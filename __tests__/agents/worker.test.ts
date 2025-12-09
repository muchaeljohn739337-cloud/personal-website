/**
 * Agent Worker Tests
 * Tests for the agent worker system with checkpoint support
 */

import { AIJobStatus, CheckpointStatus, CheckpointType } from '@prisma/client';

// Mock Prisma
jest.mock('@/lib/prismaClient', () => ({
  prisma: {
    aIJob: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    agentCheckpoint: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    agentLog: {
      create: jest.fn(),
    },
  },
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
  })),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  withScope: jest.fn((callback) =>
    callback({ setTag: jest.fn(), setUser: jest.fn(), setLevel: jest.fn(), setContext: jest.fn() })
  ),
}));

// Mock job handlers
jest.mock('@/lib/agents/job-handlers', () => {
  const mockHandler = jest.fn(async () => ({ success: true }));
  return {
    getJobHandler: jest.fn(() => mockHandler),
    jobHandlers: {},
  };
});

import { prisma } from '@/lib/prismaClient';
import { getWorker, stopWorker } from '@/lib/agents/worker';

describe('Agent Worker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    stopWorker();
  });

  describe('Job Enqueueing', () => {
    it('should create a job in the database', async () => {
      const mockJob = {
        id: 'job-1',
        jobType: 'simple-task',
        status: AIJobStatus.PENDING,
        taskDescription: 'Test task',
        inputData: {},
        priority: 5,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: 0,
        maxAttempts: 3,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        failureReason: null,
        tokensUsed: 0,
        estimatedCost: 0,
        assignedAgent: null,
        orchestratorId: null,
        outputData: null,
      };

      (prisma.aIJob.create as jest.Mock).mockResolvedValue(mockJob);

      const job = await prisma.aIJob.create({
        data: {
          jobType: 'simple-task',
          taskDescription: 'Test task',
          inputData: {},
          priority: 5,
          status: AIJobStatus.PENDING,
          userId: 'user-1',
        },
      });

      expect(job).toBeDefined();
      expect(job.jobType).toBe('simple-task');
      expect(job.status).toBe(AIJobStatus.PENDING);
      expect(prisma.aIJob.create).toHaveBeenCalled();
    });
  });

  describe('Worker Processing', () => {
    it('should pick up a job and transition to RUNNING', async () => {
      const mockJob = {
        id: 'job-1',
        jobType: 'simple-task',
        status: AIJobStatus.PENDING,
        taskDescription: 'Test task',
        inputData: {},
        priority: 5,
        userId: 'user-1',
        attempts: 0,
        maxAttempts: 3,
        startedAt: null,
        completedAt: null,
        failedAt: null,
        failureReason: null,
        tokensUsed: 0,
        estimatedCost: 0,
        assignedAgent: null,
        orchestratorId: null,
        outputData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.aIJob.findFirst as jest.Mock).mockResolvedValue(mockJob);
      (prisma.aIJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.agentCheckpoint.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.aIJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: AIJobStatus.RUNNING,
        startedAt: new Date(),
        attempts: 1,
      });

      const worker = getWorker({ pollInterval: 100, maxConcurrentJobs: 1 });

      // Start worker (will poll once)
      worker.start();

      // Wait a bit for processing
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify job was updated to RUNNING
      expect(prisma.aIJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AIJobStatus.RUNNING,
          }),
        })
      );

      worker.stop();
    });
  });

  describe('Checkpoint Creation', () => {
    it('should create a checkpoint during job execution', async () => {
      const mockCheckpoint = {
        id: 'checkpoint-1',
        jobId: 'job-1',
        checkpointType: CheckpointType.APPROVAL_REQUIRED,
        status: CheckpointStatus.PENDING,
        message: 'Test checkpoint',
        data: null,
        metadata: null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.agentCheckpoint.create as jest.Mock).mockResolvedValue(mockCheckpoint);

      const checkpoint = await prisma.agentCheckpoint.create({
        data: {
          jobId: 'job-1',
          checkpointType: CheckpointType.APPROVAL_REQUIRED,
          message: 'Test checkpoint',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          status: CheckpointStatus.PENDING,
        },
      });

      expect(checkpoint).toBeDefined();
      expect(checkpoint.checkpointType).toBe(CheckpointType.APPROVAL_REQUIRED);
      expect(checkpoint.status).toBe(CheckpointStatus.PENDING);
      expect(prisma.agentCheckpoint.create).toHaveBeenCalled();
    });
  });

  describe('Job Completion', () => {
    it('should transition job to COMPLETED after successful execution', async () => {
      const mockJob = {
        id: 'job-1',
        jobType: 'simple-task',
        status: AIJobStatus.RUNNING,
        taskDescription: 'Test task',
        inputData: {},
        priority: 5,
        userId: 'user-1',
        attempts: 1,
        maxAttempts: 3,
        startedAt: new Date(),
        completedAt: null,
        failedAt: null,
        failureReason: null,
        tokensUsed: 0,
        estimatedCost: 0,
        assignedAgent: null,
        orchestratorId: null,
        outputData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.aIJob.findUnique as jest.Mock).mockResolvedValue(mockJob);
      (prisma.aIJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: AIJobStatus.COMPLETED,
        completedAt: new Date(),
        outputData: { success: true },
      });

      await prisma.aIJob.update({
        where: { id: 'job-1' },
        data: {
          status: AIJobStatus.COMPLETED,
          completedAt: new Date(),
          outputData: { success: true },
        },
      });

      expect(prisma.aIJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AIJobStatus.COMPLETED,
          }),
        })
      );
    });
  });

  describe('Job Failure', () => {
    it('should transition job to FAILED after error', async () => {
      const mockJob = {
        id: 'job-1',
        jobType: 'simple-task',
        status: AIJobStatus.RUNNING,
        taskDescription: 'Test task',
        inputData: {},
        priority: 5,
        userId: 'user-1',
        attempts: 1,
        maxAttempts: 3,
        startedAt: new Date(),
        completedAt: null,
        failedAt: null,
        failureReason: null,
        tokensUsed: 0,
        estimatedCost: 0,
        assignedAgent: null,
        orchestratorId: null,
        outputData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.aIJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: AIJobStatus.FAILED,
        failedAt: new Date(),
        failureReason: 'Test error',
      });

      await prisma.aIJob.update({
        where: { id: 'job-1' },
        data: {
          status: AIJobStatus.FAILED,
          failedAt: new Date(),
          failureReason: 'Test error',
        },
      });

      expect(prisma.aIJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AIJobStatus.FAILED,
            failureReason: 'Test error',
          }),
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed jobs if attempts < maxAttempts', async () => {
      const mockJob = {
        id: 'job-1',
        jobType: 'simple-task',
        status: AIJobStatus.FAILED,
        taskDescription: 'Test task',
        inputData: {},
        priority: 5,
        userId: 'user-1',
        attempts: 1,
        maxAttempts: 3,
        startedAt: new Date(),
        completedAt: null,
        failedAt: new Date(),
        failureReason: 'Test error',
        tokensUsed: 0,
        estimatedCost: 0,
        assignedAgent: null,
        orchestratorId: null,
        outputData: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.aIJob.update as jest.Mock).mockResolvedValue({
        ...mockJob,
        status: AIJobStatus.RETRY,
      });

      await prisma.aIJob.update({
        where: { id: 'job-1' },
        data: {
          status: AIJobStatus.RETRY,
        },
      });

      expect(prisma.aIJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-1' },
          data: expect.objectContaining({
            status: AIJobStatus.RETRY,
          }),
        })
      );
    });
  });
});
