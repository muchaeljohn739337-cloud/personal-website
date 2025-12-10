/**
 * Production Deployment Script
 * Follows steps from DEPLOY.md and PRODUCTION_DEPLOYMENT.md
 */

import { execSync } from 'child_process';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface DeploymentStep {
  name: string;
  command?: string;
  description: string;
  manual?: boolean;
  instructions?: string[];
}

const steps: DeploymentStep[] = [
  {
    name: 'Environment Variables',
    description: 'Verify environment variables are set',
    manual: true,
    instructions: [
      'Check .env.local exists',
      'Verify all required variables from env.example',
      'Ensure production secrets are set (not test keys)',
      'See ENV_SETUP.md for complete list',
    ],
  },
  {
    name: 'Supabase API Schema',
    description: 'Set up api schema for Supabase API access',
    command: 'npm run setup:supabase:api:schema',
    manual: true,
    instructions: [
      'Run: npm run setup:supabase:api:schema',
      'Follow SQL instructions in Supabase Dashboard',
      'Grant permissions: GRANT SELECT ON TABLE api.<table> TO anon',
      'Grant authenticated: GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE api.<table> TO authenticated',
      'See SUPABASE_API_SCHEMA_SETUP.md for details',
    ],
  },
  {
    name: 'Prisma Generate',
    description: 'Generate Prisma client',
    command: 'npm run prisma:generate',
  },
  {
    name: 'Build Project',
    description: 'Build Next.js application',
    command: 'npm run build',
  },
  {
    name: 'Database Migrations',
    description: 'Run database migrations',
    command: 'npm run migrate:prod',
    manual: true,
    instructions: [
      'Ensure DATABASE_URL is set correctly',
      'Run: npm run migrate:prod',
      'Or: npx prisma migrate deploy',
      'Verify migrations completed successfully',
    ],
  },
  {
    name: 'Pre-Production Checks',
    description: 'Run pre-production validation',
    command: 'npm run preprod:check',
  },
  {
    name: 'Deploy to Vercel',
    description: 'Deploy to Vercel production',
    command: 'npm run deploy:prod',
    manual: true,
    instructions: [
      'Ensure VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID are set',
      'Or deploy via Vercel Dashboard',
      'Set all environment variables in Vercel Dashboard',
      'See PRODUCTION_DEPLOYMENT.md for details',
    ],
  },
  {
    name: 'Verify Deployment',
    description: 'Verify deployment is healthy',
    command: 'npm run verify:prod',
  },
];

function checkEnvironmentVariables() {
  console.log('🔍 Checking environment variables...\n');

  const required = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET'];

  const missing: string[] = [];

  required.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((varName) => console.error(`   - ${varName}`));
    console.error('\n💡 Set these in .env.local or production environment');
    return false;
  }

  console.log('✅ All required environment variables are set\n');
  return true;
}

function runDeployment() {
  console.log('🚀 Production Deployment Script\n');
  console.log('='.repeat(60));
  console.log('');

  // Check environment
  if (!checkEnvironmentVariables()) {
    console.error('❌ Environment check failed. Please fix and retry.');
    process.exit(1);
  }

  // Run steps
  steps.forEach((step, index) => {
    console.log(`\n[${index + 1}/${steps.length}] ${step.name}`);
    console.log('─'.repeat(60));
    console.log(`📋 ${step.description}\n`);

    if (step.manual) {
      console.log('⚠️  Manual step - follow instructions:');
      if (step.instructions) {
        step.instructions.forEach((instruction, i) => {
          console.log(`   ${i + 1}. ${instruction}`);
        });
      }
      console.log('');
      if (step.command) {
        console.log(`💡 Command: ${step.command}`);
        console.log('   (Run this command manually)\n');
      }
    } else if (step.command) {
      try {
        console.log(`▶️  Running: ${step.command}\n`);
        execSync(step.command, { stdio: 'inherit' });
        console.log(`\n✅ ${step.name} completed successfully`);
      } catch (error) {
        console.error(`\n❌ ${step.name} failed`);
        console.error('   Error:', error instanceof Error ? error.message : String(error));
        console.error('\n💡 Fix the error and retry this step');
        process.exit(1);
      }
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Deployment steps completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Monitor deployment logs');
  console.log('   2. Test production endpoints');
  console.log('   3. Verify health check: npm run verify:prod');
  console.log('   4. Check Supabase Dashboard for API access');
  console.log('   5. Monitor error tracking (Sentry)');
  console.log('');
}

// Run deployment
runDeployment();
