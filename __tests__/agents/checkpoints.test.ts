/**
 * Agent Checkpoints Tests
 * Tests for checkpoint creation, approval, and rejection
 */

import { CheckpointStatus, CheckpointType } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prismaClient', () => ({
  prisma: {
    agentCheckpoint: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prismaClient';
import {
  createCheckpoint,
  getCheckpoint,
  approveCheckpoint,
  rejectCheckpoint,
  listCheckpointsByJob,
  getBlockingCheckpoint,
} from '@/lib/agents/checkpoint-manager';

describe('Agent Checkpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Create Checkpoint', () => {
    it('should create a checkpoint with all required fields', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.PENDING,
        message: 'Test checkpoint message',
        data: { test: 'data' },
        metadata: { handler: 'test' },
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          jobType: 'test',
          status: 'RUNNING',
          taskDescription: 'Test task',
        },
      };

      (prisma.agentCheckpoint.create as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await createCheckpoint({
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        message: 'Test checkpoint message',
        data: { test: 'data' },
        metadata: { handler: 'test' },
      });

      expect(checkpoint).toBeDefined();
      expect(checkpoint.checkpointType).toBe(CheckpointType.APPROVAL_REQUIRED);
      expect(checkpoint.status).toBe(CheckpointStatus.PENDING);
      expect(checkpoint.message).toBe('Test checkpoint message');
      expect(prisma.agentCheckpoint.create).toHaveBeenCalled();
    });

    it('should set default expiration to 24 hours if not provided', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.PENDING,
        message: 'Test',
        data: null,
        metadata: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          jobType: 'test',
          status: 'RUNNING',
          taskDescription: 'Test',
        },
      };

      (prisma.agentCheckpoint.create as jest.Mock).mockResolvedValue(mockCheckpoint);

      await createCheckpoint({
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        message: 'Test',
      });

      expect(prisma.agentCheckpoint.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Get Checkpoint', () => {
    it('should retrieve a checkpoint by ID', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.PENDING,
        message: 'Test',
        data: null,
        metadata: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          jobType: 'test',
          status: 'RUNNING',
          taskDescription: 'Test',
          logs: [],
        },
      };

      (prisma.agentCheckpoint.findUnique as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await getCheckpoint('checkpoint-1');

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.id).toBe('checkpoint-1');
      expect(prisma.agentCheckpoint.findUnique).toHaveBeenCalledWith({
        where: { id: 'checkpoint-1' },
        include: expect.any(Object),
      });
    });
  });

  describe('Approve Checkpoint', () => {
    it('should approve a pending checkpoint', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.APPROVED,
        message: 'Test',
        data: null,
        metadata: null,
        approvedBy: 'admin-1',
        approvedAt: new Date(),
        rejectionReason: null,
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          jobType: 'test',
          status: 'RUNNING',
          taskDescription: 'Test',
        },
      };

      (prisma.agentCheckpoint.update as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await approveCheckpoint('checkpoint-1', 'admin-1');

      expect(checkpoint).toBeDefined();
      expect(checkpoint.status).toBe(CheckpointStatus.APPROVED);
      expect(checkpoint.approvedBy).toBe('admin-1');
      expect(checkpoint.approvedAt).toBeDefined();
      expect(prisma.agentCheckpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'checkpoint-1' },
          data: expect.objectContaining({
            status: CheckpointStatus.APPROVED,
            approvedBy: 'admin-1',
          }),
        })
      );
    });
  });

  describe('Reject Checkpoint', () => {
    it('should reject a pending checkpoint with reason', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.REJECTED,
        message: 'Test',
        data: null,
        metadata: null,
        approvedBy: 'admin-1',
        approvedAt: new Date(),
        rejectionReason: 'Not approved',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        job: {
          id: 'job-1',
          jobType: 'test',
          status: 'RUNNING',
          taskDescription: 'Test',
        },
      };

      (prisma.agentCheckpoint.update as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await rejectCheckpoint('checkpoint-1', 'admin-1', 'Not approved');

      expect(checkpoint).toBeDefined();
      expect(checkpoint.status).toBe(CheckpointStatus.REJECTED);
      expect(checkpoint.rejectionReason).toBe('Not approved');
      expect(prisma.agentCheckpoint.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'checkpoint-1' },
          data: expect.objectContaining({
            status: CheckpointStatus.REJECTED,
            rejectionReason: 'Not approved',
          }),
        })
      );
    });
  });

  describe('List Checkpoints by Job', () => {
    it('should list all checkpoints for a job', async () => {
      const mockCheckpoints = [
        {
          id: 'checkpoint-1',
          jobId: 'job-1',
          checkpointType: CheckpointType.APPROVAL_REQUIRED,
          status: CheckpointStatus.PENDING,
          message: 'First checkpoint',
          createdAt: new Date(),
          job: { id: 'job-1', jobType: 'test', status: 'RUNNING' },
        },
        {
          id: 'checkpoint-2',
          jobId: 'job-1',
          checkpointType: CheckpointType.INFO,
          status: CheckpointStatus.APPROVED,
          message: 'Second checkpoint',
          createdAt: new Date(),
          job: { id: 'job-1', jobType: 'test', status: 'RUNNING' },
        },
      ];

      (prisma.agentCheckpoint.findMany as jest.Mock).mockResolvedValue(mockCheckpoints);

      const checkpoints = await listCheckpointsByJob('job-1');

      expect(checkpoints).toHaveLength(2);
      expect(checkpoints[0].id).toBe('checkpoint-1');
      expect(prisma.agentCheckpoint.findMany).toHaveBeenCalledWith({
        where: { jobId: 'job-1' },
        orderBy: { createdAt: 'asc' },
        include: expect.any(Object),
      });
    });
  });

  describe('Get Blocking Checkpoint', () => {
    it('should return the latest pending approval-required checkpoint', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.PENDING,
        message: 'Blocking checkpoint',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      (prisma.agentCheckpoint.findFirst as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await getBlockingCheckpoint('job-1');

      expect(checkpoint).toBeDefined();
      expect(checkpoint?.checkpointType).toBe(CheckpointType.APPROVAL_REQUIRED);
      expect(checkpoint?.status).toBe(CheckpointStatus.PENDING);
      expect(prisma.agentCheckpoint.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            jobId: 'job-1',
            checkpointType: CheckpointType.APPROVAL_REQUIRED,
            status: CheckpointStatus.PENDING,
          }),
        })
      );
    });

    it('should return null if no blocking checkpoint exists', async () => {
      (prisma.agentCheckpoint.findFirst as jest.Mock).mockResolvedValue(null);

      const checkpoint = await getBlockingCheckpoint('job-1');

      expect(checkpoint).toBeNull();
    });
  });

  describe('Checkpoint Expiration', () => {
    it('should expire old checkpoints', async () => {
      (prisma.agentCheckpoint.updateMany as jest.Mock).mockResolvedValue({ count: 5 });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { expireOldCheckpoints } = require('@/lib/agents/checkpoint-manager');
      const count = await expireOldCheckpoints();

      expect(count).toBe(5);
      expect(prisma.agentCheckpoint.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: CheckpointStatus.PENDING,
            expiresAt: expect.any(Object),
          }),
          data: {
            status: CheckpointStatus.EXPIRED,
          },
        })
      );
    });
  });
});
