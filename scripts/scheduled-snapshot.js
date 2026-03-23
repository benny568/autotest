#!/usr/bin/env node

/**
 * Standalone script to create a snapshot
 * Can be run directly or via cron
 */

import http from 'http';

const API_URL = 'http://localhost:3001/api/snapshot';

function createSnapshot() {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3001,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            const timestamp = new Date().toLocaleString();
            console.log(`Snapshot created successfully at ${timestamp}`);
            if (result.gitPullResult) {
              const pullStatus = result.gitPullResult === 'success' 
                ? 'success' 
                : `failed (${result.gitPullMessage || 'unknown error'})`;
              console.log(`Git pull: ${pullStatus}`);
            }
            resolve(result);
          } catch (error) {
            console.error('Error parsing response:', error.message);
            reject(error);
          }
        } else {
          console.error(`Error: Server returned status ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`Error connecting to server: ${error.message}`);
      console.error('Make sure the server is running on port 3001');
      reject(error);
    });

    req.end();
  });
}

// Run if called directly
createSnapshot()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create snapshot:', error.message);
    process.exit(1);
  });
