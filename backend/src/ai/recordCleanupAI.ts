/**
 * ═══════════════════════════════════════════════════════════════
 * RECORD CLEANUP AI - AUTOMATED DATA MAINTENANCE
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Remove redundant/outdated records, ensure data hygiene
 * Features:
 * - Scan databases, logs, job histories for old records
 * - Archive or safely delete obsolete entries with audit logs
 * - Maintain data consistency across all tables
 * - Auto-sync with unified instruction set
 * Integration: Guardian AI, Auto-Remember, Audit Logs
 * ═══════════════════════════════════════════════════════════════
 */

import prisma from "../prismaClient";
import { guardianAI } from "./guardian_integration";

interface CleanupConfig {
  jobRetentionDays: number;
  logRetentionDays: number;
  auditRetentionDays: number;
  sessionRetentionDays: number;
  notificationRetentionDays: number;
  archiveBeforeDelete: boolean;
  dryRun: boolean;
}

interface CleanupResult {
  recordsCleaned: number;
  recordsArchived: number;
  errors: string[];
  summary: {
    jobs: number;
    logs: number;
    audits: number;
    sessions: number;
    notifications: number;
  };
  timestamp: Date;
}

class RecordCleanupAI {
  private config: CleanupConfig = {
    jobRetentionDays: 30,
    logRetentionDays: 90,
    auditRetentionDays: 365,
    sessionRetentionDays: 7,
    notificationRetentionDays: 30,
    archiveBeforeDelete: true,
    dryRun: false,
  };

  /**
   * Main cleanup orchestrator - runs all cleanup tasks
   */
  async cleanAllOldRecords(customConfig?: Partial<CleanupConfig>): Promise<CleanupResult> {
    const config = { ...this.config, ...customConfig };
    console.log("🧹 Record Cleanup AI - Starting automated cleanup...");
    console.log(`   Dry Run: ${config.dryRun ? "YES (no deletions)" : "NO"}`);

    const result: CleanupResult = {
      recordsCleaned: 0,
      recordsArchived: 0,
      errors: [],
      summary: {
        jobs: 0,
        logs: 0,
        audits: 0,
        sessions: 0,
        notifications: 0,
      },
      timestamp: new Date(),
    };

    try {
      // 1. Clean old jobs
      const jobsResult = await this.cleanOldJobs(config);
      result.summary.jobs = jobsResult.cleaned;
      result.recordsCleaned += jobsResult.cleaned;
      result.recordsArchived += jobsResult.archived;

      // 2. Clean old audit logs (keep longer for compliance)
      const auditResult = await this.cleanOldAuditLogs(config);
      result.summary.audits = auditResult.cleaned;
      result.recordsCleaned += auditResult.cleaned;

      // 3. Clean old notifications (already read/dismissed)
      const notificationResult = await this.cleanOldNotifications(config);
      result.summary.notifications = notificationResult.cleaned;
      result.recordsCleaned += notificationResult.cleaned;

      // 4. Clean expired sessions
      const sessionResult = await this.cleanExpiredSessions(config);
      result.summary.sessions = sessionResult.cleaned;
      result.recordsCleaned += sessionResult.cleaned;

      // 5. Clean orphaned records (referential integrity)
      await this.cleanOrphanedRecords(config);

      // 6. Log cleanup action to Guardian AI
      await guardianAI.logAction("system", "record_cleanup", "Automated cleanup completed", {
        recordsCleaned: result.recordsCleaned,
        recordsArchived: result.recordsArchived,
        summary: result.summary,
      });

      console.log(`✅ Cleanup complete: ${result.recordsCleaned} records cleaned, ${result.recordsArchived} archived`);
      return result;
    } catch (error) {
      console.error("❌ Record cleanup failed:", error);
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
      return result;
    }
  }

  /**
   * Clean old completed/failed jobs (background tasks, cron jobs)
   */
  private async cleanOldJobs(config: CleanupConfig): Promise<{ cleaned: number; archived: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.jobRetentionDays);

    console.log(`   Cleaning jobs older than ${config.jobRetentionDays} days...`);

    try {
      // Find old completed/failed jobs
      const oldJobs = await prisma.job.findMany({
        where: {
          AND: [
            { updatedAt: { lt: cutoffDate } },
            {
              OR: [{ status: "completed" }, { status: "failed" }],
            },
          ],
        },
      });

      if (config.dryRun) {
        console.log(`   [DRY RUN] Would clean ${oldJobs.length} old jobs`);
        return { cleaned: 0, archived: 0 };
      }

      let archived = 0;
      if (config.archiveBeforeDelete) {
        // Archive jobs before deletion (optional: save to separate archive table)
        for (const job of oldJobs) {
          await guardianAI.logAction("system", "job_archived", `Archived job ${job.id}`, { job });
          archived++;
        }
      }

      // Delete old jobs
      const deleteResult = await prisma.job.deleteMany({
        where: {
          id: { in: oldJobs.map((j) => j.id) },
        },
      });

      console.log(`   ✅ Cleaned ${deleteResult.count} old jobs`);
      return { cleaned: deleteResult.count, archived };
    } catch (error) {
      console.error("   ❌ Failed to clean jobs:", error);
      return { cleaned: 0, archived: 0 };
    }
  }

  /**
   * Clean old audit logs (keep longer for compliance)
   */
  private async cleanOldAuditLogs(config: CleanupConfig): Promise<{ cleaned: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.auditRetentionDays);

    console.log(`   Cleaning audit logs older than ${config.auditRetentionDays} days...`);

    try {
      if (config.dryRun) {
        const count = await prisma.audit_logs.count({
          where: { createdAt: { lt: cutoffDate } },
        });
        console.log(`   [DRY RUN] Would clean ${count} old audit log entries`);
        return { cleaned: 0 };
      }

      const deleteResult = await prisma.audit_logs.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      console.log(`   ✅ Cleaned ${deleteResult.count} old audit logs`);
      return { cleaned: deleteResult.count };
    } catch (error) {
      console.error("   ❌ Failed to clean audit logs:", error);
      return { cleaned: 0 };
    }
  }

  /**
   * Clean old read/dismissed notifications
   */
  private async cleanOldNotifications(config: CleanupConfig): Promise<{ cleaned: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.notificationRetentionDays);

    console.log(`   Cleaning notifications older than ${config.notificationRetentionDays} days...`);

    try {
      if (config.dryRun) {
        const count = await prisma.notifications.count({
          where: {
            AND: [
              { createdAt: { lt: cutoffDate } },
              { isRead: true }, // Only delete read notifications
            ],
          },
        });
        console.log(`   [DRY RUN] Would clean ${count} old notifications`);
        return { cleaned: 0 };
      }

      const deleteResult = await prisma.notifications.deleteMany({
        where: {
          AND: [{ createdAt: { lt: cutoffDate } }, { isRead: true }],
        },
      });

      console.log(`   ✅ Cleaned ${deleteResult.count} old notifications`);
      return { cleaned: deleteResult.count };
    } catch (error) {
      console.error("   ❌ Failed to clean notifications:", error);
      return { cleaned: 0 };
    }
  }

  /**
   * Clean expired user sessions
   */
  private async cleanExpiredSessions(config: CleanupConfig): Promise<{ cleaned: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.sessionRetentionDays);

    console.log(`   Cleaning sessions older than ${config.sessionRetentionDays} days...`);

    try {
      if (config.dryRun) {
        const count = await prisma.session.count({
          where: {
            OR: [
              { expiresAt: { lt: new Date() } }, // Expired sessions
              { lastActivity: { lt: cutoffDate } }, // Inactive sessions
            ],
          },
        });
        console.log(`   [DRY RUN] Would clean ${count} expired sessions`);
        return { cleaned: 0 };
      }

      const deleteResult = await prisma.session.deleteMany({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { lastActivity: { lt: cutoffDate } }],
        },
      });

      console.log(`   ✅ Cleaned ${deleteResult.count} expired sessions`);
      return { cleaned: deleteResult.count };
    } catch (error) {
      console.error("   ❌ Failed to clean sessions:", error);
      return { cleaned: 0 };
    }
  }

  /**
   * Clean orphaned records (referential integrity)
   */
  private async cleanOrphanedRecords(config: CleanupConfig): Promise<void> {
    console.log("   Checking for orphaned records...");

    try {
      // Example: Clean notifications for deleted users
      if (!config.dryRun) {
        const orphanedNotifications = await prisma.$executeRaw`
          DELETE FROM "Notification" 
          WHERE "userId" NOT IN (SELECT "id" FROM "User")
        `;
        if (orphanedNotifications > 0) {
          console.log(`   ✅ Cleaned ${orphanedNotifications} orphaned notifications`);
        }

        // Clean transactions for deleted users
        const orphanedTransactions = await prisma.$executeRaw`
          DELETE FROM "Transaction" 
          WHERE "userId" NOT IN (SELECT "id" FROM "User")
        `;
        if (orphanedTransactions > 0) {
          console.log(`   ✅ Cleaned ${orphanedTransactions} orphaned transactions`);
        }
      }
    } catch (error) {
      console.error("   ⚠️  Failed to clean orphaned records:", error);
    }
  }

  /**
   * Get cleanup statistics (for admin dashboard)
   */
  async getCleanupStats(): Promise<{
    oldJobsCount: number;
    oldAuditLogsCount: number;
    oldNotificationsCount: number;
    expiredSessionsCount: number;
    estimatedSpaceSavings: string;
  }> {
    const cutoffJob = new Date();
    cutoffJob.setDate(cutoffJob.getDate() - this.config.jobRetentionDays);

    const cutoffAudit = new Date();
    cutoffAudit.setDate(cutoffAudit.getDate() - this.config.auditRetentionDays);

    const cutoffNotification = new Date();
    cutoffNotification.setDate(cutoffNotification.getDate() - this.config.notificationRetentionDays);

    const cutoffSession = new Date();
    cutoffSession.setDate(cutoffSession.getDate() - this.config.sessionRetentionDays);

    const [oldJobsCount, oldAuditLogsCount, oldNotificationsCount, expiredSessionsCount] = await Promise.all([
      prisma.job.count({
        where: {
          AND: [{ updatedAt: { lt: cutoffJob } }, { OR: [{ status: "completed" }, { status: "failed" }] }],
        },
      }),
      prisma.audit_logs.count({
        where: { createdAt: { lt: cutoffAudit } },
      }),
      prisma.notifications.count({
        where: {
          AND: [{ createdAt: { lt: cutoffNotification } }, { isRead: true }],
        },
      }),
      prisma.session.count({
        where: {
          OR: [{ expiresAt: { lt: new Date() } }, { lastActivity: { lt: cutoffSession } }],
        },
      }),
    ]);

    // Estimate space savings (rough approximation: 1KB per record)
    const totalRecords = oldJobsCount + oldAuditLogsCount + oldNotificationsCount + expiredSessionsCount;
    const estimatedKB = totalRecords * 1;
    const estimatedSpaceSavings = estimatedKB > 1024 ? `${(estimatedKB / 1024).toFixed(2)} MB` : `${estimatedKB} KB`;

    return {
      oldJobsCount,
      oldAuditLogsCount,
      oldNotificationsCount,
      expiredSessionsCount,
      estimatedSpaceSavings,
    };
  }

  /**
   * Schedule automatic cleanup (run daily via cron)
   */
  scheduleAutomaticCleanup(): void {
    console.log("📅 Scheduling automatic cleanup (daily at 2 AM)...");

    // Run cleanup every day at 2 AM
    const schedule = require("node-cron");
    schedule.schedule("0 2 * * *", async () => {
      console.log("🕒 [CRON] Running scheduled cleanup...");
      await this.cleanAllOldRecords({ dryRun: false });
    });

    console.log("✅ Automatic cleanup scheduled");
  }
}

// Export singleton instance
export const recordCleanupAI = new RecordCleanupAI();

// Export for testing
export { CleanupConfig, CleanupResult, RecordCleanupAI };
