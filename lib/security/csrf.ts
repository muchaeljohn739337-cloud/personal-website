/**
 * CSRF Protection Utility
 * Implements token-based CSRF protection for forms and API requests
 */

import { randomBytes, createHmac } from 'crypto';

const CSRF_SECRET = process.env.SESSION_SECRET || process.env.JWT_SECRET;
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate a CSRF token
 * @param sessionId - User's session ID for binding the token
 */
export function generateCSRFToken(sessionId: string): string {
  if (!CSRF_SECRET) {
    console.error('CRITICAL: No secret configured for CSRF token generation');
    throw new Error('CSRF configuration error');
  }

  const timestamp = Date.now();
  const randomPart = randomBytes(32).toString('hex');
  const data = `${sessionId}:${timestamp}:${randomPart}`;

  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(data);
  const signature = hmac.digest('hex');

  // Encode token as base64 for easy transport
  const tokenData: CSRFToken = { token: `${data}:${signature}`, timestamp };
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * Validate a CSRF token
 * @param token - The CSRF token to validate
 * @param sessionId - User's session ID to verify binding
 */
export function validateCSRFToken(token: string, sessionId: string): boolean {
  if (!CSRF_SECRET) {
    console.error('CRITICAL: No secret configured for CSRF token validation');
    return false;
  }

  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const tokenData: CSRFToken = JSON.parse(decoded);

    // Check expiry
    if (Date.now() - tokenData.timestamp > TOKEN_EXPIRY) {
      return false;
    }

    // Parse the token parts
    const parts = tokenData.token.split(':');
    if (parts.length !== 4) {
      return false;
    }

    const [tokenSessionId, timestamp, randomPart, providedSignature] = parts;

    // Verify session binding
    if (tokenSessionId !== sessionId) {
      return false;
    }

    // Verify signature
    const data = `${tokenSessionId}:${timestamp}:${randomPart}`;
    const hmac = createHmac('sha256', CSRF_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest('hex');

    // Timing-safe comparison
    return timingSafeEqual(providedSignature, expectedSignature);
  } catch {
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Middleware helper to check CSRF token from request
 */
export function getCSRFTokenFromRequest(headers: Headers): string | null {
  return (
    headers.get('x-csrf-token') || headers.get('x-xsrf-token') || headers.get('csrf-token') || null
  );
}

/**
 * Check if request method requires CSRF validation
 */
export function requiresCSRFValidation(method: string): boolean {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  return !safeMethods.includes(method.toUpperCase());
}
