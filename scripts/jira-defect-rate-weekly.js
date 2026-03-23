#!/usr/bin/env node
/**
 * Fetches defects from Jira using the Reformers/Cares-Nexus/VIHE JQL
 * (including status NOT IN (Cancelled)), aggregates by week (created date),
 * and prints a Mermaid xychart line chart. Each point = defects logged that week.
 * X-axis uses short labels (e.g. "10 Mar") for readability.
 *
 * Requires: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env)
 * Run: node scripts/jira-defect-rate-weekly.js
 */

import 'dotenv/config';
import { format, addWeeks } from 'date-fns';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const JQL = `"Teams[Dropdown]" = Reformers AND type = Bug AND labels IN (Cares-Nexus, VIHE, vIHE-e2e) AND labels NOT IN (vIHE-fast-follow, IHE, IHE-fast-follow) AND status NOT IN (Cancelled) ORDER BY created ASC`;

const MAX_RESULTS = 100;

/** Use the new /rest/api/3/search/jql endpoint (old /search returns 410). */
async function jiraSearch(jql, fields, nextPageToken = null) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env). See JIRA_SETUP.md');
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

/** Week key: Monday of the week in UTC (Jira created is ISO/UTC). Returns yyyy-MM-dd. */
function getWeekKey(isoDateStr) {
  if (!isoDateStr) return null;
  const d = new Date(isoDateStr);
  const utcDay = d.getUTCDay();
  const daysSinceMonday = (utcDay + 6) % 7;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - daysSinceMonday);
  const y = monday.getUTCFullYear();
  const m = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const day = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  const countsByWeek = {};
  let nextPageToken = null;
  let total = 0;

  do {
    const data = await jiraSearch(JQL, ['created'], nextPageToken);
    const issues = data.issues || [];
    total += issues.length;
    nextPageToken = data.nextPageToken ?? null;
    for (const issue of issues) {
      const created = issue.fields?.created;
      const weekKey = getWeekKey(created);
      if (weekKey) {
        countsByWeek[weekKey] = (countsByWeek[weekKey] || 0) + 1;
      }
    }
    if (issues.length === 0) break;
  } while (nextPageToken);

  const weekKeys = Object.keys(countsByWeek).sort();
  if (weekKeys.length === 0) {
    console.log('No issues with created dates found. Total issues:', total);
    if (total > 0) {
      const data = await jiraSearch(JQL, ['created'], null);
      const first = data.issues?.[0];
      if (first) {
        console.log('Sample issue fields:', JSON.stringify(first.fields, null, 2));
      }
    }
    return;
  }

  const firstWeek = new Date(weekKeys[0] + 'T12:00:00');
  const lastWeek = new Date(weekKeys[weekKeys.length - 1] + 'T12:00:00');
  const labels = [];
  const chartLabels = [];
  const values = [];
  let current = firstWeek;
  let index = 0;
  while (current <= lastWeek) {
    const key = format(current, 'yyyy-MM-dd');
    labels.push(format(current, 'd MMM yy'));
    const dayOfMonth = current.getDate();
    const isFirstWeekOfMonth = dayOfMonth <= 7;
    chartLabels.push(isFirstWeekOfMonth ? format(current, 'MMM yy') : '\u200B'.repeat(index + 1));
    values.push(countsByWeek[key] ?? 0);
    current = addWeeks(current, 1);
    index += 1;
  }
  const n = labels.length;

  const maxVal = Math.max(1, ...values);
  const yMax = Math.ceil(maxVal * 1.2) || 10;

  console.log('');
  console.log('Defects logged per week (each point on the graph = this count):');
  labels.forEach((label, idx) => {
    console.log(`  ${label}: ${values[idx]} defect(s)`);
  });
  console.log('');
  console.log('--- Paste the block below into TEST_GROWTH_ANALYSIS.md (section 8 - Defects per week) ---');
  console.log('');
  console.log('```mermaid');
  console.log('---');
  console.log('config:');
  console.log('  width: 1100');
  console.log('  themeVariables:');
  console.log('    xyChart:');
  console.log("      backgroundColor: '#ffffff'");
  console.log("      titleColor: '#000000'");
  console.log("      xAxisLabelColor: '#000000'");
  console.log("      yAxisLabelColor: '#000000'");
  console.log('---');
  console.log('xychart-beta');
  console.log('    title "Defects logged per week (Reformers, Cares-Nexus / VIHE / vIHE-e2e, excl. Cancelled)"');
  console.log('    x-axis [' + chartLabels.map((l) => `"${l}"`).join(', ') + ']');
  console.log(`    y-axis "Defects logged" 0 --> ${yMax}`);
  console.log('    line [' + values.join(', ') + ']');
  console.log('```');
  console.log('');
  console.log('Total defects (matching JQL):', total);
  console.log('Weeks shown:', labels.length, '(one point per week). X-axis shows first week of each month only (e.g. Mar 25, Apr 25).');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
