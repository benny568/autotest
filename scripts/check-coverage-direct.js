/**
 * Direct SonarQube API script to check code coverage
 * This bypasses MCP and uses the SonarQube REST API directly
 * 
 * Usage: node scripts/check-coverage-direct.js <project-key>
 * Example: node scripts/check-coverage-direct.js signifyhealth_reformers.content-manager-client
 */

const projectKey = process.argv[2] || 'signifyhealth_reformers.content-manager-client';
const token = process.env.SONARQUBE_TOKEN || 'squ_cd4aa785778720dd2674e987de433802e08924ef';
const org = process.env.SONARQUBE_ORG || 'signifyhealth';
const baseUrl = 'https://sonarcloud.io';

async function checkCoverage() {
  try {
    console.log(`Checking code coverage for project: ${projectKey}\n`);
    console.log(`Organization: ${org}\n`);

    // First, try to find the project
    console.log('Searching for project...');
    
    // Try different organization key variations
    const orgVariations = [
      org,
      org.toLowerCase(),
      org.toUpperCase(),
      org.replace(/-/g, '_'),
      org.replace(/_/g, '-'),
    ];
    
    let searchResponse = null;
    let workingOrg = null;
    let searchData = null;
    
    // Try each organization variation
    for (const orgKey of orgVariations) {
      const searchUrl = `${baseUrl}/api/projects/search?organization=${encodeURIComponent(orgKey)}&q=${encodeURIComponent(projectKey)}&token=${token}`;
      searchResponse = await fetch(searchUrl);
      
      if (searchResponse.ok) {
        workingOrg = orgKey;
        searchData = await searchResponse.json();
        console.log(`✓ Found organization: ${orgKey}\n`);
        break;
      } else if (searchResponse.status === 404) {
        // Try next variation
        continue;
      } else {
        // Other error, break and report
        break;
      }
    }
    
    // If no organization worked, try to search by project key directly (might work for some setups)
    if (!searchResponse || !searchResponse.ok) {
      console.log('Trying to search by project key directly...');
      // Try common project key formats
      const projectKeyVariations = [
        projectKey,
        `${org}_${projectKey}`,
        `${org}:${projectKey}`,
        projectKey.replace(/\./g, '_'),
        projectKey.replace(/_/g, '.'),
      ];
      
      for (const key of projectKeyVariations) {
        // Try to get measures directly - if it works, we found the key
        const testUrl = `${baseUrl}/api/measures/component?component=${encodeURIComponent(key)}&metricKeys=coverage&token=${token}`;
        const testResponse = await fetch(testUrl);
        
        if (testResponse.ok) {
          console.log(`✓ Found project key: ${key}\n`);
          // Get full metrics
          const metrics = ['coverage', 'lines_to_cover', 'uncovered_lines', 'line_coverage', 'branch_coverage'];
          const metricsUrl = `${baseUrl}/api/measures/component?component=${encodeURIComponent(key)}&metricKeys=${metrics.join(',')}&token=${token}`;
          const metricsResponse = await fetch(metricsUrl);
          const metricsData = await metricsResponse.json();
          
          console.log('\n=== Code Coverage Metrics ===');
          if (metricsData.component && metricsData.component.measures) {
            metricsData.component.measures.forEach(measure => {
              let value = measure.value || 'N/A';
              if (measure.metric.includes('coverage') && value !== 'N/A') {
                value = `${value}%`;
              }
              console.log(`${measure.metric}: ${value}`);
            });
            
            const coverage = metricsData.component.measures.find(m => m.metric === 'coverage');
            const lineCoverage = metricsData.component.measures.find(m => m.metric === 'line_coverage');
            const branchCoverage = metricsData.component.measures.find(m => m.metric === 'branch_coverage');
            
            console.log('\n📊 Summary:');
            if (coverage) console.log(`   Overall Coverage: ${coverage.value}%`);
            if (lineCoverage) console.log(`   Line Coverage: ${lineCoverage.value}%`);
            if (branchCoverage) console.log(`   Branch Coverage: ${branchCoverage.value}%`);
          }
          
          return; // Success, exit early
        }
      }
      
      // If we get here, nothing worked
      const errorText = searchResponse ? await searchResponse.text() : 'No response';
      console.error(`\nSearch failed. Status: ${searchResponse?.status || 'unknown'}`);
      console.error('Response:', errorText);
      console.error('\nTroubleshooting:');
      console.error('1. Verify your token is valid and not expired');
      console.error('2. Check that the token has the correct permissions');
      console.error('3. The organization key might be incorrect');
      console.error('4. Try finding your organization key in SonarCloud: https://sonarcloud.io/organizations');
      throw new Error(`Failed to find project. Please verify your SONARQUBE_TOKEN and organization key.`);
    }

    // searchData should already be set if we got here
    if (!searchData) {
      searchData = await searchResponse.json();
    }
    const totalProjects = searchData.components?.length || 0;
    console.log(`Found ${totalProjects} project(s)\n`);

    if (searchData.components && searchData.components.length > 0) {
      // Show all matching projects (or first 20 if many)
      const projectsToShow = searchData.components.slice(0, 20);
      projectsToShow.forEach((project, index) => {
        const match = project.key === projectKey || 
                     project.key.includes(projectKey) ||
                     project.name?.toLowerCase().includes(projectKey.toLowerCase()) ||
                     projectKey.includes(project.key) ? ' ⭐' : '';
        console.log(`${index + 1}. ${project.key} - ${project.name}${match}`);
      });
      if (totalProjects > 20) {
        console.log(`... and ${totalProjects - 20} more projects`);
      }
      console.log('');

      // Use the first match or exact match
      const project = searchData.components.find(p => 
        p.key === projectKey || 
        p.key.toLowerCase() === projectKey.toLowerCase() ||
        p.key.includes(projectKey) ||
        projectKey.includes(p.key) ||
        p.name?.toLowerCase().includes(projectKey.toLowerCase())
      ) || searchData.components[0];

      const actualProjectKey = project.key;
      console.log(`Using project: ${actualProjectKey} (${project.name})\n`);

      // Get coverage metrics
      console.log('Fetching coverage metrics...');
      const metrics = ['coverage', 'lines_to_cover', 'uncovered_lines', 'line_coverage', 'branch_coverage'];
      let metricsUrl = `${baseUrl}/api/measures/component?component=${encodeURIComponent(actualProjectKey)}&metricKeys=${metrics.join(',')}&token=${token}`;
      
      let metricsResponse = await fetch(metricsUrl);
      
      // Fallback to Basic auth if needed
      if (!metricsResponse.ok && metricsResponse.status === 401) {
        const authHeader = `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
        metricsUrl = `${baseUrl}/api/measures/component?component=${encodeURIComponent(actualProjectKey)}&metricKeys=${metrics.join(',')}`;
        metricsResponse = await fetch(metricsUrl, {
          headers: {
            'Authorization': authHeader
          }
        });
      }

      if (!metricsResponse.ok) {
        throw new Error(`Failed to get metrics: ${metricsResponse.status} ${metricsResponse.statusText}`);
      }

      const metricsData = await metricsResponse.json();
      
      console.log('\n=== Code Coverage Metrics ===');
      if (metricsData.component && metricsData.component.measures) {
        metricsData.component.measures.forEach(measure => {
          const value = measure.value || 'N/A';
          const formattedValue = measure.metric === 'coverage' || measure.metric === 'line_coverage' || measure.metric === 'branch_coverage'
            ? `${value}%`
            : value;
          console.log(`${measure.metric}: ${formattedValue}`);
        });

        // Calculate coverage percentage if available
        const coverage = metricsData.component.measures.find(m => m.metric === 'coverage');
        const lineCoverage = metricsData.component.measures.find(m => m.metric === 'line_coverage');
        const branchCoverage = metricsData.component.measures.find(m => m.metric === 'branch_coverage');
        
        if (coverage) {
          console.log(`\n📊 Overall Coverage: ${coverage.value}%`);
        }
        if (lineCoverage) {
          console.log(`📊 Line Coverage: ${lineCoverage.value}%`);
        }
        if (branchCoverage) {
          console.log(`📊 Branch Coverage: ${branchCoverage.value}%`);
        }
      } else {
        console.log('No coverage data found.');
        console.log('Response:', JSON.stringify(metricsData, null, 2));
      }

      // Get quality gate status
      console.log('\n=== Quality Gate Status ===');
      try {
        let qgUrl = `${baseUrl}/api/qualitygates/project_status?projectKey=${encodeURIComponent(actualProjectKey)}&token=${token}`;
        let qgResponse = await fetch(qgUrl);
        
        // Fallback to Basic auth if needed
        if (!qgResponse.ok && qgResponse.status === 401) {
          const authHeader = `Basic ${Buffer.from(`${token}:`).toString('base64')}`;
          qgUrl = `${baseUrl}/api/qualitygates/project_status?projectKey=${encodeURIComponent(actualProjectKey)}`;
          qgResponse = await fetch(qgUrl, {
            headers: {
              'Authorization': authHeader
            }
          });
        }

        if (qgResponse.ok) {
          const qgData = await qgResponse.json();
          console.log(`Status: ${qgData.projectStatus?.status || 'Unknown'}`);
          if (qgData.projectStatus?.conditions) {
            qgData.projectStatus.conditions.forEach(condition => {
              const status = condition.status === 'OK' ? '✅' : condition.status === 'ERROR' ? '❌' : '⚠️';
              console.log(`${status} ${condition.metricKey}: ${condition.actualValue || 'N/A'} (threshold: ${condition.errorThreshold || 'N/A'})`);
            });
          }
        }
      } catch (qgError) {
        console.log('Could not fetch quality gate status:', qgError.message);
      }

    } else {
      console.log('No projects found. Please check the project key.');
      console.log('\nTry these variations:');
      console.log(`  - ${projectKey}`);
      console.log(`  - ${projectKey.replace(/\./g, '_')}`);
      console.log(`  - ${org}_${projectKey}`);
      console.log(`  - ${org}:${projectKey}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

checkCoverage();
