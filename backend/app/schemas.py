"""Modelli Pydantic condivisi tra layer.

I modelli 'LLM*' sono quelli che chiediamo all'LLM via structured output:
li teniamo piccoli e guidati, per massimizzare la qualita dell'output.
I modelli 'Section', 'ProcessResult' sono quelli che poi esponiamo via API:
contengono i dati arricchiti col post-processing (timestamp reale, testo completo).
"""
from __future__ import annotations

from urllib.parse import urlparse

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ---------- Input API ----------

# Guardrail L1: domini consentiti per l'URL in ingresso.
# Solo host ufficiali YouTube. Tutto il resto viene rifiutato alla validazione.
_ALLOWED_YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}


class ProcessRequest(BaseModel):
    url: HttpUrl = Field(..., description="URL del video YouTube")

    @field_validator("url")
    @classmethod
    def must_be_youtube(cls, v: HttpUrl) -> HttpUrl:
        """Rifiuta subito qualunque URL che non appartenga a un dominio YouTube.
        Questo sposta la validazione dal livello 'pipeline' al livello 'schema':
        se un utente passa https://evil.com, FastAPI risponde 422 ancora prima
        di entrare nella logica di business.
        """
        host = (urlparse(str(v)).hostname or "").lower()
        if host not in _ALLOWED_YOUTUBE_HOSTS:
            raise ValueError(
                f"Dominio non supportato: {host!r}. "
                f"Sono accettati solo URL YouTube ({', '.join(sorted(_ALLOWED_YOUTUBE_HOSTS))})."
            )
        return v


# ---------- Trascrizione (output del transcript service) ----------

class TranscriptSegment(BaseModel):
    """Un frammento della trascrizione con timestamp nativo."""
    text: str
    start: float  # secondi
    duration: float  # secondi


class Transcript(BaseModel):
    video_id: str
    language: str
    source: str  # "youtube-captions" oppure "whisper"
    segments: list[TranscriptSegment]

    @property
    def full_text(self) -> str:
        return " ".join(s.text for s in self.segments)

    @property
    def total_duration(self) -> float:
        if not self.segments:
            return 0.0
        last = self.segments[-1]
        return last.start + last.duration


# ---------- Output dell'LLM (structured output) ----------

class LLMSectionBoundary(BaseModel):
    """Cosa chiediamo all'LLM: l'indice del segmento dove inizia la sezione
    e un titolo breve. NIENTE timestamp inventati.
    """
    start_segment_index: int = Field(
        ...,
        ge=0,
        description="Indice (0-based) del segmento in cui inizia la sezione.",
    )
    title: str = Field(
        ...,
        min_length=3,
        max_length=120,
        description="Titolo breve e descrittivo della sezione (max 10 parole).",
    )


class LLMSectionPlan(BaseModel):
    """Wrapper richiesto dallo structured output di LangChain."""
    sections: list[LLMSectionBoundary] = Field(
        ...,
        min_length=1,
        description="Elenco ordinato delle sezioni, la prima deve avere start_segment_index=0.",
    )


# ---------- Output finale API ----------

class Section(BaseModel):
    """Sezione post-processata: il timestamp viene SEMPRE dal segmento reale."""
    index: int
    title: str
    start_seconds: float
    start_timestamp: str  # es. "00:05:30"
    transcript: str


class VideoMeta(BaseModel):
    video_id: str
    url: str
    language: str
    transcript_source: str
    total_duration_seconds: float


class ProcessResult(BaseModel):
    video: VideoMeta
    sections: list[Section]
