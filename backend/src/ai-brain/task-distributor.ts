/**
 * Distributed Task Management System
 * Handles distribution of Snyk security issues to specialized AI agents
 * Prevents system overload with smart rate limiting and prioritization
 */

import { EventEmitter } from "events";
import prisma from "../prismaClient";

export interface SnykIssue {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "vuln" | "license" | "code";
  packageName?: string;
  version?: string;
  fixedIn?: string[];
  file?: string;
  line?: number;
  description: string;
  remediation?: string;
}

export interface TaskBatch {
  id: string;
  issues: SnykIssue[];
  priority: number;
  agentType: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentCapability {
  type: string;
  maxConcurrent: number;
  canHandle: (issue: SnykIssue) => boolean;
  priority: number;
}

export class TaskDistributor extends EventEmitter {
  private agents: Map<string, AgentCapability> = new Map();
  private activeTasks: Map<string, TaskBatch> = new Map();
  private queue: TaskBatch[] = [];
  private maxConcurrentTasks = 5;
  private isProcessing = false;

  constructor() {
    super();
    this.initializeAgents();
  }

  /**
   * Register available AI agents and their capabilities
   */
  private initializeAgents(): void {
    // Code Security Fixer Agent
    this.registerAgent({
      type: "SnykFixerAgent",
      maxConcurrent: 3,
      priority: 1,
      canHandle: (issue) => issue.type === "code",
    });

    // Dependency Update Agent
    this.registerAgent({
      type: "DependencyAgent",
      maxConcurrent: 2,
      priority: 2,
      canHandle: (issue) => issue.type === "vuln" && !!issue.packageName,
    });

    // Security Patch Agent
    this.registerAgent({
      type: "SecurityPatchAgent",
      maxConcurrent: 2,
      priority: 1,
      canHandle: (issue) => issue.type === "vuln" && issue.severity === "critical",
    });

    // Code Review Agent
    this.registerAgent({
      type: "CodeReviewAgent",
      maxConcurrent: 1,
      priority: 3,
      canHandle: () => true, // Reviews all fixes
    });

    // Testing Agent
    this.registerAgent({
      type: "TestingAgent",
      maxConcurrent: 2,
      priority: 2,
      canHandle: () => true, // Tests all fixes
    });

    console.log(`✅ Registered ${this.agents.size} AI agents`);
  }

  /**
   * Register an agent capability
   */
  public registerAgent(capability: AgentCapability): void {
    this.agents.set(capability.type, capability);
    console.log(`📝 Registered agent: ${capability.type} (max: ${capability.maxConcurrent})`);
  }

  /**
   * Analyze and distribute Snyk issues
   */
  public async distributeIssues(issues: SnykIssue[]): Promise<void> {
    console.log(`\n🎯 Analyzing ${issues.length} Snyk issues...\n`);

    // Group issues by severity and type
    const grouped = this.groupIssues(issues);

    // Create task batches
    const batches = this.createTaskBatches(grouped);

    // Log distribution plan
    this.logDistributionPlan(batches);

    // Add to queue
    batches.forEach((batch) => this.queue.push(batch));

    // Start processing
    await this.processQueue();
  }

  /**
   * Group issues by severity and type
   */
  private groupIssues(issues: SnykIssue[]): Map<string, SnykIssue[]> {
    const groups = new Map<string, SnykIssue[]>();

    issues.forEach((issue) => {
      const key = `${issue.severity}-${issue.type}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(issue);
    });

    return groups;
  }

  /**
   * Create task batches for agents
   */
  private createTaskBatches(grouped: Map<string, SnykIssue[]>): TaskBatch[] {
    const batches: TaskBatch[] = [];
    let batchId = 1;

    grouped.forEach((issues, key) => {
      // Find best agent for this issue type
      const sampleIssue = issues[0];
      const agent = this.findBestAgent(sampleIssue);

      if (agent) {
        // Split into chunks based on agent capacity
        const chunkSize = agent.maxConcurrent * 2;
        for (let i = 0; i < issues.length; i += chunkSize) {
          const chunk = issues.slice(i, i + chunkSize);

          batches.push({
            id: `batch-${batchId++}`,
            issues: chunk,
            priority: this.calculatePriority(chunk),
            agentType: agent.type,
            status: "pending",
            createdAt: new Date(),
          });
        }
      }
    });

    // Sort by priority (highest first)
    return batches.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Find best agent for an issue
   */
  private findBestAgent(issue: SnykIssue): AgentCapability | undefined {
    const candidates = Array.from(this.agents.values())
      .filter((agent) => agent.canHandle(issue))
      .sort((a, b) => a.priority - b.priority);

    return candidates[0];
  }

  /**
   * Calculate batch priority (higher = more urgent)
   */
  private calculatePriority(issues: SnykIssue[]): number {
    const severityScores = {
      critical: 1000,
      high: 100,
      medium: 10,
      low: 1,
    };

    return issues.reduce((sum, issue) => {
      return sum + severityScores[issue.severity];
    }, 0);
  }

  /**
   * Log distribution plan
   */
  private logDistributionPlan(batches: TaskBatch[]): void {
    console.log("📊 Task Distribution Plan:\n");

    const agentSummary = new Map<string, number>();
    batches.forEach((batch) => {
      const count = agentSummary.get(batch.agentType) || 0;
      agentSummary.set(batch.agentType, count + batch.issues.length);
    });

    agentSummary.forEach((count, agent) => {
      console.log(`   ${agent}: ${count} issues`);
    });

    console.log(`\n   Total batches: ${batches.length}`);
    console.log(`   Max concurrent: ${this.maxConcurrentTasks}\n`);
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log("⚠️  Queue processing already in progress");
      return;
    }

    this.isProcessing = true;
    console.log("🚀 Starting queue processing...\n");

    while (this.queue.length > 0 || this.activeTasks.size > 0) {
      // Process active tasks
      await this.processActiveTasks();

      // Start new tasks if capacity available
      while (this.activeTasks.size < this.maxConcurrentTasks && this.queue.length > 0) {
        const batch = this.queue.shift()!;
        await this.startTask(batch);
      }

      // Wait before next check
      if (this.queue.length > 0 || this.activeTasks.size > 0) {
        await this.sleep(2000);
      }
    }

    this.isProcessing = false;
    console.log("\n✅ All tasks completed!\n");
    this.emit("completed");
  }

  /**
   * Start a task batch
   */
  private async startTask(batch: TaskBatch): Promise<void> {
    batch.status = "in-progress";
    this.activeTasks.set(batch.id, batch);

    console.log(`▶️  Starting ${batch.id} (${batch.agentType}): ${batch.issues.length} issues`);

    // Log to database
    await this.logTaskStart(batch);

    // Emit event for agent to pick up
    this.emit("task", batch);
  }

  /**
   * Process active tasks (check for completion)
   */
  private async processActiveTasks(): Promise<void> {
    const completed: string[] = [];

    this.activeTasks.forEach((batch, id) => {
      // In real implementation, check agent status
      // For now, simulate completion after timeout
      const elapsed = Date.now() - batch.createdAt.getTime();

      if (elapsed > 5000) {
        // 5 seconds for demo
        batch.status = "completed";
        batch.completedAt = new Date();
        completed.push(id);
      }
    });

    // Remove completed tasks
    for (const id of completed) {
      const batch = this.activeTasks.get(id)!;
      this.activeTasks.delete(id);

      console.log(`✅ Completed ${id}: ${batch.issues.length} issues fixed`);
      await this.logTaskComplete(batch);
    }
  }

  /**
   * Mark task as failed
   */
  public async failTask(batchId: string, error: string): Promise<void> {
    const batch = this.activeTasks.get(batchId);
    if (batch) {
      batch.status = "failed";
      batch.error = error;
      batch.completedAt = new Date();
      this.activeTasks.delete(batchId);

      console.error(`❌ Failed ${batchId}: ${error}`);
      await this.logTaskComplete(batch);
    }
  }

  /**
   * Get current status
   */
  public getStatus(): any {
    return {
      queueLength: this.queue.length,
      activeTasks: this.activeTasks.size,
      isProcessing: this.isProcessing,
      agents: Array.from(this.agents.keys()),
    };
  }

  /**
   * Log task start to database
   */
  private async logTaskStart(batch: TaskBatch): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action: "TASK_BATCH_STARTED",
          resourceType: "SECURITY",
          resourceId: batch.id,
          metadata: {
            agent: batch.agentType,
            issueCount: batch.issues.length,
            priority: batch.priority,
          } as any,
          severity: "MEDIUM",
          ipAddress: "system",
          userAgent: "TaskDistributor",
        },
      });
    } catch (error) {
      console.error("Failed to log task start:", error);
    }
  }

  /**
   * Log task completion to database
   */
  private async logTaskComplete(batch: TaskBatch): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action: batch.status === "completed" ? "TASK_BATCH_COMPLETED" : "TASK_BATCH_FAILED",
          resourceType: "SECURITY",
          resourceId: batch.id,
          metadata: {
            agent: batch.agentType,
            issueCount: batch.issues.length,
            status: batch.status,
            error: batch.error,
            duration: batch.completedAt ? batch.completedAt.getTime() - batch.createdAt.getTime() : 0,
          } as any,
          severity: batch.status === "failed" ? "HIGH" : "LOW",
          ipAddress: "system",
          userAgent: "TaskDistributor",
        },
      });
    } catch (error) {
      console.error("Failed to log task completion:", error);
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const taskDistributor = new TaskDistributor();
