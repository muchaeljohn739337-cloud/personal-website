/**
 * Agent Worker System
 * Background worker that processes agent jobs and creates checkpoints
 */

import { AIJobStatus, CheckpointStatus, CheckpointType, Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';

import {
  addAgentLogBreadcrumb,
  addCheckpointBreadcrumb,
  addJobStatusBreadcrumb,
  captureJobError,
  startJobTransaction,
} from './sentry-helpers';
import { getBlockingCheckpoint, getCheckpoint, requiresApproval } from './checkpoint-manager';
import { getJobHandler, type JobHandlerContext } from './job-handlers';
import { prisma } from '../prismaClient';

export interface WorkerConfig {
  pollInterval?: number; // milliseconds
  maxConcurrentJobs?: number;
  enableSentry?: boolean;
}

export class AgentWorker {
  private isRunning = false;
  private pollInterval: number;
  private maxConcurrentJobs: number;
  private activeJobs = new Set<string>();
  private pollTimer: NodeJS.Timeout | null = null;
  private enableSentry: boolean;

  constructor(config: WorkerConfig = {}) {
    this.pollInterval = config.pollInterval || 5000; // 5 seconds default
    this.maxConcurrentJobs = config.maxConcurrentJobs || 3;
    this.enableSentry = config.enableSentry ?? true;
  }

  /**
   * Start the worker
   */
  start() {
    if (this.isRunning) {
      console.warn('[AgentWorker] Worker is already running');
      return;
    }

    this.isRunning = true;
    console.log('[AgentWorker] Starting worker...');

    // Start polling for jobs
    this.poll();
  }

  /**
   * Stop the worker
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('[AgentWorker] Stopping worker...');

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    // Wait for active jobs to complete (with timeout)
    return this.waitForActiveJobs(30000); // 30 second timeout
  }

  /**
   * Poll for pending jobs
   */
  private async poll() {
    if (!this.isRunning) {
      return;
    }

    try {
      // Check if we can process more jobs
      if (this.activeJobs.size < this.maxConcurrentJobs) {
        await this.processNextJob();
      }
    } catch (error) {
      console.error('[AgentWorker] Error in poll cycle:', error);
      if (this.enableSentry) {
        Sentry.captureException(error as Error);
      }
    }

    // Schedule next poll
    this.pollTimer = setTimeout(() => this.poll(), this.pollInterval);
  }

  /**
   * Process the next available job
   */
  private async processNextJob() {
    // Find a job that's ready to process
    const job = await prisma.aIJob.findFirst({
      where: {
        status: {
          in: [AIJobStatus.PENDING, AIJobStatus.QUEUED],
        },
      },
      orderBy: [
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'asc' }, // Then oldest first
      ],
    });

    if (!job) {
      return; // No jobs to process
    }

    // Check if job is blocked by a pending checkpoint
    const blockingCheckpoint = await getBlockingCheckpoint(job.id);
    if (blockingCheckpoint) {
      // Job is waiting for checkpoint approval, skip it for now
      return;
    }

    // Process the job
    this.activeJobs.add(job.id);
    this.processJob(job.id)
      .catch((error) => {
        console.error(`[AgentWorker] Error processing job ${job.id}:`, error);
        if (this.enableSentry) {
          captureJobError(job.id, error, {
            jobType: job.jobType,
            userId: job.userId || undefined,
          });
        }
      })
      .finally(() => {
        this.activeJobs.delete(job.id);
      });
  }

  /**
   * Process a single job
   */
  private async processJob(jobId: string) {
    const job = await prisma.aIJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    // Start Sentry transaction
    let transaction: Sentry.Transaction | undefined;
    if (this.enableSentry) {
      transaction = startJobTransaction(job);
    }

    try {
      // Update job status to RUNNING
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: AIJobStatus.RUNNING,
          startedAt: new Date(),
          attempts: { increment: 1 },
        },
      });

      if (this.enableSentry) {
        addJobStatusBreadcrumb(jobId, job.status, AIJobStatus.RUNNING);
      }

      // Get job handler
      const handler = getJobHandler(job.jobType);
      if (!handler) {
        throw new Error(`No handler found for job type: ${job.jobType}`);
      }

      // Create context for handler
      const context: JobHandlerContext = {
        jobId: job.id,
        jobType: job.jobType,
        inputData: job.inputData || {},
        userId: job.userId || undefined,
        createLog: async (action, message, metadata) => {
          await this.createLog(job.id, action, message, metadata);
        },
        createCheckpoint: async (type, message, data, metadata) => {
          return this.createCheckpoint(job.id, type, message, data, metadata);
        },
        waitForCheckpoint: async (checkpointId) => {
          return this.waitForCheckpoint(job.id, checkpointId);
        },
      };

      // Execute handler
      const outputData = await handler(context);

      // Update job as completed
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: AIJobStatus.COMPLETED,
          completedAt: new Date(),
          outputData,
        },
      });

      if (this.enableSentry) {
        addJobStatusBreadcrumb(jobId, AIJobStatus.RUNNING, AIJobStatus.COMPLETED);
        transaction?.finish();
      }

      console.log(`[AgentWorker] Job ${jobId} completed successfully`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update job as failed
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: AIJobStatus.FAILED,
          failedAt: new Date(),
          failureReason: errorMessage,
        },
      });

      if (this.enableSentry) {
        addJobStatusBreadcrumb(jobId, AIJobStatus.RUNNING, AIJobStatus.FAILED, errorMessage);
        transaction?.finish();
      }

      // Check if we should retry
      if (job.attempts < job.maxAttempts) {
        await prisma.aIJob.update({
          where: { id: jobId },
          data: {
            status: AIJobStatus.RETRY,
          },
        });
        console.log(
          `[AgentWorker] Job ${jobId} will be retried (attempt ${job.attempts + 1}/${job.maxAttempts})`
        );
      } else {
        console.error(
          `[AgentWorker] Job ${jobId} failed after ${job.attempts} attempts:`,
          errorMessage
        );
      }

      throw error;
    }
  }

  /**
   * Create a log entry for a job
   */
  private async createLog(
    jobId: string,
    action: string,
    message: string,
    metadata?: Prisma.JsonValue
  ) {
    const log = await prisma.agentLog.create({
      data: {
        jobId,
        agentName: 'worker',
        agentType: 'ORCHESTRATOR',
        action,
        message,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    if (this.enableSentry) {
      addAgentLogBreadcrumb(jobId, 'worker', action, message);
    }

    return log;
  }

  /**
   * Create a checkpoint for a job
   */
  private async createCheckpoint(
    jobId: string,
    type: CheckpointType,
    message: string,
    data?: Prisma.JsonValue,
    metadata?: Prisma.JsonValue
  ) {
    const checkpoint = await prisma.agentCheckpoint.create({
      data: {
        jobId,
        checkpointType: type,
        message,
        data: data || null,
        metadata: metadata || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        status: CheckpointStatus.PENDING,
      },
    });

    if (this.enableSentry) {
      addCheckpointBreadcrumb(checkpoint);
    }

    // If this is an approval-required checkpoint, pause the job
    if (requiresApproval(type)) {
      // Update job status to indicate it's waiting for approval
      await prisma.aIJob.update({
        where: { id: jobId },
        data: {
          status: AIJobStatus.RUNNING, // Keep as RUNNING but worker will skip it
        },
      });
    }

    return checkpoint.id;
  }

  /**
   * Wait for a checkpoint to be approved/rejected
   */
  private async waitForCheckpoint(jobId: string, checkpointId: string): Promise<boolean> {
    // Poll for checkpoint status
    const maxWaitTime = 24 * 60 * 60 * 1000; // 24 hours
    const pollInterval = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const checkpoint = await getCheckpoint(checkpointId);

      if (!checkpoint) {
        throw new Error(`Checkpoint ${checkpointId} not found`);
      }

      if (checkpoint.status === CheckpointStatus.APPROVED) {
        return true;
      }

      if (checkpoint.status === CheckpointStatus.REJECTED) {
        return false;
      }

      if (checkpoint.status === CheckpointStatus.EXPIRED) {
        return false;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    // Timeout - treat as rejected
    await prisma.agentCheckpoint.update({
      where: { id: checkpointId },
      data: { status: CheckpointStatus.EXPIRED },
    });

    return false;
  }

  /**
   * Wait for active jobs to complete
   */
  private async waitForActiveJobs(timeout: number): Promise<void> {
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      console.warn(`[AgentWorker] ${this.activeJobs.size} jobs still active after timeout`);
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      pollInterval: this.pollInterval,
    };
  }
}

// Singleton instance
let workerInstance: AgentWorker | null = null;

/**
 * Get or create the worker instance
 */
export function getWorker(config?: WorkerConfig): AgentWorker {
  if (!workerInstance) {
    workerInstance = new AgentWorker(config);
  }
  return workerInstance;
}

/**
 * Start the worker (if not already running)
 */
export function startWorker(config?: WorkerConfig) {
  const worker = getWorker(config);
  worker.start();
}

/**
 * Stop the worker
 */
export function stopWorker() {
  if (workerInstance) {
    workerInstance.stop();
  }
}
