import { mean } from "simple-statistics";
import { getAnomalyDetector } from "./anomaly-detection";
import { getTracing } from "./tracing";

/**
 * Agent Performance Analytics & Optimization
 * Comprehensive analytics for AI agent performance with optimization suggestions
 */

export interface AgentPerformance {
  agentName: string;
  totalExecutions: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorRate: number;
  throughput: number; // executions per hour
  lastActive: Date;
  healthScore: number; // 0-100
}

export interface PerformanceComparison {
  agentName: string;
  current: AgentPerformance;
  previous: AgentPerformance;
  improvement: number; // percentage change
  trend: "improving" | "degrading" | "stable";
}

export interface OptimizationSuggestion {
  agentName: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "performance" | "reliability" | "cost" | "scalability";
  issue: string;
  suggestion: string;
  expectedImpact: string;
  effort: "low" | "medium" | "high";
}

export interface AnalyticsDashboard {
  overview: {
    totalAgents: number;
    activeAgents: number;
    avgHealthScore: number;
    totalExecutions: number;
    overallSuccessRate: number;
  };
  topPerformers: AgentPerformance[];
  bottlenecks: AgentPerformance[];
  optimizations: OptimizationSuggestion[];
  trends: PerformanceComparison[];
}

export class AgentAnalytics {
  private performanceHistory: Map<string, AgentPerformance[]> = new Map();

  /**
   * Analyze all agents and generate comprehensive report
   */
  async analyzeAllAgents(): Promise<AnalyticsDashboard> {
    const tracing = getTracing();
    const allMetrics = tracing.getAllAgentMetrics();

    // Calculate performance for each agent
    const performances: AgentPerformance[] = await Promise.all(
      allMetrics.map(async ({ agentName, metrics }) => {
        return this.calculatePerformance(agentName, metrics);
      })
    );

    // Store in history
    for (const perf of performances) {
      this.addToHistory(perf);
    }

    // Identify top performers and bottlenecks
    const sortedByHealth = [...performances].sort((a, b) => b.healthScore - a.healthScore);
    const topPerformers = sortedByHealth.slice(0, 5);
    const bottlenecks = sortedByHealth.slice(-5).reverse();

    // Generate optimization suggestions
    const optimizations = await this.generateOptimizations(performances);

    // Calculate trends
    const trends = performances
      .map((perf) => this.calculateTrend(perf.agentName))
      .filter((t): t is PerformanceComparison => t !== null);

    // Calculate overview
    const overview = {
      totalAgents: performances.length,
      activeAgents: performances.filter((p) => p.totalExecutions > 0).length,
      avgHealthScore: mean(performances.map((p) => p.healthScore)),
      totalExecutions: performances.reduce((sum, p) => sum + p.totalExecutions, 0),
      overallSuccessRate: mean(performances.map((p) => p.successRate)),
    };

    return {
      overview,
      topPerformers,
      bottlenecks,
      optimizations,
      trends,
    };
  }

  /**
   * Calculate detailed performance metrics for an agent
   */
  private async calculatePerformance(
    agentName: string,
    metrics: ReturnType<typeof getTracing.prototype.getAgentMetrics>
  ): Promise<AgentPerformance> {
    // Calculate percentiles (simplified - in production, use actual distribution)
    const p95Duration = metrics.avgDuration * 1.5;
    const p99Duration = metrics.avgDuration * 2;

    // Calculate throughput (executions per hour)
    const throughput = metrics.totalExecutions; // Simplified

    // Calculate health score
    const healthScore = this.calculateHealthScore(metrics);

    return {
      agentName,
      totalExecutions: metrics.totalExecutions,
      successRate: metrics.successRate,
      avgDuration: metrics.avgDuration,
      p95Duration,
      p99Duration,
      errorRate: metrics.errorRate,
      throughput,
      lastActive: new Date(),
      healthScore,
    };
  }

  /**
   * Calculate health score for an agent
   */
  private calculateHealthScore(metrics: ReturnType<typeof getTracing.prototype.getAgentMetrics>): number {
    let score = 100;

    // Penalize high error rate
    score -= metrics.errorRate * 50;

    // Penalize slow response time (over 5 seconds)
    if (metrics.avgDuration > 5000) {
      score -= Math.min(30, ((metrics.avgDuration - 5000) / 1000) * 5);
    }

    // Bonus for high execution count (indicates usefulness)
    if (metrics.totalExecutions > 100) {
      score += 5;
    }

    // Penalize recent errors
    if (metrics.recentErrors.length > 0) {
      score -= metrics.recentErrors.length * 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Add performance to history
   */
  private addToHistory(performance: AgentPerformance): void {
    if (!this.performanceHistory.has(performance.agentName)) {
      this.performanceHistory.set(performance.agentName, []);
    }

    const history = this.performanceHistory.get(performance.agentName)!;
    history.push(performance);

    // Keep only last 100 snapshots
    if (history.length > 100) {
      this.performanceHistory.set(performance.agentName, history.slice(-100));
    }
  }

  /**
   * Calculate performance trend
   */
  private calculateTrend(agentName: string): PerformanceComparison | null {
    const history = this.performanceHistory.get(agentName);
    if (!history || history.length < 2) {
      return null;
    }

    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    const improvement = ((current.healthScore - previous.healthScore) / previous.healthScore) * 100;

    let trend: PerformanceComparison["trend"];
    if (Math.abs(improvement) < 5) {
      trend = "stable";
    } else if (improvement > 0) {
      trend = "improving";
    } else {
      trend = "degrading";
    }

    return {
      agentName,
      current,
      previous,
      improvement,
      trend,
    };
  }

  /**
   * Generate optimization suggestions
   */
  private async generateOptimizations(performances: AgentPerformance[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    for (const perf of performances) {
      // Slow performance
      if (perf.avgDuration > 5000) {
        suggestions.push({
          agentName: perf.agentName,
          priority: perf.avgDuration > 10000 ? "critical" : "high",
          category: "performance",
          issue: `Average duration ${Math.round(perf.avgDuration)}ms is too slow`,
          suggestion: "Add caching, optimize database queries, or use async operations",
          expectedImpact: "Reduce latency by 40-60%",
          effort: "medium",
        });
      }

      // High error rate
      if (perf.errorRate > 0.1) {
        suggestions.push({
          agentName: perf.agentName,
          priority: "critical",
          category: "reliability",
          issue: `Error rate ${Math.round(perf.errorRate * 100)}% is too high`,
          suggestion: "Review error logs, add retry logic, improve error handling",
          expectedImpact: "Reduce errors by 70-90%",
          effort: "high",
        });
      }

      // Low throughput
      if (perf.throughput < 10 && perf.totalExecutions > 0) {
        suggestions.push({
          agentName: perf.agentName,
          priority: "medium",
          category: "scalability",
          issue: "Low throughput indicates potential bottleneck",
          suggestion: "Parallelize operations, increase worker count, or optimize algorithm",
          expectedImpact: "Increase throughput by 2-3x",
          effort: "medium",
        });
      }

      // Poor health score
      if (perf.healthScore < 50) {
        suggestions.push({
          agentName: perf.agentName,
          priority: "high",
          category: "reliability",
          issue: `Health score ${Math.round(perf.healthScore)} is critically low`,
          suggestion: "Comprehensive review needed - check errors, performance, and resource usage",
          expectedImpact: "Improve overall reliability by 50%+",
          effort: "high",
        });
      }
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  /**
   * Get detailed analytics for a specific agent
   */
  async getAgentAnalytics(agentName: string): Promise<{
    current: AgentPerformance;
    history: AgentPerformance[];
    optimizations: OptimizationSuggestion[];
    anomalies: any[];
  } | null> {
    const tracing = getTracing();
    const metrics = tracing.getAgentMetrics(agentName);

    if (metrics.totalExecutions === 0) {
      return null;
    }

    const current = await this.calculatePerformance(agentName, metrics);
    const history = this.performanceHistory.get(agentName) || [];
    const optimizations = await this.generateOptimizations([current]);

    // Get anomalies for this agent
    let anomalies: any[] = [];
    try {
      const detector = getAnomalyDetector();
      anomalies = detector.getAnomalies({ agentName, limit: 10 });
    } catch (error) {
      // Anomaly detection not initialized
    }

    return {
      current,
      history,
      optimizations,
      anomalies,
    };
  }

  /**
   * Compare multiple agents
   */
  async compareAgents(agentNames: string[]): Promise<{
    performances: AgentPerformance[];
    winner: string;
    insights: string[];
  }> {
    const tracing = getTracing();
    const performances: AgentPerformance[] = [];

    for (const name of agentNames) {
      const metrics = tracing.getAgentMetrics(name);
      if (metrics.totalExecutions > 0) {
        const perf = await this.calculatePerformance(name, metrics);
        performances.push(perf);
      }
    }

    if (performances.length === 0) {
      return {
        performances: [],
        winner: "",
        insights: ["No data available for comparison"],
      };
    }

    // Determine winner (highest health score)
    const winner = performances.reduce((best, current) => (current.healthScore > best.healthScore ? current : best));

    // Generate insights
    const insights: string[] = [];

    const avgSuccess = mean(performances.map((p) => p.successRate));
    const avgDuration = mean(performances.map((p) => p.avgDuration));

    insights.push(
      `Average success rate: ${Math.round(avgSuccess * 100)}%`,
      `Average duration: ${Math.round(avgDuration)}ms`,
      `Best performer: ${winner.agentName} (health: ${Math.round(winner.healthScore)})`
    );

    const slowest = performances.reduce((max, p) => (p.avgDuration > max.avgDuration ? p : max));
    if (slowest.avgDuration > avgDuration * 1.5) {
      insights.push(`${slowest.agentName} is significantly slower than average`);
    }

    return {
      performances,
      winner: winner.agentName,
      insights,
    };
  }

  /**
   * Export analytics data
   */
  exportData(): {
    timestamp: Date;
    performances: Map<string, AgentPerformance[]>;
  } {
    return {
      timestamp: new Date(),
      performances: this.performanceHistory,
    };
  }
}

// Global instance
let globalAnalytics: AgentAnalytics | null = null;

export function initializeAgentAnalytics(): AgentAnalytics {
  globalAnalytics = new AgentAnalytics();
  return globalAnalytics;
}

export function getAgentAnalytics(): AgentAnalytics {
  if (!globalAnalytics) {
    throw new Error("Agent Analytics not initialized. Call initializeAgentAnalytics() first.");
  }
  return globalAnalytics;
}
