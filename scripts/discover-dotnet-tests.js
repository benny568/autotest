#!/usr/bin/env node
/**
 * Lists tests in reformers.content-manager-service (or any .NET repo) via `dotnet test --list-tests`.
 *
 * Prerequisites: .NET SDK on PATH, tests build.
 *
 * Usage:
 *   npm run dotnet:discover
 *   node scripts/discover-dotnet-tests.js /path/to/repo
 *   node scripts/discover-dotnet-tests.js --json > data/dotnet-tests.json
 *
 * Env: REFORMERS_SERVICE_REPO_PATH if no path argument
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { discoverDotnetTests, findSolutionOrProject } from './lib/dotnet-discover.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_REPO_ID = 'reformers.content-manager-service';

function defaultServicePathFromConfig() {
  try {
    const raw = readFileSync(join(ROOT, 'config/testing-repos.json'), 'utf-8');
    const config = JSON.parse(raw);
    const repo = (config.repos || []).find((r) => r.type === 'dotnet');
    return (repo?.defaultPath || '').trim();
  } catch {
    return '';
  }
}

try {
  const dotenv = await import('dotenv');
  (dotenv.default || dotenv).config();
} catch {
  // optional
}

function positionalRepoPath() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') continue;
    if (a === '--out') {
      i++;
      continue;
    }
    if (a.startsWith('--')) continue;
    return a;
  }
  return null;
}

function main() {
  const jsonOut = process.argv.includes('--json');
  const outIdx = process.argv.indexOf('--out');
  const outFile = outIdx >= 0 && process.argv[outIdx + 1] ? process.argv[outIdx + 1] : null;

  const repoPath = (
    positionalRepoPath() ||
    process.env.REFORMERS_SERVICE_REPO_PATH ||
    defaultServicePathFromConfig() ||
    ''
  ).trim();

  if (!repoPath || !existsSync(repoPath)) {
    console.error(
      'Set REFORMERS_SERVICE_REPO_PATH, set defaultPath for the dotnet repo in config/testing-repos.json, or pass the repo path as an argument.\n' +
        'Example: REFORMERS_SERVICE_REPO_PATH=/path/to/reformers.content-manager-service npm run dotnet:discover'
    );
    process.exit(1);
  }

  const result = discoverDotnetTests(repoPath, DEFAULT_REPO_ID);
  if (result.error && !result.tests.length) {
    const target = result.target || findSolutionOrProject(repoPath);
    console.error('dotnet test --list-tests failed:', result.error);
    if (result.stdout) process.stderr.write(result.stdout);
    if (target) console.error('Target:', target.path);
    process.exit(1);
  }

  const payload = {
    repoPath: result.repoPath,
    target: result.target?.path,
    generatedAt: new Date().toISOString(),
    count: result.tests.length,
    tests: result.tests.map((t) => ({
      fqn: t.fqn,
      humanName: t.humanName,
      mappingKey: t.mapKey,
    })),
  };

  if (jsonOut) {
    const text = JSON.stringify(payload, null, 2);
    if (outFile) {
      const dir = dirname(outFile);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outFile, text, 'utf-8');
      console.error(`Wrote ${outFile} (${payload.count} tests)`);
    } else {
      console.log(text);
    }
    return;
  }

  console.log(`Repo: ${repoPath}`);
  console.log(`Target: ${result.target?.path}`);
  console.log(`Tests: ${payload.count}`);
  if (result.error) {
    console.warn('Note: partial result —', result.error);
  }
  console.log('');
  result.tests.slice(0, 30).forEach((t, i) => {
    console.log(`${i + 1}. ${t.humanName}`);
    console.log(`   ${t.fqn}`);
  });
  if (result.tests.length > 30) {
    console.log(`... and ${result.tests.length - 30} more. Use --json for full list.`);
  }
}

main();
