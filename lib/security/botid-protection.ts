/**
 * BotID Protection
 * Invisible CAPTCHA for high-value pages and routes
 * Powered by Kasada Deep Analysis
 */

import { verifyBotId } from 'botid';
import type { NextRequest } from 'next/server';

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
    // Get BotID token from header or cookie
    const botIdToken =
      request.headers.get('x-botid-token') ||
      request.cookies.get('botid-token')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!botIdToken) {
      return {
        verified: false,
        isBot: false,
        isVerifiedBot: false,
        reason: 'No BotID token provided',
      };
    }

    // Verify token with BotID
    const verification = await verifyBotId(botidToken);

    return {
      verified: verification.verified,
      isBot: verification.isBot || false,
      isVerifiedBot: verification.isVerifiedBot || false,
      riskScore: verification.riskScore,
      reason: verification.verified ? undefined : 'BotID verification failed',
    };
  } catch (error) {
    console.error('BotID verification error:', error);
    return {
      verified: false,
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


