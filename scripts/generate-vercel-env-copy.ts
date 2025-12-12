#!/usr/bin/env tsx

/**
 * Generate Vercel Environment Variables - Ready to Copy
 * Creates a formatted list of all variables ready to paste into Vercel Dashboard
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

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
        // Remove quotes if present
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

function main() {
  console.log('📋 Generating Vercel Environment Variables - Ready to Copy\n');
  console.log('='.repeat(80));
  console.log('');

  const localEnv = loadLocalEnv();
  const varsToSet: Array<{ name: string; value: string; required: boolean }> = [];
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
    console.log('⚠️  Missing required variables:\n');
    missing.forEach((v) => console.log(`   - ${v}`));
    console.log('');

    if (missing.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('💡 Get SUPABASE_SERVICE_ROLE_KEY from:');
      console.log('   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api');
      console.log('   (Use the NEW rotated service_role key)\n');
    }
  }

  // Generate copy-paste ready file
  let output = '# Vercel Environment Variables - Copy to Dashboard\n\n';
  output +=
    '**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n\n';
  output += '**For each variable:**\n';
  output += '1. Click "Add New"\n';
  output += '2. Enter variable name\n';
  output += '3. Paste the value below\n';
  output += '4. Select environment: **Production**\n';
  output += '5. Click "Save"\n\n';
  output += '---\n\n';

  varsToSet.forEach((envVar) => {
    const status = envVar.required ? '✅ REQUIRED' : '⚠️  OPTIONAL';
    output += `## ${envVar.name} ${status}\n\n`;
    output += '```\n';
    output += `${envVar.value}\n`;
    output += '```\n\n';
  });

  if (missing.length > 0) {
    output += '---\n\n';
    output += '## ⚠️ Missing Variables\n\n';
    missing.forEach((varName) => {
      output += `- **${varName}** - Set manually in Vercel Dashboard\n`;
    });
    output += '\n';
  }

  output += '---\n\n';
  output += '## ✅ After Setting All Variables\n\n';
  output += '1. Vercel will automatically redeploy\n';
  output += '2. Wait 2-3 minutes\n';
  output += '3. Run: `npm run post-deploy`\n';
  output += '4. Verify: `npm run verify:prod`\n';

  const outputPath = join(process.cwd(), 'VERCEL_ENV_COPY_PASTE.md');
  writeFileSync(outputPath, output);

  console.log('✅ Generated file: VERCEL_ENV_COPY_PASTE.md\n');
  console.log('📋 Open this file to copy all values:\n');
  console.log(`   ${outputPath}\n`);
  console.log('='.repeat(80));
  console.log('\n📋 Quick Copy-Paste Values:\n');

  varsToSet.forEach((envVar) => {
    console.log(`${envVar.name}:`);
    console.log(`${envVar.value}`);
    console.log('');
  });

  if (missing.length > 0) {
    console.log('⚠️  Still need to set manually:');
    missing.forEach((v) => console.log(`   - ${v}`));
    console.log('');
  }

  console.log('💡 All values are also saved in: VERCEL_ENV_COPY_PASTE.md\n');
}

main();
