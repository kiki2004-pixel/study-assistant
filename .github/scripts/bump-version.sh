#!/usr/bin/env bash
# Usage: bump-version.sh <component>
# Bumps the version for <component> (api|web) in VERSIONS and prints the new version.
# Version format: YYYY.MM.NNN (e.g. 2026.04.001)
set -euo pipefail

COMPONENT="$1"
VERSIONS_FILE="$(git rev-parse --show-toplevel)/VERSIONS"

CURRENT=$(grep "^${COMPONENT}=" "$VERSIONS_FILE" | cut -d= -f2)

CUR_YEAR=$(echo "$CURRENT" | cut -d. -f1)
CUR_MONTH=$(echo "$CURRENT" | cut -d. -f2)
CUR_BUILD=$(echo "$CURRENT" | cut -d. -f3)

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
