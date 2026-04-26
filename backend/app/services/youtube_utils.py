"""Utility for parsing YouTube URLs and formatting timestamps."""
from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


# Pattern to extract the video ID from various YouTube URL forms
_ID_PATTERNS = [
    re.compile(r"^[A-Za-z0-9_-]{11}$"),  # Direct ID
]


def extract_video_id(url: str) -> str:
    """Return the 11-character ID from a YouTube link.
    Supports watch?v=, youtu.be/, embed/, shorts/."""
    url = url.strip()

    # If the user passed the ID directly
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
        # /embed/<id> or /shorts/<id> or /v/<id>
        m = re.match(r"^/(embed|shorts|v)/([A-Za-z0-9_-]{11})", parsed.path)
        if m:
            return m.group(2)

    raise ValueError(f"Unable to extract video ID from: {url!r}")


def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS (or MM:SS if < 1h)."""
    total = int(round(seconds))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h:02d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def youtube_watch_url(video_id: str, start_seconds: float | None = None) -> str:
    """Build the canonical URL with an optional &t=<sec>s parameter."""
    base = f"https://www.youtube.com/watch?v={video_id}"
    if start_seconds is not None:
        return f"{base}&t={int(start_seconds)}s"
    return base
