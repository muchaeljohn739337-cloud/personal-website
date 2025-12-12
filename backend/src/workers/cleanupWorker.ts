import { Job } from 'bullmq';
import prisma from '../prismaClient';
import { jobService } from '../services/JobService';
import { logger } from '../utils/logger';

/**
 * Cleanup Worker - Performs maintenance and cleanup tasks
 */
export async function cleanupJob(job: Job) {
  const { retentionDays = 7 } = job.data;
  
  logger.info(`Running cleanup job with ${retentionDays} days retention`);

  try {
    await job.updateProgress(10);

    // Clean up old job logs
    const jobsCleanup = await jobService.cleanupOldJobs(retentionDays);
    
    await job.updateProgress(30);

    // Clean up old notifications
    const notificationsCleanup = await cleanupOldNotifications(retentionDays);
    
    await job.updateProgress(50);

    // Clean up old audit logs
    const auditLogsCleanup = await cleanupOldAuditLogs(retentionDays * 3); // Keep audit logs longer
    
    await job.updateProgress(70);

    // Clean up old sessions
    const sessionsCleanup = await cleanupExpiredSessions();
    
    await job.updateProgress(90);

    // Clean up orphaned records
    const orphanedCleanup = await cleanupOrphanedRecords();

    await job.updateProgress(100);

    const results = {
      jobLogs: jobsCleanup,
      notifications: notificationsCleanup,
      auditLogs: auditLogsCleanup,
      sessions: sessionsCleanup,
      orphaned: orphanedCleanup,
    };

    logger.info('Cleanup job completed:', results);
    return results;
  } catch (error) {
    logger.error('Cleanup job failed:', error);
    throw error;
  }
}

async function cleanupOldNotifications(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.notifications.deleteMany({
    where: {
      isRead: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info(`Cleaned up ${result.count} old notifications`);
  return result.count;
}

async function cleanupOldAuditLogs(days: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.audit_logs.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info(`Cleaned up ${result.count} old audit logs`);
  return result.count;
}

async function cleanupExpiredSessions() {
  const result = await prisma.sessions.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  logger.info(`Cleaned up ${result.count} expired sessions`);
  return result.count;
}

async function cleanupOrphanedRecords() {
  let totalCleaned = 0;

  // Clean up notifications for deleted users
  // This is just an example - adjust based on your schema
  try {
    const orphanedNotifications = await prisma.notifications.deleteMany({
      where: {
        userId: {
          notIn: (await prisma.users.findMany({ select: { id: true } })).map(u => u.id),
        },
      },
    });
    totalCleaned += orphanedNotifications.count;
  } catch (error) {
    logger.error('Failed to cleanup orphaned notifications:', error);
  }

  logger.info(`Cleaned up ${totalCleaned} orphaned records`);
  return totalCleaned;
}

/**
 * Update Exchange Rates Worker
 */
export async function updateExchangeRatesJob(job: Job) {
  logger.info('Updating crypto exchange rates');

  try {
    await job.updateProgress(10);

    // This is a placeholder - integrate with actual exchange rate API
    const rates = {
      BTC: 50000,
      ETH: 3000,
      USDT: 1,
      LTC: 150,
    };

    await job.updateProgress(50);

    // Update in database (adjust based on your schema)
    // await prisma.admin_settings.update({...});

    await job.updateProgress(100);

    logger.info('Exchange rates updated:', rates);
    return rates;
  } catch (error) {
    logger.error('Failed to update exchange rates:', error);
    throw error;
  }
}
