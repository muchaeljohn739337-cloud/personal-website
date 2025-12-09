#!/usr/bin/env tsx

/**
 * Post-Deployment Verification Script
 * Automatically verifies deployment health and runs migrations
 */

import { execSync } from 'child_process';
import { setTimeout } from 'timers/promises';

const PRODUCTION_URL = 'https://advanciapayledger.com';
const VERCEL_URL = 'https://personal-website-425qil78l-advanciapayledger.vercel.app';
const HEALTH_ENDPOINT = `${PRODUCTION_URL}/api/health`;
const MAX_RETRIES = 10;
const RETRY_DELAY = 30000; // 30 seconds

interface HealthCheckResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}

function checkHealth(): HealthCheckResult {
  try {
    const result = execSync(
      `curl -s -o /dev/null -w "%{http_code}" ${HEALTH_ENDPOINT}`,
      { encoding: 'utf-8', timeout: 10000 }
    );
    const statusCode = parseInt(result.trim(), 10);
    
    if (statusCode === 200) {
      return { success: true, statusCode: 200 };
    } else {
      return { success: false, statusCode, error: `HTTP ${statusCode}` };
    }
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string };
    return {
      success: false,
      error: err.message || 'Connection failed',
    };
  }
}

function checkVercelLogs() {
  try {
    console.log('\n📋 Checking Vercel logs...\n');
    execSync(
      `npx vercel inspect ${VERCEL_URL.replace('https://', '')} --logs`,
      { stdio: 'inherit' }
    );
  } catch (error) {
    console.log('⚠️  Could not fetch logs (this is okay if deployment is new)');
  }
}

async function waitForHealth(): Promise<boolean> {
  console.log('⏳ Waiting for deployment to be healthy...\n');
  console.log(`Checking: ${HEALTH_ENDPOINT}\n`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt}/${MAX_RETRIES}...`);
    
    const result = checkHealth();
    
    if (result.success) {
      console.log(`✅ Health check passed! (HTTP ${result.statusCode})\n`);
      return true;
    } else {
      console.log(`❌ Health check failed: ${result.error || `HTTP ${result.statusCode}`}`);
      
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Waiting ${RETRY_DELAY / 1000} seconds before retry...\n`);
        await setTimeout(RETRY_DELAY);
      }
    }
  }

  return false;
}

function runMigrations(): boolean {
  try {
    console.log('🔄 Running database migrations...\n');
    execSync('npm run migrate:prod', { stdio: 'inherit' });
    console.log('\n✅ Migrations completed successfully!\n');
    return true;
  } catch (error) {
    console.log('\n❌ Migrations failed\n');
    console.log('💡 You may need to run migrations manually:\n');
    console.log('   npm run migrate:prod\n');
    return false;
  }
}

function verifyEnvironmentVariables() {
  console.log('🔍 Verifying environment variables...\n');
  try {
    execSync('npm run verify:vercel:env', { stdio: 'inherit' });
  } catch (error) {
    console.log('\n⚠️  Some environment variables may be missing\n');
    console.log('💡 Set them in Vercel Dashboard:\n');
    console.log('   https://vercel.com/dashboard → Your Project → Settings → Environment Variables\n');
  }
}

async function main() {
  console.log('🚀 Post-Deployment Verification\n');
  console.log('='.repeat(80));
  console.log('');

  // Step 1: Verify environment variables
  verifyEnvironmentVariables();

  // Step 2: Wait for health check
  const isHealthy = await waitForHealth();

  if (!isHealthy) {
    console.log('\n⚠️  Deployment is not responding yet\n');
    console.log('🔍 Based on Vercel logs, the issue is:\n');
    console.log('❌ DATABASE_URL is missing or invalid in Vercel');
    console.log('   Error: "the URL must start with the protocol postgresql:// or postgres://"\n');
    console.log('💡 CRITICAL: Set DATABASE_URL in Vercel Dashboard:\n');
    console.log('   1. Go to: https://vercel.com/dashboard');
    console.log('   2. Select project: personal-website');
    console.log('   3. Settings → Environment Variables');
    console.log('   4. Add DATABASE_URL with your production database URL');
    console.log('   5. Format: postgresql://user:password@host:port/database');
    console.log('   6. Select "Production" environment');
    console.log('   7. Save and redeploy\n');
    console.log('📋 Also verify these are set:');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY (NEW rotated key)');
    console.log('   - JWT_SECRET');
    console.log('   - SESSION_SECRET');
    console.log('   - NEXTAUTH_SECRET');
    console.log('   - NEXT_PUBLIC_APP_URL');
    console.log('   - NEXTAUTH_URL\n');
    
    // Still try to check logs
    checkVercelLogs();
    process.exit(1);
  }

  // Step 3: Check logs (optional)
  console.log('📋 Checking recent logs...\n');
  checkVercelLogs();

  // Step 4: Run migrations
  const migrationsSuccess = runMigrations();

  // Summary
  console.log('='.repeat(80));
  console.log('\n📊 Post-Deployment Summary:\n');
  console.log(`✅ Health Check: ${isHealthy ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Migrations: ${migrationsSuccess ? 'COMPLETED' : 'FAILED'}`);
  console.log('');

  if (isHealthy && migrationsSuccess) {
    console.log('🎉 Deployment verification complete!\n');
    console.log('✅ Your application is live and ready:\n');
    console.log(`   Production: ${PRODUCTION_URL}`);
    console.log(`   Vercel URL: ${VERCEL_URL}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Test registration: https://advanciapayledger.com/auth/register');
    console.log('2. Test login: https://advanciapayledger.com/auth/login');
    console.log('3. Check admin panel (if applicable)');
    console.log('4. Monitor Vercel Dashboard for any issues\n');
  } else {
    console.log('⚠️  Some verification steps failed. Review errors above.\n');
  }
}

main().catch((error) => {
  console.error('\n❌ Verification script failed:', error);
  process.exit(1);
});

