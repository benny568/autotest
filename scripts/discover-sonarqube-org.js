/**
 * Discover your SonarQube organization key
 * 
 * Usage: node scripts/discover-sonarqube-org.js
 */

const token = process.env.SONARQUBE_TOKEN || 'squ_cd4aa785778720dd2674e987de433802e08924ef';
const baseUrl = 'https://sonarcloud.io';

async function discoverOrg() {
  try {
    console.log('Discovering your SonarQube organizations...\n');

    // Try to get user info which might include organizations
    const userUrl = `${baseUrl}/api/authentication/validate?token=${token}`;
    const userResponse = await fetch(userUrl);
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('✓ Token is valid');
      console.log('User:', userData.user?.login || 'Unknown');
      console.log('');
    }

    // Try common organization patterns
    const commonOrgs = [
      'signifyhealth',
      'signify-health',
      'signify_health',
      'signify',
    ];

    console.log('Trying common organization keys...\n');
    
    for (const org of commonOrgs) {
      const testUrl = `${baseUrl}/api/projects/search?organization=${org}&ps=1&token=${token}`;
      const testResponse = await fetch(testUrl);
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log(`✓ Found organization: ${org}`);
        console.log(`  Total projects: ${data.paging?.total || 0}`);
        if (data.components && data.components.length > 0) {
          console.log(`  Sample project: ${data.components[0].key} - ${data.components[0].name}`);
        }
        console.log('');
      } else if (testResponse.status === 404) {
        console.log(`✗ Organization "${org}" not found`);
      } else {
        const errorText = await testResponse.text();
        console.log(`? Organization "${org}": ${testResponse.status} - ${errorText.substring(0, 100)}`);
      }
    }

    console.log('\nTo find your organization key:');
    console.log('1. Log in to https://sonarcloud.io');
    console.log('2. Check the URL when viewing your organization');
    console.log('3. The organization key is in the URL: https://sonarcloud.io/organizations/YOUR_ORG_KEY');
    console.log('4. Or go to: https://sonarcloud.io/organizations to see all your organizations');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

discoverOrg();
