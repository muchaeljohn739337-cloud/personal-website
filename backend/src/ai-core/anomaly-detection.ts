import IsolationForest from "ml-isolation-forest";
import { mean, standardDeviation } from "simple-statistics";

/**
 * Anomaly Detection for AI Usage Patterns
 * Uses Isolation Forest algorithm to detect unusual behavior
 */

export interface UsagePattern {
  timestamp: Date;
  agentName: string;
  taskType: string;
  duration: number;
  requestCount: number;
  errorCount: number;
  cpuUsage?: number;
  memoryUsage?: number;
  metadata?: Record<string, any>;
}

export interface Anomaly {
  timestamp: Date;
  pattern: UsagePattern;
  score: number; // -1 to 1 (lower = more anomalous)
  severity: "low" | "medium" | "high" | "critical";
  reason: string;
  recommendation: string;
}

export interface AnomalyDetectionConfig {
  contamination?: number; // Expected proportion of anomalies (0-1)
  nTrees?: number; // Number of trees in forest
  sampleSize?: number; // Sample size for each tree
  threshold?: number; // Threshold for anomaly classification
  enableRealTimeAlerts?: boolean;
}

export class AnomalyDetector {
  private config: Required<AnomalyDetectionConfig>;
  private forest: IsolationForest | null = null;
  private patterns: UsagePattern[] = [];
  private anomalies: Anomaly[] = [];
  private isTraining: boolean = false;

  constructor(config: AnomalyDetectionConfig = {}) {
    this.config = {
      contamination: config.contamination || 0.1,
      nTrees: config.nTrees || 100,
      sampleSize: config.sampleSize || 256,
      threshold: config.threshold || -0.5,
      enableRealTimeAlerts: config.enableRealTimeAlerts ?? true,
    };
  }

  /**
   * Add a usage pattern for analysis
   */
  addPattern(pattern: UsagePattern): void {
    this.patterns.push(pattern);

    // Keep only last 10,000 patterns
    if (this.patterns.length > 10000) {
      this.patterns = this.patterns.slice(-10000);
    }

    // Retrain if we have enough data and not currently training
    if (this.patterns.length >= 100 && !this.isTraining) {
      this.trainModel();
    }
  }

  /**
   * Train the anomaly detection model
   */
  private async trainModel(): Promise<void> {
    if (this.patterns.length < 100) {
      console.warn("[Anomaly Detection] Not enough data to train (need at least 100 patterns)");
      return;
    }

    this.isTraining = true;

    try {
      // Convert patterns to feature vectors
      const features = this.patterns.map((p) => this.extractFeatures(p));

      // Train isolation forest
      this.forest = new IsolationForest({
        nTrees: this.config.nTrees,
        sampleSize: Math.min(this.config.sampleSize, features.length),
        contamination: this.config.contamination,
      });

      this.forest.fit(features);

      console.log(`[Anomaly Detection] Model trained with ${this.patterns.length} patterns`);
    } catch (error) {
      console.error("[Anomaly Detection] Error training model:", error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Extract numerical features from a usage pattern
   */
  private extractFeatures(pattern: UsagePattern): number[] {
    return [
      pattern.duration,
      pattern.requestCount,
      pattern.errorCount,
      pattern.cpuUsage || 0,
      pattern.memoryUsage || 0,
      pattern.timestamp.getHours(), // Time of day
      pattern.timestamp.getDay(), // Day of week
    ];
  }

  /**
   * Check if a pattern is anomalous
   */
  async detectAnomaly(pattern: UsagePattern): Promise<Anomaly | null> {
    if (!this.forest) {
      // Not enough data to detect anomalies yet
      return null;
    }

    const features = this.extractFeatures(pattern);
    const score = this.forest.predict([features])[0];

    if (score < this.config.threshold) {
      const anomaly = this.createAnomaly(pattern, score);

      this.anomalies.push(anomaly);

      // Keep only last 1000 anomalies
      if (this.anomalies.length > 1000) {
        this.anomalies.shift();
      }

      if (this.config.enableRealTimeAlerts) {
        this.alertAnomaly(anomaly);
      }

      return anomaly;
    }

    return null;
  }

  /**
   * Create an anomaly object with detailed information
   */
  private createAnomaly(pattern: UsagePattern, score: number): Anomaly {
    // Determine severity based on score
    let severity: Anomaly["severity"];
    if (score < -0.8) {
      severity = "critical";
    } else if (score < -0.6) {
      severity = "high";
    } else if (score < -0.4) {
      severity = "medium";
    } else {
      severity = "low";
    }

    // Analyze what makes this anomalous
    const reason = this.analyzeAnomaly(pattern);
    const recommendation = this.getRecommendation(pattern, reason);

    return {
      timestamp: new Date(),
      pattern,
      score,
      severity,
      reason,
      recommendation,
    };
  }

  /**
   * Analyze what makes a pattern anomalous
   */
  private analyzeAnomaly(pattern: UsagePattern): string {
    const reasons: string[] = [];

    // Calculate statistics for comparison
    const durations = this.patterns.filter((p) => p.agentName === pattern.agentName).map((p) => p.duration);

    if (durations.length > 10) {
      const avgDuration = mean(durations);
      const stdDuration = standardDeviation(durations);

      if (pattern.duration > avgDuration + 2 * stdDuration) {
        reasons.push(
          `Duration (${pattern.duration}ms) is ${Math.round((pattern.duration / avgDuration) * 100)}% higher than average`
        );
      }
    }

    const errorCounts = this.patterns.filter((p) => p.agentName === pattern.agentName).map((p) => p.errorCount);

    if (errorCounts.length > 10) {
      const avgErrors = mean(errorCounts);
      if (pattern.errorCount > avgErrors * 2) {
        reasons.push(`Error count (${pattern.errorCount}) is unusually high`);
      }
    }

    // Check for unusual request patterns
    const recentPatterns = this.patterns.filter((p) => p.agentName === pattern.agentName).slice(-50);

    if (recentPatterns.length > 10) {
      const avgRequests = mean(recentPatterns.map((p) => p.requestCount));
      if (pattern.requestCount > avgRequests * 3) {
        reasons.push(`Request spike detected (${pattern.requestCount} requests)`);
      }
    }

    // Check resource usage
    if (pattern.cpuUsage && pattern.cpuUsage > 80) {
      reasons.push(`High CPU usage (${pattern.cpuUsage}%)`);
    }

    if (pattern.memoryUsage && pattern.memoryUsage > 80) {
      reasons.push(`High memory usage (${pattern.memoryUsage}%)`);
    }

    return reasons.length > 0 ? reasons.join("; ") : "Unusual pattern detected";
  }

  /**
   * Get recommendation based on anomaly
   */
  private getRecommendation(pattern: UsagePattern, reason: string): string {
    if (reason.includes("Duration")) {
      return "Investigate slow operations. Check database queries, external API calls, or consider caching.";
    }

    if (reason.includes("Error count")) {
      return "Review error logs for this agent. Check for external service issues or input validation problems.";
    }

    if (reason.includes("Request spike")) {
      return "Monitor for DDoS or unusual traffic. Consider rate limiting or scaling resources.";
    }

    if (reason.includes("CPU usage")) {
      return "Optimize CPU-intensive operations or scale horizontally to handle load.";
    }

    if (reason.includes("memory usage")) {
      return "Check for memory leaks, optimize data structures, or increase available memory.";
    }

    return "Monitor this pattern closely and investigate if it persists.";
  }

  /**
   * Alert about an anomaly
   */
  private alertAnomaly(anomaly: Anomaly): void {
    const alert = {
      severity: anomaly.severity,
      agent: anomaly.pattern.agentName,
      task: anomaly.pattern.taskType,
      score: anomaly.score,
      reason: anomaly.reason,
      recommendation: anomaly.recommendation,
      timestamp: anomaly.timestamp,
    };

    console.warn("[Anomaly Detection] ALERT:", JSON.stringify(alert, null, 2));

    // Emit event for dashboard
    // This would be connected to your event emitter
  }

  /**
   * Get all detected anomalies
   */
  getAnomalies(options?: { severity?: Anomaly["severity"]; agentName?: string; limit?: number }): Anomaly[] {
    let filtered = this.anomalies;

    if (options?.severity) {
      filtered = filtered.filter((a) => a.severity === options.severity);
    }

    if (options?.agentName) {
      filtered = filtered.filter((a) => a.pattern.agentName === options.agentName);
    }

    const limit = options?.limit || 100;
    return filtered.slice(-limit);
  }

  /**
   * Get anomaly statistics
   */
  getStatistics(): {
    totalPatterns: number;
    totalAnomalies: number;
    anomalyRate: number;
    bySeverity: Record<Anomaly["severity"], number>;
    byAgent: Record<string, number>;
  } {
    const bySeverity: Record<Anomaly["severity"], number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const byAgent: Record<string, number> = {};

    for (const anomaly of this.anomalies) {
      bySeverity[anomaly.severity]++;
      byAgent[anomaly.pattern.agentName] = (byAgent[anomaly.pattern.agentName] || 0) + 1;
    }

    return {
      totalPatterns: this.patterns.length,
      totalAnomalies: this.anomalies.length,
      anomalyRate: this.patterns.length > 0 ? this.anomalies.length / this.patterns.length : 0,
      bySeverity,
      byAgent,
    };
  }

  /**
   * Retrain model manually
   */
  async retrain(): Promise<void> {
    await this.trainModel();
  }
}

// Global anomaly detector instance
let globalDetector: AnomalyDetector | null = null;

export function initializeAnomalyDetection(config?: AnomalyDetectionConfig): AnomalyDetector {
  globalDetector = new AnomalyDetector(config);
  return globalDetector;
}

export function getAnomalyDetector(): AnomalyDetector {
  if (!globalDetector) {
    throw new Error("Anomaly detection not initialized. Call initializeAnomalyDetection() first.");
  }
  return globalDetector;
}
