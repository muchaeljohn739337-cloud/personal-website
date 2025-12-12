import { EventEmitter } from "events";
import { AIWorkerMetadata, aiWorkerRegistry } from "./aiWorkerRegistry";

interface LoadBalancerConfig {
  minActiveUsers: number;
  maxConcurrentRequests: number;
  queueTimeout: number;
  enableGracefulDegradation: boolean;
}

interface QueuedRequest {
  id: string;
  workerId: string;
  timestamp: Date;
  priority: number;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

export class AILoadBalancer extends EventEmitter {
  private activeUsers: number = 0;
  private requestQueue: QueuedRequest[] = [];
  private activeRequests: number = 0;
  private config: LoadBalancerConfig;

  constructor(config?: Partial<LoadBalancerConfig>) {
    super();

    this.config = {
      minActiveUsers: config?.minActiveUsers || 20,
      maxConcurrentRequests: config?.maxConcurrentRequests || 100,
      queueTimeout: config?.queueTimeout || 30000, // 30 seconds
      enableGracefulDegradation:
        config?.enableGracefulDegradation !== undefined
          ? config.enableGracefulDegradation
          : true,
    };

    console.log("⚖️ AI Load Balancer initialized", this.config);
  }

  /**
   * Update active user count
   */
  setActiveUsers(count: number): void {
    const previous = this.activeUsers;
    this.activeUsers = count;

    if (
      count >= this.config.minActiveUsers &&
      previous < this.config.minActiveUsers
    ) {
      console.log(
        `🚀 Active users threshold reached (${count}). All AI workers active.`
      );
      this.emit("threshold:reached", count);
    } else if (
      count < this.config.minActiveUsers &&
      previous >= this.config.minActiveUsers
    ) {
      console.log(
        `⏸️ Active users below threshold (${count}). Graceful degradation enabled.`
      );
      this.emit("threshold:below", count);
    }
  }

  /**
   * Get active user count
   */
  getActiveUsers(): number {
    return this.activeUsers;
  }

  /**
   * Check if system should prevent shutdown
   */
  shouldPreventShutdown(): boolean {
    return this.activeUsers >= this.config.minActiveUsers;
  }

  /**
   * Enqueue a request for processing
   */
  async enqueue<T>(
    workerId: string,
    task: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    // Check if we're over capacity
    if (this.activeRequests >= this.config.maxConcurrentRequests) {
      // Queue the request
      return new Promise<T>((resolve, reject) => {
        const requestId = `${workerId}-${Date.now()}-${Math.random()}`;
        const queuedRequest: QueuedRequest = {
          id: requestId,
          workerId,
          timestamp: new Date(),
          priority,
          resolve: resolve as any,
          reject,
        };

        // Add to queue (sorted by priority)
        this.requestQueue.push(queuedRequest);
        this.requestQueue.sort((a, b) => b.priority - a.priority);

        // Set timeout
        setTimeout(() => {
          const index = this.requestQueue.findIndex((r) => r.id === requestId);
          if (index !== -1) {
            this.requestQueue.splice(index, 1);
            reject(
              new Error("Request timeout: Queue processing took too long")
            );
          }
        }, this.config.queueTimeout);

        this.emit("request:queued", {
          workerId,
          queueSize: this.requestQueue.length,
        });
      }).then((result) => {
        // Execute the task when dequeued
        return task();
      });
    }

    // Execute immediately
    this.activeRequests++;

    try {
      const result = await task();
      return result;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests < this.config.maxConcurrentRequests
    ) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        request.resolve(true); // Signal to execute
        this.emit("request:dequeued", {
          workerId: request.workerId,
          queueSize: this.requestQueue.length,
        });
      }
    }
  }

  /**
   * Determine if a non-critical worker should pause
   */
  shouldPauseWorker(worker: AIWorkerMetadata): boolean {
    if (!this.config.enableGracefulDegradation) {
      return false;
    }

    // Never pause critical workers
    const criticalWorkers = ["guardian-ai", "surveillance-ai", "prisma-solver"];
    if (criticalWorkers.includes(worker.id)) {
      return false;
    }

    // Pause non-critical workers if below threshold and system is under load
    const isUnderLoad =
      this.activeRequests > this.config.maxConcurrentRequests * 0.8;
    const belowThreshold = this.activeUsers < this.config.minActiveUsers;

    return isUnderLoad && belowThreshold;
  }

  /**
   * Get load balancer statistics
   */
  getStats() {
    return {
      activeUsers: this.activeUsers,
      activeRequests: this.activeRequests,
      queuedRequests: this.requestQueue.length,
      maxConcurrentRequests: this.config.maxConcurrentRequests,
      utilizationPercent:
        (this.activeRequests / this.config.maxConcurrentRequests) * 100,
      preventShutdown: this.shouldPreventShutdown(),
    };
  }

  /**
   * Allocate workers based on load
   */
  allocateWorkers(): {
    active: string[];
    paused: string[];
  } {
    const allWorkers = aiWorkerRegistry.getAllWorkers();
    const active: string[] = [];
    const paused: string[] = [];

    for (const worker of allWorkers) {
      if (this.shouldPauseWorker(worker)) {
        paused.push(worker.id);
      } else {
        active.push(worker.id);
      }
    }

    return { active, paused };
  }
}

// Export singleton instance
export const aiLoadBalancer = new AILoadBalancer();
