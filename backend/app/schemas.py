"""Pydantic models shared across layers.

The 'LLM*' models are those we request from the LLM via structured output:
we keep them small and constrained to maximise output quality.
The 'Section' and 'ProcessResult' models are those exposed via API:
they contain data enriched by post-processing (real timestamp, full text).
"""
from __future__ import annotations

from urllib.parse import urlparse

from pydantic import BaseModel, Field, HttpUrl, field_validator


# ---------- API Input ----------

# Guardrail L1: allowed domains for the input URL.
# Only official YouTube hosts. Everything else is rejected at validation.
_ALLOWED_YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
}


class ProcessRequest(BaseModel):
    url: HttpUrl = Field(..., description="YouTube video URL")

    @field_validator("url")
    @classmethod
    def must_be_youtube(cls, v: HttpUrl) -> HttpUrl:
        """Reject any URL that does not belong to a YouTube domain.
        This moves validation from the 'pipeline' layer to the 'schema' layer:
        if a user passes https://evil.com, FastAPI responds 422 before
        entering business logic.
        """
        host = (urlparse(str(v)).hostname or "").lower()
        if host not in _ALLOWED_YOUTUBE_HOSTS:
            raise ValueError(
                f"Unsupported domain: {host!r}. "
                f"Only YouTube URLs are accepted ({', '.join(sorted(_ALLOWED_YOUTUBE_HOSTS))})."
            )
        return v


# ---------- Transcript (output of the transcript service) ----------

class TranscriptSegment(BaseModel):
    """A transcript fragment with its native timestamp."""
    text: str
    start: float  # seconds
    duration: float  # seconds


class Transcript(BaseModel):
    video_id: str
    language: str
    source: str  # "youtube-captions" or "whisper"
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


# ---------- LLM output (structured output) ----------

class LLMSectionBoundary(BaseModel):
    """What we ask the LLM: the segment index where a section starts
    and a short title. NO invented timestamps.
    """
    start_segment_index: int = Field(
        ...,
        ge=0,
        description="0-based index of the segment where the section begins.",
    )
    title: str = Field(
        ...,
        min_length=3,
        max_length=120,
        description="Short, descriptive section title (max 10 words).",
    )


class LLMSectionPlan(BaseModel):
    """Wrapper required by LangChain structured output."""
    sections: list[LLMSectionBoundary] = Field(
        ...,
        min_length=1,
        description="Ordered list of sections; the first must have start_segment_index=0.",
    )


# ---------- Final API output ----------

class Section(BaseModel):
    """Post-processed section: the timestamp ALWAYS comes from the real segment."""
    index: int
    title: str
    start_seconds: float
    start_timestamp: str  # e.g. "00:05:30"
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
