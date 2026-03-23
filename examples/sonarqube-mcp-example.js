/**
 * Example usage of SonarQube MCP Client
 * 
 * This file demonstrates how to use the SonarQube MCP client
 * to interact with SonarQube for code quality analysis.
 */

import { getSonarQubeMCPClient } from '../server/sonarqube-mcp-client.js';

async function example() {
  try {
    // Get the client instance
    const client = getSonarQubeMCPClient();

    // Connect to the MCP server
    console.log('Connecting to SonarQube MCP server...');
    await client.connect();
    console.log('Connected successfully!');

    // Discover available tools
    console.log('\nDiscovering available tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools?.length || 0} tools:`);
    tools.tools?.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description || 'No description'}`);
    });

    // Example: Analyze code (if tool exists)
    // Uncomment and modify based on available tools:
    /*
    console.log('\nAnalyzing code...');
    const codeToAnalyze = `
      function example() {
        let x = 1;
        let y = 2;
        return x + y;
      }
    `;
    const analysis = await client.analyzeCode(codeToAnalyze, 'typescript');
    console.log('Analysis result:', analysis);
    */

    // Example: Get project metrics (if tool exists)
    // Uncomment and modify based on your project:
    /*
    console.log('\nGetting project metrics...');
    const metrics = await client.getProjectMetrics('your-project-key');
    console.log('Project metrics:', metrics);
    */

    // Example: Using generic callTool method
    // Replace 'tool-name' with an actual tool name from listTools()
    /*
    console.log('\nCalling tool directly...');
    const result = await client.callTool('tool-name', {
      // Add tool-specific parameters
    });
    console.log('Tool result:', result);
    */

    // Disconnect when done
    await client.disconnect();
    console.log('\nDisconnected from SonarQube MCP server');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the example
example();
