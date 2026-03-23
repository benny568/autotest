#!/usr/bin/env node
/**
 * Fetches defect data from Jira (CW project, Reformers team) with full pagination,
 * applies priority filter (excludes Low, Lowest, Minor), and saves to the JSON
 * files used by build-quality-graph-from-csv.js.
 *
 * Includes both Bug and UX Bug issue types to match Jira dashboard.
 *
 * Requires: JIRA_BASE_URL (or JIRA_URL), JIRA_EMAIL (or JIRA_USERNAME), JIRA_API_TOKEN
 * Run: node scripts/fetch-defects-for-quality-graph.js
 */

import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

const JIRA_BASE_URL = process.env.JIRA_BASE_URL || process.env.JIRA_URL;
const JIRA_EMAIL = process.env.JIRA_EMAIL || process.env.JIRA_USERNAME;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;

const MAX_RESULTS = 100;

// CW project, Reformers team, Bug + UX Bug, exclude Low/Lowest/Minor
const JQL_PRE_2026 =
  'project = CW AND "Teams[Dropdown]" = Reformers AND issuetype IN (Bug, "UX Bug") AND priority NOT IN (Low, Lowest, Minor) AND created < 2026-01-01 ORDER BY created ASC';
const JQL_2026 =
  'project = CW AND "Teams[Dropdown]" = Reformers AND issuetype IN (Bug, "UX Bug") AND priority NOT IN (Low, Lowest, Minor) AND created >= 2026-01-01 ORDER BY created ASC';

async function jiraSearch(jql, fields, nextPageToken = null) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error(
      'Set JIRA_BASE_URL (or JIRA_URL), JIRA_EMAIL (or JIRA_USERNAME), JIRA_API_TOKEN. See JIRA_SETUP.md'
    );
  }
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const params = new URLSearchParams({
    jql,
    maxResults: String(MAX_RESULTS),
    fields: Array.isArray(fields) ? fields.join(',') : fields,
  });
  if (nextPageToken) params.set('nextPageToken', nextPageToken);
  const url = `${JIRA_BASE_URL.replace(/\/$/, '')}/rest/api/3/search/jql?${params.toString()}`;
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

async function fetchAllIssues(jql) {
  const all = [];
  let nextPageToken = null;
  do {
    const data = await jiraSearch(jql, ['created', 'resolutiondate', 'labels'], nextPageToken);
    const issues = data.issues || [];
    for (const issue of issues) {
      all.push({
        key: issue.key,
        created: issue.fields?.created ?? null,
        resolutiondate: issue.fields?.resolutiondate ?? null,
        labels: issue.fields?.labels ?? [],
      });
    }
    nextPageToken = data.nextPageToken ?? null;
    if (issues.length === 0) break;
  } while (nextPageToken);
  return all;
}

function toJsonFormat(issues) {
  return {
    issues: issues.map((i) => {
      const o = { key: i.key, created: i.created, labels: i.labels ?? [] };
      if (i.resolutiondate) o.resolutiondate = i.resolutiondate;
      return o;
    }),
  };
}

async function main() {
  console.log('Fetching defects from Jira (CW, Reformers, Bug + UX Bug, priority != Low/Lowest/Minor)...');

  const [pre2026, y2026] = await Promise.all([
    fetchAllIssues(JQL_PRE_2026),
    fetchAllIssues(JQL_2026),
  ]);

  console.log(`  Pre-2026: ${pre2026.length} defects`);
  console.log(`  2026:     ${y2026.length} defects`);

  const pre2026Path = join(DATA_DIR, 'mcp-defects-cw-reformers.json');
  const y2026Path = join(DATA_DIR, 'mcp-defects-2026.json');

  writeFileSync(pre2026Path, JSON.stringify(toJsonFormat(pre2026), null, 0), 'utf-8');
  writeFileSync(y2026Path, JSON.stringify(toJsonFormat(y2026), null, 0), 'utf-8');

  console.log(`\nSaved to ${pre2026Path}`);
  console.log(`Saved to ${y2026Path}`);
  console.log('\nRun: npm run quality-graph');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
