import { NextRequest, NextResponse } from 'next/server';

import { autoHeal, runHealthCheck } from '@/lib/self-healing/system';

/**
 * Cron endpoint for automatic health checks and self-healing
 * Should be called by Vercel Cron or external cron service
 *
 * Protected by CRON_SECRET environment variable
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Run health check
    const health = await runHealthCheck();

    // Auto-heal if needed
    let fixes: Awaited<ReturnType<typeof autoHeal>> = [];
    if (health.status !== 'HEALTHY') {
      fixes = await autoHeal();
    }

    return NextResponse.json({
      success: true,
      health: {
        status: health.status,
        checks: health.checks.length,
        passed: health.checks.filter((c) => c.status === 'PASS').length,
        failed: health.checks.filter((c) => c.status === 'FAIL').length,
      },
      autoFixed: fixes.length,
      fixes: fixes.map((f) => ({
        issue: f.issue,
        action: f.action,
        status: f.status,
      })),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron health check error:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
