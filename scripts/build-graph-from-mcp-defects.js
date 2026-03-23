#!/usr/bin/env node
/**
 * Builds quality graph from MCP-fetched defect data (passed via stdin or file).
 * Usage: node scripts/build-graph-from-mcp-defects.js [defects.json]
 * Or: cat defects.json | node scripts/build-graph-from-mcp-defects.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  startOfDay,
  endOfDay,
  addWeeks,
  format,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REFORMERS_REPO = '/Users/bodaly/sig/fixes/reformers.content-manager-client';
const START_DATE = new Date('2026-01-01');
const END_DATE = new Date();

function getTestFileCreationDates(repoPath) {
  if (!existsSync(repoPath)) return [];
  const results = [];
  for (const pattern of ['*.test.ts', '*.test.tsx', '*.spec.ts', '*.spec.tsx']) {
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
          const firstCommitDate = lines[lines.length - 1];
          if (firstCommitDate) {
            results.push({ file, created: parseISO(firstCommitDate) });
          }
        } catch {}
      }
    } catch {}
  }
  return results;
}

function buildWeeklyDataPoints(defects, testFileDates) {
  const points = [];
  let current = startOfDay(START_DATE);
  const end = endOfDay(END_DATE);
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    const pointDate = endOfDay(current);
    const activeDefects = defects.filter((d) => {
      if (!d.created) return false;
      if (isAfter(d.created, pointDate)) return false;
      if (!d.resolved) return true;
      return isAfter(d.resolved, pointDate);
    }).length;
    const cumulativeDefects = defects.filter((d) => {
      if (!d.created) return false;
      return !isAfter(d.created, pointDate);
    }).length;
    const testCases = testFileDates.filter((t) => !isAfter(t.created, pointDate)).length;
    points.push({
      date: format(current, 'yyyy-MM-dd'),
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

function generateHtml(data) {
  const { chartData, summary, config } = data;
  const labels = JSON.stringify(chartData.labels);
  const activeDefects = JSON.stringify(chartData.activeDefects);
  const cumulativeDefects = JSON.stringify(chartData.cumulativeDefects);
  const testCases = JSON.stringify(chartData.testCases);
  const yDefectsMax = Math.max(20, Math.ceil((Math.max(0, ...chartData.activeDefects, ...chartData.cumulativeDefects) || 0) * 1.2));
  const yTestMax = Math.max(20, Math.ceil((Math.max(0, ...chartData.testCases) || 0) * 1.2));
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
  <p class="subtitle">${config.startDate} – ${config.endDate} — ${config.project} project, ${config.team} team.</p>
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
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${labels},
        datasets: [
          { label: 'Active Defects', data: ${activeDefects}, borderColor: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.2)', fill: true, tension: 0.3, yAxisID: 'y' },
          { label: 'Cumulative Defects Found', data: ${cumulativeDefects}, borderColor: '#ff9800', borderDash: [5, 5], fill: false, tension: 0.3, yAxisID: 'y' },
          { label: 'Test Cases (cumulative)', data: ${testCases}, borderColor: '#1976d2', fill: false, tension: 0.3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Defects' }, min: 0, max: ${yDefectsMax} },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Test Cases' }, min: 0, max: ${yTestMax}, grid: { drawOnChartArea: false } }
        }
      }
    });
  </script>
</body>
</html>`;
}

// Parse MCP response format: issue.created, issue.resolutiondate (top-level)
function parseMcpDefects(issues) {
  const seen = new Set();
  return (issues || []).map((issue) => {
    const key = issue.key;
    if (seen.has(key)) return null;
    seen.add(key);
    const created = issue.created || issue.fields?.created;
    const resolved = issue.resolutiondate || issue.fields?.resolutiondate || null;
    return {
      key,
      created: created ? parseISO(created) : null,
      resolved: resolved ? parseISO(resolved) : null,
    };
  }).filter(Boolean);
}

async function main() {
  let defectsJson;
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (args.length > 0) {
    const allIssues = [];
    for (const path of args) {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      const issues = Array.isArray(data) ? data : (data.issues || []);
      allIssues.push(...issues);
    }
    defectsJson = JSON.stringify({ issues: allIssues });
  } else {
    defectsJson = await new Promise((resolve) => {
      let data = '';
      process.stdin.setEncoding('utf-8');
      process.stdin.on('data', (chunk) => { data += chunk; });
      process.stdin.on('end', () => resolve(data));
    });
  }
  const mcpData = JSON.parse(defectsJson);
  const issues = Array.isArray(mcpData) ? mcpData : (mcpData.issues || mcpData);
  const defects = parseMcpDefects(issues);
  console.error(`Parsed ${defects.length} defects from MCP data`);

  const testFileDates = getTestFileCreationDates(REFORMERS_REPO);
  console.error(`Found ${testFileDates.length} test files`);

  const points = buildWeeklyDataPoints(defects, testFileDates);
  const step = Math.max(1, Math.floor(points.length / 12));
  const sampledPoints = points.filter((_, i) => i % step === 0 || i === points.length - 1);
  const latest = points[points.length - 1] || {};
  const activeNow = defects.filter((d) => !d.resolved).length;

  const output = {
    generatedAt: new Date().toISOString(),
    config: { startDate: format(START_DATE, 'yyyy-MM-dd'), endDate: format(END_DATE, 'yyyy-MM-dd'), project: 'CW', team: 'Reformers' },
    summary: { testCasesToday: latest.testCases ?? 0, totalDefectsFound: defects.length, activeDefectsNow: activeNow, testRunsCompleted: 0 },
    chartData: {
      labels: sampledPoints.map((p) => p.shortLabel),
      activeDefects: sampledPoints.map((p) => p.activeDefects),
      cumulativeDefects: sampledPoints.map((p) => p.cumulativeDefects),
      testCases: sampledPoints.map((p) => p.testCases),
    },
    rawPoints: points,
  };

  const dataPath = join(__dirname, '../data/quality-graph-data.json');
  const htmlPath = join(__dirname, '../quality-improvement-graph.html');
  writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf-8');
  writeFileSync(htmlPath, generateHtml(output), 'utf-8');
  console.log(`Graph written to ${htmlPath}`);
  console.log('Summary:', output.summary);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
