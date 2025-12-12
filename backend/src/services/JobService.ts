import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import { redis } from '../config/redis';
import prisma from '../prismaClient';
import { logger } from '../utils/logger';

export type JobType = 
  | 'PROCESS_TRANSACTION'
  | 'SEND_EMAIL'
  | 'GENERATE_REPORT'
  | 'CLEANUP_JOBS'
  | 'SEND_NOTIFICATION'
  | 'PROCESS_WITHDRAWAL'
  | 'UPDATE_EXCHANGE_RATES'
  | string;

export interface JobData {
  [key: string]: any;
}

export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  backoff?: {
    type: 'exponential' | 'fixed';
    delay: number;
  };
}

class JobService {
  private static instance: JobService;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService();
    }
    return JobService.instance;
  }

  public async initialize() {
    if (this.initialized) {
      logger.warn('JobService already initialized');
      return;
    }

    logger.info('Initializing JobService...');

    // Initialize default queues
    await this.createQueue('default');
    await this.createQueue('high-priority');
    await this.createQueue('low-priority');
    
    // Schedule cleanup job to run daily at midnight
    await this.scheduleJob(
      'CLEANUP_JOBS',
      '0 0 * * *',
      { retentionDays: 7 },
      'cleanup-old-jobs',
      'low-priority'
    );

    this.initialized = true;
    logger.info('✅ JobService initialized successfully');
  }

  private async createQueue(name: string): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    });

    const queueEvents = new QueueEvents(name, { connection: redis });

    this.queues.set(name, queue);
    this.queueEvents.set(name, queueEvents);

    this.setupQueueEvents(queue, queueEvents);

    logger.info(`Created queue: ${name}`);
    return queue;
  }

  private setupQueueEvents(queue: Queue, queueEvents: QueueEvents) {
    queueEvents.on('completed', async ({ jobId }) => {
      logger.info(`Job ${jobId} completed successfully`);
      
      // Log to database
      try {
        await prisma.jobLog.updateMany({
          where: { id: jobId },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });
      } catch (error) {
        logger.error(`Failed to update job log for ${jobId}:`, error);
      }
    });

    queueEvents.on('failed', async ({ jobId, failedReason }) => {
      logger.error(`Job ${jobId} failed: ${failedReason}`);
      
      // Log to database
      try {
        await prisma.jobLog.updateMany({
          where: { id: jobId },
          data: {
            status: 'failed',
            error: failedReason,
            failedAt: new Date(),
          },
        });
      } catch (error) {
        logger.error(`Failed to update job log for ${jobId}:`, error);
      }
    });

    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`Job ${jobId} stalled and will be reprocessed`);
    });

    queueEvents.on('progress', ({ jobId, data }) => {
      logger.debug(`Job ${jobId} progress: ${JSON.stringify(data)}`);
    });
  }

  public async addJob<T = any>(
    type: JobType,
    data: JobData,
    options: JobOptions = {},
    queueName: string = 'default'
  ): Promise<Job<T>> {
    const queue = this.queues.get(queueName) || await this.createQueue(queueName);
    const jobId = `${type}:${uuidv4()}`;
    
    const job = await queue.add(
      type,
      {
        id: jobId,
        ...data
      },
      {
        jobId,
        priority: options.priority || 1,
        delay: options.delay,
        attempts: options.attempts || 3,
        backoff: options.backoff || {
          type: 'exponential',
          delay: 5000, // 5 seconds
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      }
    );

    // Log to database
    try {
      await prisma.jobLog.create({
        data: {
          id: jobId,
          type,
          status: 'pending',
          data: data as any,
          priority: options.priority || 1,
          delay: options.delay || 0,
          maxAttempts: options.attempts || 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(`Failed to create job log for ${jobId}:`, error);
    }

    logger.info(`Added job ${job.id} to queue ${queueName}`);
    return job as Job<T>;
  }

  public async scheduleJob(
    type: JobType,
    cronPattern: string,
    data: JobData,
    jobName: string,
    queueName: string = 'default'
  ) {
    const queue = this.queues.get(queueName) || await this.createQueue(queueName);
    
    // Add a job that will be repeated
    await queue.add(
      jobName,
      { type, ...data },
      {
        repeat: {
          pattern: cronPattern,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
      }
    );

    logger.info(`Scheduled job ${jobName} (${type}) with pattern ${cronPattern}`);
  }

  public registerWorker<T = any>(
    jobTypes: JobType | JobType[],
    handler: (job: Job<T>) => Promise<void>,
    queueName: string = 'default',
    options: { concurrency?: number } = {}
  ) {
    const types = Array.isArray(jobTypes) ? jobTypes : [jobTypes];
    
    if (this.workers.has(queueName)) {
      logger.warn(`Worker for queue ${queueName} already exists`);
      return;
    }

    const worker = new Worker<T>(
      queueName,
      async (job) => {
        try {
          logger.info(`Processing job ${job.id} of type ${job.name}`);
          
          // Update job log start time
          await prisma.jobLog.updateMany({
            where: { id: job.id },
            data: {
              status: 'processing',
              startedAt: new Date(),
              attempts: { increment: 1 },
            },
          }).catch(() => {});

          await handler(job);
          
          logger.info(`Completed job ${job.id} successfully`);
        } catch (error) {
          logger.error(`Error processing job ${job.id}:`, error);
          throw error; // Will trigger retry logic
        }
      },
      {
        connection: redis,
        concurrency: options.concurrency || 5,
        limiter: {
          max: 10,
          duration: 1000,
        },
      }
    );

    worker.on('failed', (job, error) => {
      logger.error(`Job ${job?.id} failed:`, error);
    });

    worker.on('completed', (job) => {
      logger.info(`Worker completed job ${job.id}`);
    });

    this.workers.set(queueName, worker);
    logger.info(`Registered worker for queue: ${queueName}, job types: ${types.join(', ')}`);
  }

  public async getJobStatus(jobId: string, queueName: string = 'default') {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    const state = await job.getState();

    return {
      id: job.id,
      name: job.name,
      type: job.data.type,
      status: state,
      progress: job.progress,
      data: job.data,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      attemptsMade: job.attemptsMade,
    };
  }

  public async getQueueMetrics(queueName: string = 'default') {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [counts, workers] = await Promise.all([
      queue.getJobCounts(),
      queue.getWorkers()
    ]);

    return {
      name: queueName,
      ...counts,
      workerCount: workers.length,
    };
  }

  public async getAllQueueMetrics() {
    const metrics = [];
    for (const queueName of this.queues.keys()) {
      try {
        const queueMetrics = await this.getQueueMetrics(queueName);
        metrics.push(queueMetrics);
      } catch (error) {
        logger.error(`Failed to get metrics for queue ${queueName}:`, error);
      }
    }
    return metrics;
  }

  public async cleanupOldJobs(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    logger.info(`Cleaning up jobs older than ${days} days (before ${cutoffDate.toISOString()})`);

    try {
      // Clean up completed jobs
      const completedCount = await prisma.jobLog.deleteMany({
        where: {
          status: 'completed',
          completedAt: {
            lt: cutoffDate,
          },
        },
      });

      // Clean up failed jobs
      const failedCount = await prisma.jobLog.deleteMany({
        where: {
          status: 'failed',
          failedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${completedCount.count} completed and ${failedCount.count} failed jobs`);
      
      return {
        completedJobs: completedCount.count,
        failedJobs: failedCount.count,
        total: completedCount.count + failedCount.count,
      };
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      throw error;
    }
  }

  public async shutdown() {
    logger.info('Shutting down JobService...');

    // Close all workers
    for (const [queueName, worker] of this.workers.entries()) {
      await worker.close();
      logger.info(`Worker for ${queueName} shut down`);
    }

    // Close all queues
    for (const [queueName, queue] of this.queues.entries()) {
      await queue.close();
      logger.info(`Queue ${queueName} closed`);
    }

    // Close all queue events
    for (const [queueName, queueEvents] of this.queueEvents.entries()) {
      await queueEvents.close();
      logger.info(`Queue events for ${queueName} closed`);
    }

    this.initialized = false;
    logger.info('✅ Job service shut down successfully');
  }
}

// Singleton export
export const jobService = JobService.getInstance();

// Graceful shutdown
const shutdown = async () => {
  logger.info('Received shutdown signal. Shutting down job service...');
  await jobService.shutdown();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default jobService;
