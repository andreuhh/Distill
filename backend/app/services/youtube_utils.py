"""Utility per parsing di URL YouTube e formattazione timestamp."""
from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


# Pattern per estrarre l'ID video da varie forme di URL YouTube
_ID_PATTERNS = [
    re.compile(r"^[A-Za-z0-9_-]{11}$"),  # ID diretto
]


def extract_video_id(url: str) -> str:
    """Ritorna l'ID di 11 caratteri dal link YouTube.
    Supporta watch?v=, youtu.be/, embed/, shorts/."""
    url = url.strip()

    # Se l'utente ha passato direttamente l'id
    if _ID_PATTERNS[0].match(url):
        return url

    parsed = urlparse(url)
    host = parsed.hostname or ""

    if "youtu.be" in host:
        # https://youtu.be/<id>
        vid = parsed.path.lstrip("/")
        if _ID_PATTERNS[0].match(vid):
            return vid

    if "youtube.com" in host:
        # /watch?v=<id>
        if parsed.path == "/watch":
            v = parse_qs(parsed.query).get("v", [None])[0]
            if v and _ID_PATTERNS[0].match(v):
                return v
        # /embed/<id> o /shorts/<id> o /v/<id>
        m = re.match(r"^/(embed|shorts|v)/([A-Za-z0-9_-]{11})", parsed.path)
        if m:
            return m.group(2)

    raise ValueError(f"Impossibile estrarre l'ID video da: {url!r}")


def format_timestamp(seconds: float) -> str:
    """Converte secondi in HH:MM:SS (o MM:SS se < 1h)."""
    total = int(round(seconds))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def youtube_watch_url(video_id: str, start_seconds: float | None = None) -> str:
    """Costruisce l'URL canonico con eventuale &t=<sec>s."""
    base = f"https://www.youtube.com/watch?v={video_id}"
    if start_seconds is not None:
        return f"{base}&t={int(start_seconds)}s"
    return base
