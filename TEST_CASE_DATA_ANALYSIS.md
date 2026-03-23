# Test Case Data Analysis: Mar 4 vs Mar 18 Discrepancy

## Summary

The test case count dropped from **3,990** (Mar 4) to **2,022** (Mar 18) — a difference of ~1,968 tests. This is **not** a real loss of tests. It is caused by a **change in extraction scope**.

## Root Cause

| Factor | Mar 4 CSV | Mar 18 CSV |
|--------|-----------|-------------|
| **Rows** | 4,699 | 2,115 |
| **Unique test names** | 3,990 | 2,022 |
| **Extraction scope** | Included `node_modules` | Excludes `node_modules`, `dist`, `coverage` |

The Mar 4 extraction was run with an older version of `run_extract.py` that **did not exclude** `node_modules`. Dependency tests (e.g. from Jest, React Testing Library, and other packages) were included, inflating the count.

The current `run_extract.py` (lines 120–124) excludes:

```python
if 'node_modules' not in p and 'dist' not in p and 'coverage' not in p:
```

So Mar 18 correctly counts **only project-owned tests** (330 test files, 2,022 unique names).

## Evidence

- **Mar 4 CSV** contains tests like: `"Load a config with string extends from node_modules and overwrite all options"` — clearly from a dependency (e.g. Jest/ESLint config).
- **TEST_GROWTH_ANALYSIS.md** (line 1031) already notes: *"Earlier extractions (e.g. Mar 4, 2026) may have included node_modules, yielding higher counts."*

## Recommendation

To get a consistent trend on the quality graph:

1. **Re-extract Mar 4** using the current exclusion logic against the codebase state from Mar 4.
2. **Replace** `test-cases-spreadsheet-2026-03-04.csv` with the re-extracted file.

This will align all snapshots to the same scope (project tests only) and remove the artificial drop.

## Resolution (Scope Made Consistent)

All snapshots have been re-extracted with consistent scope (excluding `node_modules`, `dist`, `coverage`):

```bash
cd /Users/bodaly/sig/tools/autotest
bash scripts/reextract-all-snapshots.sh
```

This script checkouts the codebase to the commit at each snapshot date and runs `run_extract.py --output-date <date> --no-pull`. Current snapshot counts (unique test names):

| Date     | Unique |
|----------|--------|
| 2025-12-01 | 1,586 |
| 2026-01-12 | 1,915 |
| 2026-01-28 | 2,022 |
| 2026-02-13 | 2,022 |
| 2026-02-25 | 2,022 |
| 2026-03-04 | 2,022 |
| 2026-03-18 | 2,022 |

The quality graph now shows a consistent upward trend with no artificial dip.
