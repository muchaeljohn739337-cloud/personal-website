/**
 * ═══════════════════════════════════════════════════════════════
 * HTTPS/HSTS SECURITY MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 * Purpose: Ensure proper URL redirection, HTTPS enforcement, header security
 * Features:
 * - Force HTTPS & HSTS headers
 * - Prevent redirect loops
 * - Add security headers: X-Frame-Options, CSP, X-XSS-Protection
 * - Detect and block malicious redirects
 * ═══════════════════════════════════════════════════════════════
 */

import { NextFunction, Request, Response } from "express";

// Track redirect chains to detect loops
const redirectHistory = new Map<string, number[]>();
const MAX_REDIRECTS = 3;
const REDIRECT_WINDOW = 10000; // 10 seconds

// ═══════════════════════════════════════════════════════════════
// HTTPS ENFORCEMENT MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
export function forceHTTPS(req: Request, res: Response, next: NextFunction) {
  // Skip in development or if already HTTPS
  if (
    process.env.NODE_ENV === "development" ||
    req.secure ||
    req.headers["x-forwarded-proto"] === "https"
  ) {
    return next();
  }

  // Check for redirect loop before redirecting
  const clientIP = req.ip || req.socket.remoteAddress || "unknown";
  const redirectKey = `${clientIP}-${req.url}`;

  if (checkRedirectLoop(redirectKey)) {
    console.error("🚨 Redirect loop detected:", redirectKey);
    return res.status(400).json({
      error: "Redirect loop detected",
      message: "Too many HTTPS redirects. Please check your configuration.",
    });
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  console.log(`🔒 Redirecting HTTP → HTTPS: ${req.url}`);

  // Track this redirect
  trackRedirect(redirectKey);

  return res.redirect(301, httpsUrl);
}

// ═══════════════════════════════════════════════════════════════
// ENHANCED SECURITY HEADERS
// ═══════════════════════════════════════════════════════════════
export function enhancedSecurityHeaders(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // HTTP Strict Transport Security (HSTS)
  // Force HTTPS for 1 year, including all subdomains
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Prevent clickjacking attacks
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable browser XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy - only send origin on cross-origin requests
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Content Security Policy (CSP)
  // This is a strict policy - adjust based on your needs
  const cspPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.stripe.com https://api.advanciapayledger.com wss:",
    "frame-src 'self' https://js.stripe.com",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", cspPolicy);

  // Permissions Policy (formerly Feature-Policy)
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(self)"
  );

  // Remove X-Powered-By header to hide tech stack
  res.removeHeader("X-Powered-By");

  next();
}

// ═══════════════════════════════════════════════════════════════
// REDIRECT LOOP DETECTION
// ═══════════════════════════════════════════════════════════════
function checkRedirectLoop(key: string): boolean {
  const now = Date.now();
  const history = redirectHistory.get(key) || [];

  // Remove old redirects outside the time window
  const recentRedirects = history.filter(
    (timestamp) => now - timestamp < REDIRECT_WINDOW
  );

  // Check if too many redirects in the window
  return recentRedirects.length >= MAX_REDIRECTS;
}

function trackRedirect(key: string) {
  const now = Date.now();
  const history = redirectHistory.get(key) || [];

  // Add current redirect
  history.push(now);

  // Keep only recent redirects
  const recentHistory = history.filter(
    (timestamp) => now - timestamp < REDIRECT_WINDOW
  );

  redirectHistory.set(key, recentHistory);
}

// Clean up old redirect history every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, history] of redirectHistory.entries()) {
    const recentHistory = history.filter(
      (timestamp) => now - timestamp < REDIRECT_WINDOW
    );
    if (recentHistory.length === 0) {
      redirectHistory.delete(key);
    } else {
      redirectHistory.set(key, recentHistory);
    }
  }
}, 60000);

// ═══════════════════════════════════════════════════════════════
// MALICIOUS REDIRECT DETECTION
// ═══════════════════════════════════════════════════════════════
export function validateRedirect(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check for open redirect vulnerabilities
  const redirectParam =
    req.query.redirect ||
    req.query.returnUrl ||
    req.query.return ||
    req.query.next;

  if (redirectParam && typeof redirectParam === "string") {
    // Whitelist of allowed redirect domains
    const allowedDomains = [
      "advanciapayledger.com",
      "www.advanciapayledger.com",
      "admin.advanciapayledger.com",
      "localhost",
      "127.0.0.1",
    ];

    try {
      const url = new URL(redirectParam, `https://${req.headers.host}`);

      // Check if redirect is to an allowed domain
      const isAllowed = allowedDomains.some((domain) =>
        url.hostname.endsWith(domain)
      );

      if (!isAllowed) {
        console.warn("🚨 Blocked malicious redirect attempt:", redirectParam);
        return res.status(400).json({
          error: "Invalid redirect destination",
          message: "Redirect to external domains is not allowed",
        });
      }
    } catch (error) {
      // Invalid URL
      return res.status(400).json({
        error: "Invalid redirect URL",
        message: "Malformed redirect parameter",
      });
    }
  }

  next();
}

// ═══════════════════════════════════════════════════════════════
// COMBINED SECURITY MIDDLEWARE
// ═══════════════════════════════════════════════════════════════
export function applySecurityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Apply all security measures in order
  forceHTTPS(req, res, () => {
    validateRedirect(req, res, () => {
      enhancedSecurityHeaders(req, res, next);
    });
  });
}

export default {
  forceHTTPS,
  enhancedSecurityHeaders,
  validateRedirect,
  applySecurityMiddleware,
};
