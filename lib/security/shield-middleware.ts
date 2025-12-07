/**
 * Security Shield Middleware
 * Acts as a protective layer between users and the system
 * Automatically triggers maintenance mode on critical security events
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  isIPBlocked,
  isSystemLocked,
  isMaintenanceMode,
  checkLoginAttempt,
  checkAPIAttempt,
  detectRequestAnomalies,
  markSuspicious,
  getSystemHealth,
  triggerSystemLockdown,
} from './intrusion-detection';
import { analyzeInput } from './ai-safety';
import { getClientIP } from './rate-limit';

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAINTENANCE_PAGE = '/maintenance';
const BLOCKED_PAGE = '/blocked';
const ADMIN_PATHS = ['/admin', '/api/admin'];
const AUTH_PATHS = ['/api/auth/login', '/api/auth/register', '/auth/login', '/auth/register'];
const SENSITIVE_PATHS = ['/api/payments', '/api/wallet', '/api/withdraw', '/api/admin'];

// Paths that bypass the shield (static assets, etc.)
const BYPASS_PATHS = [
  '/_next',
  '/static',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/maintenance',
  '/blocked',
];

// =============================================================================
// SHIELD STATE
// =============================================================================

interface ShieldState {
  enabled: boolean;
  level: 'normal' | 'elevated' | 'high' | 'critical';
  autoLockdownEnabled: boolean;
  lastIncident: Date | null;
  incidentCount: number;
}

let shieldState: ShieldState = {
  enabled: true,
  level: 'normal',
  autoLockdownEnabled: true,
  lastIncident: null,
  incidentCount: 0,
};

// =============================================================================
// SHIELD MIDDLEWARE
// =============================================================================

export interface ShieldResult {
  allowed: boolean;
  redirect?: string;
  headers?: Record<string, string>;
  reason?: string;
}

/**
 * Main security shield function
 */
export async function securityShield(request: NextRequest): Promise<ShieldResult> {
  const path = request.nextUrl.pathname;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;

  // Check bypass paths
  if (BYPASS_PATHS.some((bypass) => path.startsWith(bypass))) {
    return { allowed: true };
  }

  // Check if system is in lockdown
  if (isSystemLocked()) {
    return {
      allowed: false,
      redirect: MAINTENANCE_PAGE,
      reason: 'System is in lockdown mode',
    };
  }

  // Check if maintenance mode is active
  if (isMaintenanceMode() && !path.startsWith('/api/admin')) {
    return {
      allowed: false,
      redirect: MAINTENANCE_PAGE,
      reason: 'Maintenance mode is active',
    };
  }

  // Check if IP is blocked
  if (isIPBlocked(ip)) {
    return {
      allowed: false,
      redirect: BLOCKED_PAGE,
      reason: 'IP address is blocked',
    };
  }

  // Detect request anomalies
  const anomalies = detectRequestAnomalies({
    ip,
    userAgent,
    path,
    method,
    timestamp: new Date(),
  });

  if (anomalies.length > 0) {
    shieldState.incidentCount++;
    shieldState.lastIncident = new Date();

    // Check for critical anomalies
    const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      markSuspicious(ip);

      // Auto-lockdown on multiple critical anomalies
      if (shieldState.autoLockdownEnabled && criticalAnomalies.length >= 2) {
        triggerSystemLockdown(ip, 'Multiple critical anomalies detected');
        return {
          allowed: false,
          redirect: MAINTENANCE_PAGE,
          reason: 'Security incident detected',
        };
      }

      return {
        allowed: false,
        redirect: BLOCKED_PAGE,
        reason: 'Suspicious activity detected',
      };
    }

    // Elevate shield level based on anomalies
    updateShieldLevel(anomalies.length);
  }

  // Check API rate limiting
  if (path.startsWith('/api/')) {
    const apiCheck = checkAPIAttempt(ip, path);
    if (!apiCheck.allowed) {
      return {
        allowed: false,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Remaining': '0',
        },
        reason: apiCheck.message,
      };
    }
  }

  // Extra protection for sensitive paths
  if (SENSITIVE_PATHS.some((sensitive) => path.startsWith(sensitive))) {
    // Require elevated security checks
    const sensitiveCheck = await checkSensitivePath(request, ip, path);
    if (!sensitiveCheck.allowed) {
      return sensitiveCheck;
    }
  }

  // Add security headers
  const securityHeaders = generateSecurityHeaders(shieldState.level);

  return {
    allowed: true,
    headers: securityHeaders,
  };
}

/**
 * Check sensitive path access
 */
async function checkSensitivePath(
  request: NextRequest,
  ip: string,
  path: string
): Promise<ShieldResult> {
  // For admin paths, require additional verification
  if (ADMIN_PATHS.some((admin) => path.startsWith(admin))) {
    // Check for admin token or session
    const authHeader = request.headers.get('authorization');
    const adminToken = request.cookies.get('admin_token')?.value;

    if (!authHeader && !adminToken) {
      markSuspicious(ip);
      return {
        allowed: false,
        reason: 'Admin access requires authentication',
      };
    }
  }

  // For payment paths, check for suspicious patterns
  if (path.includes('/payments') || path.includes('/withdraw')) {
    // Check request body for suspicious content
    if (request.method === 'POST') {
      try {
        const body = await request.text();
        const analysis = analyzeInput(body);

        if (analysis.isThreat) {
          markSuspicious(ip);
          return {
            allowed: false,
            reason: 'Suspicious payment request detected',
          };
        }
      } catch {
        // Body already consumed or not available
      }
    }
  }

  return { allowed: true };
}

/**
 * Update shield level based on incidents
 */
function updateShieldLevel(anomalyCount: number): void {
  const health = getSystemHealth();

  if (health.status === 'critical' || anomalyCount >= 5) {
    shieldState.level = 'critical';
  } else if (health.status === 'degraded' || anomalyCount >= 3) {
    shieldState.level = 'high';
  } else if (anomalyCount >= 1) {
    shieldState.level = 'elevated';
  } else {
    shieldState.level = 'normal';
  }
}

/**
 * Generate security headers based on shield level
 */
function generateSecurityHeaders(level: ShieldState['level']): Record<string, string> {
  const headers: Record<string, string> = {
    'X-Shield-Level': level,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  // Add stricter headers for elevated levels
  if (level === 'high' || level === 'critical') {
    headers['Content-Security-Policy'] =
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';";
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';
  }

  if (level === 'critical') {
    headers['X-Shield-Warning'] = 'System under elevated security';
  }

  return headers;
}

// =============================================================================
// SHIELD CONTROL
// =============================================================================

/**
 * Get current shield state
 */
export function getShieldState(): ShieldState {
  return { ...shieldState };
}

/**
 * Enable/disable shield
 */
export function setShieldEnabled(enabled: boolean): void {
  shieldState.enabled = enabled;
}

/**
 * Set shield level manually
 */
export function setShieldLevel(level: ShieldState['level']): void {
  shieldState.level = level;
}

/**
 * Enable/disable auto-lockdown
 */
export function setAutoLockdown(enabled: boolean): void {
  shieldState.autoLockdownEnabled = enabled;
}

/**
 * Reset shield state
 */
export function resetShieldState(): void {
  shieldState = {
    enabled: true,
    level: 'normal',
    autoLockdownEnabled: true,
    lastIncident: null,
    incidentCount: 0,
  };
}

// =============================================================================
// LOGIN PROTECTION
// =============================================================================

/**
 * Protect login endpoint
 */
export function protectLogin(
  identifier: string,
  success: boolean
): {
  allowed: boolean;
  message: string;
  lockoutUntil?: Date;
} {
  const result = checkLoginAttempt(identifier, success);

  if (!result.allowed) {
    shieldState.incidentCount++;
    shieldState.lastIncident = new Date();
  }

  return {
    allowed: result.allowed,
    message: result.message,
    lockoutUntil: result.lockoutUntil,
  };
}

// =============================================================================
// MIDDLEWARE WRAPPER
// =============================================================================

/**
 * Create Next.js middleware wrapper
 */
export function createShieldMiddleware() {
  return async function middleware(request: NextRequest): Promise<NextResponse> {
    const result = await securityShield(request);

    if (!result.allowed) {
      if (result.redirect) {
        return NextResponse.redirect(new URL(result.redirect, request.url));
      }

      return new NextResponse(JSON.stringify({ error: result.reason || 'Access denied' }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...result.headers,
        },
      });
    }

    const response = NextResponse.next();

    // Add security headers
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        response.headers.set(key, value);
      }
    }

    return response;
  };
}

// =============================================================================
// PENTESTER DETECTION
// =============================================================================

const PENTESTER_INDICATORS = [
  // Common pentesting tools
  'sqlmap',
  'nikto',
  'nmap',
  'burp',
  'owasp',
  'metasploit',
  'hydra',
  'john',
  'hashcat',
  'gobuster',
  'dirbuster',
  'wfuzz',
  'ffuf',
  'nuclei',
  'zap',

  // Common pentesting paths
  '/.git',
  '/.env',
  '/wp-admin',
  '/phpmyadmin',
  '/admin.php',
  '/config.php',
  '/backup',
  '/debug',
  '/test',
  '/phpinfo',
  '/server-status',
  '/actuator',
  '/swagger',
  '/graphql',
];

/**
 * Detect pentesting attempts
 */
export function detectPentester(request: {
  path: string;
  userAgent: string;
  headers: Record<string, string>;
}): {
  isPentester: boolean;
  confidence: number;
  indicators: string[];
} {
  const indicators: string[] = [];
  let confidence = 0;

  // Check user agent
  const ua = request.userAgent.toLowerCase();
  for (const tool of PENTESTER_INDICATORS.slice(0, 15)) {
    if (ua.includes(tool)) {
      indicators.push(`User-Agent contains: ${tool}`);
      confidence += 30;
    }
  }

  // Check path
  const path = request.path.toLowerCase();
  for (const indicator of PENTESTER_INDICATORS.slice(15)) {
    if (path.includes(indicator)) {
      indicators.push(`Path contains: ${indicator}`);
      confidence += 20;
    }
  }

  // Check for common pentesting headers
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];
  for (const header of suspiciousHeaders) {
    if (request.headers[header] && request.headers[header].includes(',')) {
      indicators.push(`Multiple IPs in ${header}`);
      confidence += 10;
    }
  }

  // Check for scanning patterns
  if (/\.(bak|backup|old|orig|sql|tar|zip|gz)$/i.test(path)) {
    indicators.push('Backup file enumeration');
    confidence += 25;
  }

  return {
    isPentester: confidence >= 30,
    confidence: Math.min(confidence, 100),
    indicators,
  };
}

/**
 * Handle detected pentester
 */
export async function handlePentester(
  ip: string,
  detection: ReturnType<typeof detectPentester>
): Promise<void> {
  if (!detection.isPentester) return;

  // Mark as suspicious
  markSuspicious(ip);

  // Log the attempt
  console.log(`[SECURITY] Pentester detected from ${ip}:`, detection);

  // Alert admin
  const SECURITY_WEBHOOK = process.env.SECURITY_WEBHOOK_URL;
  if (SECURITY_WEBHOOK) {
    try {
      await fetch(SECURITY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pentester_detected',
          ip,
          detection,
          timestamp: new Date().toISOString(),
          message: `Unauthorized security testing detected from ${ip}. This activity has been logged and reported.`,
        }),
      });
    } catch (error) {
      console.error('Failed to send pentester alert:', error);
    }
  }
}
