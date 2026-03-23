# SonarQube MCP Server Setup Guide

This guide will help you set up the SonarQube Model Context Protocol (MCP) server for code quality analysis.

## Prerequisites

1. **Docker**: Ensure Docker is installed and running on your system
2. **SonarQube Account**: You need either:
   - SonarQube Cloud account, OR
   - Access to a SonarQube Server instance
3. **User Token**: Generate a personal user token from your SonarQube account

## Step 1: Generate SonarQube Token

### For SonarQube Cloud:
1. Log in to [SonarQube Cloud](https://sonarcloud.io)
2. Go to **My Account** → **Security**
3. Generate a new token
4. Copy the token (you won't be able to see it again)

### For SonarQube Server:
1. Log in to your SonarQube Server instance
2. Go to **My Account** → **Security**
3. Generate a new token
4. Copy the token

## Step 2: Get Your Organization Key (Cloud) or Server URL

### For SonarQube Cloud:
- Your organization key is visible in your SonarQube Cloud dashboard URL
- Example: `https://sonarcloud.io/organizations/your-org-key`
- The organization key is the part after `/organizations/`

### For SonarQube Server:
- Your server URL is the base URL of your SonarQube instance
- Example: `https://sonarqube.yourcompany.com`

## Step 3: Update ecosystem.config.cjs

Add the SonarQube environment variables to your `ecosystem.config.cjs` file:

### For SonarQube Cloud:
```javascript
env: {
  // ... existing variables ...
  
  // SonarQube MCP Configuration (Cloud)
  SONARQUBE_TOKEN: 'your-token-here',
  SONARQUBE_ORG: 'your-organization-key',
}
```

### For SonarQube Server:
```javascript
env: {
  // ... existing variables ...
  
  // SonarQube MCP Configuration (Server)
  SONARQUBE_TOKEN: 'your-token-here',
  SONARQUBE_URL: 'https://sonarqube.yourcompany.com',
}
```

**Important**: 
- Never commit tokens to version control
- Use environment variables or secure secret management
- For production, consider using PM2's secret management or environment variable files

## Step 4: Pull the Docker Image

Before using the MCP server, pull the official Docker image:

```bash
docker pull mcp/sonarqube:latest
```

## Step 5: Restart PM2

After updating the configuration, restart PM2 to pick up the new environment variables:

```bash
# Restart the server
pm2 restart autotest-server

# Save the PM2 configuration
pm2 save

# Check logs to verify connection
pm2 logs autotest-server --lines 50 | grep -i "sonarqube\|mcp"
```

## Step 6: Test the Connection

You can test the SonarQube MCP connection by using the client in your code:

```javascript
import { getSonarQubeMCPClient } from './server/sonarqube-mcp-client.js';

const client = getSonarQubeMCPClient();
await client.connect();

// First, discover available tools
const tools = await client.listTools();
console.log('Available tools:', tools);

// Test by calling a tool (example - actual tool names may vary)
// You can use the generic callTool method or specific helper methods
const result = await client.callTool('tool-name', { /* arguments */ });
console.log('Result:', result);
```

## Discovering Available Tools

The SonarQube MCP server provides various tools. To see what's available:

```javascript
const client = getSonarQubeMCPClient();
await client.connect();

// List all available tools
const tools = await client.listTools();
console.log('Available tools:', tools.tools.map(t => ({
  name: t.name,
  description: t.description
})));
```

## Using the Client

The client provides both generic and convenience methods:

### Generic Method (Recommended)
Use `callTool()` to call any tool by name:

```javascript
// Call any tool dynamically
const result = await client.callTool('tool-name', {
  param1: 'value1',
  param2: 'value2'
});
```

### Convenience Methods
The client includes some convenience methods (tool names may vary):

- `analyzeCode(code, language)` - Analyze code snippets
- `getProjectIssues(projectKey, branch)` - Get project issues
- `getProjectMetrics(projectKey, branch)` - Get project metrics

**Note**: Tool names may vary depending on the SonarQube MCP server version. Always use `listTools()` first to discover available tools.

## Integration with Your Server

The SonarQube MCP client is available at `server/sonarqube-mcp-client.js`. You can import and use it in your server code:

```javascript
import { getSonarQubeMCPClient } from './sonarqube-mcp-client.js';

// In your route handler
app.get('/api/sonarqube/metrics/:projectKey', async (req, res) => {
  try {
    const client = getSonarQubeMCPClient();
    const metrics = await client.getProjectMetrics(req.params.projectKey);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Troubleshooting

### Docker Image Not Found
```bash
# Pull the image manually
docker pull mcp/sonarqube:latest
```

### Connection Errors
1. Verify your token is correct:
   ```bash
   # Test with Docker directly
   docker run -i --rm \
     -e SONARQUBE_TOKEN=your-token \
     -e SONARQUBE_ORG=your-org \
     mcp/sonarqube
   ```

2. Check environment variables in PM2:
   ```bash
   pm2 show autotest-server | grep SONARQUBE
   ```

3. Check Docker is running:
   ```bash
   docker ps
   ```

### Authentication Errors
- Verify your token hasn't expired
- Ensure you're using the correct organization key (Cloud) or URL (Server)
- Check that your token has the necessary permissions

### Environment Variables Not Updating
1. Make sure you restarted PM2:
   ```bash
   pm2 restart autotest-server
   ```

2. Verify variables are set:
   ```bash
   pm2 env autotest-server | grep SONARQUBE
   ```

3. Check PM2 logs:
   ```bash
   pm2 logs autotest-server --lines 50
   ```

## Using SonarQube MCP in Cursor IDE

If you want to use SonarQube MCP directly in Cursor IDE (not just in your server code):

1. **Quick Setup in Cursor**:
   - Go to the [SonarQube MCP Server GitHub repository](https://github.com/SonarSource/sonarqube-mcp-server)
   - Click the "Add to Cursor" or "Deploy to Cursor" button
   - Enter your `SONARQUBE_TOKEN` and `SONARQUBE_ORG` (or `SONARQUBE_URL` for Server)
   - Cursor will automatically configure the MCP server

2. **Manual Configuration**:
   - Open Cursor Settings
   - Navigate to MCP Servers configuration
   - Add a new server with:
     - Command: `docker`
     - Args: `run`, `--rm`, `-i`, `-e`, `SONARQUBE_TOKEN`, `-e`, `SONARQUBE_ORG`, `mcp/sonarqube`
     - Environment variables: Set `SONARQUBE_TOKEN` and `SONARQUBE_ORG` (or `SONARQUBE_URL`)

## Example Usage

See `examples/sonarqube-mcp-example.js` for a complete example of using the client.

## Additional Resources

- **Official Documentation**: [SonarQube MCP Server Docs](https://docs.sonarsource.com/sonarqube-mcp-server)
- **GitHub Repository**: [SonarQube MCP Server](https://github.com/SonarSource/sonarqube-mcp-server)
- **Video Tutorial**: [The Secret to Shipping Safe Code With AI: SonarQube MCP Server](https://www.youtube.com/watch?v=NuD0BbnECkg)

## Quick Reference

```bash
# Update config, then:
pm2 restart autotest-server    # Restart to pick up new env vars
pm2 save                       # Save PM2 state
pm2 logs autotest-server       # Check logs

# Pull Docker image
docker pull mcp/sonarqube:latest

# Test Docker connection manually
docker run -i --rm \
  -e SONARQUBE_TOKEN=your-token \
  -e SONARQUBE_ORG=your-org \
  mcp/sonarqube
```
