#!/usr/bin/env python3
"""
check_links.py
--------------
Walk every *.html file at the repository root and confirm that each
internal href / src points to a real file. Fragments (#section) and
external URLs (http://, https://, mailto:, data:) are skipped.

Exits non-zero on any broken link so CI fails loudly.
"""

from __future__ import annotations

import pathlib
import re
import sys
from collections import defaultdict
from urllib.parse import urlsplit

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

HREF_RE = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)

SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


def collect_links(html_path: pathlib.Path) -> list[str]:
    text = html_path.read_text(encoding="utf-8", errors="ignore")
    return HREF_RE.findall(text)


def is_internal(target: str) -> bool:
    if not target or target.startswith("#"):
        return False
    scheme = urlsplit(target).scheme.lower()
    return scheme not in SKIP_SCHEMES


def resolve(target: str, source: pathlib.Path) -> pathlib.Path:
    # Strip any anchor or query string before resolving.
    bare = target.split("#", 1)[0].split("?", 1)[0]
    if bare.startswith("/"):
        return REPO_ROOT / bare.lstrip("/")
    return (source.parent / bare).resolve()


def main() -> int:
    broken: dict[pathlib.Path, list[str]] = defaultdict(list)
    pages = list(REPO_ROOT.glob("*.html"))
    for page in pages:
        for href in collect_links(page):
            if not is_internal(href):
                continue
            target = resolve(href, page)
            if not target.exists():
                broken[page].append(href)

    if not broken:
        print(f"All internal links OK across {len(pages)} page(s).")
        return 0

    print("Broken internal links:", file=sys.stderr)
    for page, hrefs in sorted(broken.items()):
        rel = page.relative_to(REPO_ROOT)
        for h in hrefs:
            print(f"  {rel} -> {h}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
