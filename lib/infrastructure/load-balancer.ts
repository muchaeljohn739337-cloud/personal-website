/**
 * Load Balancer & Proxy Configuration
 * Ensures system stability with 30-40 concurrent users
 * Prevents crashes and system breakdowns
 */

export interface LoadBalancerConfig {
  maxConcurrentUsers: number;
  maxRequestsPerSecond: number;
  timeout: number;
  retryAttempts: number;
  healthCheckInterval: number;
}

export interface SystemMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

class LoadBalancer {
  private config: LoadBalancerConfig;
  private activeConnections: Set<string> = new Set();
  private requestQueue: Array<{ id: string; timestamp: number }> = [];
  private metrics: SystemMetrics;

  constructor() {
    this.config = {
      maxConcurrentUsers: 50, // Support 30-40 users comfortably
      maxRequestsPerSecond: 100,
      timeout: 30000, // 30 seconds
      retryAttempts: 3,
      healthCheckInterval: 5000, // 5 seconds
    };

    this.metrics = {
      activeUsers: 0,
      requestsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      status: 'HEALTHY',
    };

    this.startMonitoring();
    this.startCleanup();
  }

  /**
   * Check if system can handle new request
   */
  canHandleRequest(_userId?: string): { allowed: boolean; reason?: string } {
    // Check concurrent users
    if (this.activeConnections.size >= this.config.maxConcurrentUsers) {
      return {
        allowed: false,
        reason: 'Maximum concurrent users reached. Please try again in a moment.',
      };
    }

    // Check requests per second
    const now = Date.now();
    const recentRequests = this.requestQueue.filter((req) => now - req.timestamp < 1000).length;

    if (recentRequests >= this.config.maxRequestsPerSecond) {
      return {
        allowed: false,
        reason: 'Too many requests. Please slow down.',
      };
    }

    // Check system health
    if (this.metrics.status === 'CRITICAL') {
      return {
        allowed: false,
        reason: 'System is under maintenance. Please try again later.',
      };
    }

    return { allowed: true };
  }

  /**
   * Register new connection
   */
  registerConnection(connectionId: string, _userId?: string): boolean {
    const canHandle = this.canHandleRequest();
    if (!canHandle.allowed) {
      return false;
    }

    this.activeConnections.add(connectionId);
    this.requestQueue.push({ id: connectionId, timestamp: Date.now() });
    this.updateMetrics();

    return true;
  }

  /**
   * Unregister connection
   */
  unregisterConnection(connectionId: string): void {
    this.activeConnections.delete(connectionId);
    this.updateMetrics();
  }

  /**
   * Update system metrics
   */
  private updateMetrics(): void {
    this.metrics.activeUsers = this.activeConnections.size;

    const now = Date.now();
    const recentRequests = this.requestQueue.filter((req) => now - req.timestamp < 1000).length;
    this.metrics.requestsPerSecond = recentRequests;

    // Determine status
    if (this.metrics.activeUsers >= this.config.maxConcurrentUsers * 0.9) {
      this.metrics.status = 'CRITICAL';
    } else if (this.metrics.activeUsers >= this.config.maxConcurrentUsers * 0.7) {
      this.metrics.status = 'DEGRADED';
    } else {
      this.metrics.status = 'HEALTHY';
    }
  }

  /**
   * Start monitoring system health
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();

      // Check if system needs scaling
      if (this.metrics.status === 'CRITICAL') {
        console.warn('[LoadBalancer] System is at critical capacity');
        // In production, trigger auto-scaling here
      }
    }, this.config.healthCheckInterval);
  }

  /**
   * Cleanup old requests from queue
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      this.requestQueue = this.requestQueue.filter((req) => now - req.timestamp < 60000); // Keep last minute
    }, 10000); // Every 10 seconds
  }

  /**
   * Get current metrics
   */
  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  /**
   * Get configuration
   */
  getConfig(): LoadBalancerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LoadBalancerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let loadBalancerInstance: LoadBalancer | null = null;

export function getLoadBalancer(): LoadBalancer {
  if (!loadBalancerInstance) {
    loadBalancerInstance = new LoadBalancer();
  }
  return loadBalancerInstance;
}
