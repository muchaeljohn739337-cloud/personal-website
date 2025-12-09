#!/usr/bin/env tsx

/**
 * Set Vercel Environment Variables using API Token
 * Automatically sets all required variables using Vercel API
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const VERCEL_TOKEN = 'v9pIjTwBISOBcptBXinj5YHu';
const VERCEL_PROJECT_ID = 'prj_HQeqbbLNwAvvT5vdL3krVh9vndDH';
const VERCEL_TEAM_ID = ''; // Optional, leave empty for personal account

const REQUIRED_VARS = [
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
];

const OPTIONAL_VARS = ['DIRECT_URL', 'CRON_SECRET'];

interface EnvVar {
  name: string;
  value: string;
  required: boolean;
}

function loadLocalEnv(): Record<string, string> {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envPath = join(process.cwd(), '.env');

  const env: Record<string, string> = {};

  if (existsSync(envLocalPath)) {
    const content = readFileSync(envLocalPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        let value = match[2].trim();
        value = value.replace(/^["']|["']$/g, '');
        env[match[1]] = value;
      }
    });
  }

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#') && !env[match[1]]) {
        let value = match[2].trim();
        value = value.replace(/^["']|["']$/g, '');
        env[match[1]] = value;
      }
    });
  }

  return env;
}

function validateDatabaseUrl(url: string): boolean {
  return url.startsWith('postgresql://') || url.startsWith('postgres://');
}

async function setVercelEnvVar(
  name: string,
  value: string,
  environment: string = 'production'
): Promise<boolean> {
  try {
    // Validate DATABASE_URL format
    if (name === 'DATABASE_URL' && !validateDatabaseUrl(value)) {
      console.log(`   ⚠️  Invalid DATABASE_URL format. Must start with postgresql:// or postgres://`);
      console.log(`   ⚠️  Current value appears to be invalid. Please set manually in Vercel Dashboard.`);
      return false;
    }

    const url = VERCEL_TEAM_ID
      ? `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env?teamId=${VERCEL_TEAM_ID}`
      : `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/env`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: name,
        value: value,
        type: 'encrypted',
        target: [environment],
      }),
    });

    if (response.ok) {
      return true;
    } else {
      const error = await response.text();
      console.log(`   Error: ${error}`);
      return false;
    }
  } catch (error) {
    console.log(`   Error: ${error}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting Vercel Environment Variables via API\n');
  console.log('='.repeat(80));
  console.log('');

  // Load variables
  const localEnv = loadLocalEnv();
  const varsToSet: EnvVar[] = [];
  const missing: string[] = [];

  REQUIRED_VARS.forEach((varName) => {
    if (localEnv[varName] && localEnv[varName].length > 0) {
      varsToSet.push({ name: varName, value: localEnv[varName], required: true });
    } else {
      missing.push(varName);
    }
  });

  OPTIONAL_VARS.forEach((varName) => {
    if (localEnv[varName] && localEnv[varName].length > 0) {
      varsToSet.push({ name: varName, value: localEnv[varName], required: false });
    }
  });

  if (missing.length > 0) {
    console.log('⚠️  Missing required variables in .env.local:\n');
    missing.forEach((v) => console.log(`   - ${v}`));
    console.log('');

    if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('💡 Get SUPABASE_SERVICE_ROLE_KEY from:');
      console.log(
        '   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api\n'
      );
      console.log('   Add it to .env.local, then run this script again.\n');
    }
  }

  if (varsToSet.length === 0) {
    console.log('❌ No variables to set. Please add them to .env.local first.\n');
    process.exit(1);
  }

  console.log(`📋 Setting ${varsToSet.length} variable(s) in Vercel...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const envVar of varsToSet) {
    process.stdout.write(`Setting ${envVar.name}... `);

    const success = await setVercelEnvVar(envVar.name, envVar.value, 'production');

    if (success) {
      console.log('✅');
      successCount++;
    } else {
      console.log('❌');
      failCount++;
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`✅ Successfully set: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  if (successCount > 0) {
    console.log('🔄 Vercel will automatically redeploy with new variables.\n');
    console.log('📋 Next steps:\n');
    console.log('1. Wait 2-3 minutes for redeploy');
    console.log('2. Run: npm run post-deploy');
    console.log('3. Verify: npm run verify:prod\n');
  }

  if (failCount > 0) {
    console.log('💡 For failed variables, check:');
    console.log('   - Token permissions');
    console.log('   - Project ID is correct');
    console.log('   - Variable values are valid\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
