#!/usr/bin/env node

/**
 * Generate Production Secrets
 * Generates secure random secrets for production deployment
 */

import { randomBytes } from 'crypto';

interface Secret {
  name: string;
  description: string;
  length: number;
  value: string;
}

function generateSecret(length: number): string {
  return randomBytes(length).toString('base64');
}

function generateHexSecret(length: number): string {
  return randomBytes(length).toString('hex');
}

const secrets: Secret[] = [
  {
    name: 'JWT_SECRET',
    description: 'JWT signing secret (64+ characters recommended)',
    length: 32,
    value: generateSecret(32),
  },
  {
    name: 'SESSION_SECRET',
    description: 'Session encryption secret (32+ characters)',
    length: 32,
    value: generateSecret(32),
  },
  {
    name: 'NEXTAUTH_SECRET',
    description: 'NextAuth.js secret (32+ characters)',
    length: 32,
    value: generateSecret(32),
  },
  {
    name: 'CRON_SECRET',
    description: 'Cron job authentication secret (32+ characters)',
    length: 32,
    value: generateSecret(32),
  },
];

console.log('🔐 Generating Production Secrets\n');
console.log('='.repeat(60));
console.log('');
console.log('⚠️  IMPORTANT: Save these secrets securely!');
console.log('   - Copy them to Vercel environment variables');
console.log('   - Store them in a password manager');
console.log('   - DO NOT commit them to git');
console.log('');
console.log('='.repeat(60));
console.log('');

secrets.forEach((secret, index) => {
  console.log(`${index + 1}. ${secret.name}`);
  console.log(`   Description: ${secret.description}`);
  console.log(`   Value: ${secret.value}`);
  console.log(`   Length: ${secret.value.length} characters`);
  console.log('');
});

console.log('='.repeat(60));
console.log('');
console.log('📋 Vercel CLI Commands:');
console.log('');
secrets.forEach((secret) => {
  console.log(`vercel env add ${secret.name} production`);
});
console.log('');
console.log('Or set them via Vercel Dashboard:');
console.log('https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables');
console.log('');
console.log('✅ Secrets generated successfully!');
console.log('');

