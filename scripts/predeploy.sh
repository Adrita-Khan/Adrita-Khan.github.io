#!/usr/bin/env bash
#
# predeploy.sh — Refresh generated files and validate the site before
# pushing to the main branch. Run from the repo root.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/2] Regenerating sitemap.xml…"
python3 scripts/generate_sitemap.py

echo "[2/2] Checking internal links…"
python3 scripts/check_links.py

echo "Done. Ready to commit & push."
