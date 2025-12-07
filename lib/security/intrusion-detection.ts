/**
 * Intrusion Detection & Prevention System (IDPS)
 * Brute force prevention, anomaly detection, and automatic protective measures
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SECURITY_WEBHOOK = process.env.SECURITY_WEBHOOK_URL;

// Thresholds
const BRUTE_FORCE_THRESHOLD = 5; // Failed attempts before lockout
const BRUTE_FORCE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes initial lockout
const MAX_LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours max lockout
const ANOMALY_THRESHOLD = 10; // Anomalous events before alert
const CRITICAL_THRESHOLD = 3; // Critical events before lockdown

// =============================================================================
// IN-MEMORY STORES (Use Redis in production)
// =============================================================================

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockoutUntil?: number;
  lockoutCount: number;
}

interface AnomalyRecord {
  events: Array<{
    type: string;
    timestamp: number;
    severity: string;
  }>;
  alertSent: boolean;
}

const loginAttempts = new Map<string, AttemptRecord>();
const apiAttempts = new Map<string, AttemptRecord>();
const anomalyRecords = new Map<string, AnomalyRecord>();
const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, number>();

// System state
let systemLockdown = false;
let maintenanceMode = false;
let lastHealthCheck = Date.now();

// =============================================================================
// BRUTE FORCE PREVENTION
// =============================================================================

export interface BruteForceResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutUntil?: Date;
  message: string;
}

/**
 * Check and record login attempt
 */
export function checkLoginAttempt(identifier: string, success: boolean): BruteForceResult {
  const now = Date.now();
  let record = loginAttempts.get(identifier);

  // Initialize record if not exists
  if (!record) {
    record = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      lockoutCount: 0,
    };
  }

  // Check if currently locked out
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(record.lockoutUntil),
      message: `Account locked. Try again after ${new Date(record.lockoutUntil).toLocaleTimeString()}`,
    };
  }

  // Reset if window expired
  if (now - record.firstAttempt > BRUTE_FORCE_WINDOW_MS) {
    record = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      lockoutCount: record.lockoutCount,
    };
  }

  if (success) {
    // Reset on successful login
    record.count = 0;
    record.lockoutUntil = undefined;
    loginAttempts.set(identifier, record);
    return {
      allowed: true,
      remainingAttempts: BRUTE_FORCE_THRESHOLD,
      message: 'Login successful',
    };
  }

  // Record failed attempt
  record.count++;
  record.lastAttempt = now;

  // Check if threshold exceeded
  if (record.count >= BRUTE_FORCE_THRESHOLD) {
    // Progressive lockout - doubles each time
    const lockoutMultiplier = Math.pow(2, record.lockoutCount);
    const lockoutDuration = Math.min(
      LOCKOUT_DURATION_MS * lockoutMultiplier,
      MAX_LOCKOUT_DURATION_MS
    );
    record.lockoutUntil = now + lockoutDuration;
    record.lockoutCount++;
    record.count = 0;

    loginAttempts.set(identifier, record);

    // Alert admin on repeated lockouts
    if (record.lockoutCount >= 3) {
      alertAdmin('brute_force_attack', {
        identifier,
        lockoutCount: record.lockoutCount,
        lockoutDuration: lockoutDuration / 1000 / 60, // minutes
      });
    }

    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(record.lockoutUntil),
      message: `Too many failed attempts. Account locked for ${Math.round(lockoutDuration / 1000 / 60)} minutes.`,
    };
  }

  loginAttempts.set(identifier, record);

  return {
    allowed: true,
    remainingAttempts: BRUTE_FORCE_THRESHOLD - record.count,
    message: `${BRUTE_FORCE_THRESHOLD - record.count} attempts remaining`,
  };
}

/**
 * Check API rate limiting with brute force detection
 */
export function checkAPIAttempt(ip: string, endpoint: string): BruteForceResult {
  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  let record = apiAttempts.get(key);

  if (!record) {
    record = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      lockoutCount: 0,
    };
  }

  // Check lockout
  if (record.lockoutUntil && now < record.lockoutUntil) {
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(record.lockoutUntil),
      message: 'Rate limited. Please try again later.',
    };
  }

  // Reset window
  if (now - record.firstAttempt > 60000) {
    // 1 minute window for API
    record = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
      lockoutCount: record.lockoutCount,
    };
  }

  record.count++;
  record.lastAttempt = now;

  // API threshold is higher
  const apiThreshold = 60; // 60 requests per minute
  if (record.count > apiThreshold) {
    record.lockoutUntil = now + 60000; // 1 minute lockout
    record.lockoutCount++;
    apiAttempts.set(key, record);

    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutUntil: new Date(record.lockoutUntil),
      message: 'Rate limit exceeded',
    };
  }

  apiAttempts.set(key, record);

  return {
    allowed: true,
    remainingAttempts: apiThreshold - record.count,
    message: 'OK',
  };
}

// =============================================================================
// ANOMALY DETECTION
// =============================================================================

export type AnomalyType =
  | 'unusual_login_time'
  | 'unusual_location'
  | 'rapid_requests'
  | 'suspicious_user_agent'
  | 'api_abuse'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'config_change'
  | 'file_access'
  | 'sql_injection'
  | 'xss_attempt'
  | 'path_traversal';

export interface AnomalyEvent {
  type: AnomalyType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string; // IP or user ID
  details: string;
  timestamp: Date;
}

/**
 * Record anomaly event
 */
export function recordAnomaly(event: AnomalyEvent): {
  recorded: boolean;
  alertTriggered: boolean;
  action: 'none' | 'warn' | 'block' | 'lockdown';
} {
  const now = Date.now();
  let record = anomalyRecords.get(event.source);

  if (!record) {
    record = { events: [], alertSent: false };
  }

  // Add event
  record.events.push({
    type: event.type,
    timestamp: now,
    severity: event.severity,
  });

  // Clean old events (keep last hour)
  record.events = record.events.filter((e) => now - e.timestamp < 3600000);

  anomalyRecords.set(event.source, record);

  // Count by severity
  const criticalCount = record.events.filter((e) => e.severity === 'critical').length;
  const highCount = record.events.filter((e) => e.severity === 'high').length;
  const totalCount = record.events.length;

  // Determine action
  let action: 'none' | 'warn' | 'block' | 'lockdown' = 'none';
  let alertTriggered = false;

  if (criticalCount >= CRITICAL_THRESHOLD) {
    action = 'lockdown';
    triggerSystemLockdown(event.source, 'Multiple critical anomalies detected');
    alertTriggered = true;
  } else if (highCount >= 5 || criticalCount >= 1) {
    action = 'block';
    blockIP(event.source);
    alertTriggered = true;
  } else if (totalCount >= ANOMALY_THRESHOLD) {
    action = 'warn';
    if (!record.alertSent) {
      alertAdmin('anomaly_threshold', {
        source: event.source,
        eventCount: totalCount,
        events: record.events.slice(-5),
      });
      record.alertSent = true;
      alertTriggered = true;
    }
  }

  return { recorded: true, alertTriggered, action };
}

/**
 * Detect anomalies in request
 */
export function detectRequestAnomalies(request: {
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  body?: string;
  userId?: string;
  timestamp: Date;
}): AnomalyEvent[] {
  const anomalies: AnomalyEvent[] = [];

  // Check for suspicious user agents
  const suspiciousAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /masscan/i,
    /burp/i,
    /owasp/i,
    /dirbuster/i,
    /gobuster/i,
    /wfuzz/i,
    /hydra/i,
    /metasploit/i,
  ];

  for (const pattern of suspiciousAgents) {
    if (pattern.test(request.userAgent)) {
      anomalies.push({
        type: 'suspicious_user_agent',
        severity: 'high',
        source: request.ip,
        details: `Suspicious user agent detected: ${request.userAgent}`,
        timestamp: request.timestamp,
      });
      break;
    }
  }

  // Check for SQL injection in path or body
  const sqlPatterns = [
    /union\s+select/i,
    /or\s+1\s*=\s*1/i,
    /and\s+1\s*=\s*1/i,
    /'\s*or\s*'/i,
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
  ];

  const checkContent = `${request.path} ${request.body || ''}`;
  for (const pattern of sqlPatterns) {
    if (pattern.test(checkContent)) {
      anomalies.push({
        type: 'sql_injection',
        severity: 'critical',
        source: request.ip,
        details: `SQL injection attempt detected in ${request.method} ${request.path}`,
        timestamp: request.timestamp,
      });
      break;
    }
  }

  // Check for XSS attempts
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /eval\s*\(/i];

  for (const pattern of xssPatterns) {
    if (pattern.test(checkContent)) {
      anomalies.push({
        type: 'xss_attempt',
        severity: 'high',
        source: request.ip,
        details: `XSS attempt detected in ${request.method} ${request.path}`,
        timestamp: request.timestamp,
      });
      break;
    }
  }

  // Check for path traversal
  if (/\.\.\/|\.\.\\|%2e%2e/i.test(request.path)) {
    anomalies.push({
      type: 'path_traversal',
      severity: 'high',
      source: request.ip,
      details: `Path traversal attempt: ${request.path}`,
      timestamp: request.timestamp,
    });
  }

  // Record all anomalies
  for (const anomaly of anomalies) {
    recordAnomaly(anomaly);
  }

  return anomalies;
}

// =============================================================================
// TAMPER DETECTION
// =============================================================================

interface SystemFingerprint {
  configHash: string;
  envHash: string;
  timestamp: number;
}

let baselineFingerprint: SystemFingerprint | null = null;

/**
 * Create system fingerprint for tamper detection
 */
export function createSystemFingerprint(): SystemFingerprint {
  const crypto = require('crypto');

  // Hash critical config values
  const configValues = [
    process.env.NODE_ENV,
    process.env.DATABASE_URL?.substring(0, 20), // Partial for security
    process.env.NEXTAUTH_URL,
  ].join('|');

  const envValues = [
    process.env.JWT_SECRET?.substring(0, 10),
    process.env.SESSION_SECRET?.substring(0, 10),
  ].join('|');

  return {
    configHash: crypto.createHash('sha256').update(configValues).digest('hex').substring(0, 16),
    envHash: crypto.createHash('sha256').update(envValues).digest('hex').substring(0, 16),
    timestamp: Date.now(),
  };
}

/**
 * Set baseline fingerprint
 */
export function setBaselineFingerprint(): void {
  baselineFingerprint = createSystemFingerprint();
}

/**
 * Check for system tampering
 */
export function checkSystemTampering(): {
  tampered: boolean;
  changes: string[];
} {
  if (!baselineFingerprint) {
    setBaselineFingerprint();
    return { tampered: false, changes: [] };
  }

  const current = createSystemFingerprint();
  const changes: string[] = [];

  if (current.configHash !== baselineFingerprint.configHash) {
    changes.push('Configuration changed');
  }

  if (current.envHash !== baselineFingerprint.envHash) {
    changes.push('Environment variables changed');
  }

  if (changes.length > 0) {
    alertAdmin('system_tampering', {
      changes,
      baseline: baselineFingerprint,
      current,
    });
  }

  return {
    tampered: changes.length > 0,
    changes,
  };
}

// =============================================================================
// SYSTEM PROTECTION
// =============================================================================

/**
 * Block an IP address
 */
export function blockIP(ip: string): void {
  blockedIPs.add(ip);
  alertAdmin('ip_blocked', { ip, timestamp: new Date().toISOString() });
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

/**
 * Mark IP as suspicious
 */
export function markSuspicious(ip: string): void {
  const count = (suspiciousIPs.get(ip) || 0) + 1;
  suspiciousIPs.set(ip, count);

  if (count >= 10) {
    blockIP(ip);
  }
}

/**
 * Trigger system lockdown
 */
export function triggerSystemLockdown(source: string, reason: string): void {
  systemLockdown = true;
  maintenanceMode = true;

  alertAdmin('system_lockdown', {
    source,
    reason,
    timestamp: new Date().toISOString(),
  });

  console.error(`[SECURITY] System lockdown triggered by ${source}: ${reason}`);
}

/**
 * Disable system lockdown
 */
export function disableSystemLockdown(): void {
  systemLockdown = false;
  maintenanceMode = false;
}

/**
 * Check if system is in lockdown
 */
export function isSystemLocked(): boolean {
  return systemLockdown;
}

/**
 * Check if maintenance mode is active
 */
export function isMaintenanceMode(): boolean {
  return maintenanceMode;
}

/**
 * Enable maintenance mode
 */
export function enableMaintenanceMode(): void {
  maintenanceMode = true;
}

/**
 * Disable maintenance mode
 */
export function disableMaintenanceMode(): void {
  maintenanceMode = false;
}

// =============================================================================
// HEALTH MONITORING
// =============================================================================

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical' | 'lockdown';
  uptime: number;
  lastCheck: Date;
  issues: string[];
  metrics: {
    blockedIPs: number;
    suspiciousIPs: number;
    activeAnomalies: number;
    lockedAccounts: number;
  };
}

/**
 * Get system health status
 */
export function getSystemHealth(): SystemHealth {
  const now = Date.now();
  const issues: string[] = [];

  // Check for issues
  if (systemLockdown) {
    issues.push('System is in lockdown mode');
  }

  if (maintenanceMode) {
    issues.push('Maintenance mode is active');
  }

  if (blockedIPs.size > 100) {
    issues.push('High number of blocked IPs');
  }

  // Count active anomalies
  let activeAnomalies = 0;
  anomalyRecords.forEach((record) => {
    activeAnomalies += record.events.filter((e) => now - e.timestamp < 3600000).length;
  });

  if (activeAnomalies > 50) {
    issues.push('High anomaly activity detected');
  }

  // Count locked accounts
  let lockedAccounts = 0;
  loginAttempts.forEach((record) => {
    if (record.lockoutUntil && record.lockoutUntil > now) {
      lockedAccounts++;
    }
  });

  // Determine status
  let status: SystemHealth['status'] = 'healthy';
  if (systemLockdown) {
    status = 'lockdown';
  } else if (issues.length >= 3) {
    status = 'critical';
  } else if (issues.length >= 1) {
    status = 'degraded';
  }

  lastHealthCheck = now;

  return {
    status,
    uptime: process.uptime(),
    lastCheck: new Date(lastHealthCheck),
    issues,
    metrics: {
      blockedIPs: blockedIPs.size,
      suspiciousIPs: suspiciousIPs.size,
      activeAnomalies,
      lockedAccounts,
    },
  };
}

// =============================================================================
// ADMIN ALERTS
// =============================================================================

interface AdminAlert {
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

const alertQueue: AdminAlert[] = [];

/**
 * Send alert to admin
 */
async function alertAdmin(type: string, data: Record<string, unknown>): Promise<void> {
  const alert: AdminAlert = {
    type,
    data,
    timestamp: new Date(),
    severity: getSeverityForAlertType(type),
  };

  alertQueue.push(alert);

  // Log to console
  console.log(`[SECURITY ALERT] ${type}:`, JSON.stringify(data, null, 2));

  // Send webhook if configured
  if (SECURITY_WEBHOOK) {
    try {
      await fetch(SECURITY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'security_alert',
          alert,
        }),
      });
    } catch (error) {
      console.error('Failed to send security webhook:', error);
    }
  }

  // For critical alerts, also try email
  if (alert.severity === 'critical' && ADMIN_EMAIL) {
    console.log(`[CRITICAL ALERT] Would send email to ${ADMIN_EMAIL}`);
  }
}

/**
 * Get severity for alert type
 */
function getSeverityForAlertType(type: string): AdminAlert['severity'] {
  const criticalTypes = ['system_lockdown', 'system_tampering', 'brute_force_attack'];
  const errorTypes = ['ip_blocked', 'anomaly_threshold'];
  const warningTypes = ['suspicious_activity'];

  if (criticalTypes.includes(type)) return 'critical';
  if (errorTypes.includes(type)) return 'error';
  if (warningTypes.includes(type)) return 'warning';
  return 'info';
}

/**
 * Get recent alerts
 */
export function getRecentAlerts(limit = 50): AdminAlert[] {
  return alertQueue.slice(-limit);
}

// =============================================================================
// CLEANUP
// =============================================================================

/**
 * Cleanup old records (run periodically)
 */
export function cleanupOldRecords(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  // Cleanup login attempts
  loginAttempts.forEach((record, key) => {
    if (now - record.lastAttempt > maxAge && !record.lockoutUntil) {
      loginAttempts.delete(key);
    }
  });

  // Cleanup API attempts
  apiAttempts.forEach((record, key) => {
    if (now - record.lastAttempt > maxAge) {
      apiAttempts.delete(key);
    }
  });

  // Cleanup anomaly records
  anomalyRecords.forEach((record, key) => {
    record.events = record.events.filter((e) => now - e.timestamp < maxAge);
    if (record.events.length === 0) {
      anomalyRecords.delete(key);
    }
  });

  // Cleanup suspicious IPs (reset after 24 hours)
  suspiciousIPs.clear();
}

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldRecords, 60 * 60 * 1000);
}

// Initialize baseline fingerprint
setBaselineFingerprint();
