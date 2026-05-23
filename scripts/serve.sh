#!/usr/bin/env bash
#
# serve.sh — Spin up a minimal static server for local previewing.
#
# Usage:
#   ./scripts/serve.sh             # serves on port 8000
#   ./scripts/serve.sh 4000        # custom port
#
# Requires Python 3 (ships with macOS + most Linux distros).

set -euo pipefail

PORT="${1:-8000}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

echo "Serving $ROOT_DIR on http://localhost:$PORT"
echo "Press Ctrl+C to stop."

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT"
else
  echo "Error: Python 3 is required for the dev server." >&2
  exit 1
fi
