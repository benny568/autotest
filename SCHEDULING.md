# Scheduling Automatic Snapshots

This document explains how to set up automatic snapshot creation every Friday at 4pm.

## Option 1: Using Cron (Recommended for macOS/Linux)

### Quick Setup

Run the setup script:

```bash
npm run setup-cron
```

This will automatically configure a cron job that runs every Friday at 4:00 PM.

### Manual Cron Setup

If you prefer to set it up manually:

1. Open your crontab:

   ```bash
   crontab -e
   ```

2. Add this line (runs every Friday at 4:00 PM):

   ```
   0 16 * * 5 cd /Users/bodaly/sig/tools/autotest && node scripts/scheduled-snapshot.js >> logs/cron.log 2>&1
   ```

3. Save and exit

### Cron Schedule Format

The format is: `minute hour day month weekday`

- `0 16 * * 5` = Every Friday at 4:00 PM
- `0 16 * * 1-5` = Every weekday at 4:00 PM
- `0 9 * * *` = Every day at 9:00 AM
- `0 */6 * * *` = Every 6 hours

### Viewing Cron Jobs

```bash
crontab -l
```

### Removing Cron Job

```bash
crontab -e
# Then delete the line with scheduled-snapshot.js
```

## Option 2: Using Node.js Scheduler (Runs Continuously)

If you want the scheduler to run as part of the server process:

1. Install node-cron:

   ```bash
   npm install node-cron
   ```

2. The server can be modified to include a built-in scheduler (see server/index.js)

## Option 3: Using macOS LaunchAgent (Alternative)

Create a LaunchAgent plist file:

1. Create `~/Library/LaunchAgents/com.autotest.snapshot.plist`:

   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.autotest.snapshot</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/Users/bodaly/sig/tools/autotest/scripts/scheduled-snapshot.js</string>
       </array>
       <key>StartCalendarInterval</key>
       <dict>
           <key>Weekday</key>
           <integer>5</integer>
           <key>Hour</key>
           <integer>16</integer>
           <key>Minute</key>
           <integer>0</integer>
       </dict>
       <key>StandardOutPath</key>
       <string>/Users/bodaly/sig/tools/autotest/logs/launchd.log</string>
       <key>StandardErrorPath</key>
       <string>/Users/bodaly/sig/tools/autotest/logs/launchd.error.log</string>
   </dict>
   </plist>
   ```

2. Load it:

   ```bash
   launchctl load ~/Library/LaunchAgents/com.autotest.snapshot.plist
   ```

3. Unload it (if needed):
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.autotest.snapshot.plist
   ```

## Option 4: CI/CD Pipeline

If you use GitHub Actions, GitLab CI, or similar:

### GitHub Actions Example

Create `.github/workflows/weekly-snapshot.yml`:

```yaml
name: Weekly Test Snapshot

on:
  schedule:
    - cron: "0 16 * * 5" # Every Friday at 4pm UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  snapshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install dependencies
        run: npm install
      - name: Start server
        run: npm run server &
      - name: Wait for server
        run: sleep 5
      - name: Create snapshot
        run: npm run snapshot
```

## Important Notes

1. **Server Must Be Running**: The server must be running on port 3001 for the snapshot script to work. Consider:
   - Running the server as a service
   - Using PM2 to keep it running
   - Starting it automatically on system boot

2. **Keep Server Running**: To keep the server running continuously:

   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start npm --name "autotest-server" -- run server
   pm2 save
   pm2 startup  # Sets up auto-start on boot
   ```

3. **Logs**: Check `logs/cron.log` for execution history and any errors

4. **Time Zone**: Cron uses your system's timezone. Make sure your system clock is correct.

## Testing

Test the snapshot script manually:

```bash
npm run snapshot
```

Or test the bash script:

```bash
bash scripts/create-snapshot.sh
```

## Troubleshooting

- **"Server is not running"**: Start the server with `npm run server`
- **Permission denied**: Make scripts executable with `chmod +x scripts/*.sh`
- **Cron not running**: Check system logs and ensure cron service is active
- **Wrong timezone**: Verify your system timezone with `date`
