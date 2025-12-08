/**
 * Test Runner API
 * Run automated tests and get feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prismaClient';

// =============================================================================
// HEALTH CHECKS
// =============================================================================

async function checkDatabase(): Promise<{ status: string; time: number; error?: string }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', time: Date.now() - start };
  } catch (error) {
    return {
      status: 'down',
      time: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }
}

async function checkAPI(): Promise<{ status: string; time: number }> {
  const start = Date.now();
  return { status: 'healthy', time: Date.now() - start };
}

async function checkStripe(): Promise<{ status: string; time: number }> {
  const start = Date.now();
  try {
    const response = await fetch('https://api.stripe.com/v1', {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    return { status: response.status < 500 ? 'healthy' : 'degraded', time: Date.now() - start };
  } catch {
    return { status: 'unknown', time: Date.now() - start };
  }
}

async function checkEmail(): Promise<{ status: string; time: number }> {
  const start = Date.now();
  const hasKey = !!process.env.RESEND_API_KEY;
  return { status: hasKey ? 'configured' : 'not_configured', time: Date.now() - start };
}

// =============================================================================
// SYSTEM TESTS
// =============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

async function runSystemTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: Database connection
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.push({ name: 'Database Connection', passed: true, duration: Date.now() - dbStart });
  } catch (error) {
    results.push({
      name: 'Database Connection',
      passed: false,
      duration: Date.now() - dbStart,
      error: error instanceof Error ? error.message : 'Failed',
    });
  }

  // Test 2: User table exists
  const userStart = Date.now();
  try {
    await prisma.user.count();
    results.push({ name: 'User Table Access', passed: true, duration: Date.now() - userStart });
  } catch (error) {
    results.push({
      name: 'User Table Access',
      passed: false,
      duration: Date.now() - userStart,
      error: error instanceof Error ? error.message : 'Failed',
    });
  }

  // Test 3: Environment variables
  const envStart = Date.now();
  const requiredEnvs = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env]);
  results.push({
    name: 'Environment Variables',
    passed: missingEnvs.length === 0,
    duration: Date.now() - envStart,
    error: missingEnvs.length > 0 ? `Missing: ${missingEnvs.join(', ')}` : undefined,
  });

  // Test 4: Auth configuration
  const authStart = Date.now();
  const hasAuth = !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL;
  results.push({
    name: 'Auth Configuration',
    passed: hasAuth,
    duration: Date.now() - authStart,
    error: !hasAuth ? 'Missing NEXTAUTH_SECRET or NEXTAUTH_URL' : undefined,
  });

  // Test 5: Payment configuration
  const payStart = Date.now();
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  results.push({
    name: 'Payment Configuration',
    passed: hasStripe,
    duration: Date.now() - payStart,
    error: !hasStripe ? 'Missing STRIPE_SECRET_KEY' : undefined,
  });

  // Test 6: Email configuration
  const emailStart = Date.now();
  const hasEmail = !!process.env.RESEND_API_KEY;
  results.push({
    name: 'Email Configuration',
    passed: hasEmail,
    duration: Date.now() - emailStart,
    error: !hasEmail ? 'Missing RESEND_API_KEY' : undefined,
  });

  return results;
}

// =============================================================================
// API HANDLER
// =============================================================================

export async function GET(req: NextRequest) {
  // Check admin access
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const action = req.nextUrl.searchParams.get('action') || 'health';

  try {
    switch (action) {
      case 'health': {
        const [database, api, stripe, email] = await Promise.all([
          checkDatabase(),
          checkAPI(),
          checkStripe(),
          checkEmail(),
        ]);

        const allHealthy =
          database.status === 'healthy' && api.status === 'healthy';

        return NextResponse.json({
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          checks: { database, api, stripe, email },
        });
      }

      case 'tests': {
        const results = await runSystemTests();
        const passed = results.filter((r) => r.passed).length;
        const failed = results.filter((r) => !r.passed).length;
        const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

        return NextResponse.json({
          status: failed === 0 ? 'passed' : 'failed',
          timestamp: new Date().toISOString(),
          summary: {
            total: results.length,
            passed,
            failed,
            duration: totalDuration,
            passRate: `${((passed / results.length) * 100).toFixed(1)}%`,
          },
          results,
        });
      }

      case 'full': {
        const [healthChecks, testResults] = await Promise.all([
          Promise.all([checkDatabase(), checkAPI(), checkStripe(), checkEmail()]),
          runSystemTests(),
        ]);

        const [database, api, stripe, email] = healthChecks;
        const passed = testResults.filter((r) => r.passed).length;
        const failed = testResults.filter((r) => !r.passed).length;

        return NextResponse.json({
          timestamp: new Date().toISOString(),
          health: {
            status: database.status === 'healthy' ? 'healthy' : 'degraded',
            checks: { database, api, stripe, email },
          },
          tests: {
            status: failed === 0 ? 'passed' : 'failed',
            summary: {
              total: testResults.length,
              passed,
              failed,
              passRate: `${((passed / testResults.length) * 100).toFixed(1)}%`,
            },
            results: testResults,
          },
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[TESTS] Error:', error);
    return NextResponse.json(
      { error: 'Test execution failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
