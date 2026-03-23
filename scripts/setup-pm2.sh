#!/bin/bash

# Script to set up PM2 for the autotest server
# This will install PM2 (if needed) and configure it to run the server

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "Setting up PM2 for autotest server..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
    echo "PM2 installed successfully!"
    echo ""
else
    echo "PM2 is already installed."
    echo ""
fi

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Check if server is already running with PM2
if pm2 list | grep -q "autotest-server"; then
    echo "Server is already running with PM2."
    echo "Stopping existing instance..."
    pm2 stop autotest-server
    pm2 delete autotest-server
    echo ""
fi

# Start the server with PM2
echo "Starting server with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
echo ""
echo "Saving PM2 configuration..."
pm2 save

# Set up PM2 to start on system boot
echo ""
echo "Setting up PM2 to start on system boot..."
echo "You may be prompted for your password to set up the startup script."
pm2 startup

echo ""
echo "=========================================="
echo "PM2 setup complete!"
echo "=========================================="
echo ""
echo "Server is now running with PM2."
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check server status"
echo "  pm2 logs autotest-server - View server logs"
echo "  pm2 restart autotest-server - Restart the server"
echo "  pm2 stop autotest-server   - Stop the server"
echo "  pm2 monit               - Monitor server resources"
echo ""
echo "Logs are located at:"
echo "  $PROJECT_DIR/logs/pm2-out.log"
echo "  $PROJECT_DIR/logs/pm2-error.log"
echo "  $PROJECT_DIR/logs/pm2-combined.log"
echo ""
