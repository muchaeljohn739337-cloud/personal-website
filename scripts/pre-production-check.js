#!/usr/bin/env node

/**
 * Pre-Production Deployment Check
 * Validates environment and configuration before production deployment
 */

const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
  hasErrors = true;
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
  hasWarnings = true;
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (major < 20) {
    error(`Node.js 20+ required. Current: ${nodeVersion}`);
  } else {
    success(`Node.js version OK: ${nodeVersion}`);
  }
}

// Check required files
function checkRequiredFiles() {
  const required = ['package.json', 'next.config.mjs', 'prisma/schema.prisma', 'middleware.ts'];

  required.forEach((file) => {
    if (fs.existsSync(file)) {
      success(`${file} exists`);
    } else {
      error(`${file} is missing`);
    }
  });
}

// Check environment variables (from .env.local as reference)
function checkEnvVars() {
  const envFile = '.env.local';
  if (!fs.existsSync(envFile)) {
    warn(`${envFile} not found (OK if using platform env vars)`);
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'SESSION_SECRET',
    'NEXT_PUBLIC_APP_URL',
    'NEXTAUTH_URL',
  ];

  const missing = required.filter((varName) => !envContent.includes(`${varName}=`));

  if (missing.length > 0) {
    warn(`Missing env vars in ${envFile}: ${missing.join(', ')}`);
  } else {
    success('Required env vars found in .env.local');
  }

  // Check for production-specific settings
  if (envContent.includes('NODE_ENV=production')) {
    warn('NODE_ENV is set to production in .env.local (should be in deployment platform)');
  }

  // Check for test keys in production
  if (envContent.includes('sk_test_') || envContent.includes('pk_test_')) {
    warn('Test Stripe keys found (should use live keys in production)');
  }
}

// Check build configuration
function checkBuildConfig() {
  const nextConfig = 'next.config.mjs';
  if (fs.existsSync(nextConfig)) {
    const content = fs.readFileSync(nextConfig, 'utf8');
    if (content.includes('ignoreDuringBuilds: true')) {
      warn('ESLint is ignored during builds');
    }
    if (content.includes('ignoreBuildErrors: true')) {
      warn('TypeScript errors are ignored during builds');
    }
    success('next.config.mjs exists');
  }
}

// Check database migrations
function checkMigrations() {
  const migrationsDir = 'prisma/migrations';
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir);
    if (migrations.length === 0) {
      warn('No database migrations found');
    } else {
      success(`Found ${migrations.length} database migration(s)`);
    }
  } else {
    warn('prisma/migrations directory not found');
  }
}

// Check security configuration
function checkSecurity() {
  // Check middleware exists
  if (fs.existsSync('middleware.ts')) {
    const content = fs.readFileSync('middleware.ts', 'utf8');
    if (content.includes('SECURITY_SHIELD_ENABLED')) {
      success('Security shield configuration found');
    }
  }

  // Check for hardcoded secrets (basic check)
  // This is a simplified check - in real scenario, use tools like truffleHog
  info('Security: Run secret scanning tools before deployment');
}

// Main execution
log('\n🔍 Pre-Production Deployment Check\n', colors.blue);

checkNodeVersion();
log('');
checkRequiredFiles();
log('');
checkEnvVars();
log('');
checkBuildConfig();
log('');
checkMigrations();
log('');
checkSecurity();

// Summary
log('\n📊 Summary\n', colors.blue);

if (hasErrors) {
  error('Deployment blocked: Critical issues found');
  process.exit(1);
} else if (hasWarnings) {
  warn('Deployment can proceed, but please review warnings');
  process.exit(0);
} else {
  success('All checks passed! Ready for production deployment.');
  process.exit(0);
}
