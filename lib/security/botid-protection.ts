/**
 * BotID Protection
 * Bot detection and verification for high-value pages and routes
 * Can be integrated with Cloudflare Bot Management, reCAPTCHA, or custom solutions
 */

import type { NextRequest } from 'next/server';

// Environment configuration
const BOTID_ENABLED = process.env.BOTID_ENABLED === 'true';
const BOTID_SECRET_KEY = process.env.BOTID_SECRET_KEY;
const BOTID_SITE_KEY = process.env.NEXT_PUBLIC_BOTID_SITE_KEY;

// Cloudflare Turnstile (Web3) - Primary bot protection
const TURNSTILE_ENABLED = !!process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const TURNSTILE_SECRET_KEY = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

export interface BotIdResult {
  verified: boolean;
  isBot: boolean;
  isVerifiedBot: boolean;
  riskScore?: number;
  reason?: string;
}

/**
 * High-value routes that should be protected with BotID
 */
export const PROTECTED_ROUTES = [
  '/admin',
  '/dashboard',
  '/api/admin',
  '/api/auth/login',
  '/api/auth/register',
  '/api/payments',
  '/api/crypto',
  '/api/tokens',
  '/api/rewards',
] as const;

/**
 * Check if a route should be protected with BotID
 */
export function shouldProtectRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Verify BotID token from request
 * @param request - Next.js request object
 * @returns BotID verification result
 */
export async function verifyBotIdRequest(request: NextRequest): Promise<BotIdResult> {
  try {
    // If BotID is not enabled, skip verification (allow all)
    if (!BOTID_ENABLED) {
      return {
        verified: true,
        isBot: false,
        isVerifiedBot: false,
        reason: 'BotID protection disabled',
      };
    }

    // Check Cloudflare Bot Management headers (if behind Cloudflare)
    const cfBotScore = request.headers.get('cf-bot-management-score');
    const cfVerifiedBot = request.headers.get('cf-bot-management-verified-bot');

    if (cfBotScore) {
      const score = parseInt(cfBotScore);
      return {
        verified: score < 30, // Cloudflare scores: 0-29 = likely bot, 30-100 = likely human
        isBot: score < 30,
        isVerifiedBot: cfVerifiedBot === 'true',
        riskScore: score / 100,
        reason: score >= 30 ? undefined : 'Cloudflare bot score too low',
      };
    }

    // Get BotID token from header or cookie
    const botIdToken =
      request.headers.get('x-botid-token') ||
      request.cookies.get('botid-token')?.value ||
      request.headers.get('x-captcha-token');

    if (!botIdToken) {
      return {
        verified: false,
        isBot: false,
        isVerifiedBot: false,
        reason: 'No verification token provided',
      };
    }

    // Verify token with Cloudflare Turnstile (Web3) - Primary
    if (TURNSTILE_ENABLED && TURNSTILE_SECRET_KEY) {
      const verificationResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: TURNSTILE_SECRET_KEY,
            response: botIdToken,
          }),
        }
      );

      const result = await verificationResponse.json();

      return {
        verified: result.success || false,
        isBot: !result.success,
        isVerifiedBot: false,
        riskScore: result.success ? 0 : 1,
        reason: result.success ? undefined : 'Turnstile verification failed',
      };
    }

    // Fallback to BotID if Turnstile not configured
    if (BOTID_SECRET_KEY) {
      const verificationResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret: BOTID_SECRET_KEY,
            response: botIdToken,
          }),
        }
      );

      const result = await verificationResponse.json();

      return {
        verified: result.success || false,
        isBot: !result.success,
        isVerifiedBot: false,
        riskScore: result.success ? 0 : 1,
        reason: result.success ? undefined : 'Token verification failed',
      };
    }

    // Fallback: no verification configured
    return {
      verified: true, // Allow by default if not configured
      isBot: false,
      isVerifiedBot: false,
      reason: 'No verification service configured',
    };
  } catch (error) {
    console.error('BotID verification error:', error);
    // On error, allow through (fail open) to avoid blocking legitimate users
    return {
      verified: true,
      isBot: false,
      isVerifiedBot: false,
      reason: error instanceof Error ? error.message : 'Verification error',
    };
  }
}

/**
 * Check if request should be challenged
 * Challenges non-browser sources, excluding verified bots
 */
export async function shouldChallengeRequest(request: NextRequest): Promise<boolean> {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;

  // Skip protection for public routes
  if (!shouldProtectRoute(pathname)) {
    return false;
  }

  // Check BotID verification
  const botIdResult = await verifyBotIdRequest(request);

  // Challenge if:
  // 1. BotID verification failed
  // 2. Detected as bot but not verified
  // 3. High risk score
  if (!botIdResult.verified) {
    return true;
  }

  if (botIdResult.isBot && !botIdResult.isVerifiedBot) {
    return true;
  }

  if (botIdResult.riskScore && botIdResult.riskScore > 0.7) {
    return true;
  }

  // Allow verified bots (search engines, monitoring tools, etc.)
  if (botIdResult.isVerifiedBot) {
    return false;
  }

  // Check for common bot user agents (but allow verified ones)
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /postman/i,
  ];

  const isLikelyBot = botPatterns.some((pattern) => pattern.test(userAgent));

  // Challenge if looks like bot but not verified
  if (isLikelyBot && !botIdResult.verified) {
    return true;
  }

  return false;
}

/**
 * Get BotID challenge response
 */
export function getBotIdChallengeResponse(request: NextRequest): Response {
  return new Response(
    JSON.stringify({
      error: 'Bot verification required',
      challenge: true,
      message: 'Please verify you are not a bot',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-BotID-Challenge': 'required',
      },
    }
  );
}
