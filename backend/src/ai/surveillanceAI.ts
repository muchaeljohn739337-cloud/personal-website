/**
 * ═══════════════════════════════════════════════════════════════
 * SURVEILLANCE AI - CONTINUOUS SYSTEM MONITORING
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Continuous AI-powered monitoring of all system components
 * Features:
 * - Monitor worker activity, connector usage, job execution
 * - Detect security events (intrusions, anomalies)
 * - Optional physical monitoring (surveillance cameras)
 * - Generate real-time dashboards for admins
 * - Integrate with Guardian AI + AntiModules for live blocking
 * - Alert on suspicious activity or performance degradation
 * ═══════════════════════════════════════════════════════════════
 */

import { Server as SocketIOServer } from "socket.io";
import { getConnectorMetrics, getResourceMetrics } from "../middleware/aiRateLimiter";
import prisma from "../prismaClient";
import { guardianAI } from "./guardian_integration";
import { taskOrchestratorAI } from "./taskOrchestratorAI";

interface SecurityEvent {
  id: string;
  type: "intrusion" | "anomaly" | "suspicious_activity" | "performance_degradation" | "unauthorized_access";
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface SystemHealth {
  overall: "healthy" | "degraded" | "critical";
  cpu: { usage: number; status: string };
  memory: { usage: number; status: string };
  database: { connected: boolean; status: string };
  workers: { active: number; total: number; status: string };
  tasks: { pending: number; running: number; status: string };
  connectors: { active: number; total: number; status: string };
  timestamp: Date;
}

interface MonitoringAlert {
  id: string;
  level: "info" | "warning" | "error" | "critical";
  component: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

class SurveillanceAI {
  private io: SocketIOServer | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private securityEvents: SecurityEvent[] = [];
  private alerts: MonitoringAlert[] = [];
  private readonly MONITOR_INTERVAL_MS = 5000; // 5 seconds
  private readonly MAX_EVENTS_HISTORY = 1000;
  private readonly MAX_ALERTS_HISTORY = 500;

  /**
   * Initialize surveillance AI with Socket.IO
   */
  initialize(io: SocketIOServer): void {
    this.io = io;
    console.log("👁️  Surveillance AI - Initializing continuous monitoring...");

    // Start monitoring
    this.startMonitoring();

    console.log("✅ Surveillance AI - Monitoring active");
  }

  /**
   * Start continuous monitoring
   */
  private startMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCycle();
    }, this.MONITOR_INTERVAL_MS);

    console.log(`📊 Monitoring cycle started (every ${this.MONITOR_INTERVAL_MS}ms)`);
  }

  /**
   * Perform one monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // 1. Monitor system health
      const health = await this.monitorSystemHealth();

      // 2. Monitor workers
      await this.monitorWorkers();

      // 3. Monitor connectors
      await this.monitorConnectors();

      // 4. Monitor job execution
      await this.monitorJobExecution();

      // 5. Monitor security events
      await this.monitorSecurity();

      // 6. Check for anomalies
      await this.detectAnomalies(health);

      // 7. Broadcast updates to admin dashboard
      this.broadcastHealthUpdate(health);
    } catch (error) {
      console.error("❌ Monitoring cycle failed:", error);
    }
  }

  /**
   * Monitor overall system health
   */
  async monitorSystemHealth(): Promise<SystemHealth> {
    const resources = getResourceMetrics();
    const orchestratorStats = taskOrchestratorAI.getStats();

    // CPU status
    const cpuStatus =
      resources.cpuUsage > 90
        ? "critical"
        : resources.cpuUsage > 80
          ? "warning"
          : resources.cpuUsage > 60
            ? "elevated"
            : "normal";

    // Memory status
    const memoryStatus =
      resources.memoryPercent > 90
        ? "critical"
        : resources.memoryPercent > 85
          ? "warning"
          : resources.memoryPercent > 70
            ? "elevated"
            : "normal";

    // Database status
    const dbConnected = await this.checkDatabaseConnection();
    const dbStatus = dbConnected ? "connected" : "disconnected";

    // Workers status
    const workerStatus =
      orchestratorStats.availableWorkers === 0
        ? "critical"
        : orchestratorStats.availableWorkers < 3
          ? "warning"
          : "normal";

    // Tasks status
    const taskStatus =
      orchestratorStats.pendingTasks > 100 ? "critical" : orchestratorStats.pendingTasks > 50 ? "warning" : "normal";

    // Overall health
    const criticalCount = [cpuStatus, memoryStatus, dbStatus, workerStatus, taskStatus].filter(
      (s) => s === "critical"
    ).length;
    const warningCount = [cpuStatus, memoryStatus, dbStatus, workerStatus, taskStatus].filter(
      (s) => s === "warning"
    ).length;

    const overallHealth: SystemHealth["overall"] =
      criticalCount > 0 ? "critical" : warningCount > 1 ? "degraded" : "healthy";

    return {
      overall: overallHealth,
      cpu: { usage: resources.cpuUsage, status: cpuStatus },
      memory: { usage: resources.memoryPercent, status: memoryStatus },
      database: { connected: dbConnected, status: dbStatus },
      workers: {
        active: orchestratorStats.availableWorkers,
        total: orchestratorStats.totalWorkers,
        status: workerStatus,
      },
      tasks: {
        pending: orchestratorStats.pendingTasks,
        running: orchestratorStats.runningTasks,
        status: taskStatus,
      },
      connectors: {
        active: 0, // TODO: Calculate from connector metrics
        total: 5,
        status: "normal",
      },
      timestamp: new Date(),
    };
  }

  /**
   * Monitor worker activity
   */
  private async monitorWorkers(): Promise<void> {
    const stats = taskOrchestratorAI.getStats();

    // Alert if no workers available
    if (stats.availableWorkers === 0) {
      this.createAlert("critical", "workers", "No workers available - system overloaded");

      // Create security event
      this.createSecurityEvent({
        type: "performance_degradation",
        severity: "critical",
        description: "All workers are busy - potential system overload",
      });
    }

    // Alert if too many pending tasks
    if (stats.pendingTasks > 100) {
      this.createAlert("warning", "workers", `High task queue: ${stats.pendingTasks} pending tasks`);
    }
  }

  /**
   * Monitor connector usage
   */
  private async monitorConnectors(): Promise<void> {
    const connectorMetrics = getConnectorMetrics();

    for (const [connector, metrics] of Object.entries(connectorMetrics)) {
      // Alert if connector is rate limited
      if (metrics.limited) {
        this.createAlert(
          "warning",
          "connectors",
          `Connector ${connector} is rate limited (${metrics.requestsInWindow} requests in window)`
        );
      }

      // Alert if connector has too many active calls
      if (metrics.activeCalls > 10) {
        this.createAlert("warning", "connectors", `Connector ${connector} has ${metrics.activeCalls} active calls`);
      }
    }
  }

  /**
   * Monitor job execution
   */
  private async monitorJobExecution(): Promise<void> {
    try {
      // Check for stuck jobs (running > 30 minutes)
      // Note: Using AITask model as 'job' model doesn't exist in schema
      if (!prisma.aITask) {
        return; // Skip if model not available
      }

      const stuckJobs = await prisma.aITask.findMany({
        where: {
          status: "in_progress",
          updatedAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000),
          },
        },
      });

      if (stuckJobs.length > 0) {
        this.createAlert("error", "jobs", `${stuckJobs.length} jobs appear stuck (running > 30 minutes)`);

        // Create security event
        this.createSecurityEvent({
          type: "anomaly",
          severity: "high",
          description: `${stuckJobs.length} jobs stuck in running state`,
          metadata: { jobIds: stuckJobs.map((j) => j.id) },
        });

        // Alert Guardian AI
        await guardianAI.logAction("surveillance-ai", "stuck_jobs_detected", "Stuck jobs detected", {
          count: stuckJobs.length,
          jobs: stuckJobs,
        });
      }

      // Check for high failure rate
      const recentJobs = await prisma.aITask.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      const failedJobs = await prisma.aITask.count({
        where: {
          status: "failed",
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000),
          },
        },
      });

      const failureRate = recentJobs > 0 ? (failedJobs / recentJobs) * 100 : 0;

      if (failureRate > 20) {
        this.createAlert(
          "error",
          "jobs",
          `High job failure rate: ${failureRate.toFixed(1)}% (${failedJobs}/${recentJobs})`
        );
      }
    } catch (error) {
      console.error("Failed to monitor job execution:", error);
    }
  }

  /**
   * Monitor security events
   */
  private async monitorSecurity(): Promise<void> {
    try {
      // Check for failed login attempts
      const recentFailedLogins = await prisma.audit_logs.count({
        where: {
          action: "login_failed",
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      if (recentFailedLogins > 10) {
        this.createSecurityEvent({
          type: "suspicious_activity",
          severity: "high",
          description: `${recentFailedLogins} failed login attempts in last 15 minutes`,
        });

        // Alert Guardian AI
        await guardianAI.logAction(
          "surveillance-ai",
          "suspicious_login_activity",
          "Suspicious login activity detected",
          {
            failedAttempts: recentFailedLogins,
            timeWindow: "15 minutes",
          }
        );
      }

      // Check for unauthorized access attempts
      const unauthorizedAttempts = await prisma.audit_logs.count({
        where: {
          action: "unauthorized_access",
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      });

      if (unauthorizedAttempts > 5) {
        this.createSecurityEvent({
          type: "unauthorized_access",
          severity: "critical",
          description: `${unauthorizedAttempts} unauthorized access attempts in last hour`,
        });
      }
    } catch (error) {
      console.error("Failed to monitor security:", error);
    }
  }

  /**
   * Detect anomalies using AI
   */
  private async detectAnomalies(health: SystemHealth): Promise<void> {
    // Anomaly 1: CPU spike
    if (health.cpu.usage > 95) {
      this.createSecurityEvent({
        type: "anomaly",
        severity: "critical",
        description: `Critical CPU usage: ${health.cpu.usage.toFixed(2)}%`,
      });
    }

    // Anomaly 2: Memory spike
    if (health.memory.usage > 95) {
      this.createSecurityEvent({
        type: "anomaly",
        severity: "critical",
        description: `Critical memory usage: ${health.memory.usage.toFixed(2)}%`,
      });
    }

    // Anomaly 3: Database disconnection
    if (!health.database.connected) {
      this.createSecurityEvent({
        type: "anomaly",
        severity: "critical",
        description: "Database connection lost",
      });

      // Alert Guardian AI
      await guardianAI.logAction("surveillance-ai", "anomaly", "Database connection lost", {
        timestamp: new Date(),
      });
    }

    // Anomaly 4: All workers busy
    if (health.workers.active === 0 && health.workers.total > 0) {
      this.createSecurityEvent({
        type: "performance_degradation",
        severity: "high",
        description: "All workers are busy - system overloaded",
      });
    }
  }

  /**
   * Create security event
   */
  private createSecurityEvent(event: Omit<SecurityEvent, "id" | "timestamp">): void {
    const securityEvent: SecurityEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...event,
      timestamp: new Date(),
    };

    this.securityEvents.push(securityEvent);

    // Trim history
    if (this.securityEvents.length > this.MAX_EVENTS_HISTORY) {
      this.securityEvents = this.securityEvents.slice(-this.MAX_EVENTS_HISTORY);
    }

    // Log to Guardian AI
    guardianAI.logAction("security", event.type, event.description, event.metadata);

    // Broadcast to admins
    if (this.io) {
      this.io.to("admins").emit("security:event", securityEvent);
    }

    console.log(`🚨 Security Event [${event.severity}]: ${event.description}`);
  }

  /**
   * Create monitoring alert
   */
  private createAlert(level: MonitoringAlert["level"], component: string, message: string): void {
    const alert: MonitoringAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      component,
      message,
      timestamp: new Date(),
      acknowledged: false,
    };

    this.alerts.push(alert);

    // Trim history
    if (this.alerts.length > this.MAX_ALERTS_HISTORY) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS_HISTORY);
    }

    // Broadcast to admins
    if (this.io) {
      this.io.to("admins").emit("monitoring:alert", alert);
    }

    console.log(`⚠️  Alert [${level}] ${component}: ${message}`);
  }

  /**
   * Broadcast health update to admins
   */
  private broadcastHealthUpdate(health: SystemHealth): void {
    if (this.io) {
      this.io.to("admins").emit("monitoring:health", health);
    }
  }

  /**
   * Check database connection
   */
  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get recent security events
   */
  getRecentSecurityEvents(limit: number = 50): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): MonitoringAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Get surveillance dashboard data
   */
  async getDashboardData(): Promise<{
    health: SystemHealth;
    recentEvents: SecurityEvent[];
    activeAlerts: MonitoringAlert[];
    stats: {
      totalEvents: number;
      criticalEvents: number;
      totalAlerts: number;
      unacknowledged: number;
    };
  }> {
    const health = await this.monitorSystemHealth();
    const recentEvents = this.getRecentSecurityEvents(20);
    const activeAlerts = this.getUnacknowledgedAlerts();

    return {
      health,
      recentEvents,
      activeAlerts,
      stats: {
        totalEvents: this.securityEvents.length,
        criticalEvents: this.securityEvents.filter((e) => e.severity === "critical").length,
        totalAlerts: this.alerts.length,
        unacknowledged: activeAlerts.length,
      },
    };
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("🛑 Surveillance AI - Monitoring stopped");
    }
  }
}

// Export singleton instance
export const surveillanceAI = new SurveillanceAI();

// Export for testing
export { MonitoringAlert, SecurityEvent, SurveillanceAI, SystemHealth };
