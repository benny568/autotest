# Automated Testing Progress Report Generator

A React + TypeScript application that generates comprehensive reports showing the progress of automated testing in your codebase. The application tracks test counts, test coverage, and provides visualizations to demonstrate testing progress over time.

## Features

- **Test Metrics Tracking**: Automatically counts unit tests and E2E tests separately
- **Coverage Analysis**: Parses coverage data from lcov.info files
- **Historical Snapshots**: Stores historical data points for trend analysis
- **Weekly Aggregation**: Groups data by week for clear time-series visualization
- **Interactive Charts**: Visual graphs showing test count and coverage trends
- **Detailed Tables**: Comprehensive tables with week-over-week changes
- **Date Range Filtering**: Filter reports by custom date ranges
- **Summary Cards**: Quick overview of current metrics and growth
- **Jira Defects Dashboard**: View open defects grouped by priority and status (see [JIRA_SETUP.md](./JIRA_SETUP.md) for configuration)
- **Quality Improvement Graph**: Line chart showing Active Defects, Cumulative Defects, and Test Cases over time (CW project, Reformers team)

## Prerequisites

- Node.js 18+ and npm
- Access to the target codebase at `/Users/bodaly/sig/reformers.content-manager-client`

## Installation

1. Install dependencies:
```bash
npm install
```

## Usage

### Starting the Application

#### Option 1: Using PM2 (Recommended for Production)

For automatic snapshots to work, the server needs to run continuously. PM2 is the recommended way to manage this:

1. Set up PM2 (one-time setup):
```bash
npm run setup-pm2
```

This will:
- Install PM2 if needed
- Start the server with PM2
- Configure PM2 to start on system boot
- Set up logging

2. Check server status:
```bash
npm run pm2:status
```

3. View server logs:
```bash
npm run pm2:logs
```

#### Option 2: Manual Start (Development)

1. Start the backend server (in one terminal):
```bash
npm run server
```

2. Start the frontend development server (in another terminal):
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### PM2 Management Commands

- `npm run pm2:start` - Start the server
- `npm run pm2:stop` - Stop the server
- `npm run pm2:restart` - Restart the server
- `npm run pm2:logs` - View server logs
- `npm run pm2:status` - Check server status

### Creating Snapshots

To track progress over time, you need to create snapshots:

1. Click the "Create Snapshot" button in the UI
2. The application will:
   - Scan the codebase for test files
   - Count unit tests (`.test.ts`, `.test.tsx` files)
   - Count E2E tests (`.spec.ts`, `.spec.tsx` files in e2e directories)
   - Parse coverage data from `lcov.info` files
   - Store the snapshot with a timestamp

### Viewing Reports

1. Select a date range using the date pickers
2. The report will automatically update showing:
   - Summary cards with current metrics and growth
   - Charts showing trends over time
   - Detailed table with weekly breakdowns

## Data Storage

Snapshots are stored in `data/snapshots.json`. This file contains all historical data points and can be backed up or version controlled if needed.

## Project Structure

```
autotest/
├── server/
│   └── index.js          # Express backend API
├── src/
│   ├── components/        # React components
│   │   ├── ReportDashboard.tsx
│   │   ├── TestCountChart.tsx
│   │   ├── CoverageChart.tsx
│   │   ├── ReportTable.tsx
│   │   ├── SummaryCards.tsx
│   │   ├── DateRangeSelector.tsx
│   │   └── SnapshotButton.tsx
│   ├── App.tsx           # Main application component
│   └── main.tsx          # Entry point
├── data/                  # Data storage (created automatically)
└── package.json
```

## API Endpoints

### Test Metrics
- `POST /api/snapshot` - Create a new snapshot
- `GET /api/snapshots` - Get all snapshots
- `GET /api/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - Get weekly aggregated report
- `GET /api/metrics` - Get current metrics without creating a snapshot

### Jira Integration
- `GET /api/jira/defects` - Get all open defects grouped by priority and status
- `GET /api/jira/defects?team=TeamName` - Get defects filtered by team (requires team field configuration)
- `GET /api/jira/teams` - Get available teams (placeholder, can be enhanced)

### Quality Improvement Graph
- `GET /api/quality-graph` - Get chart data (run `npm run quality-graph` first)

The graph shows **Defects Logged**, **Open Defects**, and **Test Cases** over time (CW project, Reformers team). Defects exclude Low, Lowest, and Minor priority; only defects with VIHE or vIHE-e2e labels are included. Uses the same test case data as TEST_GROWTH_ANALYSIS.md (unique test names from `test-cases-spreadsheet-*.csv`). Run `npm run quality-graph` to regenerate, then open `quality-improvement-graph.html`.

## Configuration

- **Snapshots / UI:** The target codebase path defaults in `server/index.js`; override with **`REFORMERS_REPO_PATH`** (see `.env.example`).
- **Zephyr + multi-repo:** See **`config/testing-repos.json`** and `docs/plans/2026-03-20-testing-zephyr-weekly-design.md`.
- **Commands:** `npm run zephyr:sync`, `npm run dotnet:discover`, `npm run testing:weekly-delta` — documented in [HOW_TO_GENERATE_REPORTS.md](./HOW_TO_GENERATE_REPORTS.md).
- **CI without Reformers workflow files:** This repo can run **`.github/workflows/zephyr-junit-orchestrated.yml`**, which checks out both Reformers repos, produces JUnit, and posts to Zephyr Scale (secrets on **autotest** only). Details in [HOW_TO_GENERATE_REPORTS.md](./HOW_TO_GENERATE_REPORTS.md).

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Notes

- The application distinguishes between unit tests and E2E tests based on file patterns:
  - Unit tests: `*.test.{ts,tsx,js,jsx}` files (excluding e2e directories)
  - E2E tests: `*.spec.{ts,tsx,js,jsx}` files
- Coverage data is parsed from `lcov.info` files found in the codebase
- Weekly aggregation uses Monday as the start of the week
- Test counts are approximate based on counting test/it/describe function calls
