#!/usr/bin/env node
/**
 * Discovers automated tests in configured repos and syncs TypeScript tests to Zephyr Scale.
 * .NET repos are skipped here — use `npm run zephyr:sync:dotnet` (or `dotnet:discover` to list only).
 *
 * Per-repo mapping: data/zephyr-mapping/<repo-id>.json
 * Legacy: data/zephyr-test-mapping.json is still loaded for the client repo when the new file is absent.
 *
 * Usage:
 *   node scripts/sync-tests-to-zephyr.js              # Dry run all TS repos
 *   node scripts/sync-tests-to-zephyr.js --execute    # Create test cases in Zephyr
 *   node scripts/sync-tests-to-zephyr.js --update-titles   # Align Zephyr case names with code (needs token)
 *   node scripts/sync-tests-to-zephyr.js --repo-id reformers.content-manager-client
 *
 * Env:
 *   Paths: see config/testing-repos.json envPath per repo (e.g. REFORMERS_REPO_PATH)
 *   ZEPHYR_API_TOKEN, ZEPHYR_PROJECT_KEY (optional override of config projectKey)
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const dotenv = await import('dotenv');
  (dotenv.default || dotenv).config();
} catch {
  // optional
}

const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const CONFIG_PATH = join(ROOT, 'config/testing-repos.json');
const MAPPING_DIR = join(DATA_DIR, 'zephyr-mapping');

/**
 * Humanize test name for Zephyr display.
 */
function humanizeTestName(name) {
  let s = name.trim();
  s = s.replace(/^should\s+/i, '');
  if (!s) return name;
  s = s[0].toUpperCase() + s.slice(1);
  s = s.replace(/\bwhen no\s+/gi, 'when there is no ');
  s = s.replace(/\bwhen not\s+/gi, 'when it is not ');
  if (/^(load|show|display|render)\b/i.test(s)) {
    s = 'Can ' + s[0].toLowerCase() + s.slice(1);
  }
  s = s.replace(/\bcontent library\b/gi, 'the content library');
  s = s.replace(/\bno the content library\b/gi, 'no content library');
  return s;
}

const TEST_NAME_REGEXES = [
  /(?:it|test)\s*\(\s*['"]([^'"]+)['"]/g,
  /(?:it|test)\s*\(\s*`([^`]+)`/g,
];

function discoverTestsTs(repoPath) {
  if (!existsSync(repoPath)) {
    throw new Error(`Repo path not found: ${repoPath}`);
  }

  const ignore = ['**/node_modules/**', '**/dist/**', '**/coverage/**'];
  const files = [
    ...glob.sync('**/*.test.ts', { cwd: repoPath, ignore }),
    ...glob.sync('**/*.test.tsx', { cwd: repoPath, ignore }),
    ...glob.sync('**/*.spec.ts', { cwd: repoPath, ignore }),
  ];
  const seen = new Set();
  const tests = [];

  for (const file of files) {
    const fullPath = join(repoPath, file);
    let content;
    try {
      content = readFileSync(fullPath, 'utf-8');
    } catch (err) {
      console.warn(`Could not read ${file}:`, err.message);
      continue;
    }

    for (const regex of TEST_NAME_REGEXES) {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const testName = match[1].trim();
        if (testName.length < 3) continue;
        const key = `${file}::${testName}`;
        if (seen.has(key)) continue;
        seen.add(key);
        tests.push({
          file,
          name: testName,
          humanizedName: humanizeTestName(testName),
          fullName: `${file} > ${testName}`,
        });
      }
    }
  }

  return tests;
}

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    throw new Error(`Missing config: ${CONFIG_PATH}`);
  }
  return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
}

function resolveRepoPath(repo) {
  const envKey = repo.envPath;
  if (envKey && process.env[envKey]?.trim()) {
    return process.env[envKey].trim();
  }
  return (repo.defaultPath || '').trim();
}

function mappingPathForRepo(repoId) {
  return join(MAPPING_DIR, `${repoId}.json`);
}

function loadMapping(repo) {
  const path = mappingPathForRepo(repo.id);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return {};
    }
  }
  if (repo.legacyMappingFile) {
    const legacy = join(DATA_DIR, repo.legacyMappingFile);
    if (existsSync(legacy)) {
      try {
        return JSON.parse(readFileSync(legacy, 'utf-8'));
      } catch {
        return {};
      }
    }
  }
  return {};
}

function saveMapping(repo, mapping) {
  if (!existsSync(MAPPING_DIR)) mkdirSync(MAPPING_DIR, { recursive: true });
  writeFileSync(mappingPathForRepo(repo.id), JSON.stringify(mapping, null, 2), 'utf-8');
}

function createZephyrTestCase(name, folderId, projectKey, extraLabels) {
  const token = process.env.ZEPHYR_API_TOKEN;
  if (!token) throw new Error('ZEPHYR_API_TOKEN not set');

  const labels = ['Automated', ...(extraLabels || [])];
  const body = JSON.stringify({
    projectKey,
    name,
    folderId,
    labels,
  });
  const tmpPath = join(tmpdir(), `zephyr-create-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  try {
    writeFileSync(tmpPath, body, 'utf-8');
    const result = execSync(
      `curl -s -X POST "https://api.zephyrscale.smartbear.com/v2/testcases" ` +
        `-H "Authorization: Bearer ${token}" ` +
        `-H "Content-Type: application/json" ` +
        `-d @${tmpPath}`,
      { encoding: 'utf-8', maxBuffer: 1024 * 1024 }
    );
    const parsed = JSON.parse(result);
    return parsed.key;
  } finally {
    try {
      unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

function parseArgs() {
  const execute = process.argv.includes('--execute');
  const updateTitles = process.argv.includes('--update-titles');
  const idx = process.argv.indexOf('--repo-id');
  const repoId = idx >= 0 && process.argv[idx + 1] ? process.argv[idx + 1] : null;
  return { execute, repoId, updateTitles };
}

async function syncTitlesFromCodeTs(tests, mapping, token, delay) {
  const { getTestCase, updateTestCaseName } = await import('./lib/zephyr-scale.js');
  let updated = 0;
  for (const t of tests) {
    const mapKey = `${t.file}::${t.name}`;
    const entry = mapping[mapKey];
    if (!entry?.zephyrKey) continue;
    try {
      const remote = await getTestCase(entry.zephyrKey, token);
      if (remote.name === t.humanizedName) continue;
      await updateTestCaseName(entry.zephyrKey, t.humanizedName, token);
      updated++;
      await delay(100);
    } catch (e) {
      console.warn(`  Title sync skip ${entry.zephyrKey}:`, e.message);
    }
  }
  return updated;
}

async function main() {
  const { execute, repoId, updateTitles } = parseArgs();
  const config = loadConfig();
  const projectKey = process.env.ZEPHYR_PROJECT_KEY || config.projectKey || 'CW';

  let repos = config.repos || [];
  if (repoId) {
    repos = repos.filter((r) => r.id === repoId);
    if (repos.length === 0) {
      console.error(`Unknown --repo-id: ${repoId}`);
      process.exit(1);
    }
  }

  console.log(`Zephyr project: ${projectKey}`);
  console.log(
    `Mode: ${execute ? 'EXECUTE (create)' : 'DRY RUN'}${updateTitles ? ' + UPDATE TITLES' : ''}`
  );
  console.log('');

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  for (const repo of repos) {
    console.log(`--- ${repo.id} (${repo.type}) ---`);

    if (repo.type === 'dotnet') {
      console.log('Skipped: use `npm run zephyr:sync:dotnet` for Zephyr sync, or `npm run dotnet:discover` to list tests.');
      console.log('');
      continue;
    }

    if (repo.type !== 'typescript') {
      console.log(`Unknown type "${repo.type}", skip.`);
      console.log('');
      continue;
    }

    const repoPath = resolveRepoPath(repo);
    if (!repoPath) {
      console.warn(`No path set for ${repo.id} (${repo.envPath} or defaultPath). Skipping.`);
      console.log('');
      continue;
    }

    let tests;
    try {
      tests = discoverTestsTs(repoPath);
    } catch (e) {
      console.error(e.message);
      console.log('');
      continue;
    }

    console.log(`Repo path: ${repoPath}`);
    console.log(`Discovered ${tests.length} test cases.`);
    const mapping = loadMapping(repo);
    const toCreate = tests.filter((t) => {
      const key = `${t.file}::${t.name}`;
      return !mapping[key];
    });
    const alreadyMapped = tests.length - toCreate.length;
    if (alreadyMapped > 0) {
      console.log(`${alreadyMapped} already mapped (skipping).`);
    }
    console.log(`${toCreate.length} would be created in Zephyr.`);
    console.log('');

    if (toCreate.length > 0 && !execute) {
      console.log('Sample (first 10, humanized names):');
      toCreate.slice(0, 10).forEach((t, i) => {
        console.log(`  ${i + 1}. ${t.humanizedName}`);
      });
      console.log('');
      console.log('Run with --execute to create these in Zephyr.');
      console.log('');
    }

    if (execute && toCreate.length > 0) {
      const token = process.env.ZEPHYR_API_TOKEN;
      if (!token) {
        console.error('ZEPHYR_API_TOKEN required for --execute.');
        process.exit(1);
      }

      const folderId = repo.zephyrFolderId;
      const extraLabels = repo.zephyrExtraLabels || [];

      console.log('Creating test cases...');
      let created = 0;
      let failed = 0;

      for (const t of toCreate) {
        try {
          const zKey = createZephyrTestCase(t.humanizedName, folderId, projectKey, extraLabels);
          const mapKey = `${t.file}::${t.name}`;
          mapping[mapKey] = { zephyrKey: zKey, createdAt: new Date().toISOString() };
          created++;
          if (created % 50 === 0) console.log(`  Created ${created}/${toCreate.length}...`);
          await delay(100);
        } catch (err) {
          failed++;
          console.error(`  Failed: ${t.fullName}:`, err.message);
        }
      }

      saveMapping(repo, mapping);
      console.log(`Done for ${repo.id}. Created ${created}, failed ${failed}.`);
      console.log(`Mapping saved to ${mappingPathForRepo(repo.id)}`);
      console.log('');
    } else if (toCreate.length === 0 && !updateTitles) {
      console.log('Nothing new to create.');
      console.log('');
    }

    if (updateTitles) {
      const token = process.env.ZEPHYR_API_TOKEN;
      if (!token) {
        console.error('ZEPHYR_API_TOKEN required for --update-titles.');
        process.exit(1);
      }
      console.log(`Syncing Zephyr titles from code for ${repo.id}...`);
      const n = await syncTitlesFromCodeTs(tests, mapping, token, delay);
      console.log(`Updated ${n} title(s) in Zephyr.`);
      console.log('');
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
