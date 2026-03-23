/**
 * Get code coverage for a SonarQube project using MCP
 * 
 * Usage: node scripts/get-coverage-mcp.js <project-key>
 * Example: node scripts/get-coverage-mcp.js reformers.content-manager-client
 */

import { getSonarQubeMCPClient } from '../server/sonarqube-mcp-client.js';

const projectKey = process.argv[2] || 'reformers.content-manager-client';

async function getCoverage() {
  try {
    console.log(`Getting code coverage for project: ${projectKey}\n`);

    const client = getSonarQubeMCPClient();
    await client.connect();
    console.log('Connected to SonarQube MCP server\n');

    // First, search for the project to find the exact key
    console.log('Searching for project...');
    const projects = await client.callTool('search_my_sonarqube_projects', {
      page: '1'
    });
    
    const project = projects.components?.find(p => 
      p.key === projectKey || 
      p.key.includes(projectKey) ||
      p.name?.toLowerCase().includes(projectKey.toLowerCase())
    );

    if (!project) {
      console.log('Project not found. Available projects:');
      projects.components?.slice(0, 10).forEach(p => {
        console.log(`  - ${p.key} (${p.name})`);
      });
      await client.disconnect();
      return;
    }

    const actualProjectKey = project.key;
    console.log(`Found project: ${actualProjectKey} (${project.name})\n`);

    // Get coverage metrics
    console.log('Fetching coverage metrics...');
    const measures = await client.callTool('get_component_measures', {
      project_key: actualProjectKey,
      metric_keys: ['coverage', 'lines_to_cover', 'uncovered_lines', 'line_coverage', 'branch_coverage', 'conditions_to_cover', 'uncovered_conditions']
    });

    console.log('\n=== Code Coverage Metrics ===');
    if (measures.component && measures.component.measures) {
      measures.component.measures.forEach(measure => {
        let value = measure.value || 'N/A';
        if (measure.metric.includes('coverage') && value !== 'N/A') {
          value = `${value}%`;
        }
        console.log(`${measure.metric}: ${value}`);
      });

      // Highlight key metrics
      const coverage = measures.component.measures.find(m => m.metric === 'coverage');
      const lineCoverage = measures.component.measures.find(m => m.metric === 'line_coverage');
      const branchCoverage = measures.component.measures.find(m => m.metric === 'branch_coverage');
      
      console.log('\n📊 Summary:');
      if (coverage) {
        console.log(`   Overall Coverage: ${coverage.value}%`);
      }
      if (lineCoverage) {
        console.log(`   Line Coverage: ${lineCoverage.value}%`);
      }
      if (branchCoverage) {
        console.log(`   Branch Coverage: ${branchCoverage.value}%`);
      }
    } else {
      console.log('No coverage data found.');
      console.log('Response:', JSON.stringify(measures, null, 2));
    }

    // Get quality gate status
    console.log('\n=== Quality Gate Status ===');
    try {
      const qg = await client.callTool('get_project_quality_gate_status', {
        project_key: actualProjectKey
      });
      
      if (qg.projectStatus) {
        const status = qg.projectStatus.status;
        const icon = status === 'OK' ? '✅' : status === 'ERROR' ? '❌' : '⚠️';
        console.log(`${icon} Status: ${status}`);
        
        if (qg.projectStatus.conditions) {
          qg.projectStatus.conditions.forEach(condition => {
            const condIcon = condition.status === 'OK' ? '✅' : condition.status === 'ERROR' ? '❌' : '⚠️';
            console.log(`   ${condIcon} ${condition.metricKey}: ${condition.actualValue || 'N/A'}`);
          });
        }
      }
    } catch (qgError) {
      console.log('Could not fetch quality gate status:', qgError.message);
    }

    await client.disconnect();
    console.log('\nDone!');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

getCoverage();
