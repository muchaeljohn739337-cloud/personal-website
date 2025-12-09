#!/usr/bin/env node

/**
 * Verify Vercel Environment Variables
 * Checks if all required environment variables are set in Vercel
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

interface EnvVar {
  name: string;
  required: boolean;
  description: string;
  getValue?: () => string;
}

const requiredVars: EnvVar[] = [
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'JWT signing secret (generate with: openssl rand -base64 32)',
  },
  {
    name: 'SESSION_SECRET',
    required: true,
    description: 'Session encryption secret (generate with: openssl rand -base64 32)',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret (generate with: openssl rand -base64 32)',
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQL database connection string',
  },
  {
    name: 'NEXT_PUBLIC_APP_URL',
    required: true,
    description: 'Production application URL (e.g., https://advanciapayledger.com)',
    getValue: () => 'https://advanciapayledger.com',
  },
  {
    name: 'NEXTAUTH_URL',
    required: true,
    description: 'NextAuth.js callback URL (e.g., https://advanciapayledger.com)',
    getValue: () => 'https://advanciapayledger.com',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    getValue: () => 'https://xesecqcqzykvmrtxrzqi.supabase.co',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    required: false,
    description: 'Supabase publishable key (or use NEXT_PUBLIC_SUPABASE_ANON_KEY)',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: false,
    description: 'Supabase anon key (alternative to publishable key)',
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-side only)',
  },
];

const recommendedVars: EnvVar[] = [
  {
    name: 'CRON_SECRET',
    required: false,
    description: 'Secret for cron job authentication (generate with: openssl rand -base64 32)',
  },
  {
    name: 'DIRECT_URL',
    required: false,
    description: 'Direct database connection for migrations',
  },
  {
    name: 'REDIS_URL',
    required: false,
    description: 'Redis connection URL for caching',
  },
  {
    name: 'SMTP_HOST',
    required: false,
    description: 'SMTP server hostname',
  },
  {
    name: 'SMTP_FROM',
    required: false,
    description: 'Email sender address',
    getValue: () => 'noreply@advanciapayledger.com',
  },
];

function checkVercelCLI(): boolean {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getVercelEnvVars(): Map<string, string> {
  try {
    // Try to get environment variables from Vercel
    const output = execSync('vercel env ls --json', { encoding: 'utf-8' });
    const envList = JSON.parse(output);
    const envMap = new Map<string, string>();

    if (Array.isArray(envList)) {
      envList.forEach((env: { key: string; value: string; target: string[] }) => {
        if (env.target.includes('production')) {
          envMap.set(env.key, env.value || '[SET]');
        }
      });
    }

    return envMap;
  } catch (error) {
    console.warn('⚠️  Could not fetch Vercel environment variables');
    console.warn('   Make sure you are logged in: vercel login');
    console.warn('   And linked to project: vercel link');
    return new Map();
  }
}

function checkLocalEnv(): Map<string, string> {
  const envMap = new Map<string, string>();

  try {
    const envLocalPath = join(process.cwd(), '.env.local');
    const envLocal = readFileSync(envLocalPath, 'utf-8');

    envLocal.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();
        if (value && !value.startsWith('your_') && !value.startsWith('<')) {
          envMap.set(key, '[SET]');
        }
      }
    });
  } catch {
    // .env.local doesn't exist or can't be read
  }

  return envMap;
}

function verifyEnvironmentVariables() {
  console.log('🔍 Verifying Vercel Environment Variables\n');
  console.log('='.repeat(60));
  console.log('');

  // Check if Vercel CLI is installed
  if (!checkVercelCLI()) {
    console.log('❌ Vercel CLI is not installed');
    console.log('   Install with: npm i -g vercel');
    console.log('   Or use Vercel Dashboard: https://vercel.com/dashboard');
    console.log('');
    process.exit(1);
  }

  // Get environment variables
  const vercelEnv = getVercelEnvVars();
  const localEnv = checkLocalEnv();

  console.log('📋 Checking Required Variables:\n');

  let missingRequired = 0;
  let missingRecommended = 0;

  // Check required variables
  requiredVars.forEach((envVar) => {
    const isSet = vercelEnv.has(envVar.name) || localEnv.has(envVar.name);
    const status = isSet ? '✅' : '❌';
    const source = vercelEnv.has(envVar.name)
      ? '(Vercel)'
      : localEnv.has(envVar.name)
        ? '(Local)'
        : '';

    console.log(`${status} ${envVar.name} ${source}`);
    if (!isSet) {
      console.log(`   Missing: ${envVar.description}`);
      if (envVar.getValue) {
        console.log(`   Suggested value: ${envVar.getValue()}`);
      }
      if (envVar.required) {
        missingRequired++;
      }
    }
    console.log('');
  });

  // Check Supabase key requirement
  const hasPublishableKey =
    vercelEnv.has('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY') ||
    localEnv.has('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
  const hasAnonKey =
    vercelEnv.has('NEXT_PUBLIC_SUPABASE_ANON_KEY') || localEnv.has('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (!hasPublishableKey && !hasAnonKey) {
    console.log('❌ Missing Supabase key');
    console.log(
      '   Set either NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    console.log('');
    missingRequired++;
  }

  // Check recommended variables
  console.log('📋 Checking Recommended Variables:\n');

  recommendedVars.forEach((envVar) => {
    const isSet = vercelEnv.has(envVar.name) || localEnv.has(envVar.name);
    const status = isSet ? '✅' : '⚠️ ';
    const source = vercelEnv.has(envVar.name)
      ? '(Vercel)'
      : localEnv.has(envVar.name)
        ? '(Local)'
        : '';

    console.log(`${status} ${envVar.name} ${source}`);
    if (!isSet) {
      console.log(`   Optional: ${envVar.description}`);
      if (envVar.getValue) {
        console.log(`   Suggested value: ${envVar.getValue()}`);
      }
      missingRecommended++;
    }
    console.log('');
  });

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Summary:\n');

  if (missingRequired === 0) {
    console.log('✅ All required environment variables are set!');
  } else {
    console.log(`❌ Missing ${missingRequired} required environment variable(s)`);
    console.log('   Set these in Vercel Dashboard or via CLI');
  }

  if (missingRecommended > 0) {
    console.log(`⚠️  ${missingRecommended} recommended variable(s) not set`);
    console.log('   These are optional but recommended for full functionality');
  }

  console.log('\n🔗 Quick Links:');
  console.log('   Vercel Dashboard: https://vercel.com/dashboard');
  console.log(
    '   Environment Variables: https://vercel.com/dashboard/[team]/personal-website/settings/environment-variables'
  );
  console.log('   Setup Guide: See VERCEL_ENVIRONMENT_SETUP.md');
  console.log('');

  if (missingRequired > 0) {
    console.log('🚨 ACTION REQUIRED:');
    console.log('   1. Set all missing required variables in Vercel');
    console.log('   2. Redeploy your application');
    console.log('   3. Run this script again to verify');
    console.log('');
    process.exit(1);
  }

  console.log('✅ Environment variables are properly configured!');
  console.log('');
}

// Run verification
verifyEnvironmentVariables();
