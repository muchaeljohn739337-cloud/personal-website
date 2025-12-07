import { NextResponse } from 'next/server';

import { getCacheStats } from '@/lib/performance/cache';
import { getRequestTracker } from '@/lib/performance/connection-pool';
import { getQueueStats } from '@/lib/performance/queue';
import { getRateLimiter } from '@/lib/performance/rate-limiter';

// System health check endpoint
// Used for monitoring, load balancers, and uptime checks

export async function GET() {
  const startTime = Date.now();

  try {
    // Gather system metrics
    const cacheStats = getCacheStats();
    const queueStats = getQueueStats();
    const requestStats = getRequestTracker().getStats();
    const rateLimiter = getRateLimiter();

    // Memory usage
    const memoryUsage = process.memoryUsage();

    // Build health response
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: 0, // Will be set at the end

      // System resources
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        unit: 'MB',
      },

      // Cache performance
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate:
          cacheStats.hits + cacheStats.misses > 0
            ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
            : 'N/A',
        size: cacheStats.size,
        memoryUsage: Math.round(cacheStats.memoryUsage / 1024) + ' KB',
      },

      // Job queue
      queue: {
        pending: queueStats.pending,
        processing: queueStats.processing,
        completed: queueStats.completed,
        failed: queueStats.failed,
        total: queueStats.total,
      },

      // Request tracking
      requests: {
        active: requestStats.active,
        completed: requestStats.completed,
        failed: requestStats.failed,
      },

      // Rate limiting
      rateLimiting: {
        activeLimits: rateLimiter.getActiveLimits().size,
      },

      // Version info
      version: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
    };

    health.responseTime = Date.now() - startTime;

    return NextResponse.json(health, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
      },
      { status: 503 }
    );
  }
}

// HEAD request for simple health checks (load balancers)
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
