import { mean } from "simple-statistics";

/**
 * Predictive Maintenance for AI System Resources
 * Forecasts resource needs and prevents performance degradation
 */

export interface ResourceMetrics {
  timestamp: Date;
  cpuUsage: number; // 0-100
  memoryUsage: number; // 0-100
  taskQueueSize: number;
  activeAgents: number;
  requestRate: number; // requests per minute
  avgResponseTime: number; // milliseconds
  errorRate: number; // 0-1
}

export interface Prediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number; // 0-1
  timeHorizon: number; // minutes
  trend: "increasing" | "decreasing" | "stable";
  severity: "normal" | "warning" | "critical";
  recommendation: string;
}

export interface MaintenanceAlert {
  type: "scale_up" | "scale_down" | "optimize" | "restart";
  severity: "low" | "medium" | "high" | "critical";
  metric: string;
  currentValue: number;
  threshold: number;
  prediction: Prediction;
  timestamp: Date;
  action: string;
}

export interface PMConfig {
  predictionHorizon?: number; // minutes
  alertThresholds?: {
    cpu?: number;
    memory?: number;
    queueSize?: number;
    errorRate?: number;
  };
  enableAutoScaling?: boolean;
}

export class PredictiveMaintenance {
  private config: Required<PMConfig>;
  private metricsHistory: ResourceMetrics[] = [];
  private alerts: MaintenanceAlert[] = [];

  constructor(config: PMConfig = {}) {
    this.config = {
      predictionHorizon: config.predictionHorizon || 60,
      alertThresholds: {
        cpu: config.alertThresholds?.cpu || 80,
        memory: config.alertThresholds?.memory || 85,
        queueSize: config.alertThresholds?.queueSize || 1000,
        errorRate: config.alertThresholds?.errorRate || 0.1,
      },
      enableAutoScaling: config.enableAutoScaling ?? false,
    };
  }

  /**
   * Record current resource metrics
   */
  recordMetrics(metrics: ResourceMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only last 24 hours of metrics (assuming 1-minute intervals)
    if (this.metricsHistory.length > 1440) {
      this.metricsHistory = this.metricsHistory.slice(-1440);
    }

    // Check for immediate alerts
    this.checkImmediateAlerts(metrics);
  }

  /**
   * Check for immediate threshold violations
   */
  private checkImmediateAlerts(metrics: ResourceMetrics): void {
    if (metrics.cpuUsage > this.config.alertThresholds.cpu!) {
      this.createAlert({
        type: "scale_up",
        severity: metrics.cpuUsage > 95 ? "critical" : "high",
        metric: "cpuUsage",
        currentValue: metrics.cpuUsage,
        threshold: this.config.alertThresholds.cpu!,
        prediction: this.predictMetric("cpuUsage"),
        timestamp: new Date(),
        action: "Scale up CPU resources or optimize CPU-intensive operations",
      });
    }

    if (metrics.memoryUsage > this.config.alertThresholds.memory!) {
      this.createAlert({
        type: "scale_up",
        severity: metrics.memoryUsage > 95 ? "critical" : "high",
        metric: "memoryUsage",
        currentValue: metrics.memoryUsage,
        threshold: this.config.alertThresholds.memory!,
        prediction: this.predictMetric("memoryUsage"),
        timestamp: new Date(),
        action: "Scale up memory or investigate memory leaks",
      });
    }

    if (metrics.taskQueueSize > this.config.alertThresholds.queueSize!) {
      this.createAlert({
        type: "scale_up",
        severity: "medium",
        metric: "taskQueueSize",
        currentValue: metrics.taskQueueSize,
        threshold: this.config.alertThresholds.queueSize!,
        prediction: this.predictMetric("taskQueueSize"),
        timestamp: new Date(),
        action: "Scale up workers or optimize task processing",
      });
    }

    if (metrics.errorRate > this.config.alertThresholds.errorRate!) {
      this.createAlert({
        type: "optimize",
        severity: "high",
        metric: "errorRate",
        currentValue: metrics.errorRate,
        threshold: this.config.alertThresholds.errorRate!,
        prediction: this.predictMetric("errorRate"),
        timestamp: new Date(),
        action: "Investigate and fix errors in AI agents",
      });
    }
  }

  /**
   * Predict future value of a metric using linear regression
   */
  predictMetric(metricName: keyof ResourceMetrics): Prediction {
    if (this.metricsHistory.length < 10) {
      return this.getDefaultPrediction(metricName);
    }

    // Get recent data points (last 30 minutes)
    const recentMetrics = this.metricsHistory.slice(-30);
    const values = recentMetrics.map((m) => m[metricName] as number);
    const times = recentMetrics.map((m, i) => i);

    // Simple linear regression
    const n = values.length;
    const sumX = times.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = times.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict future value
    const futureTime = n + this.config.predictionHorizon;
    const predictedValue = slope * futureTime + intercept;

    // Calculate confidence based on R²
    const avgY = mean(values);
    const ssRes = values.reduce((sum, y, i) => sum + Math.pow(y - (slope * times[i] + intercept), 2), 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0);
    const rSquared = 1 - ssRes / ssTot;

    // Determine trend
    let trend: Prediction["trend"];
    if (Math.abs(slope) < 0.1) {
      trend = "stable";
    } else if (slope > 0) {
      trend = "increasing";
    } else {
      trend = "decreasing";
    }

    // Determine severity
    let severity: Prediction["severity"] = "normal";
    const thresholds = this.config.alertThresholds as any;
    const threshold = thresholds[metricName];

    if (threshold && predictedValue > threshold * 0.9) {
      severity = "warning";
    }
    if (threshold && predictedValue > threshold) {
      severity = "critical";
    }

    // Generate recommendation
    const recommendation = this.generateRecommendation(metricName, predictedValue, trend, severity);

    return {
      metric: metricName,
      currentValue: values[values.length - 1],
      predictedValue: Math.max(0, Math.min(predictedValue, 100)), // Clamp to 0-100 for percentages
      confidence: Math.max(0, Math.min(rSquared, 1)),
      timeHorizon: this.config.predictionHorizon,
      trend,
      severity,
      recommendation,
    };
  }

  /**
   * Get default prediction when insufficient data
   */
  private getDefaultPrediction(metricName: keyof ResourceMetrics): Prediction {
    return {
      metric: metricName,
      currentValue: 0,
      predictedValue: 0,
      confidence: 0,
      timeHorizon: this.config.predictionHorizon,
      trend: "stable",
      severity: "normal",
      recommendation: "Collecting data for predictions...",
    };
  }

  /**
   * Generate recommendation based on prediction
   */
  private generateRecommendation(
    metric: string,
    predictedValue: number,
    trend: Prediction["trend"],
    severity: Prediction["severity"]
  ): string {
    if (severity === "normal") {
      return `${metric} is within normal range`;
    }

    if (metric === "cpuUsage") {
      if (trend === "increasing") {
        return "CPU usage trending up. Consider scaling horizontally or optimizing CPU-intensive operations.";
      }
      return "High CPU usage detected. Review recent code changes for performance issues.";
    }

    if (metric === "memoryUsage") {
      if (trend === "increasing") {
        return "Memory usage growing. Check for memory leaks, optimize data structures, or scale up memory.";
      }
      return "High memory usage. Consider implementing caching strategies or garbage collection tuning.";
    }

    if (metric === "taskQueueSize") {
      return "Task queue growing. Scale up workers, optimize task processing, or implement prioritization.";
    }

    if (metric === "errorRate") {
      return "Error rate elevated. Review logs, fix bugs, and improve error handling.";
    }

    if (metric === "avgResponseTime") {
      return "Response time increasing. Optimize database queries, add caching, or scale resources.";
    }

    return `Monitor ${metric} closely`;
  }

  /**
   * Create maintenance alert
   */
  private createAlert(alert: MaintenanceAlert): void {
    console.warn("[Predictive Maintenance] ALERT:", alert);
    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  /**
   * Get all predictions for key metrics
   */
  getAllPredictions(): Prediction[] {
    const metrics: Array<keyof ResourceMetrics> = [
      "cpuUsage",
      "memoryUsage",
      "taskQueueSize",
      "errorRate",
      "avgResponseTime",
    ];

    return metrics.map((metric) => this.predictMetric(metric));
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: MaintenanceAlert["severity"]): MaintenanceAlert[] {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter((a) => a.severity === severity);
    }

    // Return only recent alerts (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return alerts.filter((a) => a.timestamp > oneHourAgo);
  }

  /**
   * Get resource utilization trends
   */
  getTrends(hours: number = 24): {
    cpuTrend: number[];
    memoryTrend: number[];
    queueTrend: number[];
    timestamps: Date[];
  } {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const filtered = this.metricsHistory.filter((m) => m.timestamp > since);

    return {
      cpuTrend: filtered.map((m) => m.cpuUsage),
      memoryTrend: filtered.map((m) => m.memoryUsage),
      queueTrend: filtered.map((m) => m.taskQueueSize),
      timestamps: filtered.map((m) => m.timestamp),
    };
  }

  /**
   * Get health score (0-100)
   */
  getHealthScore(): number {
    if (this.metricsHistory.length === 0) {
      return 100;
    }

    const latest = this.metricsHistory[this.metricsHistory.length - 1];
    const predictions = this.getAllPredictions();

    let score = 100;

    // Deduct points for current issues
    if (latest.cpuUsage > 80) score -= 20;
    if (latest.memoryUsage > 85) score -= 20;
    if (latest.errorRate > 0.05) score -= 30;
    if (latest.taskQueueSize > 500) score -= 15;

    // Deduct points for predicted issues
    const criticalPredictions = predictions.filter((p) => p.severity === "critical");
    score -= criticalPredictions.length * 10;

    return Math.max(0, score);
  }
}

// Global instance
let globalPM: PredictiveMaintenance | null = null;

export function initializePredictiveMaintenance(config?: PMConfig): PredictiveMaintenance {
  globalPM = new PredictiveMaintenance(config);
  return globalPM;
}

export function getPredictiveMaintenance(): PredictiveMaintenance {
  if (!globalPM) {
    throw new Error("Predictive Maintenance not initialized. Call initializePredictiveMaintenance() first.");
  }
  return globalPM;
}
