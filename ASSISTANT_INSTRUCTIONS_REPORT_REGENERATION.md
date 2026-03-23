# Assistant instructions: regenerating the test growth report

**When the user asks to "generate the report", "regenerate the report", "update the report", or "generate the CSV and regenerate the report", follow these steps. Include the defects chart refresh (step 7) whenever you regenerate or update the report.**

---

## 1. Generate the CSV file

- **Script:** `run_extract.py` (in this directory).
- **Codebase path:** The script uses `CODEBASE_PATH` in `run_extract.py`. Ensure it points to the target codebase (e.g. `/Users/bodaly/sig/reformers.content-manager-client`). If the user has a different path, update it.
- **Command:**
  ```bash
  cd /Users/bodaly/sig/tools/autotest && python3 run_extract.py
  ```
- **Output:** A new file `test-cases-spreadsheet-YYYY-MM-DD.csv` (date = today). The script prints total test cases, total test files, and counts per domain. If `git pull` fails (e.g. local changes), extraction still runs on the current tree.

---

## 2. Run the growth comparison

- **Script:** `run_growth_comparison.py`
- **Usage:** `python3 run_growth_comparison.py <prev_date> <curr_date>` where dates are `YYYY-MM-DD`.
- **Example:** For a new snapshot on 2026-03-15, compare to the previous report date (e.g. 2026-03-04):
  ```bash
  cd /Users/bodaly/sig/tools/autotest && python3 run_growth_comparison.py 2026-03-04 2026-03-15
  ```
- **Capture:** Note the printed output: `PREV_UNIQUE_NAMES`, `CURR_UNIQUE_NAMES`, `TRULY_ADDED`, `TRULY_REMOVED`, `RECLASSIFIED`, `NET_GROWTH`, `GROWTH_PCT`, `DAYS`, and the `DOMAIN_GROWTH` block (each line: `Domain|prev|curr|delta|pct`).

---

## 3. Update TEST_GROWTH_ANALYSIS.md

### 3.1 Add or replace the period section

- Find the section **"## [Previous Date] → [New Date]"** (e.g. "February 25, 2026 → March 4, 2026"). Either replace the latest period block or add a new one after it for **[Prev] → [New]**.
- Set:
  - **Analysis Date:** [New Date]
  - **Comparison Period:** [Number] days (from comparison output).
  - **Data Source:** CSV extraction (`test-cases-spreadsheet-YYYY-MM-DD.csv` vs `test-cases-spreadsheet-YYYY-MM-DD.csv`).

### 3.2 Executive Summary table

- **Metrics to fill:** Total Test Files (prev/curr), Total Test Cases = CSV rows (prev/curr), Unique Test Names (prev/curr), Truly Added, Truly Removed, Tests Reclassified, Net Growth.
- Use comparison output: `PREV_*` / `CURR_*`, `TRULY_ADDED`, `TRULY_REMOVED`, `RECLASSIFIED`, `NET_GROWTH`. File counts come from the extract script output (or from CSV row counts / known prior snapshot).

### 3.3 Growth by Domain table

- One row per domain from the comparison `DOMAIN_GROWTH` block: Domain name | Prev count | Curr count | Change | Growth %.
- Add a short note if "Other" or any domain jumps a lot (e.g. extraction/categorization differences).

### 3.4 Key Insights, Test Change Analysis, Conclusion

- **Key Insights:** 2–3 bullets (unique names change, notable domain shifts, reclassification vs real adds/removals).
- **Test Change Analysis:** Bullet list: Truly removed, Truly added, Reclassified, Net growth (use comparison numbers).
- **Conclusion:** One short paragraph: period growth %, unique test change, and note on domain/categorization if relevant.
- **Report Generated** and **Data Sources:** Set to the new date and the two CSV filenames.

---

## 4. Historical Comparison table

- In **TEST_GROWTH_ANALYSIS.md**, find the table **"Historical Comparison Table"** (or "Historical Comparison Table Template").
- Add one row:
  - **Period:** [Prev Date] → [New Date]
  - **Days:** from comparison output
  - **Unique Test Names:** [prev] → [curr]
  - **Truly Added / Truly Removed / Reclassified:** from comparison
  - **Net Growth:** +N
  - **Growth %:** from comparison
  - **Cumulative from Baseline:** (curr unique names − 1,586) and percentage; e.g. "+2,404 (+151.6%)". Baseline = 1,586 (Dec 1, 2025).

---

## 5. Update all charts

Use the **Charts** section in `TEST_GROWTH_ANALYSIS.md`. Append the new date (e.g. "Mar 4" or "Mar 15") to x-axes and add one value to each series. Adjust y-axis max if the new values exceed the current range.

### Chart 1 – Total test cases over time

- Append the new date label to `x-axis`.
- Append **current unique test names** (from comparison) to the single `line` array.
- Set `y-axis` max so the new value fits (e.g. 1400 --> 4100 or higher).

### Chart 2 – Test cases by domain at latest snapshot

- Change title to the **new date** (e.g. "Mar 4, 2026").
- Replace the `bar` array with **current** domain counts from the comparison (order: match x-axis order of domain labels). Update `y-axis` max if needed (e.g. if Other is large, 0 --> 3300 or higher).

### Chart 3 – Domain breakdown over time

- Append the new date to `x-axis`.
- For each of the six `line` arrays (UI, Other, Rules, State, Content, Context), append the **current** count for that domain. Adjust `y-axis` max if needed.

### Chart 4 – Growth by domain (latest period)

- Set title to **[Prev] → [New]** (e.g. "Feb 25 → Mar 4, 2026").
- Set `x-axis` and `bar` to the **deltas** for this period (from DOMAIN_GROWTH). Order bars to match x-axis labels. Use a y-axis range that fits both positive and negative deltas (e.g. -60 --> 2600 if Other grew a lot).

### Chart 5 – Overall test count growth since start

- Append the new date to `x-axis`.
- Append **(current unique names − 1,586)** to the single `line` array.
- Increase `y-axis` max if needed (e.g. -50 --> 2500 or higher).
- Update the caption to state that all points are from CSV extraction.

### Chart 6 – Growth by domain since start

- Append the new date to `x-axis`.
- **Baseline (Dec 1, 2025):** UI 194, Rules 64, State 184, Content 290, Context 0 (Other 870 not in chart).
- For each of the five domain lines, append **(current domain count − baseline)** for that domain. Adjust y-axis if needed.

---

## 6. Refresh the defects chart (Jira)

The **defects logged per week** chart (last graph in the report) is **not** updated by the CSV/comparison steps. Refresh it whenever you regenerate or update the report.

- **Script:** `scripts/jira-defect-rate-weekly.js`
- **Requires:** Jira API credentials in `.env`: `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`. See `JIRA_SETUP.md` if needed.
- **Command:**
  ```bash
  cd /Users/bodaly/sig/tools/autotest && node scripts/jira-defect-rate-weekly.js
  ```
- **Output:** The script prints a Mermaid code block and a summary line (e.g. "Total defects: 146", "Weeks shown: 51").
- **Update the report:**
  1. In `TEST_GROWTH_ANALYSIS.md`, find the section **"### 7. Defects logged per week"** (or "Defect rate (Jira)" / "Defects per week").
  2. **Replace the existing ` ```mermaid ` … ` ``` ` block** with the block printed by the script (copy from the script output between the two ``` markers).
  3. **Update the caption** under the block: set the defect count and week count to match the script output (e.g. _Data from Jira (146 defects, 51 weeks)._).
- **If the script fails** (e.g. missing Jira env vars), leave the existing defects chart as-is and note in your response that the defects chart was not refreshed and that Jira credentials are required.

---

## 7. Consistency checks

- All "unique test names" in the new period section match the comparison output (`CURR_UNIQUE_NAMES`, etc.).
- The new Historical Comparison row matches the same comparison run.
- Chart 1’s last value = current unique names; Chart 5’s last value = current unique names − 1,586.
- Chart 2 bars sum to total CSV rows (or match domain totals) for the new snapshot; Chart 3’s new column matches those domain counts.

---

## 8. Optional: REPORT_GENERATION_INSTRUCTIONS.md

- For **human** workflows (other reports, file naming, verification), the user can still follow `REPORT_GENERATION_INSTRUCTIONS.md`. This file is the **assistant-specific** checklist for "generate/regenerate the report" in one go (CSV → comparison → TEST_GROWTH_ANALYSIS.md + all charts).

---

## Quality Improvement Graph (standalone)

**When the user asks to "regenerate the graph", "regenerate the quality graph", "refresh the quality improvement graph", or similar, follow these steps.**

### What it is

The quality improvement graph (`quality-improvement-graph.html`) shows three lines over time (Jan 1, 2026 → present):
- **Defects Logged** (red)
- **Open Defects** (orange dashed)
- **Test Cases** (blue) — unique test names from CSV extraction (same data as TEST_GROWTH_ANALYSIS.md)

### Regenerate the graph

**Command:**
```bash
cd /Users/bodaly/sig/tools/autotest && npm run quality-graph
```

**Output:** Updates `quality-improvement-graph.html` and `data/quality-graph-data.json`.

### Data sources

1. **Test cases:** `test-cases-spreadsheet-*.csv` — uses snapshots at Dec 1, Jan 12, Jan 28, Feb 13, Feb 25, Mar 4 (and any new dates added to `REPORT_SNAPSHOT_DATES` in the script). If you add a new CSV (e.g. after running `python3 run_extract.py`), add its date to `REPORT_SNAPSHOT_DATES` in `scripts/build-quality-graph-from-csv.js` so it is included.

2. **Defects:** `data/mcp-defects-cw-reformers.json` and `data/mcp-defects-2026.json` — Jira defect data (CW project, Reformers team). **`npm run quality-graph` now fetches defects from Jira automatically** before building (via `scripts/fetch-defects-for-quality-graph.js`). Requires `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`. Defects exclude Low, Lowest, Minor; include Bug and UX Bug types. Only defects with VIHE or vIHE-e2e labels are included.

### To refresh defect data manually

If the automatic fetch fails (e.g. missing Jira env vars), run `node scripts/fetch-defects-for-quality-graph.js` then `npm run quality-graph`. The fetch script uses Jira REST API with full pagination and JQL: `issuetype IN (Bug, "UX Bug") AND priority NOT IN (Low, Lowest, Minor)`.

### If the graph shows wrong test case counts

- Ensure the CSV files exist and match the dates in `REPORT_SNAPSHOT_DATES` in `scripts/build-quality-graph-from-csv.js`.
- Run `python3 run_extract.py` to create a fresh CSV for today, then add today’s date to `REPORT_SNAPSHOT_DATES` if you want it in the graph.

### Quick reference

- **Script:** `scripts/build-quality-graph-from-csv.js`
- **Output:** `quality-improvement-graph.html`, `data/quality-graph-data.json`
- **Defect files:** `data/mcp-defects-cw-reformers.json`, `data/mcp-defects-2026.json`

---

## Quick reference – baseline and paths

- **Baseline date:** December 1, 2025.
- **Baseline unique test names:** 1,586.
- **CSV location:** `/Users/bodaly/sig/tools/autotest/test-cases-spreadsheet-YYYY-MM-DD.csv`.
- **Report file:** `/Users/bodaly/sig/tools/autotest/TEST_GROWTH_ANALYSIS.md`.
- **Extract script:** `run_extract.py` (codebase path inside script).
- **Comparison script:** `run_growth_comparison.py <prev_date> <curr_date>`.
- **Defects chart script:** `node scripts/jira-defect-rate-weekly.js` (requires Jira .env; paste printed Mermaid block into report and update caption).
- **Quality improvement graph:** `npm run quality-graph` (uses CSV snapshots + defect JSON files; see "Quality Improvement Graph" section above).
