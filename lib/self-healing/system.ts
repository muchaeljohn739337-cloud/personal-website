/**
 * Self-Healing System
 * Automatically detects and fixes common issues
 * Prevents malfunctions and ensures smooth operation
 */

import { prisma } from '../prismaClient';

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  checks: HealthCheck[];
  autoFixed: AutoFix[];
  timestamp: Date;
}

export interface HealthCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AutoFix {
  issue: string;
  action: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: Date;
}

/**
 * Run comprehensive system health check
 */
export async function runHealthCheck(): Promise<SystemHealth> {
  const checks: HealthCheck[] = [];
  const autoFixed: AutoFix[] = [];

  // Check 1: Database Connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({
      name: 'Database Connection',
      status: 'PASS',
      message: 'Database is accessible',
      severity: 'CRITICAL',
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'FAIL',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'CRITICAL',
    });
  }

  // Check 2: Environment Variables
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'JWT_SECRET', 'SESSION_SECRET'];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length === 0) {
    checks.push({
      name: 'Environment Variables',
      status: 'PASS',
      message: 'All required environment variables are set',
      severity: 'CRITICAL',
    });
  } else {
    checks.push({
      name: 'Environment Variables',
      status: 'FAIL',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
      severity: 'CRITICAL',
    });
  }

  // Check 3: Payment Providers
  const paymentProviders = {
    stripe: !!process.env.STRIPE_SECRET_KEY,
    lemonsqueezy: !!process.env.LEMONSQUEEZY_API_KEY,
    nowpayments: !!process.env.NOWPAYMENTS_API_KEY,
    alchemypay: !!process.env.ALCHEMY_PAY_APP_ID,
  };

  const enabledProviders = Object.values(paymentProviders).filter(Boolean).length;
  if (enabledProviders > 0) {
    checks.push({
      name: 'Payment Providers',
      status: 'PASS',
      message: `${enabledProviders} payment provider(s) configured`,
      severity: 'HIGH',
    });
  } else {
    checks.push({
      name: 'Payment Providers',
      status: 'WARNING',
      message: 'No payment providers configured',
      severity: 'HIGH',
    });
  }

  // Check 4: Orphaned Records
  try {
    const orphanedWallets = await prisma.wallet.count({
      where: {
        userId: null,
        organizationId: null,
      },
    });

    if (orphanedWallets > 0) {
      // Auto-fix: Delete orphaned wallets
      await prisma.wallet.deleteMany({
        where: {
          userId: null,
          organizationId: null,
        },
      });

      autoFixed.push({
        issue: `Found ${orphanedWallets} orphaned wallet(s)`,
        action: 'Deleted orphaned wallets',
        status: 'SUCCESS',
        timestamp: new Date(),
      });

      checks.push({
        name: 'Orphaned Records',
        status: 'PASS',
        message: `Fixed ${orphanedWallets} orphaned wallet(s)`,
        severity: 'LOW',
      });
    } else {
      checks.push({
        name: 'Orphaned Records',
        status: 'PASS',
        message: 'No orphaned records found',
        severity: 'LOW',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Orphaned Records',
      status: 'WARNING',
      message: `Could not check orphaned records: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'LOW',
    });
  }

  // Check 5: Expired Sessions
  try {
    const expiredSessions = await prisma.session.count({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    if (expiredSessions > 0) {
      // Auto-fix: Clean up expired sessions
      await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date(),
          },
        },
      });

      autoFixed.push({
        issue: `Found ${expiredSessions} expired session(s)`,
        action: 'Cleaned up expired sessions',
        status: 'SUCCESS',
        timestamp: new Date(),
      });

      checks.push({
        name: 'Expired Sessions',
        status: 'PASS',
        message: `Cleaned up ${expiredSessions} expired session(s)`,
        severity: 'LOW',
      });
    } else {
      checks.push({
        name: 'Expired Sessions',
        status: 'PASS',
        message: 'No expired sessions found',
        severity: 'LOW',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Expired Sessions',
      status: 'WARNING',
      message: `Could not check expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'LOW',
    });
  }

  // Check 6: Stuck Payments
  try {
    const stuckPayments = await prisma.cryptoPayment.count({
      where: {
        status: 'WAITING',
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (stuckPayments > 0) {
      // Auto-fix: Mark expired payments as expired
      await prisma.cryptoPayment.updateMany({
        where: {
          status: 'WAITING',
          expiresAt: {
            lt: new Date(),
          },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      autoFixed.push({
        issue: `Found ${stuckPayments} expired payment(s)`,
        action: 'Marked expired payments as EXPIRED',
        status: 'SUCCESS',
        timestamp: new Date(),
      });

      checks.push({
        name: 'Stuck Payments',
        status: 'PASS',
        message: `Fixed ${stuckPayments} expired payment(s)`,
        severity: 'MEDIUM',
      });
    } else {
      checks.push({
        name: 'Stuck Payments',
        status: 'PASS',
        message: 'No stuck payments found',
        severity: 'MEDIUM',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Stuck Payments',
      status: 'WARNING',
      message: `Could not check stuck payments: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'MEDIUM',
    });
  }

  // Determine overall status
  const criticalFailures = checks.filter(
    (c) => c.status === 'FAIL' && c.severity === 'CRITICAL'
  ).length;
  const highFailures = checks.filter((c) => c.status === 'FAIL' && c.severity === 'HIGH').length;

  let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  if (criticalFailures > 0) {
    status = 'UNHEALTHY';
  } else if (highFailures > 0) {
    status = 'DEGRADED';
  } else {
    status = 'HEALTHY';
  }

  return {
    status,
    checks,
    autoFixed,
    timestamp: new Date(),
  };
}

/**
 * Auto-heal system issues
 */
export async function autoHeal(): Promise<AutoFix[]> {
  const fixes: AutoFix[] = [];

  try {
    // Fix 1: Clean up expired sessions
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    if (expiredSessions.count > 0) {
      fixes.push({
        issue: 'Expired sessions',
        action: `Cleaned up ${expiredSessions.count} expired session(s)`,
        status: 'SUCCESS',
        timestamp: new Date(),
      });
    }

    // Fix 2: Clean up orphaned records
    const orphanedWallets = await prisma.wallet.deleteMany({
      where: {
        userId: null,
        organizationId: null,
      },
    });

    if (orphanedWallets.count > 0) {
      fixes.push({
        issue: 'Orphaned wallets',
        action: `Deleted ${orphanedWallets.count} orphaned wallet(s)`,
        status: 'SUCCESS',
        timestamp: new Date(),
      });
    }

    // Fix 3: Mark expired payments
    const expiredPayments = await prisma.cryptoPayment.updateMany({
      where: {
        status: 'WAITING',
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: 'EXPIRED',
      },
    });

    if (expiredPayments.count > 0) {
      fixes.push({
        issue: 'Expired payments',
        action: `Marked ${expiredPayments.count} payment(s) as expired`,
        status: 'SUCCESS',
        timestamp: new Date(),
      });
    }

    // Fix 4: Clean up old verification tokens
    const oldTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });

    if (oldTokens.count > 0) {
      fixes.push({
        issue: 'Expired verification tokens',
        action: `Deleted ${oldTokens.count} expired token(s)`,
        status: 'SUCCESS',
        timestamp: new Date(),
      });
    }
  } catch (error) {
    fixes.push({
      issue: 'Auto-heal error',
      action: `Error during auto-heal: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'FAILED',
      timestamp: new Date(),
    });
  }

  return fixes;
}

/**
 * Schedule automatic health checks
 */
export function scheduleHealthChecks(intervalMinutes = 60) {
  if (typeof window !== 'undefined') {
    // Client-side: Use setInterval
    setInterval(
      async () => {
        try {
          const health = await runHealthCheck();
          if (health.status !== 'HEALTHY') {
            console.warn('[Self-Healing] System health degraded:', health);
          }
        } catch (error) {
          console.error('[Self-Healing] Health check failed:', error);
        }
      },
      intervalMinutes * 60 * 1000
    );
  }
  // Server-side: Use cron job or similar
}
