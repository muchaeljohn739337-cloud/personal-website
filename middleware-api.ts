/**
 * API Route Protection Middleware
 * Protects all /api/* routes from unauthorized access
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRouteProtectionConfig,
  isPublicAPIRoute,
  protectAPI,
} from './lib/security/api-protection';
import {
  shouldChallengeRequest,
  shouldProtectRoute,
  verifyBotIdRequest,
} from './lib/security/botid-protection';

export default async function apiMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only process API routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip public routes (but still apply rate limiting)
  if (isPublicAPIRoute(pathname)) {
    const config = getRouteProtectionConfig(pathname);
    const protection = await protectAPI(request, config);
    
    if (!protection.allowed && protection.response) {
      return protection.response;
    }

    // Add rate limit headers to public routes
    const response = NextResponse.next();
    if (protection.headers) {
      Object.entries(protection.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    return response;
  }

  // BotID protection for sensitive routes
  if (shouldProtectRoute(pathname) && process.env.BOTID_ENABLED === 'true') {
    const shouldChallenge = await shouldChallengeRequest(request);
    if (shouldChallenge) {
      const botIdResult = await verifyBotIdRequest(request);
      if (!botIdResult.verified && !botIdResult.isVerifiedBot) {
        return NextResponse.json(
          {
            error: 'Bot verification required',
            challenge: true,
            message: 'Please verify you are not a bot',
          },
          {
            status: 403,
            headers: {
              'X-BotID-Challenge': 'required',
            },
          }
        );
      }
    }
  }

  // Apply protection based on route type
  const config = getRouteProtectionConfig(pathname);
  const protection = await protectAPI(request, config);

  if (!protection.allowed) {
    return protection.response || NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Create response with protection headers
  const response = NextResponse.next();
  
  // Add rate limit headers
  if (protection.headers) {
    Object.entries(protection.headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

