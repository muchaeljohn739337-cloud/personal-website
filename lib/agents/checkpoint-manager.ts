/**
 * Checkpoint Manager
 * Utility functions for creating, updating, and querying agent checkpoints
 */

import { CheckpointStatus, CheckpointType, Prisma } from '@prisma/client';

import { prisma } from '../prismaClient';

export interface CreateCheckpointInput {
  jobId: string;
  checkpointType: CheckpointType;
  message: string;
  data?: Prisma.JsonValue;
  metadata?: Prisma.JsonValue;
  expiresAt?: Date;
}

export interface UpdateCheckpointInput {
  status?: CheckpointStatus;
  approvedBy?: string;
  rejectionReason?: string;
}

/**
 * Create a new checkpoint for an agent job
 */
export async function createCheckpoint(input: CreateCheckpointInput) {
  // Set default expiration to 24 hours from now if not provided
  const expiresAt = input.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

  const checkpoint = await prisma.agentCheckpoint.create({
    data: {
      jobId: input.jobId,
      checkpointType: input.checkpointType,
      message: input.message,
      data: input.data as Prisma.InputJsonValue,
      metadata: input.metadata as Prisma.InputJsonValue,
      expiresAt,
      status: CheckpointStatus.PENDING,
    },
    include: {
      job: {
        select: {
          id: true,
          jobType: true,
          status: true,
          taskDescription: true,
        },
      },
    },
  });

  return checkpoint;
}

/**
 * Get a checkpoint by ID
 */
export async function getCheckpoint(checkpointId: string) {
  return prisma.agentCheckpoint.findUnique({
    where: { id: checkpointId },
    include: {
      job: {
        include: {
          logs: {
            orderBy: { createdAt: 'asc' },
            take: 100, // Limit logs to prevent huge responses
          },
        },
      },
    },
  });
}

/**
 * List checkpoints for a job
 */
export async function listCheckpointsByJob(jobId: string) {
  return prisma.agentCheckpoint.findMany({
    where: { jobId },
    orderBy: { createdAt: 'asc' },
    include: {
      job: {
        select: {
          id: true,
          jobType: true,
          status: true,
        },
      },
    },
  });
}

/**
 * List pending checkpoints (for admin review)
 */
export async function listPendingCheckpoints(options?: {
  limit?: number;
  offset?: number;
  checkpointType?: CheckpointType;
}) {
  const where: Prisma.AgentCheckpointWhereInput = {
    status: CheckpointStatus.PENDING,
    // Only include non-expired checkpoints
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
  };

  if (options?.checkpointType) {
    where.checkpointType = options.checkpointType;
  }

  return prisma.agentCheckpoint.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    take: options?.limit || 50,
    skip: options?.offset || 0,
    include: {
      job: {
        select: {
          id: true,
          jobType: true,
          status: true,
          taskDescription: true,
          userId: true,
          createdAt: true,
        },
      },
    },
  });
}

/**
 * Approve a checkpoint
 */
export async function approveCheckpoint(checkpointId: string, approvedBy: string) {
  const checkpoint = await prisma.agentCheckpoint.update({
    where: { id: checkpointId },
    data: {
      status: CheckpointStatus.APPROVED,
      approvedBy,
      approvedAt: new Date(),
    },
    include: {
      job: true,
    },
  });

  return checkpoint;
}

/**
 * Reject a checkpoint
 */
export async function rejectCheckpoint(
  checkpointId: string,
  approvedBy: string,
  rejectionReason: string
) {
  const checkpoint = await prisma.agentCheckpoint.update({
    where: { id: checkpointId },
    data: {
      status: CheckpointStatus.REJECTED,
      approvedBy,
      approvedAt: new Date(),
      rejectionReason,
    },
    include: {
      job: true,
    },
  });

  return checkpoint;
}

/**
 * Check if a checkpoint requires approval before job can continue
 */
export function requiresApproval(checkpointType: CheckpointType): boolean {
  return checkpointType === CheckpointType.APPROVAL_REQUIRED;
}

/**
 * Check if a checkpoint is blocking (requires approval and is pending)
 */
export async function isCheckpointBlocking(checkpointId: string): Promise<boolean> {
  const checkpoint = await prisma.agentCheckpoint.findUnique({
    where: { id: checkpointId },
    select: {
      checkpointType: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!checkpoint) return false;

  // Check if expired
  if (checkpoint.expiresAt && checkpoint.expiresAt < new Date()) {
    // Auto-expire
    await prisma.agentCheckpoint.update({
      where: { id: checkpointId },
      data: { status: CheckpointStatus.EXPIRED },
    });
    return false;
  }

  return (
    requiresApproval(checkpoint.checkpointType) && checkpoint.status === CheckpointStatus.PENDING
  );
}

/**
 * Get the latest pending checkpoint for a job that requires approval
 */
export async function getBlockingCheckpoint(jobId: string) {
  return prisma.agentCheckpoint.findFirst({
    where: {
      jobId,
      checkpointType: CheckpointType.APPROVAL_REQUIRED,
      status: CheckpointStatus.PENDING,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Expire old checkpoints (should be run periodically)
 */
export async function expireOldCheckpoints() {
  const result = await prisma.agentCheckpoint.updateMany({
    where: {
      status: CheckpointStatus.PENDING,
      expiresAt: {
        lt: new Date(),
      },
    },
    data: {
      status: CheckpointStatus.EXPIRED,
    },
  });

  return result.count;
}
