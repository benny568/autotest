# Jira Integration Setup

This guide explains how to configure the Jira integration for the defects dashboard.

## Prerequisites

1. Access to your Jira instance
2. A Jira API token (not your password)
3. Knowledge of your Jira project key and team field (if filtering by team)
4. Docker installed (if using MCP server mode)

## Configuration Modes

The app supports two modes for Jira integration:

### Mode 1: Atlassian MCP Server (Recommended)

The app can use the Atlassian MCP server for Jira operations. This provides better integration and more features.

**To enable MCP mode:**
- Set `USE_MCP=true` (or leave unset - it defaults to true if MCP env vars are present)
- Configure MCP-specific environment variables (see below)

**MCP Environment Variables:**
- `JIRA_URL` - Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
- `JIRA_USERNAME` - Your Jira account email address
- `JIRA_API_TOKEN` - Your Jira API token
- `JIRA_SSL_VERIFY` - Set to "false" if using self-signed certificates (default: "false")
- `CONFLUENCE_URL` - Optional, for Confluence integration (e.g., `https://yourcompany.atlassian.net/wiki`)
- `CONFLUENCE_USERNAME` - Optional, same as JIRA_USERNAME typically
- `CONFLUENCE_API_TOKEN` - Optional, same as JIRA_API_TOKEN typically
- `CONFLUENCE_SSL_VERIFY` - Optional, same as JIRA_SSL_VERIFY

### Mode 2: Direct Jira API (Fallback)

The app can also connect directly to Jira's REST API. This is used as a fallback if MCP is not available or fails.

**To force direct API mode:**
- Set `USE_MCP=false`
- Configure traditional Jira environment variables (see below)

**Direct API Environment Variables:**
- `JIRA_BASE_URL` - Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
- `JIRA_EMAIL` - Your Jira account email address
- `JIRA_API_TOKEN` - Your Jira API token

## Configuration

The Jira integration uses environment variables for configuration. Set these before starting the server:

### Required Environment Variables

- `JIRA_BASE_URL` - Your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
- `JIRA_EMAIL` - Your Jira account email address
- `JIRA_API_TOKEN` - Your Jira API token (see below for how to create one)

### Optional Environment Variables

- `JIRA_PROJECT_KEY` - If you want to filter by a specific project (not currently used, but available for future enhancements)
- `JIRA_TEAM_FIELD` - The custom field ID for team filtering (default: `customfield_10000`)

## Creating a Jira API Token

1. Go to [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Click "Create API token"
3. Give it a label (e.g., "Defects Dashboard")
4. Copy the token immediately (you won't be able to see it again)
5. Use this token as the `JIRA_API_TOKEN` environment variable

## Setting Environment Variables

### Option 1: Environment File (Recommended for Development)

Create a `.env` file in the project root:

```bash
JIRA_BASE_URL=https://yourcompany.atlassian.net
JIRA_EMAIL=your.email@company.com
JIRA_API_TOKEN=your-api-token-here
JIRA_TEAM_FIELD=customfield_10000
```

**Note:** You may need to install `dotenv` package and load it in your server file if you want to use `.env` files.

### Option 2: Export in Shell (Recommended for Production)

```bash
export JIRA_BASE_URL=https://yourcompany.atlassian.net
export JIRA_EMAIL=your.email@company.com
export JIRA_API_TOKEN=your-api-token-here
export JIRA_TEAM_FIELD=customfield_10000
```

### Option 3: PM2 Ecosystem Config

If using PM2, add environment variables to `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [{
    name: 'autotest-server',
    script: './server/index.js',
    env: {
      JIRA_BASE_URL: 'https://yourcompany.atlassian.net',
      JIRA_EMAIL: 'your.email@company.com',
      JIRA_API_TOKEN: 'your-api-token-here',
      JIRA_TEAM_FIELD: 'customfield_10000',
    }
  }]
};
```

## Finding Your Team Field ID

If you want to filter defects by team, you need to find the custom field ID:

1. Go to your Jira instance
2. Navigate to an issue that has the team field
3. Inspect the page source or use browser dev tools
4. Look for the field ID in the HTML (usually `customfield_XXXXX`)
5. Or use the Jira REST API to list custom fields

Alternatively, you can query the Jira API:
```bash
curl -u your.email@company.com:your-api-token \
  'https://yourcompany.atlassian.net/rest/api/3/field' | jq '.[] | select(.name == "Team")'
```

## Status Mapping

The dashboard expects the following statuses:
- Draft
- In Progress
- Dev Complete
- Test Complete
- Delivered

If your Jira instance uses different status names, you may need to:
1. Update the status names in `server/index.js` (in the `statuses` array)
2. Or create a status mapping function to map your statuses to the expected ones

## Testing the Integration

1. Start the server with environment variables set
2. Navigate to the "Jira Defects" tab in the dashboard
3. The dashboard should display defects grouped by priority and status

## Troubleshooting

### Error: "Jira configuration is missing"
- Make sure all required environment variables are set
- Restart the server after setting environment variables

### Error: "Jira API error: 401 Unauthorized"
- Check that your email and API token are correct
- Verify the API token hasn't expired or been revoked
- Make sure you're using an API token, not your password

### Error: "Jira API error: 403 Forbidden"
- Your account may not have permission to view the issues
- Check your Jira project permissions

### No defects showing
- Verify that there are open bugs (unresolved) in your Jira instance
- Check the JQL query in `server/index.js` - it searches for `issuetype = Bug AND resolution = Unresolved`
- Adjust the query if your Jira uses different issue types or resolution values

## API Endpoints

- `GET /api/jira/defects` - Get all open defects grouped by priority and status
- `GET /api/jira/defects?team=TeamName` - Get defects filtered by team (requires team field configuration)
- `GET /api/jira/teams` - Get available teams (placeholder, can be enhanced)
