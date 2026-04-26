"""FastAPI app entrypoint."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers import process as process_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s | %(message)s",
)

app = FastAPI(
    title="Distill",
    version="0.1.0",
    description=(
        "System that transforms a YouTube video into a transcript "
        "structured into sections with title and timestamp."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(process_router.router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
