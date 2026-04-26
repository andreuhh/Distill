"""FastAPI router: POST /api/process endpoint."""
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
        # Invalid URL
        raise HTTPException(status_code=400, detail=str(e)) from e
    except TranscriptError as e:
        raise HTTPException(status_code=422, detail=f"Transcript not available: {e}") from e
    except Exception as e:  # noqa: BLE001
        logger.exception("Pipeline error")
        raise HTTPException(status_code=500, detail=f"Internal error: {e}") from e
