/**
 * Production Environment Error Checker
 * Identifies and reports production environment issues
 */

import { validateEnv } from '../lib/env';

interface ProductionError {
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  category: string;
  message: string;
  solution?: string;
}

const errors: ProductionError[] = [];

function addError(
  type: ProductionError['type'],
  category: string,
  message: string,
  solution?: string
) {
  errors.push({ type, category, message, solution });
}

// Check environment variables
function checkEnvironmentVariables() {
  try {
    validateEnv();
    console.log('✅ Environment variables validated');
  } catch (error) {
    if (error instanceof Error && 'missingVars' in error) {
      const envError = error as { message: string; missingVars: string[] };
      addError(
        'CRITICAL',
        'Environment Variables',
        `Missing required environment variables: ${envError.missingVars.join(', ')}`,
        'Set all required environment variables in your deployment platform (Vercel, etc.)'
      );
    } else {
      addError(
        'CRITICAL',
        'Environment Variables',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Check production-specific variables
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    addError(
      'WARNING',
      'Environment Variables',
      'NEXT_PUBLIC_APP_URL is not set',
      'Set NEXT_PUBLIC_APP_URL to your production domain (e.g., https://advanciapayledger.com)'
    );
  }

  if (!process.env.NEXTAUTH_URL) {
    addError(
      'WARNING',
      'Environment Variables',
      'NEXTAUTH_URL is not set',
      'Set NEXTAUTH_URL to your production domain (e.g., https://advanciapayledger.com)'
    );
  }

  // Check database connection
  if (!process.env.DATABASE_URL) {
    addError(
      'CRITICAL',
      'Database',
      'DATABASE_URL is not set',
      'Set DATABASE_URL in your deployment platform environment variables'
    );
  } else if (
    process.env.DATABASE_URL.includes('localhost') ||
    process.env.DATABASE_URL.includes('127.0.0.1')
  ) {
    addError(
      'CRITICAL',
      'Database',
      'DATABASE_URL points to localhost (not production database)',
      'Update DATABASE_URL to point to your production database'
    );
  }

  // Check secrets
  const requiredSecrets = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'SESSION_SECRET'];
  for (const secret of requiredSecrets) {
    if (!process.env[secret]) {
      addError(
        'CRITICAL',
        'Secrets',
        `${secret} is not set`,
        `Generate and set ${secret} in production`
      );
    } else if (process.env[secret]!.length < 32) {
      addError(
        'WARNING',
        'Secrets',
        `${secret} is too short (should be at least 32 characters)`,
        `Generate a longer ${secret}`
      );
    }
  }
}

// Check API endpoints
async function checkAPIEndpoints() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const endpoints = ['/api/health', '/api/health/legitimacy'];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      if (!response.ok) {
        addError(
          'WARNING',
          'API Endpoints',
          `${endpoint} returned ${response.status}`,
          `Check the implementation of ${endpoint}`
        );
      }
    } catch (error) {
      if (baseUrl.includes('localhost')) {
        // Skip localhost checks in production
        continue;
      }
      addError(
        'WARNING',
        'API Endpoints',
        `Failed to reach ${endpoint}`,
        'Check network connectivity and deployment status'
      );
    }
  }
}

// Check database connection
async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return;
  }

  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    console.log('✅ Database connection successful');
  } catch (error) {
    addError(
      'CRITICAL',
      'Database',
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'Check DATABASE_URL and ensure the database is accessible from your deployment platform'
    );
  }
}

// Check payment providers
function checkPaymentProviders() {
  const providers = {
    Stripe: {
      key: 'STRIPE_SECRET_KEY',
      publishable: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      webhook: 'STRIPE_WEBHOOK_SECRET',
    },
    LemonSqueezy: {
      key: 'LEMONSQUEEZY_API_KEY',
      store: 'LEMONSQUEEZY_STORE_ID',
      webhook: 'LEMONSQUEEZY_WEBHOOK_SECRET',
    },
    NOWPayments: {
      key: 'NOWPAYMENTS_API_KEY',
      ipn: 'NOWPAYMENTS_IPN_SECRET',
    },
    AlchemyPay: {
      appId: 'ALCHEMY_PAY_APP_ID',
      secret: 'ALCHEMY_PAY_APP_SECRET',
    },
  };

  let hasPaymentProvider = false;

  for (const [provider, vars] of Object.entries(providers)) {
    const hasKey = Object.values(vars).some((varName) => process.env[varName]);
    if (hasKey) {
      hasPaymentProvider = true;
      // Check if using test keys in production
      if (provider === 'Stripe') {
        if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
          addError(
            'WARNING',
            'Payment Providers',
            'Stripe test keys detected in production',
            'Use live Stripe keys (sk_live_*) in production'
          );
        }
      }
    }
  }

  if (!hasPaymentProvider) {
    addError(
      'WARNING',
      'Payment Providers',
      'No payment providers configured',
      'Configure at least one payment provider for production'
    );
  }
}

// Check monitoring
function checkMonitoring() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN && !process.env.NEXT_PUBLIC_LOGROCKET_APP_ID) {
    addError(
      'INFO',
      'Monitoring',
      'No error monitoring configured',
      'Consider setting up Sentry or LogRocket for production error tracking'
    );
  }
}

// Main execution
async function checkProductionErrors() {
  console.log('🔍 Checking Production Environment Errors...\n');

  checkEnvironmentVariables();
  await checkDatabaseConnection();
  checkPaymentProviders();
  checkMonitoring();
  await checkAPIEndpoints();

  // Report results
  console.log('\n📊 Production Error Report\n');
  console.log('='.repeat(60));

  const critical = errors.filter((e) => e.type === 'CRITICAL');
  const warnings = errors.filter((e) => e.type === 'WARNING');
  const info = errors.filter((e) => e.type === 'INFO');

  if (critical.length > 0) {
    console.log(`\n❌ CRITICAL ERRORS (${critical.length}):\n`);
    critical.forEach((error, i) => {
      console.log(`${i + 1}. [${error.category}] ${error.message}`);
      if (error.solution) {
        console.log(`   Solution: ${error.solution}`);
      }
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.forEach((error, i) => {
      console.log(`${i + 1}. [${error.category}] ${error.message}`);
      if (error.solution) {
        console.log(`   Solution: ${error.solution}`);
      }
    });
  }

  if (info.length > 0) {
    console.log(`\nℹ️  INFO (${info.length}):\n`);
    info.forEach((error, i) => {
      console.log(`${i + 1}. [${error.category}] ${error.message}`);
      if (error.solution) {
        console.log(`   Solution: ${error.solution}`);
      }
    });
  }

  if (errors.length === 0) {
    console.log('\n✅ No production errors found!');
  }

  console.log('\n' + '='.repeat(60));

  // Exit with error code if critical issues found
  if (critical.length > 0) {
    console.log('\n❌ Production deployment should not proceed with critical errors.');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️  Production deployment can proceed, but please review warnings.');
    process.exit(0);
  } else {
    console.log('\n✅ Production environment is ready!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  checkProductionErrors().catch((error) => {
    console.error('Error checking production environment:', error);
    process.exit(1);
  });
}

export { checkProductionErrors };
