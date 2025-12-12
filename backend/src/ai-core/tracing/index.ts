import { Span, SpanStatusCode, trace, Tracer } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

/**
 * Distributed Tracing for AI Agent Coordination
 * Tracks agent execution flow, dependencies, and performance
 */

export interface TraceConfig {
  serviceName: string;
  environment: string;
  exporterUrl?: string;
  enableConsoleExport?: boolean;
}

export interface AgentTraceContext {
  agentId: string;
  agentName: string;
  taskId?: string;
  parentSpanId?: string;
  metadata?: Record<string, any>;
}

export interface TraceMetrics {
  duration: number;
  status: "success" | "error" | "timeout";
  agentName: string;
  taskType: string;
  timestamp: Date;
  error?: string;
}

export class DistributedTracing {
  private sdk: NodeSDK | null = null;
  private tracer: Tracer;
  private serviceName: string;
  private traces: Map<string, TraceMetrics[]> = new Map();

  constructor(config: TraceConfig) {
    this.serviceName = config.serviceName;
    this.initializeSDK(config);
    this.tracer = trace.getTracer(config.serviceName, "1.0.0");
  }

  private initializeSDK(config: TraceConfig) {
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    });

    const traceExporter = config.exporterUrl
      ? new OTLPTraceExporter({
          url: config.exporterUrl,
        })
      : undefined;

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    this.sdk.start();
    console.log("[Tracing] OpenTelemetry initialized for", config.serviceName);
  }

  /**
   * Start a new trace for agent execution
   */
  async traceAgentExecution<T>(agentContext: AgentTraceContext, operation: string, fn: () => Promise<T>): Promise<T> {
    const spanName = `${agentContext.agentName}.${operation}`;

    return this.tracer.startActiveSpan(spanName, async (span: Span) => {
      const startTime = Date.now();

      try {
        // Add agent metadata to span
        span.setAttributes({
          "agent.id": agentContext.agentId,
          "agent.name": agentContext.agentName,
          "agent.operation": operation,
          "task.id": agentContext.taskId || "unknown",
        });

        if (agentContext.metadata) {
          for (const [key, value] of Object.entries(agentContext.metadata)) {
            span.setAttribute(`metadata.${key}`, JSON.stringify(value));
          }
        }

        // Execute the operation
        const result = await fn();

        // Record success
        span.setStatus({ code: SpanStatusCode.OK });
        const duration = Date.now() - startTime;

        this.recordMetric({
          duration,
          status: "success",
          agentName: agentContext.agentName,
          taskType: operation,
          timestamp: new Date(),
        });

        span.setAttribute("duration.ms", duration);
        span.end();

        return result;
      } catch (error) {
        // Record error
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: errorMessage,
        });

        span.recordException(error as Error);

        this.recordMetric({
          duration,
          status: "error",
          agentName: agentContext.agentName,
          taskType: operation,
          timestamp: new Date(),
          error: errorMessage,
        });

        span.end();
        throw error;
      }
    });
  }

  /**
   * Create a child span for sub-operations
   */
  async traceSubOperation<T>(operation: string, fn: () => Promise<T>, attributes?: Record<string, any>): Promise<T> {
    return this.tracer.startActiveSpan(operation, async (span: Span) => {
      try {
        if (attributes) {
          for (const [key, value] of Object.entries(attributes)) {
            span.setAttribute(key, JSON.stringify(value));
          }
        }

        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Unknown error",
        });
        span.recordException(error as Error);
        span.end();
        throw error;
      }
    });
  }

  /**
   * Track agent coordination (when one agent calls another)
   */
  async traceAgentCoordination(sourceAgent: string, targetAgent: string, action: string, payload: any): Promise<void> {
    const span = this.tracer.startSpan(`coordination.${sourceAgent}->${targetAgent}`);

    span.setAttributes({
      "coordination.source": sourceAgent,
      "coordination.target": targetAgent,
      "coordination.action": action,
      "coordination.payload_size": JSON.stringify(payload).length,
    });

    span.end();
  }

  /**
   * Record custom metric
   */
  private recordMetric(metric: TraceMetrics) {
    const key = `${metric.agentName}:${metric.taskType}`;

    if (!this.traces.has(key)) {
      this.traces.set(key, []);
    }

    const metrics = this.traces.get(key)!;
    metrics.push(metric);

    // Keep only last 1000 metrics per agent/task combination
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  /**
   * Get performance metrics for an agent
   */
  getAgentMetrics(agentName: string): {
    totalExecutions: number;
    avgDuration: number;
    successRate: number;
    errorRate: number;
    recentErrors: string[];
  } {
    const allMetrics: TraceMetrics[] = [];

    for (const [key, metrics] of this.traces.entries()) {
      if (key.startsWith(agentName + ":")) {
        allMetrics.push(...metrics);
      }
    }

    if (allMetrics.length === 0) {
      return {
        totalExecutions: 0,
        avgDuration: 0,
        successRate: 0,
        errorRate: 0,
        recentErrors: [],
      };
    }

    const totalExecutions = allMetrics.length;
    const successCount = allMetrics.filter((m) => m.status === "success").length;
    const avgDuration = allMetrics.reduce((sum, m) => sum + m.duration, 0) / totalExecutions;

    const recentErrors = allMetrics
      .filter((m) => m.error)
      .slice(-5)
      .map((m) => m.error!)
      .filter((error, index, self) => self.indexOf(error) === index);

    return {
      totalExecutions,
      avgDuration,
      successRate: successCount / totalExecutions,
      errorRate: (totalExecutions - successCount) / totalExecutions,
      recentErrors,
    };
  }

  /**
   * Get all agent metrics (for dashboard)
   */
  getAllAgentMetrics(): Array<{
    agentName: string;
    metrics: ReturnType<typeof this.getAgentMetrics>;
  }> {
    const agentNames = new Set<string>();

    for (const key of this.traces.keys()) {
      const agentName = key.split(":")[0];
      agentNames.add(agentName);
    }

    return Array.from(agentNames).map((agentName) => ({
      agentName,
      metrics: this.getAgentMetrics(agentName),
    }));
  }

  /**
   * Detect slow operations
   */
  getSlowOperations(thresholdMs: number = 5000): TraceMetrics[] {
    const slowOps: TraceMetrics[] = [];

    for (const metrics of this.traces.values()) {
      for (const metric of metrics) {
        if (metric.duration > thresholdMs) {
          slowOps.push(metric);
        }
      }
    }

    return slowOps.sort((a, b) => b.duration - a.duration).slice(0, 20);
  }

  /**
   * Shutdown tracing
   */
  async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown();
      console.log("[Tracing] OpenTelemetry shut down");
    }
  }
}

// Global tracing instance
let globalTracing: DistributedTracing | null = null;

export function initializeTracing(config: TraceConfig): DistributedTracing {
  globalTracing = new DistributedTracing(config);
  return globalTracing;
}

export function getTracing(): DistributedTracing {
  if (!globalTracing) {
    throw new Error("Tracing not initialized. Call initializeTracing() first.");
  }
  return globalTracing;
}
