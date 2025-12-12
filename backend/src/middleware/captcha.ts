/**
 * CAPTCHA Verification Middleware
 *
 * Supports:
 * - Cloudflare Turnstile (recommended - privacy-friendly)
 * - hCaptcha (fallback)
 * - reCAPTCHA v3 (legacy support)
 *
 * Usage:
 *   import { verifyCaptcha, captchaOptional } from './middleware/captcha';
 *
 *   // Required captcha
 *   router.post('/register', verifyCaptcha, async (req, res) => { ... });
 *
 *   // Optional captcha (only verifies if token provided)
 *   router.post('/contact', captchaOptional, async (req, res) => { ... });
 */

import { NextFunction, Request, Response } from "express";

// Configuration from environment
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY || "";
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY || "";
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || "";
const CAPTCHA_ENABLED = process.env.CAPTCHA_ENABLED !== "false";

// Captcha verification URLs
const VERIFY_URLS = {
  turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  hcaptcha: "https://hcaptcha.com/siteverify",
  recaptcha: "https://www.google.com/recaptcha/api/siteverify",
};

interface CaptchaResponse {
  success: boolean;
  score?: number; // reCAPTCHA v3 only
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Detect captcha provider from token format
 */
function detectProvider(token: string): "turnstile" | "hcaptcha" | "recaptcha" | null {
  if (!token) return null;

  // Turnstile tokens start with specific prefix
  if (token.startsWith("0.") || token.length > 2000) {
    return "turnstile";
  }

  // hCaptcha tokens are typically shorter
  if (token.length < 500 && !token.includes(".")) {
    return "hcaptcha";
  }

  // reCAPTCHA tokens contain dots
  if (token.includes(".")) {
    return "recaptcha";
  }

  return null;
}

/**
 * Verify captcha token with provider
 */
async function verifyToken(
  token: string,
  provider: "turnstile" | "hcaptcha" | "recaptcha",
  ip?: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  const secrets: Record<string, string> = {
    turnstile: TURNSTILE_SECRET,
    hcaptcha: HCAPTCHA_SECRET,
    recaptcha: RECAPTCHA_SECRET,
  };

  const secret = secrets[provider];
  if (!secret) {
    console.warn(`[Captcha] No secret configured for ${provider}`);
    return { success: false, error: `${provider} not configured` };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(VERIFY_URLS[provider], {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data: CaptchaResponse = await response.json();

    if (data.success) {
      return {
        success: true,
        score: data.score,
      };
    }

    return {
      success: false,
      error: data["error-codes"]?.join(", ") || "Verification failed",
    };
  } catch (error) {
    console.error(`[Captcha] ${provider} verification error:`, error);
    return { success: false, error: "Verification request failed" };
  }
}

/**
 * Extract captcha token from request
 * Checks body, headers, and query params
 */
function extractToken(req: Request): string | null {
  // Check common field names in body
  const body = req.body || {};
  const tokenFields = [
    "captchaToken",
    "cf-turnstile-response",
    "cf_turnstile_response",
    "h-captcha-response",
    "hcaptcha_response",
    "g-recaptcha-response",
    "recaptcha_response",
    "token",
  ];

  for (const field of tokenFields) {
    if (body[field]) return body[field];
  }

  // Check headers
  const headerToken = req.headers["x-captcha-token"] || req.headers["cf-turnstile-response"];
  if (headerToken) return headerToken as string;

  // Check query params (for GET requests)
  if (req.query.captchaToken) return req.query.captchaToken as string;

  return null;
}

/**
 * Main captcha verification middleware
 * Requires valid captcha token
 */
export async function verifyCaptcha(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Skip if captcha disabled
  if (!CAPTCHA_ENABLED) {
    return next();
  }

  // Skip for trusted IPs (localhost, internal)
  const ip = req.ip || req.socket.remoteAddress || "";
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    if (process.env.NODE_ENV === "development") {
      return next();
    }
  }

  const token = extractToken(req);
  if (!token) {
    res.status(400).json({
      success: false,
      error: "Captcha token required",
      code: "CAPTCHA_MISSING",
    });
    return;
  }

  // Detect provider
  const provider = detectProvider(token);
  if (!provider) {
    res.status(400).json({
      success: false,
      error: "Invalid captcha token format",
      code: "CAPTCHA_INVALID",
    });
    return;
  }

  // Verify token
  const result = await verifyToken(token, provider, ip);

  if (!result.success) {
    res.status(403).json({
      success: false,
      error: "Captcha verification failed",
      code: "CAPTCHA_FAILED",
      details: result.error,
    });
    return;
  }

  // For reCAPTCHA v3, check score threshold
  if (provider === "recaptcha" && result.score !== undefined) {
    const threshold = parseFloat(process.env.RECAPTCHA_THRESHOLD || "0.5");
    if (result.score < threshold) {
      res.status(403).json({
        success: false,
        error: "Captcha score too low",
        code: "CAPTCHA_LOW_SCORE",
        score: result.score,
      });
      return;
    }
    // Attach score to request for downstream use
    (req as any).captchaScore = result.score;
  }

  // Attach verification info to request
  (req as any).captchaVerified = true;
  (req as any).captchaProvider = provider;

  next();
}

/**
 * Optional captcha middleware
 * Only verifies if token is provided, doesn't fail if missing
 */
export async function captchaOptional(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!CAPTCHA_ENABLED) {
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    // No token = skip verification
    (req as any).captchaVerified = false;
    return next();
  }

  // If token provided, verify it
  return verifyCaptcha(req, res, next);
}

/**
 * Rate-limited captcha middleware
 * Only requires captcha after N requests from same IP
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const CAPTCHA_RATE_LIMIT = parseInt(process.env.CAPTCHA_RATE_LIMIT || "5", 10);
const CAPTCHA_RATE_WINDOW = parseInt(process.env.CAPTCHA_RATE_WINDOW || "60000", 10); // 1 minute

export async function captchaAfterLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!CAPTCHA_ENABLED) {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  // Get or create rate limit entry
  let entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + CAPTCHA_RATE_WINDOW };
    rateLimitMap.set(ip, entry);
  }

  entry.count++;

  // Below limit = no captcha needed
  if (entry.count <= CAPTCHA_RATE_LIMIT) {
    return next();
  }

  // Above limit = require captcha
  return verifyCaptcha(req, res, next);
}

/**
 * Get captcha configuration for frontend
 */
export function getCaptchaConfig(): {
  enabled: boolean;
  provider: string;
  siteKey: string | null;
} {
  if (!CAPTCHA_ENABLED) {
    return { enabled: false, provider: "none", siteKey: null };
  }

  // Priority: Turnstile > hCaptcha > reCAPTCHA
  if (TURNSTILE_SECRET) {
    return {
      enabled: true,
      provider: "turnstile",
      siteKey: process.env.TURNSTILE_SITE_KEY || null,
    };
  }

  if (HCAPTCHA_SECRET) {
    return {
      enabled: true,
      provider: "hcaptcha",
      siteKey: process.env.HCAPTCHA_SITE_KEY || null,
    };
  }

  if (RECAPTCHA_SECRET) {
    return {
      enabled: true,
      provider: "recaptcha",
      siteKey: process.env.RECAPTCHA_SITE_KEY || null,
    };
  }

  return { enabled: false, provider: "none", siteKey: null };
}

export default {
  verifyCaptcha,
  captchaOptional,
  captchaAfterLimit,
  getCaptchaConfig,
};
