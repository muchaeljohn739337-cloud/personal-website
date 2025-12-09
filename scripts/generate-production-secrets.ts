#!/usr/bin/env tsx
/**
 * Generate Production Secrets
 * Generates secure random secrets for production deployment
 */

import { randomBytes } from 'crypto';

interface Secret {
  name: string;
  value: string;
  description: string;
}

function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

function generateHexSecret(length: number = 64): string {
  return randomBytes(length).toString('hex');
}

const secrets: Secret[] = [
  {
    name: 'JWT_SECRET',
    value: generateHexSecret(64),
    description: 'Secret for JWT token signing (min 32 chars)',
  },
  {
    name: 'SESSION_SECRET',
    value: generateHexSecret(64),
    description: 'Secret for session encryption (min 32 chars)',
  },
  {
    name: 'NEXTAUTH_SECRET',
    value: generateSecret(32),
    description: 'Secret for NextAuth.js (min 32 chars)',
  },
  {
    name: 'CRON_SECRET',
    value: generateSecret(32),
    description: 'Secret for cron job authentication',
  },
];

console.log('🔐 Production Secrets Generator\n');
console.log('='.repeat(80));
console.log('\n⚠️  IMPORTANT: Keep these secrets secure! Never commit them to git.\n');
console.log('📋 Copy these values to Vercel Environment Variables:\n');
console.log('='.repeat(80));

secrets.forEach((secret, index) => {
  console.log(`\n${index + 1}. ${secret.name}`);
  console.log(`   Description: ${secret.description}`);
  console.log(`   Value: ${secret.value}`);
  console.log(`   Length: ${secret.value.length} characters`);
});

console.log('\n' + '='.repeat(80));
console.log('\n📝 Instructions:');
console.log('1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables');
console.log('2. Add each variable above for "Production" environment');
console.log('3. After adding all variables, trigger a new deployment');
console.log('\n💡 Tip: You can also copy the values below as a quick reference:\n');

console.log('# Production Secrets (Copy to Vercel)');
secrets.forEach((secret) => {
  console.log(`${secret.name}=${secret.value}`);
});

console.log('\n✅ Secrets generated successfully!\n');
