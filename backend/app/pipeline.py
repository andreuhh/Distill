"""Orchestrazione della pipeline end-to-end: URL -> ProcessResult.
Centralizza la logica qui per riusarla sia dall'API sia dalla CLI.
"""
from __future__ import annotations

import logging

from . import cache as result_cache
from .config import settings
from .schemas import ProcessResult, VideoMeta
from .services.sectioner import generate_sections
from .services.transcript import get_transcript
from .services.youtube_utils import extract_video_id

logger = logging.getLogger(__name__)


def run_pipeline(url: str) -> ProcessResult:
    video_id = extract_video_id(url)
    logger.info("Video ID: %s", video_id)

    cached = result_cache.get(video_id, settings.cache_ttl_days)
    if cached is not None:
        return cached

    transcript = get_transcript(video_id)
    logger.info(
        "Trascrizione ottenuta: source=%s lang=%s segments=%d",
        transcript.source,
        transcript.language,
        len(transcript.segments),
    )

    sections = generate_sections(transcript)

    result = ProcessResult(
        video=VideoMeta(
            video_id=video_id,
            url=f"https://www.youtube.com/watch?v={video_id}",
            language=transcript.language,
            transcript_source=transcript.source,
            total_duration_seconds=transcript.total_duration,
        ),
        sections=sections,
    )

    result_cache.set(video_id, result)
    return result
