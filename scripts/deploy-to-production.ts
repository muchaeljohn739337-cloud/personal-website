#!/usr/bin/env tsx
/**
 * Deploy to Production
 * Comprehensive deployment script with pre-checks
 */

import { execSync } from 'child_process';

console.log('🚀 Production Deployment Script\n');
console.log('='.repeat(80));
console.log('\n⚠️  IMPORTANT: Ensure environment variables are set in Vercel!\n');
console.log('='.repeat(80));

// Step 1: Check Vercel login
console.log('\n1️⃣ Checking Vercel authentication...');
try {
  const whoami = execSync('npx vercel whoami', { encoding: 'utf-8', stdio: 'pipe' });
  console.log(`   ✅ Logged in as: ${whoami.trim()}\n`);
} catch (error) {
  console.log('   ❌ Not logged in to Vercel\n');
  console.log('   💡 Run: npx vercel login\n');
  process.exit(1);
}

// Step 2: Check if environment variables guide was run
console.log('2️⃣ Checking environment variables setup...');
console.log("   ⚠️  Make sure you've set all required variables in Vercel Dashboard");
console.log("   💡 Run: npm run setup:vercel-env to see what's needed\n");

// Step 3: Build check
console.log('3️⃣ Running pre-deployment checks...');
try {
  console.log('   Checking build...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('   ✅ Build successful\n');
} catch (error) {
  console.log('   ❌ Build failed\n');
  process.exit(1);
}

// Step 4: Deploy
console.log('4️⃣ Deploying to production...');
console.log('   This may take a few minutes...\n');

try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
  console.log('\n✅ Deployment successful!\n');
  console.log('='.repeat(80));
  console.log('\n📋 Next Steps:\n');
  console.log('1. Verify deployment: npm run verify:prod');
  console.log('2. Test admin login: https://advanciapayledger.com/auth/login');
  console.log('3. Check Vercel dashboard for deployment status\n');
} catch (error) {
  console.log('\n❌ Deployment failed\n');
  console.log('💡 Check the error messages above and fix any issues\n');
  process.exit(1);
}
