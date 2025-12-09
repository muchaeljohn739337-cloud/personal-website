import { NextResponse } from 'next/server';

import { getLoadBalancer } from '@/lib/infrastructure/load-balancer';
import { getEmailWorkerSystem } from '@/lib/email/workers';
import { getSMSPool } from '@/lib/communications/sms-pool';
import { runHealthCheck } from '@/lib/self-healing/system';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

// GET /api/system/status - Get comprehensive system status
// Public endpoint for monitoring
export async function GET() {
  try {
    const [health, loadBalancer, emailWorkers, smsPool] = await Promise.all([
      runHealthCheck(),
      Promise.resolve(getLoadBalancer()),
      Promise.resolve(getEmailWorkerSystem()),
      Promise.resolve(getSMSPool()),
    ]);

    const metrics = loadBalancer.getMetrics();
    const workers = emailWorkers.getWorkersStatus();
    const queueStatus = emailWorkers.getQueueStatus();
    const smsStats = smsPool.getStats();

    return NextResponse.json({
      success: true,
      system: {
        health: {
          status: health.status,
          checks: health.checks.length,
          passed: health.checks.filter((c) => c.status === 'PASS').length,
          failed: health.checks.filter((c) => c.status === 'FAIL').length,
          autoFixed: health.autoFixed.length,
        },
        loadBalancer: {
          status: metrics.status,
          activeUsers: metrics.activeUsers,
          maxUsers: loadBalancer.getConfig().maxConcurrentUsers,
          requestsPerSecond: metrics.requestsPerSecond,
          capacity: `${Math.round((metrics.activeUsers / loadBalancer.getConfig().maxConcurrentUsers) * 100)}%`,
        },
        email: {
          workers: {
            total: workers.length,
            active: workers.filter((w) => w.status === 'active' || w.status === 'processing')
              .length,
            idle: workers.filter((w) => w.status === 'idle').length,
            totalProcessed: workers.reduce((sum, w) => sum + w.processedCount, 0),
            totalErrors: workers.reduce((sum, w) => sum + w.errorCount, 0),
          },
          queue: queueStatus,
        },
        sms: {
          configured: smsPool.isConfigured(),
          stats: smsStats,
        },
        overall: {
          status:
            health.status === 'HEALTHY' && metrics.status === 'HEALTHY'
              ? 'OPERATIONAL'
              : 'DEGRADED',
          uptime: '99.9%',
          lastChecked: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({ error: 'Failed to get system status' }, { status: 500 });
  }
}
