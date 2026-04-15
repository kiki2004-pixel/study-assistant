#!/usr/bin/env bash
# Usage: bump-version.sh <component>
# Bumps the version for <component> (api|web) in VERSIONS and prints the new version.
# Version format: YYYY.MM.NNN (e.g. 2026.04.001)
set -euo pipefail

COMPONENT="$1"
VERSIONS_FILE="$(git rev-parse --show-toplevel)/VERSIONS"

# Read what's currently in the file (may have been manually edited)
CURRENT=$(grep "^${COMPONENT}=" "$VERSIONS_FILE" | cut -d= -f2)

# Read the last auto-bumped version from git history — immune to manual edits
LAST_BUMP_HASH=$(git log --grep="^chore(release): bump versions$" --format="%H" -n1 2>/dev/null || true)
if [[ -n "$LAST_BUMP_HASH" ]]; then
  LAST_BUMPED=$(git show "${LAST_BUMP_HASH}:VERSIONS" | grep "^${COMPONENT}=" | cut -d= -f2 || echo "")
else
  LAST_BUMPED=""
fi

# Use whichever is higher — prevents generating a version <= any previously published one
BASE="$CURRENT"
if [[ -n "$LAST_BUMPED" && "$LAST_BUMPED" > "$BASE" ]]; then
  echo "::warning::${COMPONENT} VERSIONS was manually set to ${CURRENT} (below last bumped ${LAST_BUMPED}). Using ${LAST_BUMPED} as base." >&2
  BASE="$LAST_BUMPED"
fi

CUR_YEAR=$(echo "$BASE" | cut -d. -f1)
CUR_MONTH=$(echo "$BASE" | cut -d. -f2)
CUR_BUILD=$(echo "$BASE" | cut -d. -f3)

NOW_YEAR=$(date -u +%Y)
NOW_MONTH=$(date -u +%m)

if [[ "$CUR_YEAR" == "$NOW_YEAR" && "$CUR_MONTH" == "$NOW_MONTH" ]]; then
  NEW_BUILD=$(printf "%03d" $((10#$CUR_BUILD + 1)))
else
  NEW_BUILD="001"
fi

NEW_VERSION="${NOW_YEAR}.${NOW_MONTH}.${NEW_BUILD}"

sed -i "s/^${COMPONENT}=.*/${COMPONENT}=${NEW_VERSION}/" "$VERSIONS_FILE"

echo "$NEW_VERSION"
