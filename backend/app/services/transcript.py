"""Service that produces a segmented transcript from a video_id.

Strategy:
1) youtube-transcript-api (fast, free, with native YouTube timestamps)
2) FALLBACK: yt-dlp to download the audio + Whisper (OpenAI API) to transcribe
   with segment-level timestamps.

If both fail, raises TranscriptError.
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
    """Unified error for the transcript service."""


# ----------------------- Strategy 1: YouTube captions -----------------------

def _fetch_from_youtube_captions(video_id: str, preferred_languages: Iterable[str]) -> Transcript:
    """Use youtube-transcript-api. Returns a Transcript or raises an exception."""
    from youtube_transcript_api import YouTubeTranscriptApi  # type: ignore

    preferred = list(preferred_languages)

    try:
        # 0.7.x+: instance-based API with .list(); 0.6.x used .list_transcripts()
        ytt = YouTubeTranscriptApi()
        transcripts = ytt.list(video_id)
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"YouTube captions not available: {e}") from e

    # Try manual subtitles in preferred languages first,
    # then auto-generated ones, then anything available.
    transcript_obj = None
    try:
        transcript_obj = transcripts.find_manually_created_transcript(preferred)
    except Exception:
        try:
            transcript_obj = transcripts.find_generated_transcript(preferred)
        except Exception:
            # fallback: first available
            try:
                transcript_obj = next(iter(transcripts))
            except StopIteration as e:
                raise TranscriptError("No language available") from e

    try:
        raw = transcript_obj.fetch()
    except Exception as e:  # noqa: BLE001
        raise TranscriptError(f"Error fetching subtitles: {e}") from e

    segments: list[TranscriptSegment] = []
    for item in raw:
        # 0.6.x returns dicts, 0.7.x+ returns objects with attributes
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
        raise TranscriptError("Subtitles present but empty")

    return Transcript(
        video_id=video_id,
        language=getattr(transcript_obj, "language_code", "unknown"),
        source="youtube-captions",
        segments=segments,
    )


# ----------------------- Strategy 2: Whisper fallback -----------------------

def _download_audio(video_id: str, out_dir: Path) -> Path:
    """Download the audio track (bestaudio) as m4a using yt-dlp."""
    from yt_dlp import YoutubeDL  # type: ignore

    out_template = str(out_dir / f"{video_id}.%(ext)s")
    ydl_opts = {
        "format": "bestaudio/best",
        "outtmpl": out_template,
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
        # no postprocessing: Whisper accepts m4a/webm/opus without issues
    }
    url = f"https://www.youtube.com/watch?v={video_id}"
    with YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
    filename = Path(ydl.prepare_filename(info))
    if not filename.exists():
        # the final extension sometimes changes: pick the first file in the dir
        matches = list(out_dir.glob(f"{video_id}.*"))
        if not matches:
            raise TranscriptError("yt-dlp did not produce an audio file")
        filename = matches[0]
    return filename


def _fetch_from_whisper(video_id: str) -> Transcript:
    """Download audio and transcribe it with the Whisper API in 'verbose_json' mode
    to get segments with timestamps."""
    from openai import OpenAI  # type: ignore

    client = OpenAI(api_key=settings.openai_api_key)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        audio_path = _download_audio(video_id, tmp_path)
        logger.info("Audio downloaded to %s (%.1f MB)", audio_path, audio_path.stat().st_size / 1e6)

        with audio_path.open("rb") as f:
            # response_format=verbose_json gives us .segments with start/end
            response = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                # let Whisper auto-detect the language
            )

    # The Python SDK returns an object with attributes (or dict); handle both
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
        raise TranscriptError("Whisper did not produce any segments")

    return Transcript(
        video_id=video_id,
        language=language,
        source="whisper",
        segments=segments,
    )


# ----------------------- Public API -----------------------

def get_transcript(video_id: str) -> Transcript:
    """Return the segmented transcript, trying YouTube captions first,
    then Whisper (if enabled)."""
    errors: list[str] = []

    try:
        return _fetch_from_youtube_captions(video_id, settings.preferred_languages_list)
    except Exception as e:  # noqa: BLE001
        logger.warning("YouTube captions failed for %s: %s", video_id, e)
        errors.append(f"captions: {e}")

    if settings.enable_whisper_fallback:
        try:
            return _fetch_from_whisper(video_id)
        except Exception as e:  # noqa: BLE001
            logger.warning("Whisper fallback failed for %s: %s", video_id, e)
            errors.append(f"whisper: {e}")

    raise TranscriptError(
        "Unable to obtain the transcript. Details: " + " | ".join(errors)
    )
