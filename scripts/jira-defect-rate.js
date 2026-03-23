#!/usr/bin/env node
/**
 * Fetches defects from Jira using the Reformers/Cares-Nexus/VIHE JQL,
 * aggregates by month (created date) for the last 11 months, and prints
 * a Mermaid xychart line chart for pasting into TEST_GROWTH_ANALYSIS.md.
 *
 * Requires: JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env)
 * Run: node scripts/jira-defect-rate.js
 */

import 'dotenv/config';
import { startOfMonth, format, subMonths } from 'date-fns';

const JIRA_BASE_URL = process.env.JIRA_BASE_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const JQL = `"Teams[Dropdown]" = Reformers AND type = Bug AND labels IN (Cares-Nexus, VIHE, vIHE-e2e) AND labels NOT IN (vIHE-fast-follow, IHE, IHE-fast-follow)`;

const NUM_MONTHS = 11;
const MAX_RESULTS = 100;

async function jiraSearch(jql, fields, startAt = 0) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN (or .env). See JIRA_SETUP.md');
  }
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const url = `${JIRA_BASE_URL}/rest/api/3/search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ jql, fields, startAt, maxResults: MAX_RESULTS }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira API ${res.status}: ${text}`);
  }
  return res.json();
}

function getMonthKey(isoDateStr) {
  if (!isoDateStr) return null;
  const d = new Date(isoDateStr);
  const start = startOfMonth(d);
  return format(start, 'yyyy-MM');
}

async function main() {
  const countsByMonth = {};
  let startAt = 0;
  let total = 1;

  while (startAt < total) {
    const data = await jiraSearch(JQL, ['created'], startAt);
    total = data.total;
    const issues = data.issues || [];
    for (const issue of issues) {
      const created = issue.fields?.created;
      const monthKey = getMonthKey(created);
      if (monthKey) {
        countsByMonth[monthKey] = (countsByMonth[monthKey] || 0) + 1;
      }
    }
    startAt += issues.length;
    if (issues.length === 0) break;
  }

  // Build ordered series: one point per month = count of defects created that month
  const now = new Date();
  const monthLabels = [];
  const values = [];
  for (let i = NUM_MONTHS - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const key = format(monthStart, 'yyyy-MM');
    const label = format(monthStart, 'MMM yy');
    const count = countsByMonth[key] || 0;
    monthLabels.push(label);
    values.push(count);
  }

  const maxVal = Math.max(1, ...values);
  const yMax = Math.ceil(maxVal * 1.2) || 10;

  console.log('');
  console.log('Defects logged per month (each point on the graph = this count):');
  monthLabels.forEach((label, idx) => {
    console.log(`  ${label}: ${values[idx]} defect(s)`);
  });
  console.log('');
  console.log('--- Paste the block below into TEST_GROWTH_ANALYSIS.md (Defect rate section 7) ---');
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
  console.log('    title "Defects logged per month (Reformers, Cares-Nexus / VIHE / vIHE-e2e)"');
  console.log('    x-axis [' + monthLabels.map((l) => `"${l}"`).join(', ') + ']');
  console.log(`    y-axis "Defects logged" 0 --> ${yMax}`);
  console.log('    line [' + values.join(', ') + ']');
  console.log('```');
  console.log('');
  console.log('Total defects (matching JQL):', total);
  console.log('Months shown:', NUM_MONTHS, '(one point per month = count for that month)');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
