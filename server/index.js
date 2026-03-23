import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync, statSync } from 'fs';
import { glob } from 'glob';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables from .env file if it exists
try {
  const dotenv = await import('dotenv');
  const dotenvConfig = dotenv.default || dotenv;
  dotenvConfig.config();
} catch (error) {
  // dotenv is optional, continue without it if not installed
  console.log('Note: dotenv not installed. Using environment variables from system.');
}

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = join(__dirname, '../data');
const SNAPSHOTS_FILE = join(DATA_DIR, 'snapshots.json');
const DEBUG_LOG_FILE = join(__dirname, '../logs/jira-debug.log');

// Helper to log to both console and file
function debugLog(...args) {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)).join(' ');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.error(logMessage); // Use console.error as it's less likely to be buffered
  try {
    appendFileSync(DEBUG_LOG_FILE, logMessage, 'utf-8');
  } catch (err) {
    // Ignore file write errors
  }
}

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Target codebase path (can override with REFORMERS_REPO_PATH env)
const CODEBASE_PATH = process.env.REFORMERS_REPO_PATH || '/Users/bodaly/sig/fixes/reformers.content-manager-client';
const MAIN_BRANCH = 'main'; // Change to 'master' if your default branch is different

const CONFIG_TESTING_REPOS = join(__dirname, '../config/testing-repos.json');

function getDotnetRepoMeta() {
  try {
    const raw = readFileSync(CONFIG_TESTING_REPOS, 'utf-8');
    const config = JSON.parse(raw);
    return (config.repos || []).find((r) => r.type === 'dotnet') || null;
  } catch {
    return null;
  }
}

function resolveDotnetRepoPath(repo) {
  if (!repo) return '';
  if (repo.envPath && process.env[repo.envPath]?.trim()) {
    return process.env[repo.envPath].trim();
  }
  return (repo.defaultPath || '').trim();
}

/**
 * Optional: dotnet test case count (always when repo path exists).
 * Optional: serviceCoverage when SNAPSHOT_INCLUDE_DOTNET_COVERAGE=true (slow).
 */
async function getServiceSnapshotFields() {
  const repo = getDotnetRepoMeta();
  const servicePath = resolveDotnetRepoPath(repo);
  if (!repo || !servicePath || !existsSync(servicePath)) {
    return {};
  }

  try {
    const modUrl = new URL('../scripts/lib/dotnet-discover.js', import.meta.url);
    const { discoverDotnetTests, findSolutionOrProject } = await import(modUrl.href);
    const discovered = discoverDotnetTests(servicePath, repo.id);
    const out = {
      dotnetTestCases: discovered.tests.length,
    };
    if (discovered.error) {
      out.dotnetDiscoveryWarning = discovered.error;
    }

    if (process.env.SNAPSHOT_INCLUDE_DOTNET_COVERAGE === 'true') {
      const target = discovered.target || findSolutionOrProject(servicePath);
      if (target) {
        const cov = await collectDotnetCoverage(servicePath, target.path);
        if (cov) out.serviceCoverage = cov;
      }
    }
    return out;
  } catch (e) {
    console.warn('Service snapshot fields skipped:', e.message);
    return {};
  }
}

async function collectDotnetCoverage(servicePath, testTargetPath) {
  const resultsParent = join(servicePath, 'TestResults-autotest-snapshot');
  if (!existsSync(resultsParent)) {
    mkdirSync(resultsParent, { recursive: true });
  }
  const runDir = join(resultsParent, `run-${Date.now()}`);
  mkdirSync(runDir, { recursive: true });

  try {
    await execAsync(
      `dotnet test "${testTargetPath}" -m:1 --collect:"XPlat Code Coverage" --results-directory "${runDir}"`,
      { cwd: servicePath, timeout: 300000, maxBuffer: 20 * 1024 * 1024 }
    );
  } catch (e) {
    return {
      lineCoverage: null,
      branchCoverage: null,
      error: e.message || String(e),
    };
  }

  const files = await glob('**/coverage.cobertura.xml', { cwd: runDir, absolute: true });
  if (files.length === 0) {
    return { lineCoverage: null, branchCoverage: null, error: 'No cobertura output found' };
  }

  let best = files[0];
  let bestM = 0;
  for (const f of files) {
    try {
      const m = statSync(f).mtimeMs;
      if (m > bestM) {
        bestM = m;
        best = f;
      }
    } catch {
      // ignore
    }
  }

  const xml = readFileSync(best, 'utf-8');
  const lineM = xml.match(/line-rate="([\d.]+)"/);
  const branchM = xml.match(/branch-rate="([\d.]+)"/);
  return {
    lineCoverage: lineM ? parseFloat(lineM[1]) * 100 : null,
    branchCoverage: branchM ? parseFloat(branchM[1]) * 100 : null,
  };
}

function resolveClientGitBranch() {
  try {
    const raw = readFileSync(CONFIG_TESTING_REPOS, 'utf-8');
    const config = JSON.parse(raw);
    const client = (config.repos || []).find((r) => r.type === 'typescript');
    return client?.gitBranch || MAIN_BRANCH;
  } catch {
    return MAIN_BRANCH;
  }
}

function resolveServiceGitBranch() {
  try {
    const raw = readFileSync(CONFIG_TESTING_REPOS, 'utf-8');
    const config = JSON.parse(raw);
    const svc = (config.repos || []).find((r) => r.type === 'dotnet');
    return process.env.REFORMERS_SERVICE_GIT_BRANCH?.trim() || svc?.gitBranch || MAIN_BRANCH;
  } catch {
    return MAIN_BRANCH;
  }
}

/**
 * Pull latest for one repo (checkout branch, then git pull). Does not throw.
 */
async function gitPullRepo(repoPath, branch) {
  if (!repoPath || !existsSync(repoPath)) {
    return { success: false, error: 'Repository path missing', skipped: true };
  }
  try {
    console.log(`Git: checkout ${branch} in ${repoPath}`);
    try {
      await execAsync(`git checkout ${branch}`, {
        cwd: repoPath,
        timeout: 30000,
      });
    } catch (checkoutError) {
      console.warn('Git checkout warning:', checkoutError.message);
    }
    console.log(`Git: pull in ${repoPath}`);
    const { stdout, stderr } = await execAsync('git pull', {
      cwd: repoPath,
      timeout: 120000,
    });
    if (stderr && !stderr.includes('Already up to date')) {
      console.warn('Git pull stderr:', stderr);
    }
    return { success: true, output: stdout };
  } catch (error) {
    console.error('Error pulling repo:', repoPath, error.message);
    return { success: false, error: error.message };
  }
}

/** Client repo only (backward compatible for callers). */
async function pullLatestCode() {
  return gitPullRepo(CODEBASE_PATH, resolveClientGitBranch());
}

// Load snapshots from file
function loadSnapshots() {
  if (!existsSync(SNAPSHOTS_FILE)) {
    return [];
  }
  try {
    const data = readFileSync(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading snapshots:', error);
    return [];
  }
}

// Save snapshots to file
function saveSnapshots(snapshots) {
  writeFileSync(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2), 'utf-8');
}

// Count test files and tests
async function countTests() {
  const unitTestFiles = await glob('**/*.test.{ts,tsx,js,jsx}', {
    cwd: CODEBASE_PATH,
    ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/*-e2e/**'],
  });

  const e2eTestFiles = await glob('**/*.spec.{ts,tsx,js,jsx}', {
    cwd: CODEBASE_PATH,
    ignore: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
  });

  // Count test cases in files (approximate by counting 'test(' or 'it(' or 'describe(')
  let unitTestCount = 0;
  let e2eTestCount = 0;

  for (const file of unitTestFiles) {
    try {
      const content = readFileSync(join(CODEBASE_PATH, file), 'utf-8');
      const testMatches = content.match(/\b(test|it|describe)\(/g);
      if (testMatches) {
        unitTestCount += testMatches.length;
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  for (const file of e2eTestFiles) {
    try {
      const content = readFileSync(join(CODEBASE_PATH, file), 'utf-8');
      const testMatches = content.match(/\b(test|it|describe)\(/g);
      if (testMatches) {
        e2eTestCount += testMatches.length;
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  return {
    unitTestFiles: unitTestFiles.length,
    unitTestCases: unitTestCount,
    e2eTestFiles: e2eTestFiles.length,
    e2eTestCases: e2eTestCount,
  };
}

// Parse coverage data from lcov.info files
async function getCoverage() {
  const lcovFiles = await glob('**/lcov.info', {
    cwd: CODEBASE_PATH,
    ignore: ['**/node_modules/**'],
  });

  let totalLines = 0;
  let coveredLines = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalBranches = 0;
  let coveredBranches = 0;

  for (const file of lcovFiles) {
    try {
      const content = readFileSync(join(CODEBASE_PATH, file), 'utf-8');
      
      // Try using lcov-parse library first, fallback to manual parsing
      let parsed = null;
      try {
        const lcovParse = await import('lcov-parse');
        const parseFn = lcovParse.parse || lcovParse.default?.parse || lcovParse.default;
        if (parseFn) {
          parsed = await new Promise((resolve, reject) => {
            parseFn(content, (err, data) => {
              if (err) reject(err);
              else resolve(data);
            });
          });
        }
      } catch (importError) {
        // Library not available or import failed, will use fallback
      }

      if (parsed && Array.isArray(parsed)) {
        parsed.forEach((file) => {
          totalLines += file.lines?.found || 0;
          coveredLines += file.lines?.hit || 0;
          totalFunctions += file.functions?.found || 0;
          coveredFunctions += file.functions?.hit || 0;
          totalBranches += file.branches?.found || 0;
          coveredBranches += file.branches?.hit || 0;
        });
      } else {
        // Fallback: parse lcov format manually
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('LF:')) {
            totalLines += parseInt(line.substring(3).trim()) || 0;
          } else if (line.startsWith('LH:')) {
            coveredLines += parseInt(line.substring(3).trim()) || 0;
          } else if (line.startsWith('FNF:')) {
            totalFunctions += parseInt(line.substring(4).trim()) || 0;
          } else if (line.startsWith('FNH:')) {
            coveredFunctions += parseInt(line.substring(4).trim()) || 0;
          } else if (line.startsWith('BRF:')) {
            totalBranches += parseInt(line.substring(4).trim()) || 0;
          } else if (line.startsWith('BRH:')) {
            coveredBranches += parseInt(line.substring(4).trim()) || 0;
          }
        }
      }
    } catch (error) {
      console.error(`Error reading coverage file ${file}:`, error.message);
    }
  }

  const hasLines = totalLines > 0;
  const hasFunctions = totalFunctions > 0;
  const hasBranches = totalBranches > 0;

  return {
    lineCoverage: hasLines ? (coveredLines / totalLines) * 100 : null,
    functionCoverage: hasFunctions ? (coveredFunctions / totalFunctions) * 100 : null,
    branchCoverage: hasBranches ? (coveredBranches / totalBranches) * 100 : null,
    totalLines,
    coveredLines,
    totalFunctions,
    coveredFunctions,
    totalBranches,
    coveredBranches,
  };
}

// Create a snapshot of current test metrics
app.post('/api/snapshot', async (req, res) => {
  try {
    const clientBranch = resolveClientGitBranch();
    const pullResult = await gitPullRepo(CODEBASE_PATH, clientBranch);

    const dotnetMeta = getDotnetRepoMeta();
    const servicePath = resolveDotnetRepoPath(dotnetMeta);
    let servicePull = { skipped: true };
    if (servicePath && existsSync(servicePath)) {
      servicePull = await gitPullRepo(servicePath, resolveServiceGitBranch());
    }

    const timestamp = new Date().toISOString();
    const testCounts = await countTests();
    const coverage = await getCoverage();
    const serviceFields = await getServiceSnapshotFields();

    const snapshot = {
      timestamp,
      date: timestamp.split('T')[0],
      ...testCounts,
      coverage,
      ...serviceFields,
      gitPullResult: pullResult.success ? 'success' : 'failed',
      gitPullMessage: pullResult.output || pullResult.error,
      gitPullServiceResult: servicePull.skipped
        ? 'skipped'
        : servicePull.success
          ? 'success'
          : 'failed',
      gitPullServiceMessage: servicePull.skipped
        ? 'no service repo path'
        : servicePull.output || servicePull.error,
    };

    const snapshots = loadSnapshots();
    snapshots.push(snapshot);
    saveSnapshots(snapshots);

    res.json(snapshot);
  } catch (error) {
    console.error('Error creating snapshot:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all snapshots
app.get('/api/snapshots', (req, res) => {
  try {
    const snapshots = loadSnapshots();
    res.json(snapshots);
  } catch (error) {
    console.error('Error loading snapshots:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get report data aggregated by week
app.get('/api/report', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let snapshots = loadSnapshots();

    // Filter by date range if provided
    if (startDate) {
      snapshots = snapshots.filter((s) => s.date >= startDate);
    }
    if (endDate) {
      snapshots = snapshots.filter((s) => s.date <= endDate);
    }

    // Sort by date
    snapshots.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Group by week
    const weeklyData = {};
    snapshots.forEach((snapshot) => {
      const date = new Date(snapshot.timestamp);
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekKey,
          snapshots: [],
        };
      }
      weeklyData[weekKey].snapshots.push(snapshot);
    });

    // Aggregate weekly data (use the last snapshot of each week)
    /** Omit coverage % when there is no instrumented data (e.g. no lcov). */
    function coveragePercent(cov, valueKey, totalKey) {
      const v = cov[valueKey];
      const total = cov[totalKey];
      if (typeof v !== 'number' || Number.isNaN(v)) return null;
      if (total === 0) return null;
      if (total == null && v === 0) return null;
      return v;
    }

    const weeklyReport = Object.values(weeklyData).map((week) => {
      const lastSnapshot = week.snapshots[week.snapshots.length - 1];
      const cov = lastSnapshot.coverage || {};
      const line = coveragePercent(cov, 'lineCoverage', 'totalLines');
      const fn = coveragePercent(cov, 'functionCoverage', 'totalFunctions');
      const br = coveragePercent(cov, 'branchCoverage', 'totalBranches');
      const coverageParts = [line, fn, br].filter(
        (x) => typeof x === 'number' && !Number.isNaN(x)
      );
      const averageCoverage =
        coverageParts.length > 0
          ? coverageParts.reduce((a, b) => a + b, 0) / coverageParts.length
          : null;

      return {
        weekStart: week.weekStart,
        timestamp: lastSnapshot.timestamp,
        unitTestFiles: lastSnapshot.unitTestFiles,
        unitTestCases: lastSnapshot.unitTestCases,
        e2eTestFiles: lastSnapshot.e2eTestFiles,
        e2eTestCases: lastSnapshot.e2eTestCases,
        totalTestFiles: lastSnapshot.unitTestFiles + lastSnapshot.e2eTestFiles,
        totalTestCases: lastSnapshot.unitTestCases + lastSnapshot.e2eTestCases,
        lineCoverage: line,
        functionCoverage: fn,
        branchCoverage: br,
        averageCoverage,
      };
    });

    res.json(weeklyReport);
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get the start of the week (Monday)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Get current metrics without creating a snapshot
app.get('/api/metrics', async (req, res) => {
  try {
    const testCounts = await countTests();
    const coverage = await getCoverage();
    res.json({
      ...testCounts,
      coverage,
    });
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pull latest code endpoint (client + service when configured)
app.post('/api/pull', async (req, res) => {
  try {
    const client = await gitPullRepo(CODEBASE_PATH, resolveClientGitBranch());
    const dotnetMeta = getDotnetRepoMeta();
    const servicePath = resolveDotnetRepoPath(dotnetMeta);
    let service = { skipped: true };
    if (servicePath && existsSync(servicePath)) {
      service = await gitPullRepo(servicePath, resolveServiceGitBranch());
    }
    const ok =
      client.success && (service.skipped || service.success);
    if (ok) {
      res.json({
        success: true,
        message: 'Repositories updated',
        client: { success: client.success, output: client.output, error: client.error },
        service: service.skipped
          ? { skipped: true }
          : { success: service.success, output: service.output, error: service.error },
      });
    } else {
      res.status(500).json({
        success: false,
        client: { success: client.success, output: client.output, error: client.error },
        service: service.skipped
          ? { skipped: true }
          : { success: service.success, output: service.output, error: service.error },
      });
    }
  } catch (error) {
    console.error('Error pulling code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Jira API configuration
const JIRA_BASE_URL = process.env.JIRA_BASE_URL || '';
const JIRA_EMAIL = process.env.JIRA_EMAIL || '';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || '';
const JIRA_TEAM_FIELD = process.env.JIRA_TEAM_FIELD || 'customfield_10265'; // Teams[Dropdown] field ID - Found via /api/jira/find-team-field

// Use MCP server if enabled (default: true if MCP env vars are set)
let USE_MCP = process.env.USE_MCP !== 'false' && (
  process.env.JIRA_URL || 
  process.env.JIRA_BASE_URL || 
  process.env.CONFLUENCE_URL
);

// Import MCP client
let mcpClient = null;
if (USE_MCP) {
  try {
    const { getMCPClient } = await import('./mcp-client.js');
    mcpClient = getMCPClient();
    console.log('MCP client initialized - will use Atlassian MCP server');
  } catch (error) {
    console.warn('Failed to initialize MCP client, falling back to direct API:', error.message);
  }
}

// Helper function to make Jira API requests (fallback when MCP is not available)
async function jiraRequest(endpoint, options = {}) {
  if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN) {
    throw new Error('Jira configuration is missing. Please set JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN environment variables.');
  }

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  const url = `${JIRA_BASE_URL}/rest/api/3/${endpoint}`;
  
  debugLog('Making Jira API request to:', url);
  debugLog('Method:', options.method || 'GET');
  if (options.body) {
    debugLog('Request body:', options.body);
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  debugLog('Response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    debugLog('Jira API error response:', errorText);
    throw new Error(`Jira API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const jsonResponse = await response.json();
  debugLog('Jira API response keys:', Object.keys(jsonResponse));
  if (jsonResponse.issues) {
    debugLog('Response has', jsonResponse.issues.length, 'issues');
  }
  return jsonResponse;
}

// Helper endpoint to find custom field ID for Teams
app.get('/api/jira/find-team-field', async (req, res) => {
  try {
    if (USE_MCP && mcpClient) {
      // Use MCP to search for fields
      const fields = await mcpClient.searchFields('Teams', 20);
      res.json({ fields });
    } else {
      // Fallback to direct API
      const response = await jiraRequest('field');
      const teamFields = response.filter(field => 
        field.name && field.name.toLowerCase().includes('team')
      );
      res.json({ fields: teamFields });
    }
  } catch (error) {
    console.error('Error finding team field:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get defects by priority and status
app.get('/api/jira/defects', async (req, res) => {
  debugLog('=== JIRA DEFECTS ENDPOINT HIT ===');
  debugLog('Request received at:', new Date().toISOString());
  debugLog('Using MCP:', USE_MCP && mcpClient ? 'YES' : 'NO (fallback to direct API)');
  
  try {
    const { team, test } = req.query;
    
    // Build JQL query with filters
    // Match the Jira query: type = Bug AND "Teams[Dropdown]" = Reformers 
    // AND labels IN (Cares-Nexus) AND labels IN (vIHE-e2e, VIHE)
    // AND status NOT IN (Cancelled)
    let jql = "type = Bug";
    
    // Add Teams[Dropdown] filter - using custom field
    // The field ID is stored in JIRA_TEAM_FIELD
    const teamField = JIRA_TEAM_FIELD;
    const teamValue = team || 'Reformers'; // Default to 'Reformers' if not specified
    
    // Test mode: if ?test=true, try queries without filters to debug
    if (test === 'true') {
      debugLog('TEST MODE: Running query without filters');
      jql = "type = Bug";
    } else if (test === 'nolabel') {
      // Test mode without label filter
      debugLog('TEST MODE: Running query without label filter');
      if (teamField) {
        jql += ` AND ${teamField} = "${teamValue}"`;
      }
    } else if (test === 'noteam') {
      // Test mode without team filter
      debugLog('TEST MODE: Running query without team filter');
      jql += ` AND labels IN ("Cares-Nexus") AND labels IN ("vIHE-e2e", "VIHE")`;
    } else if (!teamField) {
      // If no team field configured, skip team filter and show warning
      debugLog('WARNING: JIRA_TEAM_FIELD not configured, skipping team filter');
      jql += ` AND labels IN ("Cares-Nexus") AND labels IN ("vIHE-e2e", "VIHE")`;
    } else {
      // For dropdown/select fields, use direct value match
      jql += ` AND ${teamField} = "${teamValue}"`;
      
      // Add labels filter - requires BOTH:
      // - labels IN ("Cares-Nexus") - must have Cares-Nexus label
      // - labels IN ("vIHE-e2e", "VIHE") - must have one of the VIHE labels
      jql += ` AND labels IN ("Cares-Nexus") AND labels IN ("vIHE-e2e", "VIHE")`;
    }
    
    // Always exclude cancelled status (unless in test mode)
    if (test !== 'true') {
      jql += ` AND status NOT IN (Cancelled)`;
    }
    
    // Add ordering to match Jira query
    jql += ` ORDER BY priority DESC, created DESC`;

    debugLog('JQL Query:', jql);
    debugLog('Team Field:', teamField || 'NOT CONFIGURED');
    debugLog('Team Value:', teamValue);

    let allIssues = [];
    let total = 0;
    let startAt = 0; // Declare startAt at function scope so it's accessible in fallback
    const seenIssueKeys = new Set(); // Track unique issue keys to detect duplicates early (accessible in fallback)

    // Try using MCP server first if available
    if (USE_MCP && mcpClient) {
      try {
        debugLog('Attempting to fetch via MCP server...');
        
        // Fetch all issues with pagination
        startAt = 0;
        const maxResults = 50; // MCP server limit
        let hasMore = true;

        while (hasMore) {
          const response = await mcpClient.searchJiraIssues(
            jql,
            ['key', 'priority', 'status', 'summary'],
            maxResults,
            startAt
          );

          debugLog('MCP response structure:', JSON.stringify(Object.keys(response || {})));
          debugLog('MCP response total:', response?.total, 'start_at:', response?.start_at, 'max_results:', response?.max_results);
          
          if (response) {
            // MCP server returns issues in response.issues array
            const issues = response.issues || [];
            
            if (issues.length > 0) {
              // Check for duplicates in this batch
              const issueKeysInBatch = new Set();
              const duplicateKeysInBatch = [];
              issues.forEach((issue, idx) => {
                const issueKey = issue.key || (issue.fields && issue.fields.key) || issue.id || `UNKNOWN-${idx}`;
                if (issueKeysInBatch.has(issueKey)) {
                  duplicateKeysInBatch.push(issueKey);
                } else {
                  issueKeysInBatch.add(issueKey);
                }
              });
              
              if (duplicateKeysInBatch.length > 0) {
                debugLog(`WARNING: Found ${duplicateKeysInBatch.length} duplicate issue keys in this batch:`, duplicateKeysInBatch);
              }
              
              // Check for duplicates across all fetched issues using the Set
              const duplicateKeysAcrossAll = [];
              const newUniqueIssues = [];
              issues.forEach((issue) => {
                const issueKey = issue.key || (issue.fields && issue.fields.key) || issue.id;
                if (issueKey) {
                  if (seenIssueKeys.has(issueKey)) {
                    duplicateKeysAcrossAll.push(issueKey);
                  } else {
                    seenIssueKeys.add(issueKey);
                    newUniqueIssues.push(issue);
                  }
                } else {
                  // Issue without a key, add it anyway but log a warning
                  debugLog(`WARNING: Issue without key found at startAt ${startAt}`);
                  newUniqueIssues.push(issue);
                }
              });
              
              if (duplicateKeysAcrossAll.length > 0) {
                debugLog(`WARNING: Found ${duplicateKeysAcrossAll.length} duplicate issue keys across pagination:`, duplicateKeysAcrossAll.slice(0, 10));
                // If we're getting duplicates, it means we've likely seen all issues
                // Stop pagination to avoid infinite loops
                hasMore = false;
                debugLog('MCP: Stopping pagination due to duplicate issues (likely reached end of results)');
              }
              
              allIssues = allIssues.concat(newUniqueIssues);
              
              // Get total from response
              // MCP server returns total, but it might be -1 if unknown
              if (response.total !== undefined && response.total !== null && response.total > 0) {
                total = response.total;
              } else {
                // If total is -1 or invalid, we need to stop when we get fewer results
                total = -1; // Keep as -1 to indicate unknown
              }
              
              debugLog(`MCP: Fetched ${issues.length} issues (${newUniqueIssues.length} unique), total unique so far: ${seenIssueKeys.size}, allIssues.length: ${allIssues.length}, response.total: ${response.total}, startAt: ${startAt}`);
              
              // If we got duplicates, we've already stopped above
              if (!hasMore) {
                break;
              }
              
              // Check if there are more issues
              // CRITICAL: Stop if we got fewer issues than requested (means we're at the end)
              if (issues.length < maxResults) {
                // Got fewer than requested, we're done
                hasMore = false;
                // If total is still -1, set it to the actual count we fetched
                if (total === -1) {
                  total = seenIssueKeys.size;
                }
                debugLog('MCP: Got fewer issues than requested, stopping pagination');
              } else if (total > 0 && seenIssueKeys.size >= total) {
                // We've fetched all available issues (use seenIssueKeys.size for accurate unique count)
                hasMore = false;
                debugLog(`MCP: Fetched all available issues (${seenIssueKeys.size} unique, total was ${total}), stopping pagination`);
              } else if (total > 0 && (startAt + maxResults) >= total) {
                // Next fetch would exceed total - but only stop if we've actually fetched all
                // Check if we've already fetched enough
                if (seenIssueKeys.size >= total) {
                  hasMore = false;
                  debugLog('MCP: Next fetch would exceed total and we have all issues, stopping pagination');
                } else {
                  // Continue to get the remaining issues
                  startAt += maxResults;
                  debugLog(`MCP: Continuing pagination to fetch remaining issues, next startAt: ${startAt} (have ${seenIssueKeys.size} of ${total})`);
                }
              } else if (total === -1 && seenIssueKeys.size >= 1000) {
                // Safety limit: if total is unknown, stop after 1000 issues to prevent infinite loops
                // But warn that we may have more issues
                hasMore = false;
                debugLog('MCP: Reached safety limit of 1000 issues (total unknown), stopping pagination. WARNING: There may be more issues.');
              } else {
                // Continue fetching
                startAt += maxResults;
                debugLog(`MCP: Continuing pagination, next startAt: ${startAt} (have ${seenIssueKeys.size} unique issues so far, total: ${total})`);
              }
            } else {
              // No issues returned, we're done
              hasMore = false;
              // If this is the first page and we got 0 issues, the query returned no results
              if (startAt === 0) {
                total = 0;
                debugLog('MCP: Query returned 0 results');
              } else if (total === -1) {
                // Set total to what we've fetched so far
                total = allIssues.length;
              }
              debugLog('MCP: No issues returned, stopping pagination');
            }
          } else {
            hasMore = false;
            if (startAt === 0) {
              total = 0;
            } else if (total === -1) {
              total = allIssues.length;
            }
            debugLog('MCP: No response, stopping pagination');
          }
        }

        debugLog(`MCP: Final result: ${allIssues.length} total issues fetched`);
        if (allIssues.length > 0) {
          debugLog('Sample issue structure:', JSON.stringify(allIssues[0], null, 2));
        }
      } catch (mcpError) {
        debugLog('MCP fetch failed, falling back to direct API:', mcpError.message);
        // Fall through to direct API call
        USE_MCP = false;
      }
    }

    // Fallback to direct API if MCP failed, is not available, or didn't fetch all issues
    // Check if we need to continue fetching (MCP might have stopped early)
    // Also use direct API if MCP returned unknown total (-1) and we got a full page of results
    // This suggests there might be more issues
    const mcpReturnedUnknownTotal = USE_MCP && mcpClient && total === -1 && allIssues.length > 0;
    const mcpGotFullPage = USE_MCP && mcpClient && allIssues.length > 0 && allIssues.length % 50 === 0; // MCP maxResults is 50
    const needsMoreFetching = USE_MCP && mcpClient && allIssues.length > 0 && total > 0 && seenIssueKeys.size < total;
    const shouldUseDirectAPI = mcpReturnedUnknownTotal && mcpGotFullPage;
    
    if ((!USE_MCP || !mcpClient || needsMoreFetching || shouldUseDirectAPI) && (allIssues.length === 0 || needsMoreFetching || shouldUseDirectAPI)) {
      if (shouldUseDirectAPI) {
        debugLog(`MCP returned unknown total (-1) and we got ${seenIssueKeys.size} issues (full page), using direct API to get accurate total and remaining issues`);
        // Start from 0 to get the actual total from Jira API
        startAt = 0;
        // Clear allIssues so we get fresh data from direct API with proper total
        allIssues = [];
        seenIssueKeys.clear();
      } else if (needsMoreFetching) {
        debugLog(`MCP fetched ${seenIssueKeys.size} issues but total is ${total}, continuing with direct API to fetch remaining issues`);
        // Reset startAt to continue from where MCP left off
        startAt = seenIssueKeys.size;
      } else {
        debugLog('Using direct Jira API...');
        startAt = 0;
      }
      debugLog('JIRA_BASE_URL:', JIRA_BASE_URL);
      debugLog('JIRA_EMAIL:', JIRA_EMAIL ? 'SET' : 'NOT SET');
      debugLog('JIRA_API_TOKEN:', JIRA_API_TOKEN ? 'SET' : 'NOT SET');

      // Fetch issues with pagination
      const maxResults = 100;
      let response = null;

      do {
        try {
          // Try GET /search/jql endpoint first (as suggested by Jira error)
          const queryParams = new URLSearchParams({
            jql: jql,
            startAt: startAt.toString(),
            maxResults: maxResults.toString(),
          });
          // Add fields as comma-separated string
          queryParams.append('fields', 'key,priority,status,summary');
          
          const endpoint = `search/jql?${queryParams.toString()}`;
          debugLog('Trying GET endpoint:', endpoint);
          response = await jiraRequest(endpoint, {
            method: 'GET',
          });
          debugLog('GET response received. Total:', response.total, 'Issues:', response.issues?.length || 0);
        } catch (error) {
          debugLog('GET failed, error:', error.message);
          // Fallback to POST /search if GET /search/jql doesn't work
          if (error.message.includes('404') || error.message.includes('405')) {
            debugLog('Trying POST /search endpoint');
            response = await jiraRequest('search', {
              method: 'POST',
              body: JSON.stringify({
                jql: jql,
                startAt: startAt,
                maxResults: maxResults,
                fields: ['key', 'priority', 'status', 'summary'],
              }),
            });
            debugLog('POST response received. Total:', response.total, 'Issues:', response.issues?.length || 0);
          } else {
            debugLog('Jira API error:', error.message);
            throw error;
          }
        }
        
        if (response && response.issues) {
          allIssues = allIssues.concat(response.issues);
          // Handle different response structures - some APIs return 'total', others use 'isLast'
          if (response.total !== undefined) {
            total = response.total;
          } else if (response.isLast) {
            // If isLast is true, we've fetched all issues
            total = allIssues.length;
          } else {
            // If we got fewer issues than requested, we're done
            if (response.issues.length < maxResults) {
              total = allIssues.length;
            } else {
              // Continue fetching, assume there might be more
              total = startAt + maxResults + 1; // Set to continue loop
            }
          }
          debugLog(`Fetched ${response.issues.length} issues, total so far: ${allIssues.length}, isLast: ${response.isLast}, total: ${total}`);
        } else {
          debugLog('Unexpected response structure:', JSON.stringify(response, null, 2));
          break;
        }
        startAt += maxResults;
      } while (startAt < total && !response?.isLast);

      debugLog(`Final result: ${allIssues.length} total issues fetched`);
    }

    // Group by priority and status, and store issue keys
    const defectsByPriority = {};
    const issueKeysByCategory = {}; // Store issue keys for each priority/status combination (using Sets to avoid duplicates)
    const statuses = ['Not Started', 'In Progress', 'Dev Complete', 'Test Complete', 'DONE'];
    
    // Track processed issue keys to avoid counting duplicates
    const processedIssueKeys = new Set();

    allIssues.forEach((issue) => {
      // Handle both MCP response format and direct API format
      // MCP might return fields directly or nested in issue.fields
      const fields = issue.fields || issue;
      const priority = fields.priority?.name || fields.priority || 'Unassigned';
      const status = fields.status?.name || fields.status || 'Unknown';
      // Get issue key - could be at top level or in fields
      const issueKey = issue.key || fields.key || issue.id || 'UNKNOWN';
      
      // Skip if we've already processed this issue key (avoid duplicates)
      if (processedIssueKeys.has(issueKey)) {
        debugLog(`Skipping duplicate issue: key=${issueKey}, priority=${priority}, status=${status}`);
        return;
      }
      processedIssueKeys.add(issueKey);
      
      debugLog(`Processing issue: key=${issueKey}, priority=${priority}, status=${status}`);

      if (!defectsByPriority[priority]) {
        defectsByPriority[priority] = {
          priority,
          total: 0,
          byStatus: {},
        };
        // Initialize all statuses to 0
        statuses.forEach((s) => {
          defectsByPriority[priority].byStatus[s] = 0;
        });
      }

      defectsByPriority[priority].total++;
      
      // Normalize status for case-insensitive matching
      // Map common Jira status variations to our standard status names
      // Combine 'Draft' and 'Ready to Start' into 'Not Started'
      const statusNormalization = {
        'draft': 'Not Started',
        'ready to start': 'Not Started',
        'in progress': 'In Progress',
        'dev complete': 'Dev Complete',
        'test complete': 'Test Complete',
        'accepted': 'DONE',
        'done': 'DONE',
      };
      
      // Try to find a matching status (case-insensitive)
      const statusLower = status.toLowerCase();
      let matchedStatus = null;
      for (const [normalizedKey, normalizedValue] of Object.entries(statusNormalization)) {
        if (statusLower === normalizedKey || statusLower.includes(normalizedKey)) {
          matchedStatus = normalizedValue;
          break;
        }
      }
      
      // Also check direct match (case-insensitive)
      if (!matchedStatus) {
        const directMatch = statuses.find(s => s.toLowerCase() === statusLower);
        if (directMatch) {
          matchedStatus = directMatch;
        }
      }
      
      // Determine the status category
      let statusCategory = matchedStatus || 'Other';
      
      // Store issue key in the appropriate category (using Set to avoid duplicates)
      const categoryKey = `${priority}:${statusCategory}`;
      if (!issueKeysByCategory[categoryKey]) {
        issueKeysByCategory[categoryKey] = new Set();
      }
      issueKeysByCategory[categoryKey].add(issueKey);
      
      // Also store for "total" category
      const totalKey = `${priority}:total`;
      if (!issueKeysByCategory[totalKey]) {
        issueKeysByCategory[totalKey] = new Set();
      }
      issueKeysByCategory[totalKey].add(issueKey);
      
      // Map status if it matches one of our expected statuses
      if (matchedStatus) {
        defectsByPriority[priority].byStatus[matchedStatus]++;
      } else {
        // Store other statuses under 'Other' category
        if (!defectsByPriority[priority].byStatus['Other']) {
          defectsByPriority[priority].byStatus['Other'] = 0;
        }
        defectsByPriority[priority].byStatus['Other']++;
      }
      
      // Log status mapping for debugging
      if (status !== matchedStatus) {
        debugLog(`Status mapped: "${status}" -> "${statusCategory}" for issue ${issueKey}`);
      }
    });
    
    // Convert Sets to Arrays for JSON serialization
    const issueKeysByCategoryArrays = {};
    for (const [key, value] of Object.entries(issueKeysByCategory)) {
      issueKeysByCategoryArrays[key] = Array.from(value);
    }

    // Convert to array and sort by priority order (Blocker, Critical, Highest, High, Medium, Low)
    const priorityOrder = ['Blocker', 'Critical', 'Highest', 'High', 'Medium', 'Low', 'Lowest', 'Unassigned'];
    const defectsArray = Object.values(defectsByPriority).sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.priority);
      const bIndex = priorityOrder.indexOf(b.priority);
      if (aIndex === -1 && bIndex === -1) return a.priority.localeCompare(b.priority);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    // Store issue keys in a way that can be retrieved later
    // We'll store them in memory for now (in production, you might want to use Redis or similar)
    if (!global.issueKeysCache) {
      global.issueKeysCache = {};
    }
    const cacheKey = `${jql}:${Date.now()}`; // Include timestamp to invalidate old cache
    global.issueKeysCache[cacheKey] = issueKeysByCategoryArrays;
    
    // Calculate actual total from unique issues processed (not allIssues.length which may hit safety limit)
    const actualTotal = processedIssueKeys.size;
    
    // Also calculate total from the defects array to verify
    const calculatedTotal = defectsArray.reduce((sum, defect) => sum + defect.total, 0);
    
    debugLog(`Total issues fetched: ${allIssues.length}, Unique issues: ${actualTotal}, Calculated total from categories: ${calculatedTotal}`);
    
    res.json({
      totalDefects: actualTotal, // Use unique count instead of allIssues.length
      defectsByPriority: defectsArray,
      statuses: statuses,
      cacheKey: cacheKey, // Return cache key so frontend can request issue keys
    });
  } catch (error) {
    console.error('Error fetching Jira defects:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get issue keys for a specific priority and status
app.get('/api/jira/defects/keys', async (req, res) => {
  try {
    const { priority, status, cacheKey } = req.query;
    
    if (!priority || !cacheKey) {
      return res.status(400).json({ error: 'priority and cacheKey are required' });
    }
    
    // Get issue keys from cache
    if (!global.issueKeysCache || !global.issueKeysCache[cacheKey]) {
      return res.status(404).json({ error: 'Cache not found. Please refresh the defects data first.' });
    }
    
    const issueKeysByCategory = global.issueKeysCache[cacheKey];
    
    // Determine the category key
    let categoryKey;
    if (status && status !== 'total') {
      categoryKey = `${priority}:${status}`;
    } else {
      categoryKey = `${priority}:total`;
    }
    
    const issueKeys = issueKeysByCategory[categoryKey] || [];
    
    res.json({
      priority,
      status: status || 'total',
      issueKeys: issueKeys,
      count: issueKeys.length,
    });
  } catch (error) {
    console.error('Error fetching issue keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quality improvement graph data (CW project, Reformers team)
const QUALITY_GRAPH_DATA_FILE = join(DATA_DIR, 'quality-graph-data.json');
app.get('/api/quality-graph', (req, res) => {
  try {
    if (!existsSync(QUALITY_GRAPH_DATA_FILE)) {
      return res.status(404).json({
        error: 'Quality graph data not found',
        hint: 'Run: node scripts/quality-improvement-graph-data.js',
      });
    }
    const data = readFileSync(QUALITY_GRAPH_DATA_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error loading quality graph data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available teams (if team field is configured)
app.get('/api/jira/teams', async (req, res) => {
  try {
    if (!JIRA_TEAM_FIELD) {
      return res.json([]);
    }

    // This would require fetching field options, which varies by Jira setup
    // For now, return empty array - can be enhanced based on specific Jira configuration
    res.json([]);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
