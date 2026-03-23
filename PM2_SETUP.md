# PM2 Setup Guide

This guide explains how to use PM2 to keep the autotest server running continuously.

## Quick Setup

Run the automated setup script:

```bash
npm run setup-pm2
```

This will:

1. Install PM2 globally (if not already installed)
2. Start the server with PM2
3. Save the PM2 configuration
4. Set up PM2 to start on system boot

## Manual Setup

If you prefer to set it up manually:

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Start the Server

```bash
cd /Users/bodaly/sig/tools/autotest
pm2 start ecosystem.config.cjs
```

### 3. Save Configuration

```bash
pm2 save
```

### 4. Set Up Auto-Start on Boot

```bash
pm2 startup
```

Follow the instructions it provides (you may need to run a command with sudo).

## PM2 Commands

### Basic Operations

```bash
# Check status
pm2 status
# or
npm run pm2:status

# View logs
pm2 logs autotest-server
# or
npm run pm2:logs

# Restart server
pm2 restart autotest-server
# or
npm run pm2:restart

# Stop server
pm2 stop autotest-server
# or
npm run pm2:stop

# Start server
pm2 start ecosystem.config.cjs
# or
npm run pm2:start
```

### Advanced Operations

```bash
# Monitor resources (CPU, memory)
pm2 monit

# View detailed information
pm2 describe autotest-server

# Delete from PM2 (stops and removes)
pm2 delete autotest-server

# Reload server (zero-downtime restart)
pm2 reload autotest-server

# View all PM2 processes
pm2 list

# Clear all logs
pm2 flush
```

## Log Files

PM2 logs are stored in:

- `logs/pm2-out.log` - Standard output
- `logs/pm2-error.log` - Error output
- `logs/pm2-combined.log` - Combined logs with timestamps

View logs in real-time:

```bash
pm2 logs autotest-server --lines 100
```

## Verifying It's Working

1. Check if server is running:

   ```bash
   pm2 status
   ```

   You should see `autotest-server` with status `online`.

2. Test the API:

   ```bash
   curl http://localhost:3001/api/metrics
   ```

3. Check logs:
   ```bash
   pm2 logs autotest-server --lines 20
   ```

## Troubleshooting

### Server Not Starting

- Check PM2 logs: `pm2 logs autotest-server`
- Verify port 3001 is not in use: `lsof -i :3001`
- Check the ecosystem.config.js file path is correct

### Server Keeps Restarting

- Check error logs: `pm2 logs autotest-server --err`
- Look for error messages in the logs
- Verify all dependencies are installed: `npm install`

### PM2 Not Starting on Boot

- Run `pm2 startup` again and follow the instructions
- On macOS, you may need to grant permissions in System Preferences > Security & Privacy

### Removing PM2 Setup

```bash
pm2 stop autotest-server
pm2 delete autotest-server
pm2 unstartup
pm2 kill
```

## Benefits of Using PM2

1. **Automatic Restarts**: If the server crashes, PM2 automatically restarts it
2. **Background Running**: Server runs in the background, no terminal needed
3. **Auto-Start on Boot**: Server starts automatically when your computer reboots
4. **Log Management**: Centralized logging with rotation
5. **Monitoring**: Real-time monitoring of CPU and memory usage
6. **Zero-Downtime**: Can reload without dropping connections

## Next Steps

After setting up PM2, set up the scheduled snapshots:

```bash
npm run setup-cron
```

This will create a cron job that runs every Friday at 4pm to create snapshots automatically.
