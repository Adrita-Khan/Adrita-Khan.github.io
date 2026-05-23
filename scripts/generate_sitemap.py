#!/usr/bin/env python3
"""
generate_sitemap.py
-------------------
Scan the repository root for top-level HTML pages and emit an up-to-date
sitemap.xml. Skipped:
  * 404.html (error page — should not be indexed)
  * Any page whose <head> contains <meta name="robots" content="noindex">
  * Redirect stubs (pages that contain <meta http-equiv="refresh">)

Run from the repo root:

    python scripts/generate_sitemap.py
"""

from __future__ import annotations

import datetime as dt
import pathlib
import re
import sys
import xml.sax.saxutils as sax

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE_URL = "https://adrita-khan.github.io/"

# Per-page priority (defaults to 0.6).
PRIORITY = {
    "index.html": "1.0",
    "publications.html": "0.9",
    "research.html": "0.9",
    "education.html": "0.8",
    "academic_experience.html": "0.7",
}

EXCLUDE = {"404.html"}

NOINDEX_RE = re.compile(
    r'<meta\s+name=["\']robots["\']\s+content=["\'][^"\']*noindex',
    re.IGNORECASE,
)
REDIRECT_RE = re.compile(
    r'<meta\s+http-equiv=["\']refresh["\']',
    re.IGNORECASE,
)


def should_index(path: pathlib.Path) -> bool:
    if path.name in EXCLUDE:
        return False
    try:
        head = path.read_text(encoding="utf-8", errors="ignore")[:4000]
    except OSError:
        return False
    if NOINDEX_RE.search(head):
        return False
    if REDIRECT_RE.search(head):
        return False
    return True


def build_sitemap(pages: list[pathlib.Path]) -> str:
    today = dt.date.today().isoformat()
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for page in pages:
        rel = page.name
        loc = BASE_URL if rel == "index.html" else BASE_URL + rel
        priority = PRIORITY.get(rel, "0.6")
        lines.append("  <url>")
        lines.append(f"    <loc>{sax.escape(loc)}</loc>")
        lines.append(f"    <lastmod>{today}</lastmod>")
        lines.append(f"    <priority>{priority}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def main() -> int:
    pages = sorted(p for p in REPO_ROOT.glob("*.html") if should_index(p))
    if not pages:
        print("No indexable HTML pages found.", file=sys.stderr)
        return 1
    sitemap = build_sitemap(pages)
    out = REPO_ROOT / "sitemap.xml"
    out.write_text(sitemap, encoding="utf-8")
    print(f"Wrote {out} ({len(pages)} URLs).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
