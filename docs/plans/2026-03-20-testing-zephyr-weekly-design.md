# Testing progress, Zephyr Scale sync, and weekly deltas — design

**Goal:** Automate alignment of automated tests in Git with Zephyr Scale, keep **code as source of truth**, produce **weekly deltas** (from **2025-12-01**) with **code coverage** as the primary completeness metric, and feed stakeholder reporting (Jira dashboard / graphs as a follow-on).

**Architecture:** Two ingestion streams — **TypeScript client** (existing glob + `it`/`test` extraction) and **.NET service** (separate discovery via `dotnet test --list-tests` and/or attribute parsing). Each repo has its own **Zephyr mapping file** under `data/zephyr-mapping/<repo-id>.json` (keys: stable `file::testName` or FQN). Legacy `data/zephyr-test-mapping.json` is still read for the client repo until migrated. Sync runs on demand or on schedule; weekly rollup reads `data/snapshots.json` and optional CSV history.

**Tech stack:** Node 18+, Zephyr Scale REST v2, Python `run_extract.py` (unchanged contract), `date-fns` for ISO weeks, .NET SDK on machine for service discovery.

**Stakeholder metric (Q13):** **Code coverage** (line % headline; branch optional in same table).

---

## Current repo assets (autotest)

| Piece | Path |
|--------|------|
| TS → Zephyr create + mapping | `scripts/sync-tests-to-zephyr.js` |
| Legacy client mapping | `data/zephyr-test-mapping.json` |
| CSV extraction + domains | `run_extract.py`, `test-cases-spreadsheet-*.csv` |
| Snapshots + coverage | `data/snapshots.json`, `POST /api/snapshot` in `server/index.js` |
| Graphs / defects | `npm run quality-graph`, `scripts/jira-defect-rate-weekly.js` |

## Configuration

| File | Purpose |
|------|---------|
| `config/testing-repos.json` | Repo ids, types (`typescript` \| `dotnet`), env keys for paths, Zephyr folder id, extra labels |

Environment overrides paths without editing JSON (e.g. `REFORMERS_REPO_PATH`, `REFORMERS_SERVICE_REPO_PATH`).

## Implemented in this phase

1. **Multi-repo aware Zephyr sync** — Iterates TypeScript repos from config; per-repo mapping file; legacy mapping fallback for client.
2. **.NET discovery** — Shared `scripts/lib/dotnet-discover.js`; prefers `src/ContentManagerService.sln`; `-m:1` for stable `dotnet test --list-tests`; deduped FQNs. CLI: `scripts/discover-dotnet-tests.js`.
3. **.NET → Zephyr create** — `scripts/sync-dotnet-tests-to-zephyr.js`; `npm run zephyr:sync:dotnet` / `:execute`; mapping `data/zephyr-mapping/reformers.content-manager-service.json`.
4. **Snapshots: service fields** — `POST /api/snapshot` adds `dotnetTestCases` when service path exists; optional `serviceCoverage` when `SNAPSHOT_INCLUDE_DOTNET_COVERAGE=true` (XPlat collector + Cobertura parse).
5. **Weekly delta report** — `scripts/weekly-testing-delta.js` adds service columns when any snapshot has `dotnetTestCases` or `serviceCoverage`.
6. **Git pull both repos** — `POST /api/snapshot` and `POST /api/pull` pull client + service (`gitBranch` in config or `REFORMERS_SERVICE_GIT_BRANCH`).
7. **Zephyr title sync** — `--update-titles` on TS and .NET sync scripts (GET/PUT testcase via `scripts/lib/zephyr-scale.js`).
8. **JUnit → executions** — `scripts/report-junit-to-zephyr.js` + `ZEPHYR_TEST_CYCLE_KEY` posts Pass/Fail per mapped case.

## Next phases (not yet implemented)

| Task | Notes |
|------|--------|
| **Archive removed tests in Zephyr** | Policy + Scale API when code drops a test. |
| **TRX / other result formats** | Extend beyond JUnit for .NET CI. |
| **Jira dashboard graphs** | Native Jira is limited; likely Custom Charts, eazyBI, or linked Confluence/HTML (`quality-improvement-graph.html`). |
| **Zephyr backfill API** | Pull historical manual + automated executions from Scale for weeks before local data exists. |

## Operational commands

```bash
npm run zephyr:sync              # Dry-run all TS repos from config
npm run zephyr:sync:execute      # Create missing Zephyr cases (TS)
npm run zephyr:sync:dotnet       # Dry-run .NET Zephyr sync
npm run zephyr:sync:dotnet:execute
npm run dotnet:discover          # List .NET tests (service repo)
npm run testing:weekly-delta     # Weekly deltas from snapshots (stdout)
npm run testing:weekly-delta -- --write   # Write data/weekly-deltas/latest.md
```

## Verification

- `node scripts/sync-tests-to-zephyr.js` — no error; lists per-repo discovery counts.
- `node scripts/discover-dotnet-tests.js` — with valid `REFORMERS_SERVICE_REPO_PATH`, non-empty list or clear SDK error.
- `node scripts/weekly-testing-delta.js` — table with weeks ≥ 2025-12-01 when `data/snapshots.json` has data.

---

*Last updated: 2026-03-20*
