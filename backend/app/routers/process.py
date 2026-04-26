"""Router FastAPI: endpoint POST /api/process."""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from ..pipeline import run_pipeline
from ..schemas import ProcessRequest, ProcessResult
from ..services.transcript import TranscriptError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["process"])


@router.post("/process", response_model=ProcessResult)
def process(req: ProcessRequest) -> ProcessResult:
    try:
        return run_pipeline(str(req.url))
    except ValueError as e:
        # URL non valido
        raise HTTPException(status_code=400, detail=str(e)) from e
    except TranscriptError as e:
        raise HTTPException(status_code=422, detail=f"Trascrizione non disponibile: {e}") from e
    except Exception as e:  # noqa: BLE001
        logger.exception("Errore pipeline")
        raise HTTPException(status_code=500, detail=f"Errore interno: {e}") from e
