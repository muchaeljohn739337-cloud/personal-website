#!/usr/bin/env node

// Production Monitoring Script
// Continuous health checks for all services

const https = require('https');
const { URL } = require('url');

const SERVICES = [
  'https://modular-saas-platform-frontend.vercel.app',
  'https://advancia-backend-upnrf.onrender.com/api/health',
  'https://advanciapayledger.com',
  'https://api.advanciapayledger.com/api/health'
];

async function checkService(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        timeout: 10000,
        rejectUnauthorized: false
      };

      const req = https.request(options, (res) => {
        resolve({ url, status: res.statusCode, success: res.statusCode < 400 });
      });

      req.on('error', () => resolve({ url, status: 'ERROR', success: false }));
      req.on('timeout', () => resolve({ url, status: 'TIMEOUT', success: false }));
      req.end();
    } catch (error) {
      resolve({ url, status: 'ERROR', success: false });
    }
  });
}

async function monitor() {
  console.log(`\n📊 Production Monitoring - ${new Date().toISOString()}`);

  for (const url of SERVICES) {
    const result = await checkService(url);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${url}: ${result.status}`);
  }
}

// Run monitoring
monitor().catch(console.error);
