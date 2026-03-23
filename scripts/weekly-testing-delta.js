#!/usr/bin/env node
/**
 * Weekly deltas from data/snapshots.json (client snapshot pipeline).
 * Primary stakeholder metric: code coverage (line %). Also shows unit/E2E counts when present.
 *
 * Project start: 2025-12-01 (ISO weeks; Monday week start, aligned with README).
 *
 * Usage:
 *   npm run testing:weekly-delta
 *   npm run testing:weekly-delta -- --write
 *   npm run testing:weekly-delta -- --start 2025-12-01
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseISO, getISOWeek, getISOWeekYear, startOfISOWeek, isBefore } from 'date-fns';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SNAPSHOTS_FILE = join(ROOT, 'data/snapshots.json');
const OUTPUT_DIR = join(ROOT, 'data/weekly-deltas');
const DEFAULT_START = '2025-12-01';

function weekLabel(dateStr) {
  const d = parseISO(dateStr);
  const y = getISOWeekYear(d);
  const w = getISOWeek(d);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

function weekStartMonday(dateStr) {
  const d = parseISO(dateStr);
  return startOfISOWeek(d).toISOString().slice(0, 10);
}

function loadSnapshots() {
  if (!existsSync(SNAPSHOTS_FILE)) {
    console.error(`Missing ${SNAPSHOTS_FILE}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(SNAPSHOTS_FILE, 'utf-8'));
}

function pickLastPerWeek(snapshots, startDateStr) {
  const start = parseISO(startDateStr);
  const filtered = snapshots
    .filter((s) => s.date && !isBefore(parseISO(s.date), start))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const byWeek = new Map();
  for (const s of filtered) {
    const wk = weekLabel(s.date);
    byWeek.set(wk, s);
  }
  return Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([wk, snap]) => ({ week: wk, weekStart: weekStartMonday(snap.date), snap }));
}

function lineCoverage(snap) {
  const c = snap.coverage;
  if (!c) return null;
  const v = c.lineCoverage;
  if (typeof v !== 'number' || Number.isNaN(v)) return null;
  if (c.totalLines === 0) return null;
  return v;
}

function serviceLineCoverage(snap) {
  const c = snap.serviceCoverage;
  if (!c || typeof c.lineCoverage !== 'number' || Number.isNaN(c.lineCoverage)) return null;
  return c.lineCoverage;
}

function formatPct(n) {
  if (n == null || Number.isNaN(n)) return '—';
  return `${n.toFixed(2)}%`;
}

function formatDelta(prev, cur, fmt) {
  if (prev == null || cur == null) return '—';
  const d = cur - prev;
  if (Number.isNaN(d)) return '—';
  const sign = d > 0 ? '+' : '';
  return `${sign}${fmt(d)}`;
}

function parseArgs() {
  const write = process.argv.includes('--write');
  const idx = process.argv.indexOf('--start');
  const start = idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : DEFAULT_START;
  return { write, start };
}

function main() {
  const { write, start } = parseArgs();
  const snapshots = loadSnapshots();
  const rows = pickLastPerWeek(snapshots, start);

  if (rows.length === 0) {
    console.log(`No snapshots on or after ${start}.`);
    process.exit(0);
  }

  let prevLine = null;
  let prevUnit = null;
  let prevE2e = null;
  let prevSvcLine = null;
  let prevDotnet = null;

  const showService = rows.some(
    (r) => r.snap.dotnetTestCases != null || serviceLineCoverage(r.snap) != null
  );

  const lines = [];
  lines.push('# Weekly testing delta (snapshots)');
  lines.push('');
  lines.push(`Project start (filter): **${start}** · Source: \`data/snapshots.json\` · Metric focus: **line coverage**`);
  lines.push('');

  if (showService) {
    lines.push(
      '| ISO week | Week start (Mon) | Line cov | Δ line | Unit cases | Δ unit | E2E cases | Δ E2E | Svc line cov | Δ svc | .NET tests | Δ .NET |'
    );
    lines.push(
      '|----------|------------------|----------|--------|------------|--------|-----------|-------|--------------|-------|------------|--------|'
    );
  } else {
    lines.push('| ISO week | Week start (Mon) | Line cov | Δ line | Unit cases | Δ unit | E2E cases | Δ E2E |');
    lines.push('|----------|------------------|----------|--------|------------|--------|-----------|-------|');
  }

  for (const { week, weekStart, snap } of rows) {
    const line = lineCoverage(snap);
    const unit = snap.unitTestCases;
    const e2e = snap.e2eTestCases;
    const svcLine = serviceLineCoverage(snap);
    const dotnet = snap.dotnetTestCases;

    const dLine = formatDelta(prevLine, line, (x) => `${x.toFixed(2)} pts`);
    const dUnit = formatDelta(prevUnit, unit, (x) => String(Math.round(x)));
    const dE2e = formatDelta(prevE2e, e2e, (x) => String(Math.round(x)));
    const dSvc = formatDelta(prevSvcLine, svcLine, (x) => `${x.toFixed(2)} pts`);
    const dDot = formatDelta(prevDotnet, dotnet, (x) => String(Math.round(x)));

    if (showService) {
      lines.push(
        `| ${week} | ${weekStart} | ${formatPct(line)} | ${dLine} | ${unit ?? '—'} | ${dUnit} | ${e2e ?? '—'} | ${dE2e} | ${formatPct(svcLine)} | ${dSvc} | ${dotnet ?? '—'} | ${dDot} |`
      );
    } else {
      lines.push(
        `| ${week} | ${weekStart} | ${formatPct(line)} | ${dLine} | ${unit ?? '—'} | ${dUnit} | ${e2e ?? '—'} | ${dE2e} |`
      );
    }

    prevLine = line ?? prevLine;
    prevUnit = unit ?? prevUnit;
    prevE2e = e2e ?? prevE2e;
    prevSvcLine = svcLine ?? prevSvcLine;
    prevDotnet = dotnet ?? prevDotnet;
  }

  lines.push('');
  lines.push(
    '*Δ columns compare to the previous row (previous ISO week with a snapshot). Client line coverage requires lcov; service line coverage appears when snapshots include `serviceCoverage` (set `SNAPSHOT_INCLUDE_DOTNET_COVERAGE=true` when creating snapshots). `.NET tests` counts come from `dotnet test --list-tests` on the service solution.*'
  );

  const md = lines.join('\n');
  console.log(md);

  if (write) {
    if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
    const out = join(OUTPUT_DIR, 'latest.md');
    writeFileSync(out, md, 'utf-8');
    console.error(`\nWrote ${out}`);
  }
}

main();
