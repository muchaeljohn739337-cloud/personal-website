/**
 * Environment Variable Validation
 * Ensures all required secrets are set before the application starts
 */

interface EnvConfig {
  // Required secrets
  JWT_SECRET: string;
  SESSION_SECRET: string;
  NEXTAUTH_SECRET: string;
  DATABASE_URL: string;
  DIRECT_URL?: string; // Direct database connection for migrations

  // Optional but recommended
  NEXTAUTH_URL?: string;
  REDIS_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASSWORD?: string;
  SMTP_FROM?: string;

  // OAuth (optional)
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;

  // Payment Providers - Stripe
  STRIPE_SECRET_KEY?: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;

  // Payment Providers - LemonSqueezy
  LEMONSQUEEZY_API_KEY?: string;
  LEMONSQUEEZY_STORE_ID?: string;
  LEMONSQUEEZY_WEBHOOK_SECRET?: string;

  // Payment Providers - NOWPayments
  NOWPAYMENTS_API_KEY?: string;
  NOWPAYMENTS_IPN_SECRET?: string;

  // Payment Providers - Alchemy Pay
  ALCHEMY_PAY_API_URL?: string;
  ALCHEMY_PAY_APP_ID?: string;
  ALCHEMY_PAY_APP_SECRET?: string;

  // Supabase Storage & Database
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Feature flags
  ENABLE_2FA?: string;
  ENABLE_EMAIL_VERIFICATION?: string;

  // Public URLs
  NEXT_PUBLIC_APP_URL?: string;

  // Monitoring & Analytics
  NEXT_PUBLIC_SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
  SENTRY_AUTH_TOKEN?: string;
  NEXT_PUBLIC_SENTRY_DEBUG?: string;
  NEXT_PUBLIC_APP_VERSION?: string;
  // LogRocket
  NEXT_PUBLIC_LOGROCKET_APP_ID?: string;

  // Cron Jobs
  CRON_SECRET?: string;
}

const requiredEnvVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
] as const;

const recommendedEnvVars = [
  'NEXTAUTH_URL',
  'REDIS_URL',
  'SMTP_HOST',
  'SMTP_FROM',
  'CRON_SECRET',
] as const;

class EnvironmentError extends Error {
  constructor(
    message: string,
    public missingVars: string[]
  ) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validate that all required environment variables are set
 * Call this at application startup
 */
export function validateEnv(): EnvConfig {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check recommended variables
  for (const varName of recommendedEnvVars) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Log warnings for missing recommended vars
  if (warnings.length > 0 && process.env.NODE_ENV !== 'test') {
    console.warn(`⚠️  Missing recommended environment variables: ${warnings.join(', ')}`);
  }

  // Throw error for missing required vars
  if (missing.length > 0) {
    const errorMessage = `
╔══════════════════════════════════════════════════════════════╗
║                    SECURITY CONFIGURATION ERROR              ║
╠══════════════════════════════════════════════════════════════╣
║  The following required environment variables are missing:   ║
${missing.map((v) => `║  • ${v.padEnd(56)}║`).join('\n')}
╠══════════════════════════════════════════════════════════════╣
║  Please set these variables in your .env file or             ║
║  environment before starting the application.                ║
╚══════════════════════════════════════════════════════════════╝
`;
    if (process.env.NODE_ENV === 'production') {
      throw new EnvironmentError(errorMessage, missing);
    } else {
      console.error(errorMessage);
    }
  }

  return {
    JWT_SECRET: process.env.JWT_SECRET!,
    SESSION_SECRET: process.env.SESSION_SECRET!,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
    DATABASE_URL: process.env.DATABASE_URL!,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    REDIS_URL: process.env.REDIS_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM: process.env.SMTP_FROM,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY,
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID,
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY,
    NOWPAYMENTS_IPN_SECRET: process.env.NOWPAYMENTS_IPN_SECRET,
    ALCHEMY_PAY_API_URL: process.env.ALCHEMY_PAY_API_URL,
    ALCHEMY_PAY_APP_ID: process.env.ALCHEMY_PAY_APP_ID,
    ALCHEMY_PAY_APP_SECRET: process.env.ALCHEMY_PAY_APP_SECRET,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ENABLE_2FA: process.env.ENABLE_2FA,
    ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    CRON_SECRET: process.env.CRON_SECRET,
  };
}

/**
 * Get a specific environment variable with type safety
 */
export function getEnv<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
  return process.env[key] as EnvConfig[K];
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: 'ENABLE_2FA' | 'ENABLE_EMAIL_VERIFICATION'): boolean {
  const value = process.env[feature];
  return value === 'true' || value === '1';
}

/**
 * Check which payment providers are configured
 */
export function getPaymentProviderConfig() {
  return {
    stripe: {
      enabled: !!(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
      hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
      missing: [
        !process.env.STRIPE_SECRET_KEY && 'STRIPE_SECRET_KEY',
        !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        !process.env.STRIPE_WEBHOOK_SECRET && 'STRIPE_WEBHOOK_SECRET (optional)',
      ].filter(Boolean) as string[],
    },
    lemonsqueezy: {
      enabled: !!(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID),
      hasWebhook: !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
      missing: [
        !process.env.LEMONSQUEEZY_API_KEY && 'LEMONSQUEEZY_API_KEY',
        !process.env.LEMONSQUEEZY_STORE_ID && 'LEMONSQUEEZY_STORE_ID',
        !process.env.LEMONSQUEEZY_WEBHOOK_SECRET && 'LEMONSQUEEZY_WEBHOOK_SECRET (optional)',
      ].filter(Boolean) as string[],
    },
    nowpayments: {
      enabled: !!process.env.NOWPAYMENTS_API_KEY,
      hasWebhook: !!process.env.NOWPAYMENTS_IPN_SECRET,
      missing: [
        !process.env.NOWPAYMENTS_API_KEY && 'NOWPAYMENTS_API_KEY',
        !process.env.NOWPAYMENTS_IPN_SECRET && 'NOWPAYMENTS_IPN_SECRET (optional)',
      ].filter(Boolean) as string[],
    },
    alchemypay: {
      enabled: !!(process.env.ALCHEMY_PAY_APP_ID && process.env.ALCHEMY_PAY_APP_SECRET),
      missing: [
        !process.env.ALCHEMY_PAY_APP_ID && 'ALCHEMY_PAY_APP_ID',
        !process.env.ALCHEMY_PAY_APP_SECRET && 'ALCHEMY_PAY_APP_SECRET',
      ].filter(Boolean) as string[],
    },
  };
}

/**
 * Generate secure random secrets for development
 */
export function generateSecrets(): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto');
  console.log('\n🔐 Generated Secure Secrets:\n');
  console.log(`JWT_SECRET=${crypto.randomBytes(64).toString('hex')}`);
  console.log(`SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.log(`NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('hex')}`);
  console.log('\n⚠️  Copy these to your .env file and keep them secure!\n');
}

// Export singleton config
let envConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    envConfig = validateEnv();
  }
  return envConfig;
}
