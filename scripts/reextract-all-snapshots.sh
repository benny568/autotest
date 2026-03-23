#!/bin/bash
# Re-extract all snapshot dates with consistent scope (excludes node_modules, dist, coverage).
# Checkouts codebase to the commit at each date, then runs run_extract.py.
set -e
CODEBASE="/Users/bodaly/sig/reformers.content-manager-client"
AUTOTEST="/Users/bodaly/sig/tools/autotest"
cd "$CODEBASE"

# Stash local changes
STASHED=0
if ! git diff --quiet || ! git diff --cached --quiet; then
  git stash push -m "autotest re-extract" -- .
  STASHED=1
fi

# Commit -> output date mapping (use commit from on or just before snapshot date)
# Format: "commit:output-date"
EXTRACTIONS=(
  "8a81892a1:2025-12-01"   # Dec 2 commit for Dec 1 snapshot
  "b35a8aa12:2026-01-12"   # Jan 13 commit for Jan 12
  "3cbed85cb:2026-01-28"   # Jan 23 commit for Jan 28
  "3cbed85cb:2026-02-13"   # Jan 23 commit for Feb 13
  "3cbed85cb:2026-02-25"   # Jan 23 commit for Feb 25
)

PREV_HEAD=$(git rev-parse HEAD)
for entry in "${EXTRACTIONS[@]}"; do
  commit="${entry%%:*}"
  date="${entry##*:}"
  echo "=== Extracting $date (commit $commit) ==="
  git checkout "$commit"
  cd "$AUTOTEST"
  python3 run_extract.py --output-date "$date" --no-pull
  cd "$CODEBASE"
done

# Restore main
git checkout main
if [ "$STASHED" -eq 1 ]; then
  git stash pop
fi
echo "=== Done. Run npm run quality-graph to regenerate. ==="
