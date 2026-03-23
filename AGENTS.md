## Learned User Preferences

- Ask clarifying questions before implementing large automation that spans Jira, Zephyr, and Git until scope, products, and metrics are agreed.
- For Reformers stakeholder testing reports in this workspace, treat code coverage (especially line coverage) as the primary “completeness” signal unless the user specifies otherwise.
- Treat code in Git as the source of truth for automated test naming and definitions when syncing to Zephyr; prefer human-readable titles in Zephyr.
- Prefer weekly deltas from a fixed program start date and outputs that leadership can drop into Jira or linked dashboards with charts.
- Expect the content-manager client and service to use different stacks; do not assume one extractor covers both without a dedicated path for .NET/C#.
- When comparing graphs to Jira, align issue types, team/project filters, priority exclusions, week boundaries, and pagination so totals match Jira.

## Learned Workspace Facts

- This repo (`autotest`) holds the Reformers testing toolkit: Zephyr Scale sync scripts, snapshot server, CSV extraction (`run_extract.py`), TEST_GROWTH_ANALYSIS, quality improvement graph, and weekly delta helpers.
- Jira Cloud integration here targets Zephyr **Scale** (SmartBear REST), not Zephyr Enterprise; tokens and URLs are Scale-specific.
- Quality improvement graph defect data should use project CW, Reformers on the Teams dropdown, issue types Bug and UX Bug, and exclude Low, Lowest, and Minor priority; Jira fetches must paginate fully so counts match the UI.
- The blue test-case series on the quality graph should follow TEST_GROWTH_ANALYSIS methodology (dated `test-cases-spreadsheet-*.csv` / unique test names), not a simple count of test files.
- Repo paths are commonly overridden with `REFORMERS_REPO_PATH` and `REFORMERS_SERVICE_REPO_PATH`; `config/testing-repos.json` lists defaults and Zephyr labels for each repo.
- Per-repo Zephyr mappings live under `data/zephyr-mapping/<repo-id>.json`, with legacy `data/zephyr-test-mapping.json` still read for the client when the new file is absent.
- Snapshot and report APIs treat missing `lcov` data as null coverage (not 0%) so dashboards and weekly deltas do not show fake zero-percent drops.
- Atlassian Jira access from Cursor tools uses the `user-atlassian` MCP server name when it is enabled in the session.
