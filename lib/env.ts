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

  // Feature flags
  ENABLE_2FA?: string;
  ENABLE_EMAIL_VERIFICATION?: string;
}

const requiredEnvVars = [
  'JWT_SECRET',
  'SESSION_SECRET',
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
] as const;

const recommendedEnvVars = ['NEXTAUTH_URL', 'REDIS_URL', 'SMTP_HOST', 'SMTP_FROM'] as const;

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
    ENABLE_2FA: process.env.ENABLE_2FA,
    ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION,
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
