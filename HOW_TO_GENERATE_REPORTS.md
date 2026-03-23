# How to Generate Reports and Graphs

Use these instructions when asking the AI assistant to generate or regenerate reports and graphs in this directory.

---

## Quality Improvement Graph

**What to say:**
- "Regenerate the quality graph"
- "Regenerate the graph"
- "Refresh the quality improvement graph"
- "Build the quality improvement graph"

**What it does:** Updates `quality-improvement-graph.html` with Defects Logged, Open Defects, and Test Cases over time (Jan 1, 2026 → present). Uses CSV test data (same as TEST_GROWTH_ANALYSIS) and Jira defect data. Defects exclude Low, Lowest, and Minor priority; only defects with VIHE or vIHE-e2e labels are included.

**Command:** `npm run quality-graph`

---

## Test Growth Report (TEST_GROWTH_ANALYSIS.md)

**What to say:**
- "Generate the report"
- "Regenerate the report"
- "Update the report"
- "Generate the CSV and regenerate the report"

**What it does:** (1) Runs `run_extract.py` to create a new CSV, (2) Runs `run_growth_comparison.py` to compare with the previous snapshot, (3) Updates `TEST_GROWTH_ANALYSIS.md` with new period, tables, and all six charts, (4) Refreshes the defects chart from Jira.

**Note:** The assistant follows `ASSISTANT_INSTRUCTIONS_REPORT_REGENERATION.md` for the full checklist.

---

## CSV Extraction Only

**What to say:**
- "Extract test cases"
- "Generate the CSV"
- "Run the test extraction"

**What it does:** Creates `test-cases-spreadsheet-YYYY-MM-DD.csv` (today's date) from the reformers codebase.

**Command:** `python3 run_extract.py`

---

## Defects Chart (Jira, for TEST_GROWTH_ANALYSIS)

**What to say:**
- "Refresh the defects chart"
- "Update the Jira defects chart in the report"

**What it does:** Fetches defect data from Jira (Reformers team) and prints a Mermaid block to paste into `TEST_GROWTH_ANALYSIS.md`.

**Command:** `node scripts/jira-defect-rate-weekly.js`  
**Requires:** `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN` in `.env`

---

## Zephyr Scale sync (TypeScript client)

**Commands:** `npm run zephyr:sync` (dry run), `npm run zephyr:sync:execute` (create cases).

Repos and labels are defined in `config/testing-repos.json`. Per-repo mappings live under `data/zephyr-mapping/<repo-id>.json`. The legacy file `data/zephyr-test-mapping.json` is still read for the client if the new mapping file does not exist yet.

## .NET service test discovery

**Command:** `npm run dotnet:discover` (uses `REFORMERS_SERVICE_REPO_PATH`, `config/testing-repos.json` defaultPath, or pass the repo path as the first argument).

Uses `src/ContentManagerService.sln` when present (full solution test list). `dotnet test` runs with `-m:1` to avoid parallel build file-lock issues on some machines.

Optional: `node scripts/discover-dotnet-tests.js --json --out data/dotnet-tests.json`

## Zephyr Scale sync (.NET service)

**Commands:** `npm run zephyr:sync:dotnet` (dry run), `npm run zephyr:sync:dotnet:execute` (create cases).

Mapping file: `data/zephyr-mapping/reformers.content-manager-service.json` (keys `reformers.content-manager-service::<FQN>`).

## Git pull (snapshot + API)

`POST /api/snapshot` and `POST /api/pull` now pull **both** the TypeScript client repo (`REFORMERS_REPO_PATH`) and the .NET service repo when `config/testing-repos.json` has a valid service `defaultPath` or `REFORMERS_SERVICE_REPO_PATH`. Branch per repo: `gitBranch` in config (default `main`); override the service branch with **`REFORMERS_SERVICE_GIT_BRANCH`** if needed.

Snapshot fields: `gitPullResult` / `gitPullMessage` (client), `gitPullServiceResult` / `gitPullServiceMessage` (service or `skipped`).

## Zephyr: sync titles from code

Align Zephyr Scale case **names** with current code (after renames):

- Client: `node scripts/sync-tests-to-zephyr.js --update-titles` (needs `ZEPHYR_API_TOKEN`)
- Service: `node scripts/sync-dotnet-tests-to-zephyr.js --update-titles`

## Zephyr: JUnit → test executions

Post Pass/Fail to a **test cycle** (create the cycle in Zephyr Scale UI, then copy its key, e.g. `CW-R42`):

```bash
export ZEPHYR_TEST_CYCLE_KEY=CW-R42
# Optional: default is service repo id
# export ZEPHYR_JUNIT_REPO_ID=reformers.content-manager-client
npm run zephyr:report-junit -- path/to/junit.xml
```

Dry-run: `node scripts/report-junit-to-zephyr.js --dry-run path/to/junit.xml`

Mapping uses `data/zephyr-mapping/*.json` plus legacy `zephyr-test-mapping.json`. JUnit `classname` + `name` are matched to `repoId::FQN` patterns (see script header).

## CI: orchestrated JUnit → Zephyr (no workflows in Reformers repos)

Workflow: **`.github/workflows/zephyr-junit-orchestrated.yml`** in **this** (`autotest`) repository checks out `hcd-tech/reformers.content-manager-client` and `hcd-tech/reformers.content-manager-service` using a PAT, runs the same JUnit-producing tests as the per-app workflows, and calls `report-junit-to-zephyr.js` for each product. Triggers: **`workflow_dispatch`** (toggles per product) and weekly **`schedule`**.

**Secrets on the autotest repo:** `REFORMERS_GITHUB_SSH_KEY` (private key for a GitHub identity that can **read** both Reformers repos; checkouts use **SSH**, not HTTPS), `ZEPHYR_API_TOKEN`, `ZEPHYR_TEST_CYCLE_KEY`. **Optional:** `SIGNIFY_NPM_TOKEN` for `npm ci` on the client when using GitHub-hosted runners (Signify npm registry).

**Variables (optional):** `REFORMERS_CLIENT_REPO`, `REFORMERS_SERVICE_REPO`, `REFORMERS_CLIENT_REF`, `REFORMERS_SERVICE_REF`, `ZEPHYR_PROJECT_KEY`.

The service job writes a temporary `Directory.Build.props` in the checkout so `JunitXml.TestLogger` applies without changing the Reformers repo. Switch **`runs-on`** in the workflow to your org’s self-hosted runner group if the client cannot reach private npm from `ubuntu-latest`.

## Snapshots: .NET test count and optional service coverage

Each `POST /api/snapshot` adds **`dotnetTestCases`** when the service repo path is configured (same discovery as above).

To also record **`serviceCoverage`** (line/branch % from Cobertura), set **`SNAPSHOT_INCLUDE_DOTNET_COVERAGE=true`** in the environment before starting the server. This runs a full `dotnet test` with the XPlat collector and can take several minutes.

## Weekly testing delta (coverage + counts)

Uses `data/snapshots.json` from the snapshot API, ISO weeks from **2025-12-01**, headline metric **line coverage**.

**Commands:**

- `npm run testing:weekly-delta` — print Markdown table to stdout
- `npm run testing:weekly-delta -- --write` — also write `data/weekly-deltas/latest.md`
- `npm run testing:weekly-delta -- --start 2025-12-01` — change filter start date

See `docs/plans/2026-03-20-testing-zephyr-weekly-design.md` for full design and backlog.

---

## Quick Reference

| Output | Instruction | Command |
|--------|-------------|---------|
| `quality-improvement-graph.html` | "Regenerate the graph" | `npm run quality-graph` |
| `TEST_GROWTH_ANALYSIS.md` | "Generate the report" | See ASSISTANT_INSTRUCTIONS_REPORT_REGENERATION.md |
| `test-cases-spreadsheet-*.csv` | "Extract test cases" | `python3 run_extract.py` |
| Defects chart in report | "Refresh the defects chart" | `node scripts/jira-defect-rate-weekly.js` |
| Zephyr TS sync | "Sync tests to Zephyr" | `npm run zephyr:sync` |
| Zephyr .NET sync | "Sync dotnet tests to Zephyr" | `npm run zephyr:sync:dotnet` |
| Weekly coverage delta | "Weekly testing delta" | `npm run testing:weekly-delta` |
| JUnit → Zephyr executions | "Report JUnit to Zephyr" | `npm run zephyr:report-junit -- path/to/junit.xml` |
| Zephyr title sync (TS) | "Sync Zephyr titles from client tests" | `node scripts/sync-tests-to-zephyr.js --update-titles` |

---

## Other Reports

The following reports exist in this directory but do not have automated generation scripts. Regeneration may require manual steps or custom scripts:

- `executive-summary.md`
- `test-cases-detailed-report.md`
- `test-analysis-report.md`
- `BE-test-analysis-report-*.md` (backend)
- `BE-test-cases-detailed-report-*.md` (backend)
- `BE-executive-summary-*.md` (backend)

If you need to regenerate any of these, describe the report and the assistant can help.
