import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * MCP Client for Atlassian MCP Server
 * Connects to the Atlassian MCP server running in Docker
 */
class AtlassianMCPClient {
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
        CONFLUENCE_URL: process.env.CONFLUENCE_URL || process.env.JIRA_BASE_URL?.replace('/rest/api/3', '/wiki') || '',
        CONFLUENCE_USERNAME: process.env.CONFLUENCE_USERNAME || process.env.JIRA_EMAIL || '',
        CONFLUENCE_API_TOKEN: process.env.CONFLUENCE_API_TOKEN || process.env.JIRA_API_TOKEN || '',
        CONFLUENCE_SSL_VERIFY: process.env.CONFLUENCE_SSL_VERIFY || 'false',
        JIRA_URL: process.env.JIRA_URL || process.env.JIRA_BASE_URL?.replace('/rest/api/3', '') || '',
        JIRA_USERNAME: process.env.JIRA_USERNAME || process.env.JIRA_EMAIL || '',
        JIRA_API_TOKEN: process.env.JIRA_API_TOKEN || '',
        JIRA_SSL_VERIFY: process.env.JIRA_SSL_VERIFY || 'false',
        ...process.env,
      };

      // Prepare Docker command and args
      const dockerArgs = [
        'run',
        '--rm',
        '-i',
        '-e', 'CONFLUENCE_URL',
        '-e', 'CONFLUENCE_USERNAME',
        '-e', 'CONFLUENCE_API_TOKEN',
        '-e', 'CONFLUENCE_SSL_VERIFY',
        '-e', 'JIRA_URL',
        '-e', 'JIRA_USERNAME',
        '-e', 'JIRA_API_TOKEN',
        '-e', 'JIRA_SSL_VERIFY',
        'mcp/atlassian:latest',
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

      console.log('Connected to Atlassian MCP server');
      return this.client;
    } catch (error) {
      console.error('Error connecting to MCP server:', error);
      this.connected = false;
      throw error;
    }
  }

  /**
   * Search Jira issues using JQL
   */
  async searchJiraIssues(jql, fields = ['priority', 'status', 'summary'], limit = 100, startAt = 0) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      // Include 'key' field to get issue keys
      const fieldsWithKey = fields.includes('key') ? fields : ['key', ...fields];
      
      const result = await this.client.callTool({
        name: 'jira_search',
        arguments: {
          jql,
          fields: fieldsWithKey.join(','),
          limit: Math.min(limit, 50), // MCP server has max limit of 50
          start_at: startAt,
        },
      });

      if (result.isError) {
        const errorText = result.content?.[0]?.text || 'MCP tool call failed';
        console.error('MCP tool call error:', errorText);
        throw new Error(errorText);
      }

      // Parse the response
      const responseText = result.content?.[0]?.text || '{}';
      let response;
      try {
        response = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse MCP response:', responseText);
        throw new Error(`Failed to parse MCP response: ${parseError.message}`);
      }
      
      // Log response for debugging
      console.log('MCP search response:', {
        total: response.total,
        issuesCount: response.issues?.length || 0,
        hasIssues: !!response.issues,
        responseKeys: Object.keys(response),
        sampleIssue: response.issues?.[0] ? Object.keys(response.issues[0]) : 'no issues'
      });

      return response;
    } catch (error) {
      console.error('Error searching Jira issues via MCP:', error);
      throw error;
    }
  }

  /**
   * Search for Jira fields by keyword
   */
  async searchFields(keyword, limit = 20) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const result = await this.client.callTool({
        name: 'jira_search_fields',
        arguments: {
          keyword,
          limit,
        },
      });

      if (result.isError) {
        throw new Error(result.content?.[0]?.text || 'MCP tool call failed');
      }

      const responseText = result.content?.[0]?.text || '[]';
      const fields = JSON.parse(responseText);

      return fields;
    } catch (error) {
      console.error('Error searching Jira fields via MCP:', error);
      throw error;
    }
  }

  /**
   * Get a specific Jira issue
   */
  async getJiraIssue(issueKey, fields = ['priority', 'status', 'summary']) {
    try {
      if (!this.connected) {
        await this.connect();
      }

      const result = await this.client.callTool({
        name: 'jira_get_issue',
        arguments: {
          issue_key: issueKey,
          fields: fields.join(','),
        },
      });

      if (result.isError) {
        throw new Error(result.content?.[0]?.text || 'MCP tool call failed');
      }

      const responseText = result.content?.[0]?.text || '{}';
      const response = JSON.parse(responseText);

      return response;
    } catch (error) {
      console.error('Error getting Jira issue via MCP:', error);
      throw error;
    }
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
      console.error('Error disconnecting from MCP server:', error);
    }
  }
}

// Export singleton instance
let mcpClientInstance = null;

export function getMCPClient() {
  if (!mcpClientInstance) {
    mcpClientInstance = new AtlassianMCPClient();
  }
  return mcpClientInstance;
}

export default AtlassianMCPClient;
