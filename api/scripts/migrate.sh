#!/usr/bin/env bash
# Runs Alembic migrations against the scrub database.
# SCRUB_DB_URL must be set before calling this script (the Makefile handles it).

set -euo pipefail

: "${SCRUB_DB_URL:?SCRUB_DB_URL is required}"

uv run alembic upgrade head
