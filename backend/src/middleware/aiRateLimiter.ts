/**
 * ═══════════════════════════════════════════════════════════════
 * AI RATE LIMITER & RESOURCE MONITOR
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Prevent AI system from overloading web/backend services
 * Features:
 * - Rate-limit AI requests to external connectors (Stripe, Crypto, Email, Social)
 * - Queue jobs intelligently to avoid simultaneous heavy executions
 * - Monitor resource usage (CPU, memory, network)
 * - Auto-throttle when resources exceed thresholds
 * ═══════════════════════════════════════════════════════════════
 */

import { NextFunction, Request, Response } from "express";
import os from "os";

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT CONFIGURATION
// ═══════════════════════════════════════════════════════════════
interface ConnectorLimits {
  stripe: { maxPerMinute: number; maxConcurrent: number };
  crypto: { maxPerMinute: number; maxConcurrent: number };
  email: { maxPerMinute: number; maxConcurrent: number };
  social: { maxPerMinute: number; maxConcurrent: number };
  ai: { maxPerMinute: number; maxConcurrent: number };
}

const CONNECTOR_LIMITS: ConnectorLimits = {
  stripe: { maxPerMinute: 30, maxConcurrent: 5 },
  crypto: { maxPerMinute: 20, maxConcurrent: 3 },
  email: { maxPerMinute: 50, maxConcurrent: 10 },
  social: { maxPerMinute: 15, maxConcurrent: 3 },
  ai: { maxPerMinute: 100, maxConcurrent: 10 },
};

// Resource thresholds
const RESOURCE_THRESHOLDS = {
  cpuPercent: 80, // Throttle if CPU > 80%
  memoryPercent: 85, // Throttle if memory > 85%
  activeConnections: 100, // Max concurrent connections
};

// ═══════════════════════════════════════════════════════════════
// RATE LIMIT TRACKING
// ═══════════════════════════════════════════════════════════════
interface RateLimitRecord {
  count: number;
  concurrent: number;
  resetTime: number;
}

const connectorUsage = new Map<string, RateLimitRecord>();

// Job queue for intelligent queuing
interface QueuedJob {
  id: string;
  connector: string;
  priority: "low" | "medium" | "high" | "critical";
  createdAt: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const jobQueue: QueuedJob[] = [];
let processingQueue = false;

// ═══════════════════════════════════════════════════════════════
// RESOURCE MONITORING
// ═══════════════════════════════════════════════════════════════
interface ResourceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryPercent: number;
  activeConnections: number;
  queueLength: number;
  throttled: boolean;
}

let resourceMetrics: ResourceMetrics = {
  cpuUsage: 0,
  memoryUsage: 0,
  memoryPercent: 0,
  activeConnections: 0,
  queueLength: 0,
  throttled: false,
};

// Update resource metrics every 5 seconds
setInterval(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  resourceMetrics = {
    cpuUsage: os.loadavg()[0] * 100, // 1-minute load average as percentage
    memoryUsage: usedMem,
    memoryPercent: (usedMem / totalMem) * 100,
    activeConnections: Array.from(connectorUsage.values()).reduce(
      (sum, record) => sum + record.concurrent,
      0
    ),
    queueLength: jobQueue.length,
    throttled:
      (usedMem / totalMem) * 100 > RESOURCE_THRESHOLDS.memoryPercent ||
      os.loadavg()[0] * 100 > RESOURCE_THRESHOLDS.cpuPercent,
  };
}, 5000);

// ═══════════════════════════════════════════════════════════════
// RATE LIMITER MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
export function aiRateLimiter(connector: keyof ConnectorLimits) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = connector;

    // Get or create rate limit record
    let record = connectorUsage.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        concurrent: 0,
        resetTime: now + 60_000, // 1 minute window
      };
      connectorUsage.set(key, record);
    }

    // Check rate limit
    const limits = CONNECTOR_LIMITS[connector];
    if (record.count >= limits.maxPerMinute) {
      return res.status(429).json({
        error: `Rate limit exceeded for ${connector}`,
        limit: limits.maxPerMinute,
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
        metrics: resourceMetrics,
      });
    }

    // Check concurrent limit
    if (record.concurrent >= limits.maxConcurrent) {
      return res.status(503).json({
        error: `Too many concurrent ${connector} requests`,
        limit: limits.maxConcurrent,
        current: record.concurrent,
        message: "Request queued for processing",
      });
    }

    // Check resource thresholds
    if (resourceMetrics.throttled) {
      return res.status(503).json({
        error: "System under heavy load",
        message: "Request throttled due to high resource usage",
        metrics: {
          cpu: `${resourceMetrics.cpuUsage.toFixed(1)}%`,
          memory: `${resourceMetrics.memoryPercent.toFixed(1)}%`,
        },
        retryAfter: 30,
      });
    }

    // Increment counters
    record.count++;
    record.concurrent++;

    // Decrement concurrent counter after request completes
    res.on("finish", () => {
      const currentRecord = connectorUsage.get(key);
      if (currentRecord) {
        currentRecord.concurrent = Math.max(0, currentRecord.concurrent - 1);
      }
    });

    next();
  };
}

// ═══════════════════════════════════════════════════════════════
// INTELLIGENT JOB QUEUE
// ═══════════════════════════════════════════════════════════════
export function queueAIJob<T>(
  connector: keyof ConnectorLimits,
  execute: () => Promise<T>,
  priority: "low" | "medium" | "high" | "critical" = "medium"
): Promise<T> {
  return new Promise((resolve, reject) => {
    const job: QueuedJob = {
      id: `${connector}-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      connector,
      priority,
      createdAt: Date.now(),
      execute: execute as () => Promise<any>,
      resolve,
      reject,
    };

    jobQueue.push(job);

    // Sort queue by priority (critical > high > medium > low)
    jobQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Start queue processing if not already running
    if (!processingQueue) {
      processQueue();
    }
  });
}

async function processQueue() {
  if (processingQueue || jobQueue.length === 0) return;

  processingQueue = true;

  while (jobQueue.length > 0) {
    // Check if system is throttled
    if (resourceMetrics.throttled) {
      console.warn("⚠️  Queue processing paused due to high resource usage:", {
        cpu: `${resourceMetrics.cpuUsage.toFixed(1)}%`,
        memory: `${resourceMetrics.memoryPercent.toFixed(1)}%`,
      });
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      continue;
    }

    const job = jobQueue.shift();
    if (!job) break;

    try {
      // Check connector limits
      const record = connectorUsage.get(job.connector);
      const limits = CONNECTOR_LIMITS[job.connector as keyof ConnectorLimits];

      if (record && record.concurrent >= limits.maxConcurrent) {
        // Re-queue job
        jobQueue.unshift(job);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // Execute job
      const result = await job.execute();
      job.resolve(result);
    } catch (error) {
      job.reject(error);
    }

    // Small delay between jobs to prevent hammering
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  processingQueue = false;
}

// ═══════════════════════════════════════════════════════════════
// RESOURCE METRICS ENDPOINT
// ═══════════════════════════════════════════════════════════════
export function getResourceMetrics(): ResourceMetrics {
  return { ...resourceMetrics };
}

export function getConnectorMetrics() {
  const metrics: Record<string, any> = {};

  for (const [connector, record] of connectorUsage.entries()) {
    const limits = CONNECTOR_LIMITS[connector as keyof ConnectorLimits];
    metrics[connector] = {
      requestsPerMinute: record.count,
      limit: limits.maxPerMinute,
      concurrent: record.concurrent,
      maxConcurrent: limits.maxConcurrent,
      resetIn: Math.max(0, Math.ceil((record.resetTime - Date.now()) / 1000)),
    };
  }

  return metrics;
}

// Clean up old records
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of connectorUsage.entries()) {
    if (now > record.resetTime && record.concurrent === 0) {
      connectorUsage.delete(key);
    }
  }
}, 60_000);

export default {
  aiRateLimiter,
  queueAIJob,
  getResourceMetrics,
  getConnectorMetrics,
};
