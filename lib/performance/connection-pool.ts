// Connection Pool Manager
// Manages database connections efficiently for high concurrency

// Pool stats interface for future monitoring
// interface PoolStats {
//   activeConnections: number;
//   idleConnections: number;
//   waitingRequests: number;
//   totalConnections: number;
//   maxConnections: number;
// }

interface PoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
}

// Connection pool configuration for Prisma/Database
export const poolConfig: PoolConfig = {
  maxConnections: 20, // Max concurrent connections
  minConnections: 5, // Keep minimum connections alive
  idleTimeoutMs: 30000, // Close idle connections after 30s
  acquireTimeoutMs: 10000, // Timeout for acquiring connection
};

// Track active requests for monitoring
class RequestTracker {
  private activeRequests: Map<string, { startTime: number; endpoint: string }> = new Map();
  private completedRequests: number = 0;
  private failedRequests: number = 0;

  start(requestId: string, endpoint: string): void {
    this.activeRequests.set(requestId, {
      startTime: Date.now(),
      endpoint,
    });
  }

  complete(requestId: string, success = true): number {
    const request = this.activeRequests.get(requestId);
    if (!request) return 0;

    const duration = Date.now() - request.startTime;
    this.activeRequests.delete(requestId);

    if (success) {
      this.completedRequests++;
    } else {
      this.failedRequests++;
    }

    return duration;
  }

  getStats(): {
    active: number;
    completed: number;
    failed: number;
    avgDuration: number;
  } {
    return {
      active: this.activeRequests.size,
      completed: this.completedRequests,
      failed: this.failedRequests,
      avgDuration: 0, // Would need to track durations for accurate avg
    };
  }

  getActiveRequests(): Array<{ id: string; endpoint: string; duration: number }> {
    const now = Date.now();
    return Array.from(this.activeRequests.entries()).map(([id, req]) => ({
      id,
      endpoint: req.endpoint,
      duration: now - req.startTime,
    }));
  }
}

// Singleton tracker
let trackerInstance: RequestTracker | null = null;

export function getRequestTracker(): RequestTracker {
  if (!trackerInstance) {
    trackerInstance = new RequestTracker();
  }
  return trackerInstance;
}

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Database connection string with pool settings
export function getDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';

  if (!baseUrl) {
    console.warn('[ConnectionPool] DATABASE_URL is not set');
    return '';
  }

  // Add connection pool parameters if not present
  // Note: Prisma handles connection pooling internally, but we can add query parameters
  if (!baseUrl.includes('connection_limit') && !baseUrl.includes('?')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    // Prisma-specific connection pool parameters
    return `${baseUrl}${separator}connection_limit=${poolConfig.maxConnections}&pool_timeout=${poolConfig.acquireTimeoutMs / 1000}&connect_timeout=10`;
  }

  return baseUrl;
}

// Health check for database connection
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    // Simple query to check connection
    const { prisma } = await import('@/lib/prismaClient');
    await prisma.$queryRaw`SELECT 1`;

    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown handler
export function setupGracefulShutdown(): void {
  const shutdown = async () => {
    console.log('[Pool] Graceful shutdown initiated...');

    // Wait for active requests to complete (max 10s)
    const tracker = getRequestTracker();
    const maxWait = 10000;
    const start = Date.now();

    while (tracker.getStats().active > 0 && Date.now() - start < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('[Pool] Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
