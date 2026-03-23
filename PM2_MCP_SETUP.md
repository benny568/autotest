# PM2 and MCP Server Configuration

## How PM2 Handles Environment Variables

PM2 reads environment variables from the `ecosystem.config.cjs` file when you start or restart a process. **Environment variables are NOT automatically picked up** - you must restart PM2 for changes to take effect.

## Updating Environment Variables

### Step 1: Update ecosystem.config.cjs

Edit the `env` section in `ecosystem.config.cjs` to include your MCP configuration:

```javascript
env: {
  USE_MCP: 'true',
  JIRA_URL: 'https://yourcompany.atlassian.net',
  JIRA_USERNAME: 'your.email@company.com',
  JIRA_API_TOKEN: 'your-token-here',
  JIRA_SSL_VERIFY: 'false',
  CONFLUENCE_URL: 'https://yourcompany.atlassian.net/wiki',
  CONFLUENCE_USERNAME: 'your.email@company.com',
  CONFLUENCE_API_TOKEN: 'your-token-here',
  CONFLUENCE_SSL_VERIFY: 'false',
}
```

### Step 2: Restart PM2

After updating the configuration file, you **must restart** PM2 to pick up the new environment variables:

```bash
# Option 1: Restart the specific app (recommended)
pm2 restart autotest-server

# Option 2: Delete and restart (if restart doesn't work)
pm2 delete autotest-server
pm2 start ecosystem.config.cjs

# Option 3: Reload (zero-downtime restart)
pm2 reload autotest-server
```

### Step 3: Save PM2 Configuration

After restarting, save the PM2 configuration so it persists across reboots:

```bash
pm2 save
```

## Verifying Environment Variables

To check if PM2 has picked up the environment variables, use one of these methods:

```bash
# Method 1: Check PM2 process info (shows some env vars)
pm2 show autotest-server

# Method 2: Check the application logs for MCP initialization
pm2 logs autotest-server --lines 50 | grep -i "mcp\|connected"

# Method 3: Test the API endpoint to see if MCP is working
curl http://localhost:3001/api/jira/defects

# Method 4: Check the debug log file
tail -20 logs/jira-debug.log | grep -i "mcp\|using"
```

**Note:** The `pm2 env` command may not work with app names. Use the methods above instead.

## Important Notes

1. **Restart Required**: PM2 does NOT automatically reload environment variables. You must restart the process.

2. **File Changes**: If you edit `ecosystem.config.cjs`, you need to restart PM2 for changes to take effect.

3. **System Environment Variables**: PM2 will also inherit environment variables from your shell session when you start it, but the `ecosystem.config.cjs` file takes precedence.

4. **Security**: Never commit API tokens or passwords to version control. Consider using PM2's `--secret` flag or environment variable files.

## Troubleshooting

### Environment variables not updating?

1. Make sure you restarted PM2 after editing the config:
   ```bash
   pm2 restart autotest-server
   ```

2. Verify the variables are set:
   ```bash
   pm2 env autotest-server | grep JIRA
   ```

3. Check PM2 logs for errors:
   ```bash
   pm2 logs autotest-server --lines 50
   ```

### Using .env files with PM2

If you prefer using a `.env` file, you can use the `dotenv` package. However, PM2's `ecosystem.config.cjs` is the recommended approach for production.

## Quick Reference

```bash
# Update config, then:
pm2 restart autotest-server    # Restart to pick up new env vars
pm2 save                       # Save PM2 state
pm2 logs autotest-server       # Check logs
pm2 env autotest-server        # Verify env vars
```
