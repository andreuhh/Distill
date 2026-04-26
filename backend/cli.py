"""CLI entrypoint — usa la stessa pipeline dell'API, senza server web.

Esempi:
    python cli.py "https://www.youtube.com/watch?v=_o4KusDr-Kg"
    python cli.py "<url>" --out out.json
    python cli.py "<url>" --format markdown --out out.md
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from app.pipeline import run_pipeline


def to_markdown(result) -> str:
    """Rende il ProcessResult in Markdown, come da esempio della traccia."""
    lines = [
        f"# Trascrizione del video {result.video.video_id}",
        "",
        f"- URL: {result.video.url}",
        f"- Lingua: {result.video.language}",
        f"- Fonte trascrizione: {result.video.transcript_source}",
        f"- Durata totale: {int(result.video.total_duration_seconds)}s",
        "",
        "## Indice",
        "",
    ]
    for s in result.sections:
        anchor = f"sezione-{s.index}"
        lines.append(f"- [{s.start_timestamp} — {s.title}](#{anchor})")
    lines.append("")
    for s in result.sections:
        anchor = f"sezione-{s.index}"
        lines.append(f"### [{s.start_timestamp}] - {s.title} <a id='{anchor}'></a>")
        lines.append("")
        lines.append(s.transcript)
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="YouTube Section AI - CLI")
    parser.add_argument("url", help="URL del video YouTube")
    parser.add_argument(
        "--out", type=Path, default=None, help="File di output (se omesso: stdout)"
    )
    parser.add_argument(
        "--format",
        choices=["json", "markdown"],
        default="json",
        help="Formato di output",
    )
    args = parser.parse_args()

    result = run_pipeline(args.url)

    if args.format == "json":
        payload = json.dumps(result.model_dump(), ensure_ascii=False, indent=2)
    else:
        payload = to_markdown(result)

    if args.out:
        args.out.write_text(payload, encoding="utf-8")
        print(f"Scritto: {args.out}", file=sys.stderr)
    else:
        print(payload)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
