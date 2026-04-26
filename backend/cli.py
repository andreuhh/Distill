"""CLI entrypoint — uses the same pipeline as the API, without a web server.

Examples:
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
    """Render the ProcessResult as Markdown, matching the assignment example."""
    lines = [
        f"# Transcript of video {result.video.video_id}",
        "",
        f"- URL: {result.video.url}",
        f"- Language: {result.video.language}",
        f"- Transcript source: {result.video.transcript_source}",
        f"- Total duration: {int(result.video.total_duration_seconds)}s",
        "",
        "## Table of Contents",
        "",
    ]
    for s in result.sections:
        anchor = f"section-{s.index}"
        lines.append(f"- [{s.start_timestamp} — {s.title}](#{anchor})")
    lines.append("")
    for s in result.sections:
        anchor = f"section-{s.index}"
        lines.append(f"### [{s.start_timestamp}] - {s.title} <a id='{anchor}'></a>")
        lines.append("")
        lines.append(s.transcript)
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Distill - CLI")
    parser.add_argument("url", help="YouTube video URL")
    parser.add_argument(
        "--out", type=Path, default=None, help="Output file (if omitted: stdout)"
    )
    parser.add_argument(
        "--format",
        choices=["json", "markdown"],
        default="json",
        help="Output format",
    )
    args = parser.parse_args()

    result = run_pipeline(args.url)

    if args.format == "json":
        payload = json.dumps(result.model_dump(), ensure_ascii=False, indent=2)
    else:
        payload = to_markdown(result)

    if args.out:
        args.out.write_text(payload, encoding="utf-8")
        print(f"Written: {args.out}", file=sys.stderr)
    else:
        print(payload)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
