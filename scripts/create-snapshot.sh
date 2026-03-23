#!/bin/bash

# Script to create a snapshot via the API
# This can be called by cron or other schedulers

API_URL="http://localhost:3001/api/snapshot"

# Check if server is running
if ! curl -s http://localhost:3001/api/metrics > /dev/null 2>&1; then
    echo "Error: Server is not running on port 3001"
    echo "Please start the server first with: npm run server"
    exit 1
fi

# Create snapshot
echo "Creating snapshot at $(date)..."
RESPONSE=$(curl -s -X POST "$API_URL")

if [ $? -eq 0 ]; then
    echo "Snapshot created successfully"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "Error: Failed to create snapshot"
    exit 1
fi
