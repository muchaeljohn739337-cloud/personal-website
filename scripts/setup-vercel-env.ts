#!/usr/bin/env tsx
/**
 * Vercel Environment Variables Setup Helper
 * Generates a comprehensive list of environment variables needed for Vercel
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

interface EnvVar {
  name: string;
  value: string | null;
  required: boolean;
  description: string;
  environment: 'production' | 'preview' | 'development' | 'all';
}

function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('base64');
}

function generateHexSecret(length: number = 64): string {
  return randomBytes(length).toString('hex');
}

function loadLocalEnv(): Record<string, string> {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envPath = join(process.cwd(), '.env');

  const env: Record<string, string> = {};

  // Try .env.local first
  if (existsSync(envLocalPath)) {
    const content = readFileSync(envLocalPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        env[match[1]] = match[2].trim();
      }
    });
  }

  // Fallback to .env
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#') && !env[match[1]]) {
        env[match[1]] = match[2].trim();
      }
    });
  }

  return env;
}

const localEnv = loadLocalEnv();

const envVars: EnvVar[] = [
  // Core Secrets (Generate new ones for production)
  {
    name: 'JWT_SECRET',
    value: localEnv.JWT_SECRET || generateHexSecret(64),
    required: true,
    description: 'Secret for JWT token signing',
    environment: 'production',
  },
  {
    name: 'SESSION_SECRET',
    value: localEnv.SESSION_SECRET || generateHexSecret(64),
    required: true,
    description: 'Secret for session encryption',
    environment: 'production',
  },
  {
    name: 'NEXTAUTH_SECRET',
    value: localEnv.NEXTAUTH_SECRET || generateSecret(32),
    required: true,
    description: 'Secret for NextAuth.js authentication',
    environment: 'production',
  },
  {
    name: 'CRON_SECRET',
    value: localEnv.CRON_SECRET || generateSecret(32),
    required: false,
    description: 'Secret for cron job authentication',
    environment: 'production',
  },

  // Database
  {
    name: 'DATABASE_URL',
    value: localEnv.DATABASE_URL || null,
    required: true,
    description: 'PostgreSQL connection string (with pooling)',
    environment: 'production',
  },
  {
    name: 'DIRECT_URL',
    value: localEnv.DIRECT_URL || null,
    required: false,
    description: 'PostgreSQL direct connection (for migrations)',
    environment: 'production',
  },

  // Application URLs
  {
    name: 'NEXT_PUBLIC_APP_URL',
    value: 'https://advanciapayledger.com',
    required: true,
    description: 'Public application URL',
    environment: 'production',
  },
  {
    name: 'NEXTAUTH_URL',
    value: 'https://advanciapayledger.com',
    required: true,
    description: 'NextAuth.js callback URL',
    environment: 'production',
  },

  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: localEnv.NEXT_PUBLIC_SUPABASE_URL || 'https://xesecqcqzykvmrtxrzqi.supabase.co',
    required: true,
    description: 'Supabase project URL',
    environment: 'production',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    value: localEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || null,
    required: true,
    description: 'Supabase publishable key',
    environment: 'production',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    value: localEnv.SUPABASE_SERVICE_ROLE_KEY || null,
    required: false,
    description: 'Supabase service role key (server-side only)',
    environment: 'production',
  },

  // Anthropic Claude
  {
    name: 'ANTHROPIC_API_KEY',
    value: localEnv.ANTHROPIC_API_KEY || null,
    required: false,
    description: 'Anthropic Claude API key',
    environment: 'production',
  },

  // Node Environment
  {
    name: 'NODE_ENV',
    value: 'production',
    required: true,
    description: 'Node.js environment',
    environment: 'production',
  },
];

console.log('🚀 Vercel Environment Variables Setup\n');
console.log('='.repeat(80));
console.log('\n📋 Required Environment Variables for Production:\n');
console.log('='.repeat(80));

const required = envVars.filter((v) => v.required);
const optional = envVars.filter((v) => !v.required);

console.log('\n🔴 REQUIRED VARIABLES:\n');
required.forEach((envVar, index) => {
  console.log(`${index + 1}. ${envVar.name}`);
  console.log(`   Description: ${envVar.description}`);
  if (envVar.value && !envVar.value.includes('your_') && !envVar.value.includes('[PASSWORD]')) {
    console.log(
      `   Value: ${envVar.value.substring(0, 50)}${envVar.value.length > 50 ? '...' : ''}`
    );
  } else {
    console.log(`   Value: [NEEDS TO BE SET]`);
  }
  console.log(`   Environment: ${envVar.environment}`);
  console.log('');
});

if (optional.length > 0) {
  console.log('\n⚠️  OPTIONAL VARIABLES (Recommended):\n');
  optional.forEach((envVar, index) => {
    console.log(`${index + 1}. ${envVar.name}`);
    console.log(`   Description: ${envVar.description}`);
    if (envVar.value && !envVar.value.includes('your_') && !envVar.value.includes('[PASSWORD]')) {
      console.log(
        `   Value: ${envVar.value.substring(0, 50)}${envVar.value.length > 50 ? '...' : ''}`
      );
    } else {
      console.log(`   Value: [OPTIONAL]`);
    }
    console.log(`   Environment: ${envVar.environment}`);
    console.log('');
  });
}

console.log('='.repeat(80));
console.log('\n📝 Setup Instructions:\n');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your project: personal-website');
console.log('3. Go to: Settings → Environment Variables');
console.log('4. Add each variable above for "Production" environment');
console.log('5. After adding all variables, trigger a new deployment\n');

console.log('💡 Quick Copy Format (for secrets only):\n');
console.log('# Generated Production Secrets');
required
  .filter((v) => v.name.includes('SECRET') && v.value && !v.value.includes('your_'))
  .forEach((envVar) => {
    console.log(`${envVar.name}=${envVar.value}`);
  });

console.log('\n✅ Setup guide generated!\n');
