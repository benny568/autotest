/**
 * Shared: locate .NET test entrypoint and list tests via `dotnet test --list-tests`.
 */

import { join } from 'path';
import { glob } from 'glob';
import { execSync } from 'child_process';

/**
 * Prefer main service solution under src/, then any root .sln, then deepest common sln.
 */
export function findSolutionOrProject(repoPath) {
  const slns = glob.sync('**/*.sln', { cwd: repoPath, ignore: ['**/node_modules/**'] });
  const preferred =
    slns.find((s) => /(^|\/)src\/ContentManagerService\.sln$/i.test(s.replace(/\\/g, '/'))) ||
    slns.find((s) => /ContentManagerService\.sln$/i.test(s)) ||
    slns[0];
  if (preferred) {
    return { kind: 'sln', path: join(repoPath, preferred) };
  }

  const projs = glob.sync('**/*Tests*.csproj', { cwd: repoPath, ignore: ['**/node_modules/**'] });
  if (projs.length > 0) {
    return { kind: 'csproj', path: join(repoPath, projs[0]) };
  }
  const anyTest = glob.sync('**/*.Tests.csproj', { cwd: repoPath, ignore: ['**/node_modules/**'] });
  if (anyTest.length > 0) {
    return { kind: 'csproj', path: join(repoPath, anyTest[0]) };
  }
  return null;
}

export function parseListTestsOutput(stdout) {
  const lines = stdout.split(/\r?\n/);
  const tests = [];
  let inBlock = false;
  for (const line of lines) {
    if (/The following Tests are available/i.test(line)) {
      inBlock = true;
      continue;
    }
    if (inBlock) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (/^Test run for|^Starting test|^Build/i.test(trimmed)) break;
      if (/^Passed!|^Failed!|^Errors?/i.test(trimmed)) break;
      if (
        trimmed.length > 3 &&
        !trimmed.startsWith('[') &&
        !trimmed.includes('MSBUILD') &&
        (trimmed.includes('.') || trimmed.includes('+'))
      ) {
        tests.push(trimmed);
      }
    }
  }
  return tests;
}

export function humanizeFqn(fqn) {
  const parts = fqn.split('.');
  const last = parts[parts.length - 1] || fqn;
  return last.replace(/_/g, ' ');
}

/**
 * @param {string} repoPath
 * @param {string} repoId - mapping namespace (e.g. reformers.content-manager-service)
 */
export function discoverDotnetTests(repoPath, repoId) {
  const target = findSolutionOrProject(repoPath);
  if (!target) {
    return { error: `No .sln or *Tests*.csproj found under ${repoPath}`, tests: [], target: null };
  }

  const dotnetArgs = [
    'test',
    `"${target.path}"`,
    '--list-tests',
    '--nologo',
    '-v',
    'q',
    '-m:1',
  ].join(' ');
  let stdout;
  try {
    stdout = execSync(`dotnet ${dotnetArgs}`, {
      cwd: repoPath,
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
  } catch (err) {
    return {
      error: err.message || String(err),
      tests: [],
      target,
      stdout: err.stdout ? String(err.stdout) : '',
    };
  }

  const fqns = [...new Set(parseListTestsOutput(stdout))];
  const tests = fqns.map((fqn) => ({
    fqn,
    humanName: humanizeFqn(fqn),
    mapKey: `${repoId}::${fqn}`,
    fullName: fqn,
  }));

  return { error: null, tests, target, repoPath };
}
