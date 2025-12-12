/**
 * Sentry Helpers for Agent System
 * Helper functions for Sentry integration in agent workers and checkpoints
 */

import * as Sentry from '@sentry/nextjs';

import type { AgentCheckpoint, AIJob } from '@prisma/client';

/**
 * Capture an error that occurred during job execution
 */
export function captureJobError(
  jobId: string,
  error: Error | unknown,
  context?: {
    jobType?: string;
    checkpointId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  Sentry.withScope((scope) => {
    scope.setTag('agent_job_id', jobId);
    scope.setTag('error_type', 'agent_job_error');

    if (context?.jobType) {
      scope.setTag('job_type', context.jobType);
    }

    if (context?.checkpointId) {
      scope.setTag('checkpoint_id', context.checkpointId);
    }

    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }

    if (context?.metadata) {
      scope.setContext('job_context', context.metadata);
    }

    scope.setLevel('error');

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), 'error');
    }
  });
}

/**
 * Add a breadcrumb for checkpoint creation
 */
export function addCheckpointBreadcrumb(checkpoint: AgentCheckpoint) {
  Sentry.addBreadcrumb({
    category: 'agent.checkpoint',
    message: `Checkpoint created: ${checkpoint.checkpointType}`,
    level: 'info',
    data: {
      checkpointId: checkpoint.id,
      jobId: checkpoint.jobId,
      checkpointType: checkpoint.checkpointType,
      status: checkpoint.status,
      message: checkpoint.message,
    },
    timestamp: checkpoint.createdAt.getTime() / 1000,
  });
}

/**
 * Add a breadcrumb for checkpoint approval/rejection
 */
export function addCheckpointActionBreadcrumb(
  checkpoint: AgentCheckpoint,
  action: 'approved' | 'rejected',
  userId: string
) {
  Sentry.addBreadcrumb({
    category: 'agent.checkpoint',
    message: `Checkpoint ${action}`,
    level: action === 'approved' ? 'info' : 'warning',
    data: {
      checkpointId: checkpoint.id,
      jobId: checkpoint.jobId,
      checkpointType: checkpoint.checkpointType,
      approvedBy: userId,
      rejectionReason: checkpoint.rejectionReason,
    },
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a Sentry transaction for job execution
 */
export function startJobTransaction(job: AIJob): unknown {
  // Use Sentry.startSpan for newer API, fallback to manual transaction
  let transaction: unknown;

  try {
    // Try using the newer Sentry API
    if (typeof (Sentry as unknown as { startSpan?: unknown }).startSpan === 'function') {
      // Span is automatically managed in newer Sentry versions
      // No need to return transaction
    } else if (
      typeof (Sentry as unknown as { startTransaction?: unknown }).startTransaction === 'function'
    ) {
      // Fallback for older Sentry versions that have startTransaction
      const startTransaction = (
        Sentry as unknown as { startTransaction: (options: unknown) => unknown }
      ).startTransaction;
      transaction = startTransaction({
        op: 'agent.job',
        name: `Agent Job: ${job.jobType}`,
        data: {
          jobId: job.id,
          jobType: job.jobType,
          priority: job.priority,
        },
      });
    }
  } catch {
    // If Sentry is not properly configured, return undefined
    transaction = undefined;
  }

  if (job.userId) {
    Sentry.setUser({ id: job.userId });
  }

  Sentry.setTag('job_type', job.jobType);
  Sentry.setTag('job_id', job.id);

  return transaction;
}

/**
 * Add a breadcrumb for job status change
 */
export function addJobStatusBreadcrumb(
  jobId: string,
  oldStatus: string,
  newStatus: string,
  reason?: string
) {
  Sentry.addBreadcrumb({
    category: 'agent.job',
    message: `Job status changed: ${oldStatus} → ${newStatus}`,
    level: newStatus === 'FAILED' ? 'error' : 'info',
    data: {
      jobId,
      oldStatus,
      newStatus,
      reason,
    },
    timestamp: Date.now() / 1000,
  });
}

/**
 * Add a breadcrumb for agent log entry
 */
export function addAgentLogBreadcrumb(
  jobId: string,
  agentName: string,
  action: string,
  message: string
) {
  Sentry.addBreadcrumb({
    category: 'agent.log',
    message: `${agentName}: ${action}`,
    level: action === 'error' ? 'error' : 'info',
    data: {
      jobId,
      agentName,
      action,
      message: message.substring(0, 200), // Limit message length
    },
    timestamp: Date.now() / 1000,
  });
}
