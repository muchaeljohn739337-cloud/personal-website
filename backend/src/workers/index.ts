import { jobService } from '../services/JobService';
import { logger } from '../utils/logger';
import { cleanupJob, updateExchangeRatesJob } from './cleanupWorker';
import { sendEmailJob, sendNotificationJob } from './emailWorker';
import { generateReportJob } from './reportWorker';
import { processTransactionJob } from './transactionWorker';

/**
 * Register all job workers with the job service
 */
export async function registerAllWorkers() {
  logger.info('Registering all job workers...');

  // Register transaction worker
  jobService.registerWorker(
    'PROCESS_TRANSACTION',
    processTransactionJob,
    'high-priority',
    { concurrency: 3 }
  );

  // Register email workers
  jobService.registerWorker(
    ['SEND_EMAIL', 'SEND_NOTIFICATION'],
    async (job) => {
      if (job.name === 'SEND_EMAIL') {
        return await sendEmailJob(job);
      } else if (job.name === 'SEND_NOTIFICATION') {
        return await sendNotificationJob(job);
      }
    },
    'default',
    { concurrency: 10 }
  );

  // Register report worker
  jobService.registerWorker(
    'GENERATE_REPORT',
    generateReportJob,
    'low-priority',
    { concurrency: 2 }
  );

  // Register cleanup workers
  jobService.registerWorker(
    ['CLEANUP_JOBS', 'UPDATE_EXCHANGE_RATES'],
    async (job) => {
      if (job.name === 'CLEANUP_JOBS' || job.data.type === 'CLEANUP_JOBS') {
        return await cleanupJob(job);
      } else if (job.name === 'UPDATE_EXCHANGE_RATES' || job.data.type === 'UPDATE_EXCHANGE_RATES') {
        return await updateExchangeRatesJob(job);
      }
    },
    'low-priority',
    { concurrency: 1 }
  );

  logger.info('✅ All job workers registered successfully');
}
