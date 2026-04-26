"""File-based cache for pipeline results.

Each result is saved as backend/cache/<video_id>.json.
The cache is best-effort: read/write errors are logged and ignored,
so they never break the main flow.

Cache key: video_id (same URL → same video_id → same result).
TTL: configurable via CACHE_TTL_DAYS in .env (0 = no expiration).
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

from .schemas import ProcessResult

logger = logging.getLogger(__name__)

_CACHE_DIR = Path(__file__).parent.parent / "cache"


def _path(video_id: str) -> Path:
    return _CACHE_DIR / f"{video_id}.json"


def get(video_id: str, ttl_days: int) -> ProcessResult | None:
    """Return the cached ProcessResult, or None if absent or expired."""
    path = _path(video_id)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if ttl_days > 0:
            cached_at = datetime.fromisoformat(data["cached_at"])
            if datetime.now() - cached_at > timedelta(days=ttl_days):
                path.unlink(missing_ok=True)
                logger.info("Cache expired for %s", video_id)
                return None
        logger.info("Cache hit for %s", video_id)
        return ProcessResult.model_validate(data["result"])
    except Exception as e:  # noqa: BLE001
        logger.warning("Cache read error for %s: %s", video_id, e)
        return None


def set(video_id: str, result: ProcessResult) -> None:
    """Save the result to the cache. Fails silently."""
    try:
        _CACHE_DIR.mkdir(exist_ok=True)
        data = {
            "cached_at": datetime.now().isoformat(),
            "result": result.model_dump(),
        }
        _path(video_id).write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        logger.info("Cache saved for %s", video_id)
    except Exception as e:  # noqa: BLE001
        logger.warning("Cache write error for %s: %s", video_id, e)
