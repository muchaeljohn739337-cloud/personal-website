// Job Queue for Background Processing
// Handles async tasks without blocking user requests

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
type JobPriority = 'low' | 'normal' | 'high' | 'critical';

interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: unknown;
}

type JobHandler<T = unknown> = (data: T) => Promise<unknown>;

class JobQueue {
  private queue: Job[] = [];
  private handlers: Map<string, JobHandler> = new Map();
  private processing = false;
  private concurrency: number;
  private activeJobs = 0;

  constructor(concurrency = 5) {
    this.concurrency = concurrency;
  }

  /**
   * Register a job handler
   */
  register<T>(type: string, handler: JobHandler<T>): void {
    this.handlers.set(type, handler as JobHandler);
  }

  /**
   * Add a job to the queue
   */
  add<T>(
    type: string,
    data: T,
    options: { priority?: JobPriority; maxAttempts?: number } = {}
  ): string {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      priority: options.priority || 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: Date.now(),
    };

    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      (j) => priorityOrder[j.priority] > priorityOrder[job.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    // Start processing if not already
    this.process();

    return job.id;
  }

  /**
   * Get job status
   */
  getJob(id: string): Job | undefined {
    return this.queue.find((j) => j.id === id);
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const stats = { pending: 0, processing: 0, completed: 0, failed: 0, total: this.queue.length };

    for (const job of this.queue) {
      stats[job.status]++;
    }

    return stats;
  }

  /**
   * Process jobs in the queue
   */
  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.some((j) => j.status === 'pending') && this.activeJobs < this.concurrency) {
      const job = this.queue.find((j) => j.status === 'pending');
      if (!job) break;

      this.activeJobs++;
      job.status = 'processing';
      job.startedAt = Date.now();
      job.attempts++;

      const handler = this.handlers.get(job.type);

      if (!handler) {
        job.status = 'failed';
        job.error = `No handler registered for job type: ${job.type}`;
        this.activeJobs--;
        continue;
      }

      try {
        job.result = await handler(job.data);
        job.status = 'completed';
        job.completedAt = Date.now();
      } catch (error) {
        if (job.attempts < job.maxAttempts) {
          job.status = 'pending'; // Retry
        } else {
          job.status = 'failed';
          job.error = error instanceof Error ? error.message : 'Unknown error';
        }
      }

      this.activeJobs--;
    }

    this.processing = false;

    // Clean up old completed/failed jobs (keep last 100)
    const completedOrFailed = this.queue.filter(
      (j) => j.status === 'completed' || j.status === 'failed'
    );
    if (completedOrFailed.length > 100) {
      const toRemove = completedOrFailed.slice(0, completedOrFailed.length - 100);
      for (const job of toRemove) {
        const index = this.queue.indexOf(job);
        if (index > -1) this.queue.splice(index, 1);
      }
    }
  }

  /**
   * Clear all jobs
   */
  clear(): void {
    this.queue = [];
  }
}

// Singleton
let queueInstance: JobQueue | null = null;

export function getJobQueue(): JobQueue {
  if (!queueInstance) {
    queueInstance = new JobQueue(5);

    // Register default handlers
    queueInstance.register('email', async (data: { to: string; subject: string; body: string }) => {
      console.log(`[Queue] Sending email to ${data.to}: ${data.subject}`);
      // Implement actual email sending
      return { sent: true };
    });

    queueInstance.register('ai-task', async (data: { task: string; priority: number }) => {
      console.log(`[Queue] Processing AI task: ${data.task}`);
      // Implement AI task processing
      return { processed: true };
    });

    queueInstance.register('webhook', async (data: { url: string; payload: unknown }) => {
      console.log(`[Queue] Calling webhook: ${data.url}`);
      const response = await fetch(data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.payload),
      });
      return { status: response.status };
    });

    queueInstance.register('cleanup', async () => {
      console.log('[Queue] Running cleanup task');
      // Implement cleanup logic
      return { cleaned: true };
    });
  }

  return queueInstance;
}

// Convenience functions
export function addJob<T>(
  type: string,
  data: T,
  options?: { priority?: JobPriority; maxAttempts?: number }
): string {
  return getJobQueue().add(type, data, options);
}

export function getJobStatus(id: string): Job | undefined {
  return getJobQueue().getJob(id);
}

export function getQueueStats() {
  return getJobQueue().getStats();
}
