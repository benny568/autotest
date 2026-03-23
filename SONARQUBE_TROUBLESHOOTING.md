# SonarQube MCP Certificate Error Troubleshooting

## Current Issue

The SonarQube MCP server is failing with:
```
Server initialization failed: (certificate_unknown) The certificate chain is not trusted.
```

This indicates an SSL/TLS certificate validation problem.

## Solutions

### Option 1: Fix Cursor MCP Configuration

The SonarQube MCP server in Cursor needs to be configured to handle SSL certificates properly.

1. **Check Cursor MCP Settings**:
   - Open Cursor Settings
   - Navigate to MCP Servers
   - Find the SonarQube MCP server configuration
   - Look for SSL verification settings

2. **For SonarQube Cloud**:
   - The certificate should be valid, so this might be a Docker/network issue
   - Try restarting Docker: `docker restart`

3. **For SonarQube Server (Self-hosted)**:
   - You may need to disable SSL verification or add the certificate
   - Check if your SonarQube server uses a self-signed certificate

### Option 2: Use the Script Directly

You can use the script I created to check coverage:

```bash
# Make sure Docker is running
docker ps

# Run the coverage check script
node scripts/check-sonarqube-coverage.js reformers_content-manager-client
```

Note: The script uses the same MCP client, so it may have the same certificate issue.

### Option 3: Direct SonarQube API Access

If MCP continues to fail, you can access SonarQube directly via its REST API:

```bash
# Get coverage metrics directly
curl -u "YOUR_TOKEN:" \
  "https://sonarcloud.io/api/measures/component?component=signifyhealth_reformers.content-manager-client&metricKeys=coverage,lines_to_cover,uncovered_lines,line_coverage"
```

Replace:
- `YOUR_TOKEN` with your SonarQube token
- `signifyhealth_reformers.content-manager-client` with the actual project key

### Option 4: Check Project Key Format

SonarQube project keys can have different formats:
- `org_key:project_name`
- `project_name`
- `org_key_project_name`

Try these variations:
- `signifyhealth_reformers.content-manager-client`
- `reformers.content-manager-client`
- `reformers_content-manager-client`
- `signifyhealth:reformers.content-manager-client`

## Finding the Correct Project Key

1. **Via SonarQube Web UI**:
   - Log in to SonarQube Cloud/Server
   - Navigate to the project
   - The project key is visible in the URL or project settings

2. **Via API**:
   ```bash
   curl -u "YOUR_TOKEN:" \
     "https://sonarcloud.io/api/projects/search?organization=signifyhealth"
   ```

## Next Steps

1. **Verify Docker is running**:
   ```bash
   docker ps
   ```

2. **Test Docker connection manually**:
   ```bash
   docker run -i --rm \
     -e SONARQUBE_TOKEN=squ_cd4aa785778720dd2674e987de433802e08924ef \
     -e SONARQUBE_ORG=signifyhealth \
     mcp/sonarqube
   ```

3. **Check Cursor MCP logs**:
   - Look for MCP server logs in Cursor
   - Check for certificate-related errors

4. **Try the alternative script**:
   ```bash
   node scripts/check-sonarqube-coverage.js <project-key>
   ```
