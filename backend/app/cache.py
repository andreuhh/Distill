"""Cache file-based per i risultati della pipeline.

Ogni risultato è salvato come backend/cache/<video_id>.json.
La cache è best-effort: errori di lettura/scrittura vengono loggati
e ignorati, così non rompono mai il flusso principale.

Chiave di cache: video_id (stesso URL → stesso video_id → stesso risultato).
TTL: configurabile via CACHE_TTL_DAYS nel .env (0 = nessuna scadenza).
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
    """Ritorna il ProcessResult cachato, o None se assente o scaduto."""
    path = _path(video_id)
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if ttl_days > 0:
            cached_at = datetime.fromisoformat(data["cached_at"])
            if datetime.now() - cached_at > timedelta(days=ttl_days):
                path.unlink(missing_ok=True)
                logger.info("Cache scaduta per %s", video_id)
                return None
        logger.info("Cache hit per %s", video_id)
        return ProcessResult.model_validate(data["result"])
    except Exception as e:  # noqa: BLE001
        logger.warning("Errore lettura cache per %s: %s", video_id, e)
        return None


def set(video_id: str, result: ProcessResult) -> None:
    """Salva il risultato nella cache. Fallisce silenziosamente."""
    try:
        _CACHE_DIR.mkdir(exist_ok=True)
        data = {
            "cached_at": datetime.now().isoformat(),
            "result": result.model_dump(),
        }
        _path(video_id).write_text(
            json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        logger.info("Cache salvata per %s", video_id)
    except Exception as e:  # noqa: BLE001
        logger.warning("Errore scrittura cache per %s: %s", video_id, e)
