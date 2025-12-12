/**
 * ═══════════════════════════════════════════════════════════════
 * TASK ORCHESTRATOR AI - INTELLIGENT TASK MANAGEMENT
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Manage and orchestrate all tasks across the system
 * Features:
 * - Assign tasks to workers/connectors based on capacity & priority
 * - Monitor progress and completion
 * - Detect failed tasks and retry/reroute automatically
 * - Integrate with Auto-Precision Core and AI Engine Coolers
 * - Prevent overload with intelligent queuing
 * ═══════════════════════════════════════════════════════════════
 */

import { getResourceMetrics, queueAIJob } from "../middleware/aiRateLimiter";
import prisma from "../prismaClient";
import { guardianAI } from "./guardian_integration";

type TaskPriority = "critical" | "high" | "medium" | "low";
type TaskStatus =
  | "pending"
  | "assigned"
  | "running"
  | "completed"
  | "failed"
  | "retrying";
type ConnectorType = "stripe" | "crypto" | "email" | "social" | "ai";

interface Task {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  connector?: ConnectorType;
  payload: any;
  assignedWorker?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface Worker {
  id: string;
  type: ConnectorType;
  capacity: number;
  currentLoad: number;
  available: boolean;
  lastHeartbeat: Date;
}

interface TaskResult {
  success: boolean;
  taskId: string;
  result?: any;
  error?: string;
  executionTime: number;
}

class TaskOrchestratorAI {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private readonly MAX_CONCURRENT_TASKS = 50;
  private readonly TASK_TIMEOUT_MS = 300000; // 5 minutes
  private readonly WORKER_HEARTBEAT_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.initializeWorkers();
    this.startMonitoring();
  }

  /**
   * Initialize workers for different connector types
   */
  private initializeWorkers(): void {
    const workerTypes: ConnectorType[] = [
      "stripe",
      "crypto",
      "email",
      "social",
      "ai",
    ];

    workerTypes.forEach((type) => {
      const capacity = this.getWorkerCapacity(type);
      for (let i = 0; i < capacity; i++) {
        const workerId = `${type}-worker-${i + 1}`;
        this.workers.set(workerId, {
          id: workerId,
          type,
          capacity: this.getConnectorMaxConcurrent(type),
          currentLoad: 0,
          available: true,
          lastHeartbeat: new Date(),
        });
      }
    });

    console.log(
      `🤖 Task Orchestrator AI - Initialized ${this.workers.size} workers`
    );
  }

  /**
   * Get worker capacity based on connector type
   */
  private getWorkerCapacity(type: ConnectorType): number {
    const capacityMap: Record<ConnectorType, number> = {
      stripe: 2, // 2 Stripe workers
      crypto: 2, // 2 Crypto workers
      email: 3, // 3 Email workers
      social: 1, // 1 Social media worker
      ai: 4, // 4 AI workers
    };
    return capacityMap[type] || 1;
  }

  /**
   * Get connector max concurrent tasks
   */
  private getConnectorMaxConcurrent(type: ConnectorType): number {
    const concurrentMap: Record<ConnectorType, number> = {
      stripe: 5,
      crypto: 3,
      email: 10,
      social: 3,
      ai: 10,
    };
    return concurrentMap[type] || 5;
  }

  /**
   * Submit a new task to the orchestrator
   */
  async submitTask(
    type: string,
    payload: any,
    options: {
      priority?: TaskPriority;
      connector?: ConnectorType;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      priority: options.priority || "medium",
      status: "pending",
      connector: options.connector,
      payload,
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add to queue (sorted by priority)
    this.taskQueue.push(task);
    this.sortQueue();

    // Save to database
    await this.saveTaskToDatabase(task);

    // Log to Guardian AI
    await guardianAI.logAction(
      "system",
      "task_submitted",
      `Task ${task.id} submitted`,
      {
        taskId: task.id,
        type: task.type,
        priority: task.priority,
      }
    );

    console.log(
      `📝 Task submitted: ${task.id} (${task.type}, priority: ${task.priority})`
    );

    // Try to assign immediately
    await this.assignTasks();

    return task.id;
  }

  /**
   * Assign pending tasks to available workers
   */
  async assignTasks(): Promise<void> {
    // Check if we're at capacity
    if (this.runningTasks.size >= this.MAX_CONCURRENT_TASKS) {
      console.log("⚠️  Max concurrent tasks reached, waiting...");
      return;
    }

    // Check resource availability
    const resources = getResourceMetrics();
    if (resources.throttled) {
      console.log("⚠️  System throttled, pausing task assignment");
      return;
    }

    // Get pending tasks
    const pendingTasks = this.taskQueue.filter((t) => t.status === "pending");

    for (const task of pendingTasks) {
      if (this.runningTasks.size >= this.MAX_CONCURRENT_TASKS) break;

      // Find available worker
      const worker = this.findAvailableWorker(task.connector);
      if (!worker) {
        console.log(`⏸️  No available worker for task ${task.id}`);
        continue;
      }

      // Assign task to worker
      task.status = "assigned";
      task.assignedWorker = worker.id;
      task.updatedAt = new Date();
      worker.currentLoad++;
      worker.available = worker.currentLoad < worker.capacity;

      // Move to running tasks
      this.runningTasks.set(task.id, task);
      this.taskQueue = this.taskQueue.filter((t) => t.id !== task.id);

      console.log(`✅ Task ${task.id} assigned to ${worker.id}`);

      // Execute task
      this.executeTask(task, worker);
    }
  }

  /**
   * Find available worker for task
   */
  private findAvailableWorker(connectorType?: ConnectorType): Worker | null {
    const availableWorkers = Array.from(this.workers.values()).filter(
      (w) => w.available && (!connectorType || w.type === connectorType)
    );

    if (availableWorkers.length === 0) return null;

    // Return worker with lowest current load
    return availableWorkers.reduce((prev, curr) =>
      curr.currentLoad < prev.currentLoad ? curr : prev
    );
  }

  /**
   * Execute a task
   */
  private async executeTask(task: Task, worker: Worker): Promise<void> {
    const startTime = Date.now();
    task.status = "running";
    task.updatedAt = new Date();

    console.log(`🚀 Executing task ${task.id} on ${worker.id}...`);

    try {
      // Execute task with timeout
      const result = await Promise.race([
        this.runTaskLogic(task),
        this.taskTimeout(task.id),
      ]);

      // Task completed successfully
      const executionTime = Date.now() - startTime;
      task.status = "completed";
      task.completedAt = new Date();
      task.updatedAt = new Date();

      console.log(`✅ Task ${task.id} completed in ${executionTime}ms`);

      // Log to Guardian AI
      await guardianAI.logAction(
        "system",
        "task_completed",
        `Task ${task.id} completed`,
        {
          taskId: task.id,
          executionTime,
          result,
        }
      );

      // Update database
      await this.updateTaskInDatabase(task);

      // Free worker
      this.freeWorker(worker);
      this.runningTasks.delete(task.id);

      // Assign next task
      await this.assignTasks();
    } catch (error) {
      // Task failed
      const executionTime = Date.now() - startTime;
      task.error = error instanceof Error ? error.message : "Unknown error";
      task.retryCount++;

      console.error(`❌ Task ${task.id} failed:`, task.error);

      // Retry if possible
      if (task.retryCount < task.maxRetries) {
        task.status = "retrying";
        console.log(
          `🔄 Retrying task ${task.id} (attempt ${task.retryCount + 1}/${
            task.maxRetries
          })`
        );

        // Put back in queue
        this.taskQueue.push(task);
        this.sortQueue();
      } else {
        task.status = "failed";
        console.error(
          `💀 Task ${task.id} failed permanently after ${task.retryCount} retries`
        );

        // Alert admin
        await guardianAI.logAction(
          "task-orchestrator",
          "task_permanent_failure",
          `Task ${task.id} failed permanently`,
          {
            taskId: task.id,
            error: task.error,
            retries: task.retryCount,
          }
        );
      }

      // Update database
      await this.updateTaskInDatabase(task);

      // Free worker
      this.freeWorker(worker);
      this.runningTasks.delete(task.id);

      // Assign next task
      await this.assignTasks();
    }
  }

  /**
   * Run task logic (integrates with AI Rate Limiter)
   */
  private async runTaskLogic(task: Task): Promise<any> {
    // Use AI Rate Limiter if connector specified
    if (task.connector) {
      return await queueAIJob(
        task.connector,
        async () => {
          // Execute task payload
          return await this.executeTaskPayload(task);
        },
        task.priority
      );
    } else {
      // Execute directly
      return await this.executeTaskPayload(task);
    }
  }

  /**
   * Execute task payload (override in subclasses or pass function)
   */
  private async executeTaskPayload(task: Task): Promise<any> {
    // Example: Execute based on task type
    switch (task.type) {
      case "email":
        return await this.sendEmail(task.payload);
      case "payment":
        return await this.processPayment(task.payload);
      case "ai_inference":
        return await this.runAIInference(task.payload);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  /**
   * Task timeout handler
   */
  private taskTimeout(taskId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Task ${taskId} timed out after ${this.TASK_TIMEOUT_MS}ms`)
        );
      }, this.TASK_TIMEOUT_MS);
    });
  }

  /**
   * Free worker after task completion
   */
  private freeWorker(worker: Worker): void {
    worker.currentLoad--;
    worker.available = worker.currentLoad < worker.capacity;
    worker.lastHeartbeat = new Date();
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    this.taskQueue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Start monitoring workers and tasks
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.monitorWorkers();
      this.monitorTasks();
    }, this.WORKER_HEARTBEAT_INTERVAL);
  }

  /**
   * Monitor worker health
   */
  private monitorWorkers(): void {
    const now = new Date();
    Array.from(this.workers.values()).forEach((worker) => {
      const timeSinceHeartbeat = now.getTime() - worker.lastHeartbeat.getTime();
      if (timeSinceHeartbeat > this.WORKER_HEARTBEAT_INTERVAL * 2) {
        console.warn(`⚠️  Worker ${worker.id} heartbeat timeout`);
        worker.available = false;
      }
    });
  }

  /**
   * Monitor running tasks for timeout
   */
  private monitorTasks(): void {
    const now = new Date();
    Array.from(this.runningTasks.values()).forEach((task) => {
      const runningTime = now.getTime() - task.updatedAt.getTime();
      if (runningTime > this.TASK_TIMEOUT_MS * 2) {
        console.error(`💀 Task ${task.id} appears stuck, force failing`);
        task.status = "failed";
        task.error = "Task stuck/timeout";
        this.updateTaskInDatabase(task);
        this.runningTasks.delete(task.id);
      }
    });
  }

  /**
   * Get orchestrator stats
   */
  getStats(): {
    totalWorkers: number;
    availableWorkers: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasksToday: number;
    failedTasksToday: number;
  } {
    const availableWorkers = Array.from(this.workers.values()).filter(
      (w) => w.available
    ).length;

    return {
      totalWorkers: this.workers.size,
      availableWorkers,
      pendingTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasksToday: 0, // TODO: Query from database
      failedTasksToday: 0, // TODO: Query from database
    };
  }

  /**
   * Save task to database
   */
  private async saveTaskToDatabase(task: Task): Promise<void> {
    try {
      await prisma.job.create({
        data: {
          id: task.id,
          type: task.type,
          status: task.status,
          payload: JSON.stringify(task.payload),
          priority: task.priority,
          retryCount: task.retryCount,
          maxRetries: task.maxRetries,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
      });
    } catch (error) {
      console.error("Failed to save task to database:", error);
    }
  }

  /**
   * Update task in database
   */
  private async updateTaskInDatabase(task: Task): Promise<void> {
    try {
      await prisma.job.update({
        where: { id: task.id },
        data: {
          status: task.status,
          retryCount: task.retryCount,
          updatedAt: task.updatedAt,
          completedAt: task.completedAt,
          error: task.error,
        },
      });
    } catch (error) {
      console.error("Failed to update task in database:", error);
    }
  }

  // Example task implementations (override these)
  private async sendEmail(payload: any): Promise<any> {
    // TODO: Implement email sending
    return { sent: true };
  }

  private async processPayment(payload: any): Promise<any> {
    // TODO: Implement payment processing
    return { processed: true };
  }

  private async runAIInference(payload: any): Promise<any> {
    // TODO: Implement AI inference
    return { result: "inference complete" };
  }
}

// Export singleton instance
export const taskOrchestratorAI = new TaskOrchestratorAI();

// Export for testing
export {
  ConnectorType,
  Task,
  TaskOrchestratorAI,
  TaskPriority,
  TaskStatus,
  Worker,
};
