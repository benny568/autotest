#!/usr/bin/env node
/**
 * Builds quality improvement graph using the same data as TEST_GROWTH_ANALYSIS.md:
 * - Test cases: unique test names from test-cases-spreadsheet-*.csv (run_extract.py output)
 * - Defects: from MCP Jira data (CW project, Reformers team)
 *
 * Usage: node scripts/build-quality-graph-from-csv.js [defect-files...]
 * Example: node scripts/build-quality-graph-from-csv.js data/mcp-defects-cw-reformers.json data/mcp-defects-2026.json
 *
 * Optional: Set TESTING_PERIODS (array of { start, end } dates) to add vertical lines marking
 * up to three testing periods. Set start/end to null to hide a period.
 * Optional: Set UAT_PERIOD ({ start, end }) to add a shaded UAT ribbon across the top of the chart.
 * Set to null to hide.
 * Optional: Set SPRINT_END_PREDICTION ({ date, defectsLogged, openDefects, testCases }) to show a prediction
 * panel to the right. Use null for any value to use the latest from data. Set SPRINT_END_PREDICTION to null to hide.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  startOfDay,
  endOfDay,
  addWeeks,
  addDays,
  format,
  isBefore,
  isAfter,
  parseISO,
} from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTOTEST_DIR = join(__dirname, '..');
const START_DATE = new Date('2025-10-01');
const END_DATE = new Date();

// Vertical lines for testing periods (set start/end to null to hide a period). Up to three periods.
const TESTING_PERIODS = [
  { start: new Date('2025-12-04'), end: new Date('2025-12-10') }, // Period 1, e.g. { start: new Date('2026-01-15'), end: new Date('2026-01-31') }
  { start: new Date('2026-01-02'), end: new Date('2026-01-09') }, // Period 2
  { start: new Date('2026-01-28'), end: new Date('2026-02-06') }, // Period 3
  { start: new Date('2026-02-18'), end: new Date('2026-03-05') }, // Period 4
];

// Optional UAT start marker - vertical line at this date. Set to null to hide.
const UAT_START_MARKER = new Date('2025-11-12');

// UAT (User Acceptance Testing) period - shown as a shaded ribbon at top of chart.
// Starts at UAT_START_MARKER when set; otherwise uses fallback. Set to null to hide.
const UAT_PERIOD = UAT_START_MARKER
  ? { start: UAT_START_MARKER, end: new Date() }
  : { start: new Date('2025-10-01'), end: new Date() };

// Sprint-end prediction - shown as grey continuation of graph lines. Set to null to hide.
const SPRINT_END_PREDICTION = {
  date: new Date('2026-03-25'), // End of current sprint
  defectsLogged: null, // Defects logged in final sprint week (null = use latest)
  openDefectsReduction: 12, // Reduce open defects by this amount from current (use openDefects to set absolute value)
  testCases: null, // null = use latest
};

function countUniqueTestNamesFromCSV(csvPath) {
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  const unique = new Set();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const idx = line.indexOf(',');
    const idx2 = idx >= 0 ? line.indexOf(',', idx + 1) : -1;
    if (idx2 >= 0) {
      const testName = line.slice(idx2 + 1).replace(/^"|"$/g, '').trim();
      if (testName) unique.add(testName);
    }
  }
  return unique.size;
}

const REPORT_SNAPSHOT_DATES = ['2025-12-01', '2026-01-12', '2026-01-28', '2026-02-13', '2026-02-25', '2026-03-04', '2026-03-18'];

function loadCSVSnapshots() {
  const snapshots = [];
  const files = readdirSync(AUTOTEST_DIR).filter(
    (f) => f.startsWith('test-cases-spreadsheet-') && f.endsWith('.csv') && !f.includes('BACKUP') && !f.includes('REEXTRACTED')
  );
  for (const f of files) {
    const m = f.match(/test-cases-spreadsheet-(\d{4}-\d{2}-\d{2})\.csv/);
    if (m) {
      const dateStr = m[1];
      if (!REPORT_SNAPSHOT_DATES.includes(dateStr)) continue;
      const path = join(AUTOTEST_DIR, f);
      if (!existsSync(path)) continue;
      const count = countUniqueTestNamesFromCSV(path);
      snapshots.push({ date: parseISO(dateStr), dateStr, count });
    }
  }
  return snapshots.sort((a, b) => a.date - b.date);
}

function getTestCountForDate(snapshots, date) {
  const pointTime = endOfDay(date).getTime();
  let best = null;
  for (const s of snapshots) {
    const t = s.date.getTime();
    if (t <= pointTime && (!best || t > best.date.getTime())) {
      best = s;
    }
  }
  return best ? best.count : 0;
}

const ALLOWED_LABELS = new Set(['VIHE', 'vIHE-e2e']);

function hasAllowedLabel(issue) {
  const labels = issue.labels ?? issue.fields?.labels ?? [];
  return labels.some((l) => ALLOWED_LABELS.has(l));
}

function parseMcpDefects(issues) {
  const seen = new Set();
  return (issues || []).filter(hasAllowedLabel).map((issue) => {
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

function buildWeeklyDataPoints(defects, csvSnapshots) {
  const points = [];
  let current = startOfDay(START_DATE);
  const end = endOfDay(END_DATE);
  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    const pointDate = endOfDay(current);
    const weekStart = startOfDay(current);
    const weekEnd = endOfDay(addDays(current, 6));
    const defectsLogged = defects.filter((d) => {
      if (!d.created) return false;
      const created = d.created;
      return !isBefore(created, weekStart) && !isAfter(created, weekEnd);
    }).length;
    const openDefects = defects.filter((d) => {
      if (!d.created) return false;
      if (isAfter(d.created, pointDate)) return false;
      if (!d.resolved) return true;
      return isAfter(d.resolved, pointDate);
    }).length;
    const testCases = getTestCountForDate(csvSnapshots, current);
    points.push({
      date: format(current, 'yyyy-MM-dd'),
      label: format(current, 'MMM d'),
      shortLabel: format(current, 'M/d'),
      defectsLogged,
      openDefects,
      testCases,
    });
    current = addWeeks(current, 1);
  }
  const lastSnapshot = csvSnapshots[csvSnapshots.length - 1];
  if (lastSnapshot && points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (isAfter(lastSnapshot.date, parseISO(lastPoint.date))) {
      const pointDate = endOfDay(lastSnapshot.date);
      const weekStart = startOfDay(lastSnapshot.date);
      const weekEnd = endOfDay(addDays(lastSnapshot.date, 6));
      points.push({
        date: format(lastSnapshot.date, 'yyyy-MM-dd'),
        label: format(lastSnapshot.date, 'MMM d'),
        shortLabel: format(lastSnapshot.date, 'M/d'),
        defectsLogged: defects.filter((d) => {
          if (!d.created) return false;
          const created = d.created;
          return !isBefore(created, weekStart) && !isAfter(created, weekEnd);
        }).length,
        openDefects: defects.filter((d) => {
          if (!d.created) return false;
          if (isAfter(d.created, pointDate)) return false;
          if (!d.resolved) return true;
          return isAfter(d.resolved, pointDate);
        }).length,
        testCases: lastSnapshot.count,
      });
    }
  }
  return points;
}

function findAnnotationLabels(sampledPoints, startDate, endDate) {
  if (!startDate || !endDate) return null;
  const start = parseISO(typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd'));
  const end = parseISO(typeof endDate === 'string' ? endDate : format(endDate, 'yyyy-MM-dd'));
  // Use the week that contains each date (not first/last point), so start and end get distinct labels
  const inWeek = (date, point) => {
    const weekStart = parseISO(point.date);
    const weekEnd = addDays(weekStart, 6);
    return !isBefore(date, weekStart) && !isAfter(date, weekEnd);
  };
  let startLabel = sampledPoints.find((p) => inWeek(start, p))?.shortLabel;
  let endLabel = [...sampledPoints].reverse().find((p) => inWeek(end, p))?.shortLabel;
  // Fallback if date falls in a week not in sampled points
  if (!startLabel) startLabel = sampledPoints.find((p) => !isBefore(parseISO(p.date), start))?.shortLabel;
  if (!endLabel) endLabel = [...sampledPoints].reverse().find((p) => !isAfter(parseISO(p.date), end))?.shortLabel;
  if (!startLabel || !endLabel) return null;
  return { startLabel, endLabel };
}

function getBoundaryPointIndices(points, periods, uatPeriod, uatStartMarker) {
  const inWeek = (date, point) => {
    const weekStart = parseISO(point.date);
    const weekEnd = addDays(weekStart, 6);
    return !isBefore(date, weekStart) && !isAfter(date, weekEnd);
  };
  const indices = new Set();
  const allPeriods = [...(periods || [])];
  if (uatPeriod?.start && uatPeriod?.end) allPeriods.push(uatPeriod);
  if (uatStartMarker) allPeriods.push({ start: uatStartMarker, end: uatStartMarker });
  for (const p of allPeriods) {
    if (!p?.start || !p?.end) continue;
    const start = parseISO(typeof p.start === 'string' ? p.start : format(p.start, 'yyyy-MM-dd'));
    const end = parseISO(typeof p.end === 'string' ? p.end : format(p.end, 'yyyy-MM-dd'));
    const startIdx = points.findIndex((pt) => inWeek(start, pt));
    const endIdx = points.findIndex((pt) => inWeek(end, pt));
    if (startIdx >= 0) indices.add(startIdx);
    if (endIdx >= 0) indices.add(endIdx);
  }
  return indices;
}

function findAnnotationLabelsForPeriods(points, sampledPoints, periods) {
  return (periods || [])
    .map((p, i) => (p?.start && p?.end ? { ...findAnnotationLabels(sampledPoints, p.start, p.end), periodNum: i + 1 } : null))
    .filter(Boolean);
}

function generateHtml(data) {
  const { chartData, summary, config, testingPeriodAnnotations, uatAnnotations, uatStartLabel, prediction } = data;
  const labels = JSON.stringify(chartData.labels);
  const defectsLogged = JSON.stringify(chartData.defectsLogged);
  const openDefects = JSON.stringify(chartData.openDefects);
  const testCases = JSON.stringify(chartData.testCases);
  const allDefectVals = [
    ...(chartData.defectsLogged || []),
    ...(chartData.openDefects || []),
    ...(chartData.predictionOpenDefects || []),
  ].filter((v) => v != null);
  const allTestVals = [...(chartData.testCases || [])].filter((v) => v != null);
  const defectsMax = Math.max(0, ...allDefectVals) || 0;
  const testMax = Math.max(0, ...allTestVals) || 0;
  const yDefectsMax = Math.max(20, Math.ceil(defectsMax * 1.15));
  const yTestMax = Math.max(20, Math.ceil(testMax * 1.15));
  const periodColors = [
    { start: 'rgba(76, 175, 80, 0.8)', end: 'rgba(244, 67, 54, 0.8)' },
    { start: 'rgba(33, 150, 243, 0.8)', end: 'rgba(255, 152, 0, 0.8)' },
    { start: 'rgba(156, 39, 176, 0.8)', end: 'rgba(0, 188, 212, 0.8)' },
  ];
  const uatRibbonYMin = yDefectsMax * 0.95;
  const uatBoxEntry = uatAnnotations
    ? `uatBox: { type: 'box', xMin: ${JSON.stringify(uatAnnotations.startLabel)}, xMax: ${JSON.stringify(uatAnnotations.endLabel)}, xScaleID: 'x', yMin: ${uatRibbonYMin}, yMax: ${yDefectsMax}, yScaleID: 'y', backgroundColor: 'rgba(66, 133, 244, 0.15)', borderColor: 'rgba(66, 133, 244, 0.4)', borderWidth: 1, borderDash: [6, 4], drawTime: 'beforeDatasetsDraw', z: -1, label: { display: true, content: 'UAT', position: 'start', font: { size: 10, weight: 'normal' } } }`
    : '';
  const uatStartEntry = uatStartLabel
    ? `uatStart: { type: 'line', xMin: ${JSON.stringify(uatStartLabel)}, xMax: ${JSON.stringify(uatStartLabel)}, xScaleID: 'x', yMin: 0, yMax: ${yDefectsMax}, yScaleID: 'y', borderColor: 'rgba(0, 137, 123, 0.9)', borderWidth: 3, borderDash: [8, 4], label: { display: true, content: 'UAT start', position: 'end', yAdjust: -4, font: { size: 8, weight: 'normal' }, backgroundColor: 'rgba(0, 137, 123, 0.9)' } }`
    : '';
  const annotationsEntries = (testingPeriodAnnotations || []).map((a, i) => {
    const colors = periodColors[i % periodColors.length];
    const lineOpts = (label) => `xMin: ${JSON.stringify(label)}, xMax: ${JSON.stringify(label)}, xScaleID: 'x', yMin: 0, yMax: ${uatRibbonYMin}, yScaleID: 'y'`;
    return `period${a.periodNum}Start: { type: 'line', ${lineOpts(a.startLabel)}, borderColor: '${colors.start}', borderWidth: 2, borderDash: [4, 4], label: { display: true, content: 'start', position: 'end' } }, period${a.periodNum}End: { type: 'line', ${lineOpts(a.endLabel)}, borderColor: '${colors.end}', borderWidth: 2, borderDash: [4, 4], label: { display: true, content: 'end', position: 'end' } }`;
  });
  const lastActualLabel = prediction && chartData.labels.length >= 2 ? chartData.labels[chartData.labels.length - 2] : null;
  const predictionBoxEntry =
    prediction && lastActualLabel
      ? `predictionBox: { type: 'box', xMin: ${JSON.stringify(lastActualLabel)}, xMax: ${JSON.stringify(prediction.shortLabel)}, xScaleID: 'x', yMin: ${uatRibbonYMin}, yMax: ${yDefectsMax}, yScaleID: 'y', backgroundColor: 'rgba(158, 158, 158, 0.08)', borderColor: 'rgba(158, 158, 158, 0.3)', borderWidth: 1, borderDash: [4, 4], drawTime: 'beforeDatasetsDraw', z: -1, label: { display: true, content: 'Prediction', position: 'start', font: { size: 10, weight: 'normal' }, color: '#757575' } }`
      : '';
  const allEntries = [uatBoxEntry, uatStartEntry, predictionBoxEntry, ...annotationsEntries].filter(Boolean);
  const annotationsConfig =
    allEntries.length > 0
      ? `annotation: { annotations: { ${allEntries.join(', ')} } }, `
      : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Testing Investment &amp; Quality Improvement</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3/dist/chartjs-plugin-annotation.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 24px; background: #fff; }
    h1 { font-size: 1.5rem; margin-bottom: 24px; }
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
          { label: 'Defects Logged', data: ${defectsLogged}, borderColor: '#d32f2f', backgroundColor: 'rgba(211, 47, 47, 0.2)', fill: true, tension: 0.3, yAxisID: 'y' },
          { label: 'Open Defects', data: ${openDefects}, borderColor: '#ff9800', borderDash: [5, 5], fill: false, tension: 0.3, yAxisID: 'y' },
          { label: 'Test Cases (unique names)', data: ${testCases}, borderColor: '#1976d2', fill: false, tension: 0.3, yAxisID: 'y1' }
          ${prediction ? `,
          { label: 'Predicted', data: ${JSON.stringify(chartData.predictionOpenDefects)}, borderColor: '#9e9e9e', borderDash: [4, 4], fill: false, tension: 0.3, yAxisID: 'y', pointRadius: 0 }` : ''}
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { ${annotationsConfig}legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: {
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Defects' }, min: 0, max: ${yDefectsMax} },
          y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Test Cases', align: 'end' }, min: 0, max: ${yTestMax}, grid: { drawOnChartArea: false }, ticks: { callback: function(v) { return (v === 500 || v === 1000 || v === 1500) ? '' : v; } } }
        }
      }
    });
  </script>
</body>
</html>`;
}

async function main() {
  const csvSnapshots = loadCSVSnapshots();
  if (csvSnapshots.length === 0) {
    console.error('No CSV snapshots found. Run: python3 run_extract.py');
    process.exit(1);
  }
  console.error(`Loaded ${csvSnapshots.length} CSV snapshots:`, csvSnapshots.map((s) => `${s.dateStr}=${s.count}`).join(', '));

  let defects = [];
  const args = process.argv.slice(2).filter((a) => !a.startsWith('-'));
  if (args.length > 0) {
    for (const path of args) {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      const issues = Array.isArray(data) ? data : (data.issues || []);
      defects = defects.concat(parseMcpDefects(issues));
    }
    const seen = new Set();
    defects = defects.filter((d) => {
      if (seen.has(d.key)) return false;
      seen.add(d.key);
      return true;
    });
  }
  console.error(`Loaded ${defects.length} defects from MCP data`);

  const points = buildWeeklyDataPoints(defects, csvSnapshots);
  const step = Math.max(1, Math.floor(points.length / 12));
  const boundaryIndices = getBoundaryPointIndices(points, TESTING_PERIODS, UAT_PERIOD, UAT_START_MARKER);
  const sampledPoints = points.filter(
    (_, i) => i % step === 0 || i === points.length - 1 || boundaryIndices.has(i)
  );
  const latest = points[points.length - 1] || {};
  const activeNow = defects.filter((d) => !d.resolved).length;

  const testingPeriodAnnotations = findAnnotationLabelsForPeriods(points, sampledPoints, TESTING_PERIODS);
  const uatAnnotations =
    UAT_PERIOD?.start && UAT_PERIOD?.end
      ? findAnnotationLabels(sampledPoints, UAT_PERIOD.start, UAT_PERIOD.end)
      : null;
  const uatStartLabel =
    UAT_START_MARKER && sampledPoints.length > 0
      ? findAnnotationLabels(sampledPoints, UAT_START_MARKER, UAT_START_MARKER)?.startLabel
      : null;

  const prediction = SPRINT_END_PREDICTION
    ? (() => {
        const reduction = SPRINT_END_PREDICTION.openDefectsReduction ?? 0;
        const openDefects =
          SPRINT_END_PREDICTION.openDefects != null
            ? SPRINT_END_PREDICTION.openDefects
            : Math.max(0, activeNow - reduction);
        return {
          defectsLogged: SPRINT_END_PREDICTION.defectsLogged ?? (latest.defectsLogged ?? 0),
          openDefects,
          testCases: SPRINT_END_PREDICTION.testCases ?? (latest.testCases ?? 0),
          dateLabel: format(SPRINT_END_PREDICTION.date, 'MMM d, yyyy'),
          shortLabel: format(SPRINT_END_PREDICTION.date, 'M/d'),
        };
      })()
    : null;

  const baseLabels = sampledPoints.map((p) => p.shortLabel);
  const baseDefectsLogged = sampledPoints.map((p) => p.defectsLogged);
  const baseOpenDefects = sampledPoints.map((p) => p.openDefects);
  const baseTestCases = sampledPoints.map((p) => p.testCases);

  const lastIdx = baseLabels.length - 1;
  const chartData = prediction
    ? (() => {
        const predOpen = baseOpenDefects.map((v, i) => (i === lastIdx ? v : null));
        predOpen.push(prediction.openDefects);
        return {
          labels: [...baseLabels, prediction.shortLabel],
          defectsLogged: [...baseDefectsLogged, null],
          openDefects: [...baseOpenDefects, null],
          testCases: [...baseTestCases, null],
          predictionOpenDefects: predOpen,
        };
      })()
    : {
        labels: baseLabels,
        defectsLogged: baseDefectsLogged,
        openDefects: baseOpenDefects,
        testCases: baseTestCases,
      };

  const output = {
    generatedAt: new Date().toISOString(),
    dataSource: 'test-cases-spreadsheet-*.csv (same as TEST_GROWTH_ANALYSIS.md)',
    config: { startDate: format(START_DATE, 'yyyy-MM-dd'), endDate: format(END_DATE, 'yyyy-MM-dd'), project: 'CW', team: 'Reformers' },
    testingPeriodAnnotations,
    uatAnnotations,
    uatStartLabel,
    prediction,
    summary: {
      testCasesToday: latest.testCases ?? 0,
      totalDefectsFound: defects.length,
      activeDefectsNow: activeNow,
      testRunsCompleted: 0,
    },
    chartData,
    rawPoints: points,
  };

  const dataPath = join(AUTOTEST_DIR, 'data/quality-graph-data.json');
  const htmlPath = join(AUTOTEST_DIR, 'quality-improvement-graph.html');
  writeFileSync(dataPath, JSON.stringify(output, null, 2), 'utf-8');
  writeFileSync(htmlPath, generateHtml(output), 'utf-8');
  console.log(`Graph written to ${htmlPath}`);
  console.log('Summary:', output.summary);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
