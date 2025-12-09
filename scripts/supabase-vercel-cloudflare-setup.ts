/**
 * Complete Supabase + Vercel + Cloudflare Deployment Setup
 * Automatically configures project for production deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: join(process.cwd(), '.env.local') });

interface SetupResult {
  category: string;
  step: string;
  status: 'success' | 'failed' | 'skipped' | 'pending';
  message: string;
  details?: string[];
}

const results: SetupResult[] = [];

// =============================================================================
// 1. DETECT PROJECT ENVIRONMENT
// =============================================================================

function detectEnvironment() {
  console.log('🔍 Step 1: Detecting Project Environment...\n');

  const env = {
    type: 'Next.js',
    framework: 'Next.js',
    language: 'TypeScript',
    packageManager: 'npm',
    nodeVersion: process.version,
    hasPrisma: existsSync('prisma/schema.prisma'),
    hasVercel: existsSync('vercel.json'),
    hasCloudflare: existsSync('wrangler.toml'),
    hasSupabase: existsSync('supabase/config.toml'),
  };

  if (existsSync('yarn.lock')) {
    env.packageManager = 'yarn';
  } else if (existsSync('pnpm-lock.yaml')) {
    env.packageManager = 'pnpm';
  }

  console.log('📋 Detected:');
  console.log(`   Framework: ${env.framework}`);
  console.log(`   Language: ${env.language}`);
  console.log(`   Package Manager: ${env.packageManager}`);
  console.log(`   Node.js: ${env.nodeVersion}`);
  console.log(`   Prisma: ${env.hasPrisma ? 'Yes' : 'No'}`);
  console.log(`   Vercel Config: ${env.hasVercel ? 'Yes' : 'No'}`);
  console.log(`   Cloudflare Config: ${env.hasCloudflare ? 'Yes' : 'No'}`);
  console.log(`   Supabase Config: ${env.hasSupabase ? 'Yes' : 'No'}`);
  console.log('');

  results.push({
    category: 'Environment',
    step: 'Detect Project',
    status: 'success',
    message: `Detected ${env.framework} project with ${env.packageManager}`,
  });

  return env;
}

// =============================================================================
// 2. INSTALL REQUIRED LIBRARIES
// =============================================================================

function installLibraries(env: ReturnType<typeof detectEnvironment>) {
  console.log('📦 Step 2: Installing Required Libraries...\n');

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const required = [
    { name: '@supabase/supabase-js', version: '^2.39.0' },
    { name: '@supabase/ssr', version: '^0.1.0' },
    { name: 'dotenv', version: '^16.3.1' },
  ];

  // Optional chart libraries
  const optional = [
    { name: 'chart.js', version: '^4.4.0' },
    { name: 'recharts', version: '^2.10.0' },
  ];

  const missing = required.filter((pkg) => !allDeps[pkg.name]);
  const missingOptional = optional.filter((pkg) => !allDeps[pkg.name]);

  if (missing.length === 0) {
    console.log('✅ All required libraries installed\n');
    results.push({
      category: 'Libraries',
      step: 'Install Required',
      status: 'success',
      message: 'All required libraries installed',
    });
  } else {
    const packagesToInstall = missing.map((p) => `${p.name}@${p.version}`).join(' ');

    const installCmd =
      env.packageManager === 'yarn'
        ? `yarn add ${packagesToInstall}`
        : env.packageManager === 'pnpm'
          ? `pnpm add ${packagesToInstall}`
          : `npm install ${packagesToInstall}`;

    try {
      console.log(`▶️  Installing: ${packagesToInstall}\n`);
      execSync(installCmd, { stdio: 'inherit' });
      console.log('✅ Required libraries installed\n');
      results.push({
        category: 'Libraries',
        step: 'Install Required',
        status: 'success',
        message: `Installed ${missing.length} packages`,
        details: missing.map((p) => p.name),
      });
    } catch (error) {
      console.error('❌ Installation failed:', error);
      results.push({
        category: 'Libraries',
        step: 'Install Required',
        status: 'failed',
        message: 'Failed to install libraries',
      });
    }
  }

  if (missingOptional.length > 0) {
    console.log('💡 Optional libraries available:');
    missingOptional.forEach((pkg) => {
      console.log(`   - ${pkg.name} (for charts/graphs)`);
    });
    console.log('');
  }
}

// =============================================================================
// 3. INITIALIZE SUPABASE
// =============================================================================

function initializeSupabase() {
  console.log('🔧 Step 3: Initializing Supabase...\n');

  if (existsSync('supabase/config.toml')) {
    console.log('✅ Supabase already initialized\n');
    results.push({
      category: 'Supabase',
      step: 'Initialize',
      status: 'success',
      message: 'Supabase config exists',
    });
    return;
  }

  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('▶️  Running: supabase init\n');
    execSync('supabase init', { stdio: 'inherit' });
    console.log('✅ Supabase initialized\n');
    results.push({
      category: 'Supabase',
      step: 'Initialize',
      status: 'success',
      message: 'Supabase initialized',
    });
  } catch (error) {
    console.log('⚠️  Supabase CLI not found or init failed');
    console.log('💡 Install: npm install -g supabase\n');
    results.push({
      category: 'Supabase',
      step: 'Initialize',
      status: 'skipped',
      message: 'Supabase CLI not available',
      details: ['Install: npm install -g supabase'],
    });
  }
}

// =============================================================================
// 4. SETUP VAULT & ENV VARIABLES
// =============================================================================

function setupVaultAndEnv() {
  console.log('🔐 Step 4: Setting up Vault & Environment Variables...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Create .env.local if needed
  if (!existsSync('.env.local') && existsSync('env.example')) {
    console.log('📝 Creating .env.local from env.example...\n');
    const envExample = readFileSync('env.example', 'utf-8');
    writeFileSync('.env.local', envExample);
    console.log('✅ Created .env.local\n');
  }

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.log('⚠️  Missing environment variables:');
    missing.forEach((varName) => console.log(`   - ${varName}`));
    console.log('');
    console.log('💡 Set these in .env.local or production environment\n');
  } else {
    console.log('✅ All required environment variables are set\n');
  }

  console.log('💡 Vault Secrets Setup:');
  console.log(
    '   https://supabase.com/dashboard/project/xesecqcqzykvmrtxrzqi/integrations/vault/secrets'
  );
  console.log('');

  results.push({
    category: 'Vault',
    step: 'Setup Secrets',
    status: missing.length === 0 ? 'success' : 'pending',
    message:
      missing.length === 0
        ? 'All environment variables set'
        : `${missing.length} variables missing`,
    details: missing.length > 0 ? missing : undefined,
  });
}

// =============================================================================
// 5. CONFIGURE VERCEL DEPLOYMENT
// =============================================================================

function configureVercel() {
  console.log('🚀 Step 5: Configuring Vercel Deployment...\n');

  let vercelConfig: Record<string, unknown> = {};

  if (existsSync('vercel.json')) {
    vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'));
    console.log('✅ vercel.json exists\n');
  }

  // Update/create vercel.json
  const updatedConfig = {
    version: 2,
    buildCommand: 'npm run build',
    devCommand: 'npm run dev',
    installCommand: 'npm install',
    framework: 'nextjs',
    regions: ['iad1'],
    rewrites: [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ],
    headers: [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ],
    domains: ['advanciapayledger.com', 'www.advanciapayledger.com'],
    crons: [
      {
        path: '/api/cron/health-check',
        schedule: '0 * * * *',
      },
    ],
    ...vercelConfig,
  };

  writeFileSync('vercel.json', JSON.stringify(updatedConfig, null, 2));

  console.log('✅ Vercel configuration updated\n');

  // Generate Vercel environment variables list
  const vercelEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'DIRECT_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'JWT_SECRET',
    'SESSION_SECRET',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'RESEND_API_KEY',
  ];

  console.log('💡 Vercel Environment Variables:');
  console.log('   Set these in Vercel Dashboard → Settings → Environment Variables\n');
  vercelEnvVars.forEach((varName) => {
    console.log(`   - ${varName}`);
  });
  console.log('');

  results.push({
    category: 'Vercel',
    step: 'Configure Deployment',
    status: 'success',
    message: 'Vercel configuration updated',
    details: ['vercel.json updated', `${vercelEnvVars.length} env vars needed`],
  });
}

// =============================================================================
// 6. CONFIGURE CLOUDFLARE DEPLOYMENT
// =============================================================================

function configureCloudflare() {
  console.log('☁️  Step 6: Configuring Cloudflare Deployment...\n');

  let wranglerConfig: Record<string, unknown> = {};

  if (existsSync('wrangler.toml')) {
    const wranglerContent = readFileSync('wrangler.toml', 'utf-8');
    console.log('✅ wrangler.toml exists\n');
  }

  // Update/create wrangler.toml
  const updatedWrangler = `# Cloudflare Workers Configuration
# For Next.js deployment via OpenNext

name = "advanciapayledger"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "advanciapayledger"
routes = [
  { pattern = "advanciapayledger.com", zone_name = "advanciapayledger.com" },
  { pattern = "www.advanciapayledger.com", zone_name = "advanciapayledger.com" }
]

# R2 Storage for caching
[[r2_buckets]]
binding = "CACHE"
bucket_name = "advanciapayledger-cache"

# Environment variables (set via wrangler secret put)
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
# SUPABASE_SERVICE_ROLE_KEY
# DATABASE_URL
# NEXTAUTH_SECRET
`;

  writeFileSync('wrangler.toml', updatedWrangler);

  console.log('✅ Cloudflare configuration updated\n');

  // Generate Cloudflare environment variables list
  const cloudflareEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
  ];

  console.log('💡 Cloudflare Environment Variables:');
  console.log('   Set via: wrangler secret put <NAME> --env production\n');
  cloudflareEnvVars.forEach((varName) => {
    console.log(`   wrangler secret put ${varName} --env production`);
  });
  console.log('');

  results.push({
    category: 'Cloudflare',
    step: 'Configure Deployment',
    status: 'success',
    message: 'Cloudflare configuration updated',
    details: ['wrangler.toml updated', `${cloudflareEnvVars.length} secrets needed`],
  });
}

// =============================================================================
// 7. GENERATE DEPLOYMENT SCRIPTS
// =============================================================================

function generateDeploymentScripts(env: ReturnType<typeof detectEnvironment>) {
  console.log('📜 Step 7: Generating Deployment Scripts...\n');

  const scriptsDir = 'scripts/deployment';
  if (!existsSync(scriptsDir)) {
    mkdirSync(scriptsDir, { recursive: true });
  }

  // Vercel deployment script
  const vercelScript = `#!/bin/bash
# Vercel Deployment Script

echo "🚀 Deploying to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "📝 Logging in to Vercel..."
vercel login

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod

echo "✅ Deployment complete!"
echo "💡 Set environment variables in Vercel Dashboard"
`;

  writeFileSync(join(scriptsDir, 'deploy-vercel.sh'), vercelScript);

  // Cloudflare deployment script
  const cloudflareScript = `#!/bin/bash
# Cloudflare Deployment Script

echo "☁️  Deploying to Cloudflare..."

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Build for Cloudflare
echo "🔨 Building for Cloudflare..."
npm run build:worker

# Deploy to Cloudflare Pages/Workers
echo "🚀 Deploying to Cloudflare..."
npx wrangler pages deploy .vercel/output/static --project-name=advanciapayledger

echo "✅ Deployment complete!"
echo "💡 Set secrets via: wrangler secret put <NAME>"
`;

  writeFileSync(join(scriptsDir, 'deploy-cloudflare.sh'), cloudflareScript);

  // Update package.json scripts
  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  if (!packageJson.scripts['deploy:vercel:script']) {
    packageJson.scripts['deploy:vercel:script'] = 'bash scripts/deployment/deploy-vercel.sh';
  }
  if (!packageJson.scripts['deploy:cloudflare:script']) {
    packageJson.scripts['deploy:cloudflare:script'] =
      'bash scripts/deployment/deploy-cloudflare.sh';
  }

  writeFileSync('package.json', JSON.stringify(packageJson, null, 2));

  console.log('✅ Deployment scripts generated:');
  console.log('   - scripts/deployment/deploy-vercel.sh');
  console.log('   - scripts/deployment/deploy-cloudflare.sh\n');

  results.push({
    category: 'Scripts',
    step: 'Generate Scripts',
    status: 'success',
    message: 'Deployment scripts created',
    details: ['deploy-vercel.sh', 'deploy-cloudflare.sh'],
  });
}

// =============================================================================
// 8. CHECK MISSING DEPENDENCIES
// =============================================================================

function checkMissingDependencies(env: ReturnType<typeof detectEnvironment>) {
  console.log('🔍 Step 8: Checking Missing Dependencies...\n');

  const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Common imports to check
  const commonImports = [
    '@supabase/supabase-js',
    '@supabase/ssr',
    'dotenv',
    'chart.js',
    'recharts',
  ];

  const missing = commonImports.filter((dep) => !allDeps[dep]);

  if (missing.length > 0) {
    console.log('⚠️  Potentially missing dependencies:');
    missing.forEach((dep) => console.log(`   - ${dep}`));
    console.log('');
    console.log('💡 Install if needed:\n');
    const installCmd =
      env.packageManager === 'yarn'
        ? `yarn add ${missing.join(' ')}`
        : env.packageManager === 'pnpm'
          ? `pnpm add ${missing.join(' ')}`
          : `npm install ${missing.join(' ')}`;
    console.log(`   ${installCmd}\n`);
  } else {
    console.log('✅ All common dependencies are installed\n');
  }

  results.push({
    category: 'Dependencies',
    step: 'Check Missing',
    status: missing.length === 0 ? 'success' : 'pending',
    message:
      missing.length === 0
        ? 'All dependencies installed'
        : `${missing.length} potentially missing`,
    details: missing.length > 0 ? missing : undefined,
  });
}

// =============================================================================
// 9. OUTPUT SUMMARY
// =============================================================================

function outputSummary() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 DEPLOYMENT SETUP SUMMARY');
  console.log('='.repeat(70) + '\n');

  const categories = ['Environment', 'Libraries', 'Supabase', 'Vault', 'Vercel', 'Cloudflare', 'Scripts', 'Dependencies'];

  categories.forEach((category) => {
    const categoryResults = results.filter((r) => r.category === category);
    if (categoryResults.length > 0) {
      console.log(`\n📁 ${category}:`);
      categoryResults.forEach((result) => {
        const icon =
          result.status === 'success'
            ? '✅'
            : result.status === 'failed'
              ? '❌'
              : result.status === 'pending'
                ? '⏳'
                : '⏭️';
        console.log(`   ${icon} ${result.step}: ${result.message}`);
        if (result.details) {
          result.details.forEach((detail) => {
            console.log(`      - ${detail}`);
          });
        }
      });
    }
  });

  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'failed').length;
  const pending = results.filter((r) => r.status === 'pending').length;

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏳ Pending: ${pending}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('='.repeat(70) + '\n');

  console.log('📝 Next Steps:\n');
  console.log('1. Set Environment Variables:');
  console.log('   - Vercel: Dashboard → Settings → Environment Variables');
  console.log('   - Cloudflare: wrangler secret put <NAME>\n');
  console.log('2. Setup API Schema:');
  console.log('   npm run setup:supabase:api:schema\n');
  console.log('3. Deploy to Vercel:');
  console.log('   npm run deploy:prod');
  console.log('   Or: npm run deploy:vercel:script\n');
  console.log('4. Deploy to Cloudflare:');
  console.log('   npm run deploy:worker:prod');
  console.log('   Or: npm run deploy:cloudflare:script\n');
  console.log('5. Verify Deployment:');
  console.log('   npm run verify:prod\n');
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('🚀 Complete Supabase + Vercel + Cloudflare Setup\n');
  console.log('='.repeat(70));
  console.log('');

  try {
    const env = detectEnvironment();
    installLibraries(env);
    initializeSupabase();
    setupVaultAndEnv();
    configureVercel();
    configureCloudflare();
    generateDeploymentScripts(env);
    checkMissingDependencies(env);
    outputSummary();
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    outputSummary();
    process.exit(1);
  }
}

main();

