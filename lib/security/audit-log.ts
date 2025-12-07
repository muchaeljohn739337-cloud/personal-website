/**
 * Security Audit Logging System
 * Tracks all security-relevant events for compliance and monitoring
 */

import { prisma } from '@/lib/prismaClient';

export type AuditEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'EMAIL_VERIFICATION_SENT'
  | 'EMAIL_VERIFIED'
  | '2FA_ENABLED'
  | '2FA_DISABLED'
  | '2FA_VERIFIED'
  | '2FA_FAILED'
  | 'BACKUP_CODE_USED'
  | 'BACKUP_CODES_REGENERATED'
  | 'ACCOUNT_CREATED'
  | 'ACCOUNT_UPDATED'
  | 'ACCOUNT_DELETED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'SESSION_CREATED'
  | 'SESSION_REVOKED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'PERMISSION_DENIED'
  | 'DATA_EXPORT'
  | 'DATA_DELETION'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_COMPLETED';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  resource?: string;
  action?: string;
  details?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date();

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const logLevel = entry.severity === 'CRITICAL' || entry.severity === 'ERROR' ? 'error' : 'info';
    console[logLevel](`[AUDIT ${entry.severity}] ${entry.eventType}`, {
      ...entry,
      timestamp: timestamp.toISOString(),
    });
  }

  try {
    // Store in database
    await prisma.auditLog.create({
      data: {
        eventType: entry.eventType,
        severity: entry.severity,
        userId: entry.userId,
        sessionId: entry.sessionId,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        resource: entry.resource,
        action: entry.action,
        details: entry.details ? JSON.stringify(entry.details) : null,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        timestamp,
      },
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Failed to create audit log:', error);

    // In production, send to external logging service as backup
    if (process.env.NODE_ENV === 'production') {
      await sendToExternalLogger(entry, timestamp);
    }
  }
}

/**
 * Send to external logging service (Sentry, DataDog, etc.)
 */
async function sendToExternalLogger(entry: AuditLogEntry, timestamp: Date): Promise<void> {
  // Implement your external logging service here
  // Example: Sentry, DataDog, Splunk, etc.

  if (process.env.SENTRY_DSN) {
    // Sentry integration would go here
  }

  if (process.env.DATADOG_API_KEY) {
    // DataDog integration would go here
  }

  // Fallback: Log to stdout for container logging
  console.log(
    JSON.stringify({
      type: 'audit',
      ...entry,
      timestamp: timestamp.toISOString(),
    })
  );
}

/**
 * Helper functions for common audit events
 */
export const auditHelpers = {
  loginSuccess: (userId: string, ip: string, userAgent?: string) =>
    createAuditLog({
      eventType: 'LOGIN_SUCCESS',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      userAgent,
      action: 'User logged in successfully',
    }),

  loginFailure: (email: string, ip: string, reason: string, userAgent?: string) =>
    createAuditLog({
      eventType: 'LOGIN_FAILURE',
      severity: 'WARNING',
      ipAddress: ip,
      userAgent,
      action: 'Login attempt failed',
      details: { email: maskEmail(email), reason },
    }),

  logout: (userId: string, ip: string) =>
    createAuditLog({
      eventType: 'LOGOUT',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: 'User logged out',
    }),

  passwordChange: (userId: string, ip: string) =>
    createAuditLog({
      eventType: 'PASSWORD_CHANGE',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: 'Password changed',
    }),

  passwordResetRequest: (email: string, ip: string) =>
    createAuditLog({
      eventType: 'PASSWORD_RESET_REQUEST',
      severity: 'INFO',
      ipAddress: ip,
      action: 'Password reset requested',
      details: { email: maskEmail(email) },
    }),

  twoFactorEnabled: (userId: string, ip: string) =>
    createAuditLog({
      eventType: '2FA_ENABLED',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: '2FA enabled',
    }),

  twoFactorFailed: (userId: string, ip: string) =>
    createAuditLog({
      eventType: '2FA_FAILED',
      severity: 'WARNING',
      userId,
      ipAddress: ip,
      action: '2FA verification failed',
    }),

  rateLimitExceeded: (ip: string, endpoint: string) =>
    createAuditLog({
      eventType: 'RATE_LIMIT_EXCEEDED',
      severity: 'WARNING',
      ipAddress: ip,
      resource: endpoint,
      action: 'Rate limit exceeded',
    }),

  suspiciousActivity: (ip: string, details: Record<string, unknown>) =>
    createAuditLog({
      eventType: 'SUSPICIOUS_ACTIVITY',
      severity: 'CRITICAL',
      ipAddress: ip,
      action: 'Suspicious activity detected',
      details,
    }),

  accountCreated: (userId: string, ip: string) =>
    createAuditLog({
      eventType: 'ACCOUNT_CREATED',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: 'Account created',
    }),

  paymentInitiated: (userId: string, ip: string, amount: number, currency: string) =>
    createAuditLog({
      eventType: 'PAYMENT_INITIATED',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: 'Payment initiated',
      details: { amount, currency },
    }),

  withdrawalRequested: (
    userId: string,
    ip: string,
    amount: number,
    currency: string,
    address: string
  ) =>
    createAuditLog({
      eventType: 'WITHDRAWAL_REQUESTED',
      severity: 'INFO',
      userId,
      ipAddress: ip,
      action: 'Withdrawal requested',
      details: { amount, currency, address: maskAddress(address) },
    }),
};

/**
 * Mask email for logging (show first 2 chars and domain)
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedLocal = local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

/**
 * Mask wallet address for logging
 */
function maskAddress(address: string): string {
  if (address.length <= 10) return '***';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Query audit logs with filters
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.eventType) where.eventType = filters.eventType;
  if (filters.severity) where.severity = filters.severity;

  if (filters.startDate || filters.endDate) {
    where.timestamp = {};
    if (filters.startDate) (where.timestamp as Record<string, Date>).gte = filters.startDate;
    if (filters.endDate) (where.timestamp as Record<string, Date>).lte = filters.endDate;
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  });
}

/**
 * Get security summary for a user
 */
export async function getUserSecuritySummary(userId: string) {
  const [recentLogins, failedLogins, securityEvents] = await Promise.all([
    prisma.auditLog.count({
      where: {
        userId,
        eventType: 'LOGIN_SUCCESS',
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditLog.count({
      where: {
        userId,
        eventType: 'LOGIN_FAILURE',
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        userId,
        severity: { in: ['WARNING', 'ERROR', 'CRITICAL'] },
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
    }),
  ]);

  return {
    recentLogins,
    failedLogins,
    securityEvents,
    riskLevel: failedLogins > 5 ? 'HIGH' : failedLogins > 2 ? 'MEDIUM' : 'LOW',
  };
}
