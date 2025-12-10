/**
 * Email Workers System
 * Handles all email processing tasks with dedicated workers
 * Each worker knows their specific role and responsibilities
 */

import { prisma } from '../prismaClient';
import { sendEmail, sendTemplatedEmail } from './index';

export interface EmailWorker {
  id: string;
  name: string;
  role: EmailWorkerRole;
  status: 'active' | 'idle' | 'processing' | 'error';
  currentJob?: string;
  processedCount: number;
  errorCount: number;
  lastActivity: Date;
}

export type EmailWorkerRole =
  | 'transactional'
  | 'marketing'
  | 'support'
  | 'security'
  | 'billing'
  | 'verification'
  | 'notifications';

class EmailWorkerSystem {
  private workers: Map<string, EmailWorker> = new Map();
  private jobQueue: Array<EmailJob> = [];
  private isProcessing = false;

  constructor() {
    this.initializeWorkers();
  }

  /**
   * Initialize email workers
   */
  private initializeWorkers() {
    const workerRoles: EmailWorkerRole[] = [
      'transactional',
      'marketing',
      'support',
      'security',
      'billing',
      'verification',
      'notifications',
    ];

    workerRoles.forEach((role) => {
      const worker: EmailWorker = {
        id: `worker_${role}_${Date.now()}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} Email Worker`,
        role,
        status: 'idle',
        processedCount: 0,
        errorCount: 0,
        lastActivity: new Date(),
      };
      this.workers.set(worker.id, worker);
    });

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(job: EmailJob): Promise<string> {
    const jobId = `email_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    job.id = jobId;
    job.createdAt = new Date();
    job.status = 'PENDING';

    this.jobQueue.push(job);

    // Log job
    const toEmail = Array.isArray(job.to) ? job.to[0] : job.to;
    if (toEmail) {
      await prisma.emailLog.create({
        data: {
          toEmail,
          fromEmail: job.from || 'noreply@advanciapayledger.com',
          subject: job.subject,
          status: 'PENDING',
          provider: 'RESEND',
        },
      });
    }

    return jobId;
  }

  /**
   * Start processing email queue
   */
  private startProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    setInterval(async () => {
      if (this.jobQueue.length === 0) return;

      const job = this.jobQueue.shift();
      if (!job) return;

      await this.processEmailJob(job);
    }, 1000); // Process every second
  }

  /**
   * Process email job with appropriate worker
   */
  private async processEmailJob(job: EmailJob): Promise<void> {
    const worker = this.getWorkerForJob(job);
    if (!worker) {
      console.error(`[EmailWorkers] No worker available for job: ${job.id}`);
      return;
    }

    worker.status = 'processing';
    worker.currentJob = job.id;
    worker.lastActivity = new Date();

    try {
      job.status = 'PROCESSING';

      if (job.template) {
        const toEmail = Array.isArray(job.to) ? job.to[0] : job.to;
        if (toEmail) {
          await sendTemplatedEmail(job.template, toEmail, job.variables || {}, job.userId);
        }
      } else {
        await sendEmail({
          to: job.to,
          subject: job.subject,
          html: job.html || '',
          text: job.text || '',
          from: job.from,
          userId: job.userId,
        });
      }

      job.status = 'COMPLETED';
      worker.processedCount++;
      worker.status = 'idle';
      worker.currentJob = undefined;

      // Update email log
      await prisma.emailLog.updateMany({
        where: { toEmail: Array.isArray(job.to) ? job.to[0] : job.to },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      job.status = 'FAILED';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      worker.errorCount++;
      worker.status = 'error';

      // Update email log
      const toEmail = Array.isArray(job.to) ? job.to[0] : job.to;
      if (toEmail) {
        await prisma.emailLog.updateMany({
          where: { toEmail },
          data: {
            status: 'FAILED',
            errorMessage: job.error,
          },
        });
      }

      // Retry logic
      const retryCount = job.retryCount || 0;
      const maxRetries = job.maxRetries || 3;
      if (retryCount < maxRetries) {
        job.retryCount = retryCount + 1;
        job.status = 'PENDING';
        this.jobQueue.push(job);
      }
    }
  }

  /**
   * Get appropriate worker for job
   */
  private getWorkerForJob(job: EmailJob): EmailWorker | null {
    let role: EmailWorkerRole = 'transactional';

    if (job.role) {
      role = job.role;
    } else if (job.template) {
      // Determine role from template
      if (job.template.includes('verification') || job.template.includes('verify')) {
        role = 'verification';
      } else if (job.template.includes('security') || job.template.includes('login')) {
        role = 'security';
      } else if (job.template.includes('billing') || job.template.includes('payment')) {
        role = 'billing';
      } else if (job.template.includes('support')) {
        role = 'support';
      }
    }

    // Find available worker for this role
    for (const worker of this.workers.values()) {
      if (worker.role === role && worker.status === 'idle') {
        return worker;
      }
    }

    // Fallback to any idle worker
    for (const worker of this.workers.values()) {
      if (worker.status === 'idle') {
        return worker;
      }
    }

    return null;
  }

  /**
   * Get worker status
   */
  getWorkersStatus(): EmailWorker[] {
    return Array.from(this.workers.values());
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { pending: number; processing: number; completed: number; failed: number } {
    return {
      pending: this.jobQueue.filter((j) => j.status === 'PENDING').length,
      processing: this.jobQueue.filter((j) => j.status === 'PROCESSING').length,
      completed: this.jobQueue.filter((j) => j.status === 'COMPLETED').length,
      failed: this.jobQueue.filter((j) => j.status === 'FAILED').length,
    };
  }
}

interface EmailJob {
  id?: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  template?: keyof typeof import('./index').EMAIL_TEMPLATES;
  variables?: Record<string, string>;
  role?: EmailWorkerRole;
  userId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt?: Date;
  retryCount?: number;
  maxRetries?: number;
  error?: string;
}

// Singleton instance
let workerSystemInstance: EmailWorkerSystem | null = null;

export function getEmailWorkerSystem(): EmailWorkerSystem {
  if (!workerSystemInstance) {
    workerSystemInstance = new EmailWorkerSystem();
  }
  return workerSystemInstance;
}

// Convenience function to send email through workers
export async function sendEmailViaWorker(
  job: Omit<EmailJob, 'id' | 'status' | 'createdAt'>
): Promise<string> {
  const system = getEmailWorkerSystem();
  return system.addEmailJob(job as EmailJob);
}
