#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Cleaning stale dev processes..."
lsof -ti :3000 | xargs -r kill -9 || true
lsof -ti :4000 | xargs -r kill -9 || true
rm -f apps/web/.next/dev/lock

echo "Starting web + api..."
exec bun x turbo@$(node -p "require('./package.json').devDependencies.turbo.replace('^','')") dev --filter=web --filter=@emploify/api
