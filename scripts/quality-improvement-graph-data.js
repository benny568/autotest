#!/usr/bin/env node
/**
 * Generates data for the Quality Improvement graph:
 * - Fetches defect data from Jira (CW project, Reformers team)
 * - Analyzes test case count over time from reformers.content-manager-client
 * - Outputs JSON for use by quality-improvement-graph.html
 *
 * Requires: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env)
 * Run: node scripts/quality-improvement-graph-data.js
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  format,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
// Teams field: use "Teams[Dropdown]" or customfield_10265 (set JIRA_TEAM_FIELD in .env)
const JIRA_TEAM_FIELD = process.env.JIRA_TEAM_FIELD || 'customfield_10265';

// CW project, Reformers team
const JQL = `project = CW AND ${JIRA_TEAM_FIELD} = Reformers AND type = Bug ORDER BY created ASC`;

const REFORMERS_REPO = '/Users/bodaly/sig/fixes/reformers.content-manager-client';
const START_DATE = new Date('2026-01-01');
const END_DATE = new Date();

const MAX_RESULTS = 100;

/** Use /rest/api/3/search/jql (POST /search returns 410). */
async function jiraSearch(jql, fields, nextPageToken = null) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error(
      'Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env). See JIRA_SETUP.md'
    );
  }
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const params = new URLSearchParams({
    jql,
    maxResults: String(MAX_RESULTS),
    fields: Array.isArray(fields) ? fields.join(',') : fields,
  });
  if (nextPageToken) params.set('nextPageToken', nextPageToken);
  const url = `${JIRA_BASE_URL}/rest/api/3/search/jql?${params.toString()}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text}`);
  }
  return res.json();
}

async function fetchAllDefects() {
  const defects = [];
  let nextPageToken = null;

  do {
    const data = await jiraSearch(JQL, ['created', 'resolutiondate'], nextPageToken);
    const issues = data.issues || [];
    for (const issue of issues) {
      const created = issue.fields?.created;
      const resolved = issue.fields?.resolutiondate ?? null;
      defects.push({
        key: issue.key,
        created: created ? parseISO(created) : null,
        resolved: resolved ? parseISO(resolved) : null,
      });
    }
    nextPageToken = data.nextPageToken ?? null;
    if (issues.length === 0) break;
  } while (nextPageToken);

  return defects;
}

function getTestFileCreationDates(repoPath) {
  if (!existsSync(repoPath)) {
    console.warn(`Repo not found: ${repoPath}`);
    return [];
  }

  const testPatterns = ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx'];
  const results = [];

  for (const pattern of testPatterns) {
    try {
      const files = execSync(`git ls-files -- "**/${pattern}"`, {
        cwd: repoPath,
        encoding: 'utf-8',
      })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const file of files) {
        try {
          const output = execSync(
            `git log --follow --diff-filter=A --format="%aI" -- "${file}"`,
            { cwd: repoPath, encoding: 'utf-8' }
          ).trim();
          const lines = output.split('\n').filter(Boolean);
          const firstCommitDate = lines[lines.length - 1]; // oldest commit
          if (firstCommitDate) {
            results.push({
              file,
              created: parseISO(firstCommitDate),
            });
          }
        } catch {
          // File might have been renamed; skip
        }
      }
    } catch (err) {
      console.warn(`Error finding test files (${pattern}):`, err.message);
    }
  }

  return results;
}

function buildWeeklyDataPoints(defects, testFileDates) {
  const points = [];
  let current = startOfDay(START_DATE);
  const end = endOfDay(END_DATE);

  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    const dateStr = format(current, 'yyyy-MM-dd');
    const pointDate = endOfDay(current);

    // Active defects: created <= date AND (not resolved OR resolved > date)
    const activeDefects = defects.filter((d) => {
      if (!d.created) return false;
      if (isAfter(d.created, pointDate)) return false;
      if (!d.resolved) return true;
      return isAfter(d.resolved, pointDate);
    }).length;

    // Cumulative defects: created <= date
    const cumulativeDefects = defects.filter((d) => {
      if (!d.created) return false;
      return !isAfter(d.created, pointDate);
    }).length;

    // Test cases: files created <= date
    const testCases = testFileDates.filter((t) => {
      return !isAfter(t.created, pointDate);
    }).length;

    points.push({
      date: dateStr,
      label: format(current, 'MMM d'),
      shortLabel: format(current, 'M/d'),
      activeDefects,
      cumulativeDefects,
      testCases,
    });

    current = addWeeks(current, 1);
  }

  return points;
}

async function main() {
  console.log('Fetching Jira defects (CW project, Reformers team)...');
  let defects = [];
  try {
    defects = await fetchAllDefects();
    console.log(`Fetched ${defects.length} defects`);
  } catch (err) {
    console.error('Jira fetch failed:', err.message);
    console.log('Using empty defect data. Set JIRA_* env vars for real data.');
  }

  console.log('Analyzing test files in reformers.content-manager-client...');
  const testFileDates = getTestFileCreationDates(REFORMERS_REPO);
  console.log(`Found ${testFileDates.length} test files with creation dates`);

  const points = buildWeeklyDataPoints(defects, testFileDates);

  // Sample to ~10-12 points for chart readability (weekly)
  const step = Math.max(1, Math.floor(points.length / 12));
  const sampledPoints = points.filter((_, i) => i % step === 0 || i === points.length - 1);

  const latest = points[points.length - 1] || {};
  const totalDefects = defects.length;
  const activeNow = defects.filter((d) => !d.resolved).length;

  const output = {
    generatedAt: new Date().toISOString(),
    config: {
      startDate: format(START_DATE, 'yyyy-MM-dd'),
      endDate: format(END_DATE, 'yyyy-MM-dd'),
      project: 'CW',
      team: 'Reformers',
    },
    summary: {
      testCasesToday: latest.testCases ?? 0,
      totalDefectsFound: totalDefects,
      activeDefectsNow: activeNow,
      testRunsCompleted: 0, // Placeholder - would need test run metadata
    },
    chartData: {
      labels: sampledPoints.map((p) => p.shortLabel),
      activeDefects: sampledPoints.map((p) => p.activeDefects),
      cumulativeDefects: sampledPoints.map((p) => p.cumulativeDefects),
      testCases: sampledPoints.map((p) => p.testCases),
    },
    rawPoints: points,
  };

  const outputPath = join(__dirname, '../data/quality-graph-data.json');
  const dataDir = dirname(outputPath);
  if (!existsSync(dataDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(dataDir, { recursive: true });
  }
  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nData written to ${outputPath}`);

  // Generate standalone HTML with embedded data
  const htmlPath = join(__dirname, '../quality-improvement-graph.html');
  const html = generateHtml(output);
  writeFileSync(htmlPath, html, 'utf-8');
  console.log(`Graph written to ${htmlPath}`);
  console.log('\nSummary:', output.summary);
}

function generateHtml(data) {
  const { chartData, summary, config } = data;
  const labels = JSON.stringify(chartData.labels);
  const activeDefects = JSON.stringify(chartData.activeDefects);
  const cumulativeDefects = JSON.stringify(chartData.cumulativeDefects);
  const testCases = JSON.stringify(chartData.testCases);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testing Investment &amp; Quality Improvement</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 24px; background: #fff; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .subtitle { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
    .chart-container { position: relative; height: 400px; max-width: 1000px; }
    .summary { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 24px; }
    .summary-box { padding: 12px 20px; border-radius: 8px; font-weight: 600; font-size: 1rem; }
    .summary-box.blue { background: #e3f2fd; color: #1565c0; }
    .summary-box.purple { background: #f3e5f5; color: #7b1fa2; }
    .summary-box.orange { background: #fff3e0; color: #e65100; }
    .summary-box.green { background: #e8f5e9; color: #2e7d32; }
  </style>
</head>
<body>
  <h1>Testing Investment &amp; Quality Improvement</h1>
  <p class="subtitle">${config.startDate} – ${config.endDate} — ${config.project} project, ${config.team} team. Demonstrating how growing test coverage and iterative test runs have driven defect counts down and raised overall product quality.</p>
  <div class="chart-container">
    <canvas id="chart"></canvas>
  </div>
  <div class="summary">
    <div class="summary-box blue">${summary.testCasesToday} TEST CASES TODAY</div>
    <div class="summary-box orange">${summary.totalDefectsFound} TOTAL DEFECTS FOUND</div>
    <div class="summary-box green">${summary.activeDefectsNow} ACTIVE DEFECTS NOW</div>
  </div>
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    const labels = ${labels};
    const activeDefects = ${activeDefects};
    const cumulativeDefects = ${cumulativeDefects};
    const testCases = ${testCases};
    const yDefectsMax = Math.max(20, Math.ceil((Math.max(0, ...activeDefects, ...cumulativeDefects) || 0) * 1.2));
    const yTestMax = Math.max(20, Math.ceil((Math.max(0, ...testCases) || 0) * 1.2));
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Active Defects',
            data: activeDefects,
            borderColor: '#d32f2f',
            backgroundColor: 'rgba(211, 47, 47, 0.2)',
            fill: true,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Cumulative Defects Found',
            data: cumulativeDefects,
            borderColor: '#ff9800',
            borderDash: [5, 5],
            fill: false,
            tension: 0.3,
            yAxisID: 'y'
          },
          {
            label: 'Test Cases (cumulative)',
            data: testCases,
            borderColor: '#1976d2',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Defects' },
            min: 0,
            max: yDefectsMax
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Test Cases' },
            min: 0,
            max: yTestMax,
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
