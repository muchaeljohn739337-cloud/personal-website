import EventEmitter from "events";
import { guardianAI } from "./guardian_integration";

export type WorkerStatus =
  | "operational"
  | "degraded"
  | "failed"
  | "initializing";
export type WorkerCategory =
  | "security"
  | "database"
  | "code-generation"
  | "monitoring"
  | "communication"
  | "optimization";

export interface AIWorkerMetadata {
  id: string;
  name: string;
  description: string;
  category: WorkerCategory;
  version: string;
  rateLimit: {
    maxRequestsPerMinute: number;
    currentRequests: number;
    lastReset: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeout: number;
    currentFailures: number;
    state: "closed" | "open" | "half-open";
    lastFailure: Date | null;
  };
  health: {
    status: WorkerStatus;
    lastHeartbeat: Date;
    uptime: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgResponseTime: number;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
  autoRestart: boolean;
  restartAttempts: number;
  maxRestartAttempts: number;
}

export interface WorkerHealthCheck {
  workerId: string;
  status: WorkerStatus;
  timestamp: Date;
  details?: string;
}

class AIWorkerRegistry extends EventEmitter {
  private workers: Map<string, AIWorkerMetadata> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT_MS = 60000; // 60 seconds - consider dead if no heartbeat

  constructor() {
    super();
    console.log("🤖 AI Worker Registry initialized");
    this.startHeartbeatMonitoring();
  }

  /**
   * Register a new AI worker
   */
  registerWorker(
    id: string,
    name: string,
    description: string,
    category: WorkerCategory,
    options: Partial<{
      maxRequestsPerMinute: number;
      failureThreshold: number;
      resetTimeout: number;
      autoRestart: boolean;
      maxRestartAttempts: number;
    }> = {}
  ): void {
    const worker: AIWorkerMetadata = {
      id,
      name,
      description,
      category,
      version: "1.0.0",
      rateLimit: {
        maxRequestsPerMinute: options.maxRequestsPerMinute || 100,
        currentRequests: 0,
        lastReset: Date.now(),
      },
      circuitBreaker: {
        failureThreshold: options.failureThreshold || 5,
        resetTimeout: options.resetTimeout || 60000,
        currentFailures: 0,
        state: "closed",
        lastFailure: null,
      },
      health: {
        status: "initializing",
        lastHeartbeat: new Date(),
        uptime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
      },
      metrics: {
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
      },
      autoRestart:
        options.autoRestart !== undefined ? options.autoRestart : true,
      restartAttempts: 0,
      maxRestartAttempts: options.maxRestartAttempts || 3,
    };

    this.workers.set(id, worker);
    this.emit("worker:registered", worker);
    console.log(`✅ Registered AI worker: ${name} (${id})`);
  }

  /**
   * Update worker heartbeat
   */
  heartbeat(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.health.lastHeartbeat = new Date();

    // If worker was failed and is now responding, mark as operational
    if (worker.health.status === "failed") {
      worker.health.status = "operational";
      worker.circuitBreaker.currentFailures = 0;
      worker.restartAttempts = 0;
      this.emit("worker:recovered", worker);
      console.log(`✅ Worker recovered: ${worker.name}`);
    } else if (worker.health.status === "initializing") {
      worker.health.status = "operational";
      this.emit("worker:operational", worker);
      console.log(`✅ Worker operational: ${worker.name}`);
    }
  }

  /**
   * Check rate limiting for a worker
   */
  checkRateLimit(workerId: string): boolean {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    const now = Date.now();

    // Reset counter if window expired
    if (now - worker.rateLimit.lastReset > 60000) {
      worker.rateLimit.currentRequests = 0;
      worker.rateLimit.lastReset = now;
    }

    if (
      worker.rateLimit.currentRequests >= worker.rateLimit.maxRequestsPerMinute
    ) {
      console.warn(`⚠️ Rate limit exceeded for worker: ${worker.name}`);
      return false;
    }

    worker.rateLimit.currentRequests++;
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(workerId: string, responseTime: number): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.health.totalRequests++;
    worker.health.successfulRequests++;

    // Update average response time
    const totalTime =
      worker.health.avgResponseTime * (worker.health.totalRequests - 1);
    worker.health.avgResponseTime =
      (totalTime + responseTime) / worker.health.totalRequests;

    // Reset circuit breaker on success
    if (worker.circuitBreaker.state === "half-open") {
      worker.circuitBreaker.state = "closed";
      worker.circuitBreaker.currentFailures = 0;
      console.log(`🔄 Circuit breaker closed for: ${worker.name}`);
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(workerId: string, error: Error): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.health.totalRequests++;
    worker.health.failedRequests++;
    worker.circuitBreaker.currentFailures++;
    worker.circuitBreaker.lastFailure = new Date();

    // Check circuit breaker threshold
    if (
      worker.circuitBreaker.currentFailures >=
      worker.circuitBreaker.failureThreshold
    ) {
      this.openCircuitBreaker(workerId);
    }

    // Update health status
    const errorRate =
      worker.health.failedRequests / worker.health.totalRequests;
    if (errorRate > 0.5) {
      worker.health.status = "failed";
      this.emit("worker:failed", worker);
      this.attemptRestart(workerId);
    } else if (errorRate > 0.2) {
      worker.health.status = "degraded";
      this.emit("worker:degraded", worker);
    }

    // Alert admin via Guardian AI
    guardianAI.logAction(
      "AI Worker Registry",
      "worker_failure",
      `Worker ${worker.name} failed: ${error.message}`,
      {
        workerId,
        errorRate,
        failures: worker.circuitBreaker.currentFailures,
        threshold: worker.circuitBreaker.failureThreshold,
      }
    );
  }

  /**
   * Open circuit breaker to prevent cascading failures
   */
  private openCircuitBreaker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.circuitBreaker.state = "open";
    console.warn(`🚨 Circuit breaker OPEN for: ${worker.name}`);

    this.emit("worker:circuit-breaker-open", worker);

    // Schedule reset attempt
    setTimeout(() => {
      this.halfOpenCircuitBreaker(workerId);
    }, worker.circuitBreaker.resetTimeout);
  }

  /**
   * Attempt to recover by half-opening circuit breaker
   */
  private halfOpenCircuitBreaker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    worker.circuitBreaker.state = "half-open";
    console.log(
      `🔄 Circuit breaker HALF-OPEN for: ${worker.name} (testing...)`
    );
    this.emit("worker:circuit-breaker-half-open", worker);
  }

  /**
   * Attempt to restart a failed worker
   */
  private async attemptRestart(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker || !worker.autoRestart) return;

    if (worker.restartAttempts >= worker.maxRestartAttempts) {
      console.error(`❌ Max restart attempts reached for: ${worker.name}`);
      await guardianAI.logAction(
        "AI Worker Registry",
        "worker_restart_failed",
        `Max restart attempts (${worker.maxRestartAttempts}) reached for ${worker.name}`,
        { workerId, attempts: worker.restartAttempts }
      );
      return;
    }

    worker.restartAttempts++;
    const backoffTime = Math.min(
      1000 * Math.pow(2, worker.restartAttempts - 1),
      30000
    );

    console.log(
      `🔄 Restarting ${worker.name} (attempt ${worker.restartAttempts}/${worker.maxRestartAttempts}) in ${backoffTime}ms...`
    );

    setTimeout(async () => {
      worker.health.status = "initializing";
      worker.circuitBreaker.currentFailures = 0;
      worker.circuitBreaker.state = "closed";

      this.emit("worker:restarting", worker);

      await guardianAI.logAction(
        "AI Worker Registry",
        "worker_restart",
        `Restarting ${worker.name} (attempt ${worker.restartAttempts})`,
        { workerId, backoffTime }
      );
    }, backoffTime);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();

      for (const [id, worker] of this.workers) {
        const timeSinceHeartbeat =
          now.getTime() - worker.health.lastHeartbeat.getTime();

        if (timeSinceHeartbeat > this.HEARTBEAT_TIMEOUT_MS) {
          if (worker.health.status !== "failed") {
            console.warn(
              `⚠️ Worker ${worker.name} missed heartbeat (${timeSinceHeartbeat}ms)`
            );
            worker.health.status = "failed";
            this.emit("worker:heartbeat-timeout", worker);
            this.attemptRestart(id);
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL_MS);

    console.log("💓 Heartbeat monitoring started");
  }

  /**
   * Update worker metrics
   */
  updateMetrics(
    workerId: string,
    metrics: {
      memoryUsage?: number;
      cpuUsage?: number;
      activeConnections?: number;
    }
  ): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    if (metrics.memoryUsage !== undefined) {
      worker.metrics.memoryUsage = metrics.memoryUsage;
    }
    if (metrics.cpuUsage !== undefined) {
      worker.metrics.cpuUsage = metrics.cpuUsage;
    }
    if (metrics.activeConnections !== undefined) {
      worker.metrics.activeConnections = metrics.activeConnections;
    }
  }

  /**
   * Get all workers
   */
  getAllWorkers(): AIWorkerMetadata[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get workers by category
   */
  getWorkersByCategory(category: WorkerCategory): AIWorkerMetadata[] {
    return Array.from(this.workers.values()).filter(
      (w) => w.category === category
    );
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): AIWorkerMetadata | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    totalWorkers: number;
    operational: number;
    degraded: number;
    failed: number;
    healthScore: number;
    color: "blue" | "yellow" | "red";
  } {
    const workers = Array.from(this.workers.values());
    const operational = workers.filter(
      (w) => w.health.status === "operational"
    ).length;
    const degraded = workers.filter(
      (w) => w.health.status === "degraded"
    ).length;
    const failed = workers.filter((w) => w.health.status === "failed").length;

    const healthScore =
      workers.length > 0 ? (operational / workers.length) * 100 : 100;

    let color: "blue" | "yellow" | "red";
    if (healthScore >= 90) color = "blue";
    else if (healthScore >= 70) color = "yellow";
    else color = "red";

    return {
      totalWorkers: workers.length,
      operational,
      degraded,
      failed,
      healthScore,
      color,
    };
  }

  /**
   * Manually restart a worker
   */
  async manualRestart(workerId: string): Promise<boolean> {
    const worker = this.workers.get(workerId);
    if (!worker) return false;

    worker.restartAttempts = 0; // Reset attempts for manual restart
    await this.attemptRestart(workerId);
    return true;
  }

  /**
   * Cleanup and stop monitoring
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    console.log("🛑 AI Worker Registry shutdown");
  }
}

// Export singleton instance
export const aiWorkerRegistry = new AIWorkerRegistry();

// Register all AI workers
export function registerAllWorkers(): void {
  // Security category
  aiWorkerRegistry.registerWorker(
    "guardian-ai",
    "Guardian AI",
    "24/7 security monitoring and threat detection",
    "security",
    { maxRequestsPerMinute: 200, failureThreshold: 3 }
  );

  aiWorkerRegistry.registerWorker(
    "surveillance-ai",
    "Surveillance AI",
    "Continuous system monitoring and anomaly detection",
    "security",
    { maxRequestsPerMinute: 150 }
  );

  // Database category
  aiWorkerRegistry.registerWorker(
    "prisma-solver",
    "Prisma Solver Core",
    "Autonomous database schema management and optimization",
    "database",
    { maxRequestsPerMinute: 50, failureThreshold: 5 }
  );

  aiWorkerRegistry.registerWorker(
    "auto-remember",
    "Auto-Remember System",
    "Continuous learning memory storage",
    "database",
    { maxRequestsPerMinute: 100 }
  );

  // Code generation category
  aiWorkerRegistry.registerWorker(
    "multi-brain-agent",
    "Multi-Brain AI Agent",
    "Advanced code generation and task execution",
    "code-generation",
    { maxRequestsPerMinute: 30, failureThreshold: 10 }
  );

  aiWorkerRegistry.registerWorker(
    "typescript-fixer",
    "TypeScript Error Fixer",
    "Automatic TypeScript error detection and fixing",
    "code-generation",
    { maxRequestsPerMinute: 10, failureThreshold: 5 }
  );

  // Monitoring category
  aiWorkerRegistry.registerWorker(
    "task-orchestrator",
    "Task Orchestrator AI",
    "Distributed task scheduling and execution",
    "monitoring",
    { maxRequestsPerMinute: 500 }
  );

  aiWorkerRegistry.registerWorker(
    "mapper-ai",
    "Mapper AI",
    "API endpoint discovery and documentation",
    "monitoring",
    { maxRequestsPerMinute: 100 }
  );

  // Communication category
  aiWorkerRegistry.registerWorker(
    "notification-service",
    "Notification Service",
    "Push notifications, email, and real-time alerts",
    "communication",
    { maxRequestsPerMinute: 300 }
  );

  // Optimization category
  aiWorkerRegistry.registerWorker(
    "auto-precision",
    "Auto-Precision Core",
    "Job execution with idempotency and rollback capabilities",
    "optimization",
    { maxRequestsPerMinute: 200 }
  );

  aiWorkerRegistry.registerWorker(
    "governance-ai",
    "Governance AI",
    "Policy enforcement and compliance monitoring",
    "security",
    { maxRequestsPerMinute: 100 }
  );

  console.log("✅ All AI workers registered");
}
