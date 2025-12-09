#!/usr/bin/env tsx

/**
 * Complete Vercel Environment Variables Setup
 * Automatically sets all required variables using Vercel CLI
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

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

function loadLocalEnv(): Record<string, string> {
  const envLocalPath = join(process.cwd(), '.env.local');
  const envPath = join(process.cwd(), '.env');

  const env: Record<string, string> = {};

  if (existsSync(envLocalPath)) {
    const content = readFileSync(envLocalPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#')) {
        env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8');
    content.split('\n').forEach((line) => {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !match[1].startsWith('#') && !env[match[1]]) {
        env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });
  }

  return env;
}

function setVercelEnvVar(name: string, value: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Use echo to pipe value to vercel env add
      const command = `echo "${value.replace(/"/g, '\\"')}" | npx vercel env add ${name} production --yes`;
      execSync(command, { stdio: 'pipe', encoding: 'utf-8' });
      resolve(true);
    } catch (error) {
      // Try alternative method
      try {
        // Write to temp file and pipe
        const tempFile = join(process.cwd(), `.temp_${name}.txt`);
        writeFileSync(tempFile, value);
        execSync(`type ${tempFile} | npx vercel env add ${name} production --yes`, {
          stdio: 'pipe',
        });
        require('fs').unlinkSync(tempFile);
        resolve(true);
      } catch {
        resolve(false);
      }
    }
  });
}

async function main() {
  console.log('🚀 Complete Vercel Environment Variables Setup\n');
  console.log('='.repeat(80));
  console.log('');

  // Check Vercel auth
  try {
    execSync('npx vercel whoami', { stdio: 'ignore' });
  } catch {
    console.log('❌ Not logged in to Vercel\n');
    console.log('💡 Please login first:\n');
    console.log('   npx vercel login\n');
    process.exit(1);
  }

  console.log('✅ Vercel authentication verified\n');

  // Load variables
  const localEnv = loadLocalEnv();
  const varsToSet: Array<{ name: string; value: string }> = [];
  const missing: string[] = [];

  REQUIRED_VARS.forEach((varName) => {
    if (localEnv[varName] && localEnv[varName].length > 0) {
      varsToSet.push({ name: varName, value: localEnv[varName] });
    } else {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.log('⚠️  Missing variables in .env.local:\n');
    missing.forEach((v) => console.log(`   - ${v}`));
    console.log('');
    
    if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('💡 Get SUPABASE_SERVICE_ROLE_KEY from:');
      console.log('   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api\n');
    }
    
    console.log('📝 Add missing variables to .env.local, then run this script again.\n');
    
    if (missing.length === REQUIRED_VARS.length) {
      process.exit(1);
    }
  }

  console.log(`📋 Setting ${varsToSet.length} variable(s) in Vercel...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const envVar of varsToSet) {
    process.stdout.write(`Setting ${envVar.name}... `);
    
    try {
      // Use PowerShell on Windows, bash on Unix
      const isWindows = process.platform === 'win32';
      const command = isWindows
        ? `echo ${envVar.value} | npx vercel env add ${envVar.name} production`
        : `echo "${envVar.value}" | npx vercel env add ${envVar.name} production`;
      
      execSync(command, { 
        stdio: 'pipe',
        encoding: 'utf-8',
        shell: isWindows ? 'powershell.exe' : '/bin/bash'
      });
      
      console.log('✅');
      successCount++;
    } catch (error) {
      console.log('❌');
      console.log(`   ⚠️  Could not set automatically. Set manually in Vercel Dashboard.`);
      console.log(`   Value: ${envVar.value.substring(0, 20)}...`);
      failCount++;
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('\n📊 Summary:\n');
  console.log(`✅ Successfully set: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  if (failCount > 0) {
    console.log('💡 For failed variables, set them manually in Vercel Dashboard:\n');
    console.log('   https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n');
  }

  if (successCount > 0) {
    console.log('🔄 Vercel will automatically redeploy with new variables.\n');
    console.log('📋 Next steps:\n');
    console.log('1. Wait 2-3 minutes for redeploy');
    console.log('2. Run: npm run post-deploy');
    console.log('3. Verify: npm run verify:prod\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});

