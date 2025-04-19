#!/usr/bin/env node

const https = require('https');
const http = require('http');

const RENDER_URL = process.env.RENDER_URL || 'http://localhost:5001';
const TIMEOUT = 5000; // 5 seconds

function checkServer() {
  return new Promise((resolve, reject) => {
    const protocol = RENDER_URL.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = protocol.get(`${RENDER_URL}/api/health`, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (res.statusCode === 200) {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            console.log(`✅ Server is up and running!`);
            console.log(`Response time: ${responseTime}ms`);
            console.log(`Environment: ${response.environment}`);
            console.log(`Timestamp: ${response.timestamp}`);
            resolve(true);
          } catch (e) {
            console.error(`❌ Invalid JSON response: ${data}`);
            reject(new Error('Invalid JSON response'));
          }
        });
      } else {
        console.error(`❌ Server returned status code: ${res.statusCode}`);
        reject(new Error(`Server returned status code: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      console.error(`❌ Error connecting to server: ${err.message}`);
      reject(err);
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      console.error(`❌ Connection timed out after ${TIMEOUT}ms`);
      reject(new Error('Connection timed out'));
    });
  });
}

// 运行检查
checkServer()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 