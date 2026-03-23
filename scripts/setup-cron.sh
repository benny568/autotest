#!/bin/bash

# Script to set up cron job for automatic snapshots
# Run this once to set up the scheduled task

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Make scripts executable
chmod +x "$SCRIPT_DIR/create-snapshot.sh"
chmod +x "$SCRIPT_DIR/scheduled-snapshot.js"

# Determine which script to use
# Option 1: Use the Node.js script (recommended)
CRON_COMMAND="0 16 * * 5 cd $PROJECT_DIR && node scripts/scheduled-snapshot.js >> $PROJECT_DIR/logs/cron.log 2>&1"

# Option 2: Use the bash script (alternative)
# CRON_COMMAND="0 16 * * 5 $SCRIPT_DIR/create-snapshot.sh >> $PROJECT_DIR/logs/cron.log 2>&1"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "scheduled-snapshot.js"; then
    echo "Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "scheduled-snapshot.js" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

echo "Cron job set up successfully!"
echo ""
echo "Schedule: Every Friday at 4:00 PM"
echo "Command: $CRON_COMMAND"
echo ""
echo "To view your cron jobs: crontab -l"
echo "To remove this cron job: crontab -e (then delete the line)"
echo ""
echo "Logs will be written to: $PROJECT_DIR/logs/cron.log"
