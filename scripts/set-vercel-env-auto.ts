#!/usr/bin/env tsx

/**
 * Automatically Set Vercel Environment Variables
 * Uses Vercel CLI to set all required environment variables
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
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

interface EnvVar {
  name: string;
  value: string;
  required: boolean;
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

function checkVercelAuth(): boolean {
  try {
    execSync('npx vercel whoami', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function setVercelEnvVar(name: string, value: string, environment: string = 'production'): boolean {
  try {
    // Use Vercel CLI to set environment variable
    // Note: Vercel CLI doesn't have a direct command to set env vars
    // We'll use the API approach or provide instructions

    console.log(`   Setting ${name} for ${environment}...`);

    // Try using vercel env add (interactive, but we can pipe the value)
    const command = `echo "${value}" | npx vercel env add ${name} ${environment}`;

    try {
      execSync(command, {
        stdio: 'pipe',
        input: value,
        encoding: 'utf-8',
      });
      return true;
    } catch (error) {
      // If that doesn't work, provide manual instructions
      console.log(`   ⚠️  Could not set automatically. Manual step required.`);
      return false;
    }
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔧 Automatically Setting Vercel Environment Variables\n');
  console.log('='.repeat(80));
  console.log('');

  // Check Vercel authentication
  if (!checkVercelAuth()) {
    console.log('❌ Not logged in to Vercel\n');
    console.log('💡 Please login first:\n');
    console.log('   npx vercel login\n');
    process.exit(1);
  }

  console.log('✅ Vercel authentication verified\n');

  // Load local environment variables
  console.log('📝 Loading environment variables from .env.local...\n');
  const localEnv = loadLocalEnv();

  // Check which variables are available
  const varsToSet: EnvVar[] = [];
  const missingVars: string[] = [];

  REQUIRED_VARS.forEach((varName) => {
    if (localEnv[varName]) {
      varsToSet.push({
        name: varName,
        value: localEnv[varName],
        required: true,
      });
    } else {
      missingVars.push(varName);
    }
  });

  OPTIONAL_VARS.forEach((varName) => {
    if (localEnv[varName]) {
      varsToSet.push({
        name: varName,
        value: localEnv[varName],
        required: false,
      });
    }
  });

  if (missingVars.length > 0) {
    console.log('⚠️  Missing required variables in .env.local:\n');
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log('');
    console.log('💡 Please set these in .env.local first, then run this script again.\n');

    if (missingVars.includes('DATABASE_URL')) {
      console.log('📋 DATABASE_URL format:');
      console.log('   postgresql://user:password@host:port/database?sslmode=require\n');
    }

    if (missingVars.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      console.log('📋 SUPABASE_SERVICE_ROLE_KEY:');
      console.log(
        '   Get from: https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/settings/api'
      );
      console.log('   Use the NEW rotated service_role key\n');
    }
  }

  if (varsToSet.length === 0) {
    console.log('❌ No variables to set. Please add them to .env.local first.\n');
    process.exit(1);
  }

  console.log(`📋 Found ${varsToSet.length} variable(s) to set:\n`);
  varsToSet.forEach((envVar) => {
    const status = envVar.required ? '✅' : '⚠️ ';
    console.log(`${status} ${envVar.name}`);
  });
  console.log('');

  // Note: Vercel CLI doesn't support non-interactive env var setting
  // We'll generate a script with the values instead
  console.log('⚠️  Vercel CLI requires interactive input for security.\n');
  console.log('📝 Generating setup script with your values...\n');

  // Generate a script file
  const scriptContent = `#!/bin/bash
# Auto-generated Vercel Environment Variables Setup Script
# Run this script to set all environment variables in Vercel

echo "🔧 Setting Vercel Environment Variables..."
echo ""

${varsToSet
  .map(
    (envVar) => `echo "Setting ${envVar.name}..."
echo "${envVar.value}" | npx vercel env add ${envVar.name} production
echo ""
`
  )
  .join('')}

echo "✅ All variables set!"
echo ""
echo "📋 Next steps:"
echo "1. Run: npm run deploy:prod:safe"
echo "2. Run: npm run post-deploy"
`;

  const scriptPath = join(process.cwd(), 'scripts', 'set-vercel-env.sh');
  require('fs').writeFileSync(scriptPath, scriptContent);

  // Make it executable (Unix)
  try {
    execSync(`chmod +x ${scriptPath}`, { stdio: 'ignore' });
  } catch {
    // Windows doesn't need chmod
  }

  console.log('✅ Generated setup script: scripts/set-vercel-env.sh\n');
  console.log('📋 To set variables, run:\n');
  console.log('   bash scripts/set-vercel-env.sh\n');
  console.log('   OR (on Windows with Git Bash):\n');
  console.log('   bash scripts/set-vercel-env.sh\n');
  console.log('');

  // Also create a PowerShell version for Windows
  const psScriptContent = `# Auto-generated Vercel Environment Variables Setup Script (PowerShell)
# Run this script to set all environment variables in Vercel

Write-Host "🔧 Setting Vercel Environment Variables..." -ForegroundColor Cyan
Write-Host ""

${varsToSet
  .map(
    (envVar) => `Write-Host "Setting ${envVar.name}..." -ForegroundColor Yellow
"${envVar.value}" | npx vercel env add ${envVar.name} production
Write-Host ""
`
  )
  .join('')}

Write-Host "✅ All variables set!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run deploy:prod:safe"
Write-Host "2. Run: npm run post-deploy"
`;

  const psScriptPath = join(process.cwd(), 'scripts', 'set-vercel-env.ps1');
  require('fs').writeFileSync(psScriptPath, psScriptContent);

  console.log('✅ Also generated PowerShell script: scripts/set-vercel-env.ps1\n');
  console.log('📋 Or run (PowerShell):\n');
  console.log('   .\\scripts\\set-vercel-env.ps1\n');
  console.log('');

  // Alternative: Create a simple Node script that uses Vercel API
  console.log('💡 Alternative: Use Vercel Dashboard\n');
  console.log('   1. Go to: https://vercel.com/dashboard');
  console.log('   2. Select project: personal-website');
  console.log('   3. Settings → Environment Variables');
  console.log('   4. Add each variable manually\n');

  console.log('📋 Variables to set:\n');
  varsToSet.forEach((envVar) => {
    const maskedValue =
      envVar.value.length > 20
        ? `${envVar.value.substring(0, 10)}...${envVar.value.substring(envVar.value.length - 10)}`
        : envVar.value;
    console.log(`   ${envVar.name}=${maskedValue}`);
  });
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
