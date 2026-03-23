#!/usr/bin/env node
/**
 * Creates missing Zephyr Scale test cases for .NET tests (FQNs from dotnet test --list-tests).
 * Mapping: data/zephyr-mapping/<repo-id>.json keys = "<repoId>::<fullyQualifiedName>"
 *
 * Usage:
 *   node scripts/sync-dotnet-tests-to-zephyr.js
 *   node scripts/sync-dotnet-tests-to-zephyr.js --execute
 *   node scripts/sync-dotnet-tests-to-zephyr.js --update-titles
 *
 * Env: ZEPHYR_API_TOKEN, ZEPHYR_PROJECT_KEY, REFORMERS_SERVICE_REPO_PATH (or config defaultPath)
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { discoverDotnetTests } from './lib/dotnet-discover.js';

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

function loadMapping(repoId) {
  const path = mappingPathForRepo(repoId);
  if (existsSync(path)) {
    try {
      return JSON.parse(readFileSync(path, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveMapping(repoId, mapping) {
  if (!existsSync(MAPPING_DIR)) mkdirSync(MAPPING_DIR, { recursive: true });
  writeFileSync(mappingPathForRepo(repoId), JSON.stringify(mapping, null, 2), 'utf-8');
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

async function syncTitlesDotnet(tests, mapping, token, delay) {
  const { getTestCase, updateTestCaseName } = await import('./lib/zephyr-scale.js');
  let updated = 0;
  for (const t of tests) {
    const entry = mapping[t.mapKey];
    if (!entry?.zephyrKey) continue;
    try {
      const remote = await getTestCase(entry.zephyrKey, token);
      if (remote.name === t.humanName) continue;
      await updateTestCaseName(entry.zephyrKey, t.humanName, token);
      updated++;
      await delay(100);
    } catch (e) {
      console.warn(`  Title sync skip ${entry.zephyrKey}:`, e.message);
    }
  }
  return updated;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const updateTitles = process.argv.includes('--update-titles');
  const config = loadConfig();
  const projectKey = process.env.ZEPHYR_PROJECT_KEY || config.projectKey || 'CW';
  const repo = (config.repos || []).find((r) => r.type === 'dotnet');

  if (!repo) {
    console.error('No dotnet repo in config/testing-repos.json');
    process.exit(1);
  }

  const repoPath = resolveRepoPath(repo);
  if (!repoPath || !existsSync(repoPath)) {
    console.error(`No valid path for ${repo.id}. Set ${repo.envPath} or defaultPath in config.`);
    process.exit(1);
  }

  console.log(`Zephyr project: ${projectKey}`);
  console.log(`Repo: ${repo.id}`);
  console.log(`Path: ${repoPath}`);
  console.log(
    `Mode: ${execute ? 'EXECUTE' : 'DRY RUN'}${updateTitles ? ' + UPDATE TITLES' : ''}`
  );
  console.log('');

  const discovered = discoverDotnetTests(repoPath, repo.id);
  if (discovered.error && discovered.tests.length === 0) {
    console.error('Discovery failed:', discovered.error);
    process.exit(1);
  }

  const tests = discovered.tests;
  console.log(`Discovered ${tests.length} .NET tests (target: ${discovered.target?.path})`);
  if (discovered.error) {
    console.warn('Warning:', discovered.error);
  }
  console.log('');

  const mapping = loadMapping(repo.id);
  const toCreate = tests.filter((t) => !mapping[t.mapKey]);
  const alreadyMapped = tests.length - toCreate.length;
  if (alreadyMapped > 0) {
    console.log(`${alreadyMapped} already mapped (skipping).`);
  }
  console.log(`${toCreate.length} would be created in Zephyr.`);
  console.log('');

  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  if (toCreate.length > 0 && !execute) {
    console.log('Sample (first 15):');
    toCreate.slice(0, 15).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.humanName}`);
    });
    console.log('');
    console.log('Run with --execute to create these in Zephyr.');
    console.log('');
  }

  if (execute && toCreate.length > 0) {
    if (!process.env.ZEPHYR_API_TOKEN) {
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
        const zKey = createZephyrTestCase(t.humanName, folderId, projectKey, extraLabels);
        mapping[t.mapKey] = { zephyrKey: zKey, createdAt: new Date().toISOString(), fqn: t.fqn };
        created++;
        if (created % 25 === 0) console.log(`  Created ${created}/${toCreate.length}...`);
        await delay(100);
      } catch (err) {
        failed++;
        console.error(`  Failed: ${t.fqn}:`, err.message);
      }
    }

    saveMapping(repo.id, mapping);
    console.log(`Done. Created ${created}, failed ${failed}.`);
    console.log(`Mapping saved to ${mappingPathForRepo(repo.id)}`);
  } else if (toCreate.length === 0 && !updateTitles) {
    console.log('Nothing new to create.');
  }

  if (updateTitles) {
    if (!process.env.ZEPHYR_API_TOKEN) {
      console.error('ZEPHYR_API_TOKEN required for --update-titles.');
      process.exit(1);
    }
    console.log('Syncing Zephyr titles from .NET test names...');
    const n = await syncTitlesDotnet(tests, mapping, process.env.ZEPHYR_API_TOKEN, delay);
    console.log(`Updated ${n} title(s) in Zephyr.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
