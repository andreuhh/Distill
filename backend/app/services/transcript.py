"""Service che produce la trascrizione segmentata a partire da un video_id.

Strategia:
1) youtube-transcript-api (rapido, gratis, con timestamp nativi YouTube)
2) FALLBACK: yt-dlp per scaricare l'audio + Whisper (OpenAI API) per trascrivere
   con timestamp a livello di segmento.

Se entrambe falliscono, solleva TranscriptError.
"""
from __future__ import annotations

import logging
import tempfile
from pathlib import Path
from typing import Iterable

from ..config import settings
from ..schemas import Transcript, TranscriptSegment

logger = logging.getLogger(__name__)


class TranscriptError(RuntimeError):
    """Errore unificato del servizio trascrizione."""


# ----------------------- Strategia 1: YouTube captions -----------------------

def _fetch_from_youtube_captions(video_id: str, preferred_languages: Iterable[str]) -> Transcript:
    """Usa youtube-transcript-api. Ritorna Transcript o solleva eccezione."""
    from youtube_transcript_api import YouTubeTranscriptApi  # type: ignore

    preferred = list(preferred_languages)

    try:
        # 0.7.x+: API instance-based con .list(); 0.6.x usava .list_transcripts()
        ytt = YouTubeTranscriptApi()
        transcripts = ytt.list(video_id)
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"YouTube captions non disponibili: {e}") from e

    # Proviamo prima i sottotitoli manuali nelle lingue preferite,
    # poi quelli auto-generati, poi qualunque cosa.
    transcript_obj = None
    try:
        transcript_obj = transcripts.find_manually_created_transcript(preferred)
    except Exception:
        try:
            transcript_obj = transcripts.find_generated_transcript(preferred)
        except Exception:
            # fallback: prima disponibile
            try:
                transcript_obj = next(iter(transcripts))
            except StopIteration as e:
                raise TranscriptError("Nessuna lingua disponibile") from e

    try:
        raw = transcript_obj.fetch()
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"Errore nel fetch dei sottotitoli: {e}") from e

    segments: list[TranscriptSegment] = []
    for item in raw:
        # 0.6.x ritorna dict, 0.7.x+ ritorna oggetti con attributi
        if isinstance(item, dict):
            text = (item.get("text") or "").strip()
            start = float(item.get("start", 0.0))
            duration = float(item.get("duration", 0.0))
        else:
            text = (getattr(item, "text", "") or "").strip()
            start = float(getattr(item, "start", 0.0))
            duration = float(getattr(item, "duration", 0.0))
        if not text:
            continue
        segments.append(
            TranscriptSegment(text=text, start=start, duration=duration)
        )

    if not segments:
        raise TranscriptError("Sottotitoli presenti ma vuoti")

    return Transcript(
        video_id=video_id,
        language=getattr(transcript_obj, "language_code", "unknown"),
        source="youtube-captions",
        segments=segments,
    )


# ----------------------- Strategia 2: Whisper fallback -----------------------

def _download_audio(video_id: str, out_dir: Path) -> Path:
    """Scarica la traccia audio (bestaudio) come m4a con yt-dlp."""
    from yt_dlp import YoutubeDL  # type: ignore

    out_template = str(out_dir / f"{video_id}.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        # non facciamo postprocess: Whisper accetta m4a/webm/opus senza problemi
    }
    url = f"https://www.youtube.com/watch?v={video_id}"
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
    filename = Path(ydl.prepare_filename(info))
    if not filename.exists():
        # a volte l'estensione finale cambia: prendiamo il primo file nella dir
        matches = list(out_dir.glob(f"{video_id}.*"))
        if not matches:
            raise TranscriptError("yt-dlp non ha prodotto file audio")
        filename = matches[0]
    return filename


def _fetch_from_whisper(video_id: str) -> Transcript:
    """Scarica audio e lo trascrive con Whisper API in modalita 'verbose_json'
    per avere i segmenti con timestamp."""
    from openai import OpenAI  # type: ignore

    client = OpenAI(api_key=settings.openai_api_key)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        audio_path = _download_audio(video_id, tmp_path)
        logger.info("Audio scaricato in %s (%.1f MB)", audio_path, audio_path.stat().st_size / 1e6)

        with audio_path.open("rb") as f:
            # response_format=verbose_json ci da .segments con start/end
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                # lasciamo che Whisper auto-detect la lingua
            )

    # L'SDK Python ritorna un oggetto con attributi (o dict); gestiamo entrambi
    def _get(obj, key, default=None):
        if isinstance(obj, dict):
            return obj.get(key, default)
        return getattr(obj, key, default)

    language = _get(response, "language", "unknown") or "unknown"
    raw_segments = _get(response, "segments", []) or []

    segments: list[TranscriptSegment] = []
    for s in raw_segments:
        text = (_get(s, "text") or "").strip()
        if not text:
            continue
        start = float(_get(s, "start", 0.0))
        end = float(_get(s, "end", start))
        segments.append(TranscriptSegment(text=text, start=start, duration=max(0.0, end - start)))

    if not segments:
        raise TranscriptError("Whisper non ha prodotto segmenti")

    return Transcript(
        video_id=video_id,
        language=language,
        source="whisper",
        segments=segments,
    )


# ----------------------- Public API -----------------------

def get_transcript(video_id: str) -> Transcript:
    """Ritorna la trascrizione segmentata provando prima i captions YouTube,
    poi Whisper (se abilitato)."""
    errors: list[str] = []

    try:
        return _fetch_from_youtube_captions(video_id, settings.preferred_languages_list)
    except Exception as e:  # noqa: BLE001
        logger.warning("Captions YouTube falliti per %s: %s", video_id, e)
        errors.append(f"captions: {e}")

    if settings.enable_whisper_fallback:
        try:
            return _fetch_from_whisper(video_id)
        except Exception as e:  # noqa: BLE001
            logger.warning("Whisper fallback fallito per %s: %s", video_id, e)
            errors.append(f"whisper: {e}")

    raise TranscriptError(
        "Impossibile ottenere la trascrizione. Dettagli: " + " | ".join(errors)
    )
