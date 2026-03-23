import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * MCP Client for SonarQube MCP Server
 * Connects to the SonarQube MCP server running in Docker
 */
class SonarQubeMCPClient {
  constructor() {
    this.client = null;
    this.transport = null;
    this.connected = false;
  }

  /**
   * Initialize and connect to the MCP server
   */
  async connect() {
    if (this.connected && this.client) {
      return this.client;
    }

    try {
      // Get environment variables for Docker
      const env = {
        SONARQUBE_TOKEN: process.env.SONARQUBE_TOKEN || '',
        SONARQUBE_ORG: process.env.SONARQUBE_ORG || '',
        SONARQUBE_URL: process.env.SONARQUBE_URL || '',
        ...process.env,
      };

      // Validate required environment variables
      if (!env.SONARQUBE_TOKEN) {
        throw new Error('SONARQUBE_TOKEN environment variable is required');
      }

      if (!env.SONARQUBE_ORG && !env.SONARQUBE_URL) {
        throw new Error('Either SONARQUBE_ORG (for Cloud) or SONARQUBE_URL (for Server) must be set');
      }

      // Prepare Docker command and args
      const dockerArgs = [
        'run',
        '--rm',
        '-i',
        '-e', 'SONARQUBE_TOKEN',
        ...(env.SONARQUBE_ORG ? ['-e', 'SONARQUBE_ORG'] : []),
        ...(env.SONARQUBE_URL ? ['-e', 'SONARQUBE_URL'] : []),
        'mcp/sonarqube:latest',
      ];

      // Create transport with Docker command
      this.transport = new StdioClientTransport({
        command: 'docker',
        args: dockerArgs,
        env,
      });

      // Create client
      this.client = new Client(
        {
          name: 'autotest-server',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect
      await this.client.connect(this.transport);
      this.connected = true;

      console.log('Connected to SonarQube MCP server');
      return this.client;
    } catch (error) {
      console.error('Error connecting to SonarQube MCP server:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * List available tools from the MCP server
   */
  async listTools() {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const tools = await this.client.listTools();
      return tools;
    } catch (error) {
      console.error('Error listing SonarQube MCP tools:', error);
      throw error;
    }
  }

  /**
   * Call a tool by name with arguments
   * Generic method to call any SonarQube MCP tool
   */
  async callTool(toolName, arguments_ = {}) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const result = await this.client.callTool({
        name: toolName,
        arguments: arguments_,
      });

      if (result.isError) {
        const errorText = result.content?.[0]?.text || 'MCP tool call failed';
        console.error(`SonarQube MCP tool call error (${toolName}):`, errorText);
        throw new Error(errorText);
      }

      // Parse response if it's JSON, otherwise return as text
      const responseText = result.content?.[0]?.text || '';
      try {
        return JSON.parse(responseText);
      } catch {
        return responseText;
      }
    } catch (error) {
      console.error(`Error calling SonarQube MCP tool (${toolName}):`, error);
      throw error;
    }
  }

  /**
   * Analyze code for quality issues
   * Note: Tool name may vary - use listTools() to discover available tools
   */
  async analyzeCode(code, language = 'typescript') {
    return this.callTool('analyze_code', { code, language });
  }

  /**
   * Get project issues from SonarQube
   * Note: Tool name may vary - use listTools() to discover available tools
   */
  async getProjectIssues(projectKey, branch = null) {
    const args = { project_key: projectKey };
    if (branch) args.branch = branch;
    return this.callTool('get_project_issues', args);
  }

  /**
   * Get project metrics from SonarQube
   * Note: Tool name may vary - use listTools() to discover available tools
   */
  async getProjectMetrics(projectKey, branch = null) {
    const args = { project_key: projectKey };
    if (branch) args.branch = branch;
    return this.callTool('get_project_metrics', args);
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
      }
      if (this.transport) {
        await this.transport.close();
      }
      this.connected = false;
      this.client = null;
      this.transport = null;
    } catch (error) {
      console.error('Error disconnecting from SonarQube MCP server:', error);
    }
  }
}

// Export singleton instance
let sonarqubeMCPClientInstance = null;

export function getSonarQubeMCPClient() {
  if (!sonarqubeMCPClientInstance) {
    sonarqubeMCPClientInstance = new SonarQubeMCPClient();
  }
  return sonarqubeMCPClientInstance;
}

export default SonarQubeMCPClient;
