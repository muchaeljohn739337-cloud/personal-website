#!/usr/bin/env node

/**
 * Create .env.local template from env.example
 * Helps users set up their environment quickly
 */

const fs = require('fs');
const path = require('path');

const envExamplePath = path.join(__dirname, '..', 'env.example');
const envLocalPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists. Skipping template creation.');
  process.exit(0);
}

if (!fs.existsSync(envExamplePath)) {
  console.error('❌ env.example not found. Please create it first.');
  process.exit(1);
}

try {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log('✅ Created .env.local from env.example');
  console.log('📝 Please edit .env.local with your actual values');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
  process.exit(1);
}
