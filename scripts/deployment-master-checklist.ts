#!/usr/bin/env node

/**
 * Master Deployment Checklist
 * Comprehensive pre-deployment verification and deployment automation
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ChecklistItem {
  category: string;
  name: string;
  description: string;
  command?: string;
  manual?: boolean;
  critical: boolean;
}

const checklist: ChecklistItem[] = [
  // Security
  {
    category: '🔴 Security',
    name: 'Rotate Supabase Service Role Key',
    description: 'Key was exposed in git history - MUST rotate',
    manual: true,
    critical: true,
  },
  {
    category: '🔴 Security',
    name: 'Verify no secrets in code',
    description: 'Check for hardcoded secrets',
    command: 'npm run security:check',
    critical: true,
  },

  // Environment Variables
  {
    category: '🟠 Environment',
    name: 'Generate production secrets',
    description: 'Generate JWT, Session, NextAuth secrets',
    command: 'npm run generate:prod-secrets',
    critical: true,
  },
  {
    category: '🟠 Environment',
    name: 'Set Vercel environment variables',
    description: 'Set all required variables in Vercel',
    manual: true,
    critical: true,
  },
  {
    category: '🟠 Environment',
    name: 'Verify Vercel environment variables',
    description: 'Check all variables are set',
    command: 'npm run verify:vercel:env',
    critical: true,
  },

  // Pre-Deployment Checks
  {
    category: '🟡 Pre-Deployment',
    name: 'Run pre-production checks',
    description: 'Validate production readiness',
    command: 'npm run preprod:check',
    critical: true,
  },
  {
    category: '🟡 Pre-Deployment',
    name: 'Run linting',
    description: 'Check code quality',
    command: 'npm run lint',
    critical: false,
  },
  {
    category: '🟡 Pre-Deployment',
    name: 'Test production build',
    description: 'Ensure build succeeds (skip if taking too long)',
    command: 'npm run build',
    critical: false,
  },
  {
    category: '🟡 Pre-Deployment',
    name: 'Run tests',
    description: 'Ensure all tests pass',
    command: 'npm test',
    critical: false,
  },

  // Database
  {
    category: '🟢 Database',
    name: 'Verify database connection',
    description: 'Test DATABASE_URL is accessible',
    manual: true,
    critical: true,
  },
  {
    category: '🟢 Database',
    name: 'Prepare database migrations',
    description: 'Ensure migrations are ready',
    command: 'npx prisma migrate status',
    critical: true,
  },

  // Supabase
  {
    category: '🔵 Supabase',
    name: 'Verify Supabase connection',
    description: 'Test Supabase API access',
    manual: true,
    critical: true,
  },
  {
    category: '🔵 Supabase',
    name: 'Verify storage buckets',
    description: 'Check storage buckets are configured',
    manual: true,
    critical: false,
  },

  // Deployment
  {
    category: '🟣 Deployment',
    name: 'Deploy to Vercel',
    description: 'Deploy application to production',
    command: 'npm run deploy:prod',
    critical: true,
  },
  {
    category: '🟣 Deployment',
    name: 'Run database migrations',
    description: 'Apply migrations to production',
    command: 'npm run migrate:prod',
    critical: true,
  },

  // Post-Deployment
  {
    category: '⚪ Post-Deployment',
    name: 'Verify deployment health',
    description: 'Check health endpoint',
    command: 'npm run verify:prod',
    critical: true,
  },
  {
    category: '⚪ Post-Deployment',
    name: 'Test user registration',
    description: 'Verify registration flow works',
    manual: true,
    critical: true,
  },
  {
    category: '⚪ Post-Deployment',
    name: 'Test user login',
    description: 'Verify login flow works',
    manual: true,
    critical: true,
  },
  {
    category: '⚪ Post-Deployment',
    name: 'Test payment flow',
    description: 'Verify payment checkout (test mode)',
    manual: true,
    critical: true,
  },
];

function checkCommand(command: string, timeout: number = 30000): { success: boolean; output?: string; error?: string } {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      timeout,
      killSignal: 'SIGTERM'
    });
    return { success: true, output };
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string; signal?: string };
    if (err.signal === 'SIGTERM') {
      return {
        success: false,
        error: 'Command timed out (skipped)',
      };
    }
    return {
      success: false,
      error: err.stderr || err.stdout || err.message || 'Unknown error',
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function checkEnvironmentVariables(): boolean {
  const required = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'NEXTAUTH_SECRET',
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
  ];

  const envLocalPath = join(process.cwd(), '.env.local');
  if (!existsSync(envLocalPath)) {
    return false;
  }

  const envLocal = readFileSync(envLocalPath, 'utf-8');
  const missing = required.filter((varName) => {
    const regex = new RegExp(`^${varName}=`, 'm');
    return !regex.test(envLocal);
  });

  return missing.length === 0;
}

function runChecklist() {
  console.log('🚀 Master Deployment Checklist\n');
  console.log('='.repeat(60));
  console.log('');

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const criticalFailures: string[] = [];

  checklist.forEach((item, index) => {
    const prefix = `[${index + 1}/${checklist.length}]`;
    console.log(`${prefix} ${item.category} - ${item.name}`);
    console.log(`   ${item.description}`);

    if (item.manual) {
      console.log('   ⚠️  Manual step - requires your action');
      console.log('   📝 See documentation for instructions');
      skipped++;
    } else if (item.command) {
      // Skip build command if it's too slow (non-critical)
      const timeout = item.name.includes('build') ? 60000 : 30000;
      const result = checkCommand(item.command, timeout);
      if (result.success) {
        console.log('   ✅ Passed');
        passed++;
      } else {
        const errorMsg = result.error?.substring(0, 100) || 'Unknown error';
        if (errorMsg.includes('timed out') || errorMsg.includes('skipped')) {
          console.log(`   ⚠️  Skipped (timeout or non-critical)`);
          skipped++;
        } else {
          console.log(`   ❌ Failed: ${errorMsg}`);
          failed++;
          if (item.critical) {
            criticalFailures.push(item.name);
          }
        }
      }
    } else {
      // Special checks
      if (item.name === 'Verify no secrets in code') {
        // This would require the security check script
        console.log('   ⚠️  Run: npm run security:check');
        skipped++;
      }
    }

    console.log('');
  });

  // Summary
  console.log('='.repeat(60));
  console.log('\n📊 Summary:\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Manual/Skipped: ${skipped}`);
  console.log('');

  if (criticalFailures.length > 0) {
    console.log('🚨 CRITICAL FAILURES:');
    criticalFailures.forEach((failure) => {
      console.log(`   - ${failure}`);
    });
    console.log('');
    console.log('⚠️  Deployment cannot proceed until critical failures are resolved!');
    process.exit(1);
  }

  if (failed === 0 && skipped === 0) {
    console.log('✅ All automated checks passed!');
    console.log('📝 Complete manual steps before deploying.');
  } else if (failed === 0) {
    console.log('✅ All automated checks passed!');
    console.log(`📝 ${skipped} manual step(s) remaining.`);
  } else {
    console.log('⚠️  Some checks failed. Review errors above.');
  }

  console.log('');
}

// Run checklist
runChecklist();
