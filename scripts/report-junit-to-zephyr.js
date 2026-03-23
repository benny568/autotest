#!/usr/bin/env node
/**
 * Map JUnit XML results to Zephyr Scale test cases via data/zephyr-mapping/*.json and POST test executions.
 *
 * Requires:
 *   ZEPHYR_API_TOKEN
 *   ZEPHYR_TEST_CYCLE_KEY — target cycle (e.g. CW-R12) from Zephyr Scale
 *   ZEPHYR_PROJECT_KEY (optional; default from config/testing-repos.json)
 *
 * Usage:
 *   node scripts/report-junit-to-zephyr.js path/to/junit.xml
 *   node scripts/report-junit-to-zephyr.js reports/*.xml
 *   node scripts/report-junit-to-zephyr.js reports/   # directory: all .xml files recursively
 *   node scripts/report-junit-to-zephyr.js --dry-run path/to/junit.xml
 *
 * Mapping lookup order for each <testcase>:
 *   1. repoId::${classname}.${name}   (typical .NET FQN-style)
 *   2. repoId::${classname}            (if name empty)
 *   3. Any mapping key ending with ::${name} (TS; may be ambiguous)
 *
 * Set ZEPHYR_JUNIT_REPO_ID=reformers.content-manager-service (default) or reformers.content-manager-client
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { createTestExecution, getToken } from './lib/zephyr-scale.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

try {
  const dotenv = await import('dotenv');
  (dotenv.default || dotenv).config();
} catch {
  // optional
}

function loadProjectKey() {
  try {
    const config = JSON.parse(readFileSync(join(ROOT, 'config/testing-repos.json'), 'utf-8'));
    return process.env.ZEPHYR_PROJECT_KEY || config.projectKey || 'CW';
  } catch {
    return process.env.ZEPHYR_PROJECT_KEY || 'CW';
  }
}

function loadAllMappings() {
  const dir = join(ROOT, 'data/zephyr-mapping');
  const legacy = join(ROOT, 'data/zephyr-test-mapping.json');
  const merged = {};
  if (existsSync(legacy)) {
    Object.assign(merged, JSON.parse(readFileSync(legacy, 'utf-8')));
  }
  if (existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.json')) continue;
      Object.assign(merged, JSON.parse(readFileSync(join(dir, f), 'utf-8')));
    }
  }
  return merged;
}

/**
 * @returns {{ name: string, classname: string, passed: boolean }[]}
 */
function parseJUnitXml(xml) {
  const out = [];
  const testcaseRegex = /<testcase\s+([^>]*?)>([\s\S]*?)<\/testcase>/gi;
  let m;
  while ((m = testcaseRegex.exec(xml)) !== null) {
    const attrs = m[1];
    const inner = m[2];
    const name = attrs.match(/\bname="([^"]*)"/)?.[1] ?? '';
    const classname = attrs.match(/\bclassname="([^"]*)"/)?.[1] ?? '';
    const passed = !/<failure\b/i.test(inner) && !/<error\b/i.test(inner);
    out.push({ name, classname, passed });
  }
  return out;
}

function resolveZephyrKey(mapping, repoId, classname, name) {
  const c = (classname || '').trim();
  const n = (name || '').trim();
  const fqnDot = c && n ? `${c}.${n}` : c || n;
  const candidates = [
    `${repoId}::${fqnDot}`,
    `${repoId}::${c}`,
    n ? `${repoId}::${n}` : null,
  ].filter(Boolean);

  for (const key of candidates) {
    if (mapping[key]?.zephyrKey) return mapping[key].zephyrKey;
  }

  if (n) {
    const suffix = `::${n}`;
    for (const key of Object.keys(mapping)) {
      if (key.endsWith(suffix) && mapping[key]?.zephyrKey) {
        return mapping[key].zephyrKey;
      }
    }
  }
  return null;
}

function resolveJUnitPaths(argv) {
  const args = argv.filter((a) => a !== '--dry-run' && !a.startsWith('-'));
  const paths = [];
  for (const a of args) {
    if (!existsSync(a)) continue;
    try {
      const st = statSync(a);
      if (st.isDirectory()) {
        paths.push(...globSync('**/*.xml', { cwd: a, absolute: true, nodir: true }));
      } else {
        paths.push(a);
      }
    } catch {
      // skip
    }
  }
  return [...new Set(paths)];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const junitPaths = resolveJUnitPaths(process.argv.slice(2));
  if (junitPaths.length === 0) {
    console.error(
      'Usage: node scripts/report-junit-to-zephyr.js [--dry-run] <junit.xml> [more.xml ...] [dir/]\n' +
        'Requires ZEPHYR_API_TOKEN, ZEPHYR_TEST_CYCLE_KEY, and matching entries in data/zephyr-mapping/*.json'
    );
    process.exit(1);
  }

  const cycleKey = process.env.ZEPHYR_TEST_CYCLE_KEY?.trim();
  if (!cycleKey && !dryRun) {
    console.error('Set ZEPHYR_TEST_CYCLE_KEY to the Zephyr Scale test cycle key (e.g. CW-R1).');
    process.exit(1);
  }

  const repoId = process.env.ZEPHYR_JUNIT_REPO_ID?.trim() || 'reformers.content-manager-service';
  const projectKey = loadProjectKey();
  const cases = [];
  for (const p of junitPaths) {
    try {
      cases.push(...parseJUnitXml(readFileSync(p, 'utf-8')));
    } catch (e) {
      console.warn(`Skip ${p}:`, e.message);
    }
  }
  if (cases.length === 0) {
    console.error('No <testcase> elements found in JUnit file(s).');
    process.exit(1);
  }
  console.error(`JUnit: ${junitPaths.length} file(s), ${cases.length} testcase(s)`);

  const mapping = loadAllMappings();
  const token = dryRun ? null : getToken();

  let posted = 0;
  let skipped = 0;
  let failed = 0;
  let dryRunMatched = 0;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const tc of cases) {
    const zKey = resolveZephyrKey(mapping, repoId, tc.classname, tc.name);
    const statusName = tc.passed ? 'Pass' : 'Fail';
    if (!zKey) {
      skipped++;
      console.warn(`No mapping: ${tc.classname} / ${tc.name}`);
      continue;
    }
    if (dryRun) {
      dryRunMatched++;
      console.log(`[dry-run] ${zKey} -> ${statusName}`);
      continue;
    }
    try {
      await createTestExecution(
        {
          projectKey,
          testCaseKey: zKey,
          testCycleKey: cycleKey,
          statusName,
          comment: `JUnit import (${repoId})`,
        },
        token
      );
      posted++;
      await delay(120);
    } catch (e) {
      failed++;
      console.error(`Failed ${zKey}:`, e.message);
    }
  }

  if (dryRun) {
    console.log(`Done (dry-run). Would post: ${dryRunMatched}, skipped (no map): ${skipped}`);
  } else {
    console.log(`Done. Posted: ${posted}, skipped (no map): ${skipped}, failed: ${failed}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
