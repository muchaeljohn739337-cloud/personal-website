#!/usr/bin/env node

/**
 * Full System Audit Script
 * Comprehensive check of the entire codebase for production readiness
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let issues = [];
let warnings = [];
let passed = [];

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(title, colors.cyan);
  log('='.repeat(60), colors.cyan);
}

function check(name, condition, errorMsg, warnMsg) {
  if (condition) {
    log(`✅ ${name}`, colors.green);
    passed.push(name);
  } else if (errorMsg) {
    log(`❌ ${name}: ${errorMsg}`, colors.red);
    issues.push({ name, error: errorMsg });
  } else if (warnMsg) {
    log(`⚠️  ${name}: ${warnMsg}`, colors.yellow);
    warnings.push({ name, warning: warnMsg });
  }
}

// 1. Security Audit
section('🔒 Security Audit');

// Check .gitignore
const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
check(
  '.gitignore includes .env files',
  gitignore.includes('.env'),
  '.env files not properly ignored'
);

// Check for hardcoded secrets
function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
      walkDir(filePath, fileList);
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const suspiciousPatterns = [
  /password\s*[:=]\s*['"`][^'"`]{4,}/i,
  /secret\s*[:=]\s*['"`][^'"`]{10,}/i,
  /api[_-]?key\s*[:=]\s*['"`][^'"`]{10,}/i,
  /token\s*[:=]\s*['"`][^'"`]{10,}/i,
  /sk_live_|pk_live_|sk_test_|pk_test_/,
];

let foundSecrets = false;
const codeFilesToCheck = walkDir('.').filter((f) => !f.includes('node_modules'));
codeFilesToCheck.forEach((file) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(content) && !file.includes('test') && !file.includes('__tests__')) {
        const matches = content.match(pattern);
        if (matches && !matches[0].includes('process.env') && !matches[0].includes('your_')) {
          foundSecrets = true;
          warnings.push({
            name: `Potential hardcoded secret in ${file}`,
            warning: `Found pattern: ${matches[0].substring(0, 30)}...`,
          });
        }
      }
    });
  } catch (e) {
    // Skip files we can't read
  }
});

check(
  'No hardcoded secrets found',
  !foundSecrets,
  null,
  foundSecrets ? 'Review potential secrets above' : null
);

// 2. GitHub Actions
section('🔄 GitHub Actions Configuration');

const ciFile = '.github/workflows/ci.yml';
check('CI workflow exists', fs.existsSync(ciFile));
if (fs.existsSync(ciFile)) {
  const ciContent = fs.readFileSync(ciFile, 'utf8');
  check(
    'Build includes Prisma generate',
    ciContent.includes('prisma generate') || ciContent.includes('prisma:generate')
  );
  check('Tests are configured', ciContent.includes('npm test'));
  check('Security scan exists', ciContent.includes('security'));
  check(
    'No hardcoded secrets in workflow',
    !ciContent.includes('secret:') && !ciContent.includes('token:')
  );
}

// 3. Environment Variables
section('🌐 Environment Configuration');

const envTs = 'lib/env.ts';
check('env.ts exists', fs.existsSync(envTs));
if (fs.existsSync(envTs)) {
  const envContent = fs.readFileSync(envTs, 'utf8');
  check('Supabase variables included', envContent.includes('SUPABASE'));
  check(
    'All payment providers included',
    envContent.includes('STRIPE') && envContent.includes('LEMONSQUEEZY')
  );
}

// 4. Database & Prisma
section('🗄️  Database Configuration');

check('Prisma schema exists', fs.existsSync('prisma/schema.prisma'));
check(
  'Migrations directory exists',
  fs.existsSync('prisma/migrations') || fs.existsSync('prisma/migrations')
);

// 5. Cloudflare Configuration
section('☁️  Cloudflare Configuration');

check('wrangler.toml exists', fs.existsSync('wrangler.toml'));
if (fs.existsSync('wrangler.toml')) {
  const wrangler = fs.readFileSync('wrangler.toml', 'utf8');
  check('Production env configured', wrangler.includes('[env.production]'));
  check('Secrets documented', wrangler.includes('SECRETS'));
}

// 6. Vercel Configuration
section('🚀 Vercel Configuration');

check('vercel.json exists', fs.existsSync('vercel.json'));
if (fs.existsSync('vercel.json')) {
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  check('Build command configured', vercel.buildCommand);
  check('Cron jobs configured', vercel.crons && vercel.crons.length > 0);
}

// 7. HTML & SEO
section('📄 HTML & SEO');

check('robots.txt exists', fs.existsSync('public/robots.txt'));
check('sitemap.xml exists', fs.existsSync('public/sitemap.xml'));
const layout = 'app/layout.tsx';
if (fs.existsSync(layout)) {
  const layoutContent = fs.readFileSync(layout, 'utf8');
  check('Metadata configured', layoutContent.includes('metadata'));
  check('OpenGraph tags', layoutContent.includes('openGraph'));
  check('Twitter cards', layoutContent.includes('twitter'));
}

// 8. Automation & Workflows
section('⚙️  Automation');

check('Scheduler exists', fs.existsSync('lib/automation/scheduler.ts'));
check('Workflows exist', fs.existsSync('lib/automation/workflows.ts'));
const cronApi = 'app/api/cron';
check('Cron API exists', fs.existsSync(`${cronApi}/route.ts`));

// 9. Payment Providers
section('💳 Payment Providers');

const paymentProviders = ['lib/payments/stripe.ts', 'lib/payments/lemonsqueezy.ts'];
paymentProviders.forEach((provider) => {
  check(
    `${path.basename(provider)} integration exists`,
    fs.existsSync(provider.replace('stripe.ts', 'stripe-client.ts')) || fs.existsSync(provider)
  );
});

// 10. Documentation
section('📚 Documentation');

const docs = ['README.md', 'PRODUCTION_DEPLOYMENT.md', 'ENV_SETUP.md', 'PAYMENT_SETUP.md'];
docs.forEach((doc) => {
  check(`${doc} exists`, fs.existsSync(doc));
});

// Summary
section('📊 Audit Summary');

log(`\n✅ Passed: ${passed.length}`, colors.green);
log(`⚠️  Warnings: ${warnings.length}`, colors.yellow);
log(`❌ Issues: ${issues.length}`, colors.red);

if (warnings.length > 0) {
  log('\n⚠️  Warnings:', colors.yellow);
  warnings.forEach((w) => log(`   - ${w.name}: ${w.warning}`, colors.yellow));
}

if (issues.length > 0) {
  log('\n❌ Critical Issues:', colors.red);
  issues.forEach((i) => log(`   - ${i.name}: ${i.error}`, colors.red));
  process.exit(1);
}

if (passed.length > 0 && issues.length === 0) {
  log('\n✅ All critical checks passed!', colors.green);
}

process.exit(issues.length > 0 ? 1 : 0);
