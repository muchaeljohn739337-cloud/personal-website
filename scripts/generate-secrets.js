#!/usr/bin/env node

/**
 * Generate secure random secrets for environment variables
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('🔑 Generating Secure Secrets');
console.log('============================\n');

console.log('# Copy these to your .env.local file:\n');
console.log(`JWT_SECRET=${generateSecret()}`);
console.log(`SESSION_SECRET=${generateSecret()}`);
console.log(`NEXTAUTH_SECRET=${generateSecret()}`);
console.log(`CRON_SECRET=${generateSecret(32)}`);
console.log('');

console.log('⚠️  IMPORTANT:');
console.log('- Keep these secrets secure');
console.log('- Never commit them to git');
console.log('- Use different secrets for development and production');
console.log('- Store production secrets in secure vault (Vercel/Cloudflare secrets)');
console.log('');
