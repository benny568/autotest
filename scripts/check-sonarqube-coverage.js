/**
 * Script to check code coverage for a SonarQube project
 * 
 * Usage: node scripts/check-sonarqube-coverage.js <project-key>
 * Example: node scripts/check-sonarqube-coverage.js reformers_content-manager-client
 */

import { getSonarQubeMCPClient } from '../server/sonarqube-mcp-client.js';

const projectKey = process.argv[2] || 'reformers_content-manager-client';

async function checkCoverage() {
  try {
    console.log(`Checking code coverage for project: ${projectKey}\n`);

    // Get the client instance
    const client = getSonarQubeMCPClient();

    // Connect to the MCP server
    console.log('Connecting to SonarQube MCP server...');
    await client.connect();
    console.log('Connected successfully!\n');

    // Get component measures including coverage
    console.log('Fetching coverage metrics...');
    const measures = await client.callTool('get_component_measures', {
      project_key: projectKey,
      metric_keys: ['coverage', 'lines_to_cover', 'uncovered_lines', 'line_coverage']
    });

    console.log('\n=== Code Coverage Metrics ===');
    if (measures.component && measures.component.measures) {
      measures.component.measures.forEach(measure => {
        console.log(`${measure.metric}: ${measure.value}`);
      });
    } else {
      console.log('No coverage data found. Response:', JSON.stringify(measures, null, 2));
    }

    // Also get quality gate status
    console.log('\n=== Quality Gate Status ===');
    try {
      const qualityGate = await client.callTool('get_project_quality_gate_status', {
        project_key: projectKey
      });
      console.log(JSON.stringify(qualityGate, null, 2));
    } catch (error) {
      console.log('Could not fetch quality gate status:', error.message);
    }

    // Disconnect
    await client.disconnect();
    console.log('\nDisconnected from SonarQube MCP server');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

checkCoverage();
