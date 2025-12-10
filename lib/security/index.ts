/**
 * Security Module Index
 * Centralized exports for all security utilities
 */

export * from './rate-limit';
export * from './csrf';

/**
 * Security validation helpers
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Password must be at least 8 characters');

  if (password.length >= 12) score++;

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score++;
  else feedback.push('Add numbers');

  if (/[^a-zA-Z0-9]/.test(password)) score++;
  else feedback.push('Add special characters');

  // Check for common patterns
  const commonPatterns = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPatterns.some((p) => password.toLowerCase().includes(p))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common password patterns');
  }

  return {
    isValid: score >= 4 && password.length >= 8,
    score: Math.min(score, 5),
    feedback,
  };
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

/**
 * Hash sensitive data for logging (partial masking)
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars * 2);
  return `${start}${masked}${end}`;
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function isValidRedirectUrl(url: string, allowedHosts: string[]): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');

    // Allow relative URLs
    if (url.startsWith('/') && !url.startsWith('//')) {
      return true;
    }

    // Check against allowed hosts
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Security audit log entry
 */
export interface SecurityEvent {
  type:
    | 'login_attempt'
    | 'login_success'
    | 'login_failure'
    | 'logout'
    | 'password_reset'
    | 'rate_limit_exceeded'
    | 'csrf_failure'
    | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Log security event (implement your logging service here)
 */
export function logSecurityEvent(event: SecurityEvent): void {
  // In production, send to your logging service (e.g., Sentry, DataDog, etc.)
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', JSON.stringify(event, null, 2));
  }

  // TODO: Implement production logging
  // await prisma.securityLog.create({ data: event });
}
