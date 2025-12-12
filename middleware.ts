import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getLoadBalancer } from './lib/infrastructure/load-balancer';
import {
  shouldChallengeRequest,
  shouldProtectRoute,
  verifyBotIdRequest,
} from './lib/security/botid-protection';

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    // Handle API routes with special protection
    if (pathname.startsWith('/api')) {
      const apiMiddleware = (await import('./middleware-api')).default;
      return apiMiddleware(request);
    }

    // Load balancer check
    const loadBalancer = getLoadBalancer();
    const connectionId = request.headers.get('x-connection-id') || request.ip || 'unknown';

    const canHandle = loadBalancer.canHandleRequest();
    if (!canHandle.allowed) {
      return NextResponse.json(
        { error: canHandle.reason || 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Register connection
    loadBalancer.registerConnection(connectionId);

    // Skip authentication for public routes
    const publicRoutes = [
      '/api/auth',
      '/api/health',
      '/api/verification',
      '/api/system/status',
      '/auth',
      '/',
      '/privacy',
      '/terms',
      '/acceptable-use',
      '/faq',
      '/security',
    ];

    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // BotID protection for high-value routes (controlled by BOTID_ENABLED env var)
    if (shouldProtectRoute(pathname) && process.env.BOTID_ENABLED === 'true') {
      const shouldChallenge = await shouldChallengeRequest(request);
      if (shouldChallenge) {
        const botIdResult = await verifyBotIdRequest(request);
        // If BotID verification failed, return challenge
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

    // Check authentication for protected routes
    if (!isPublicRoute && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

      if (!token) {
        const loginUrl = new URL('/auth/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Admin routes require admin role
      if (pathname.startsWith('/admin')) {
        if (token.role !== 'ADMIN' && token.role !== 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    // Add response headers
    const response = NextResponse.next();

    // System headers
    response.headers.set('X-Connection-ID', connectionId);
    response.headers.set('X-System-Status', loadBalancer.getMetrics().status);

    // Add visitor location headers (from Cloudflare or request)
    const cfCity = request.headers.get('cf-ipcity');
    const cfCountry = request.headers.get('cf-ipcountry');
    const cfLatitude = request.headers.get('cf-iplatitude');
    const cfLongitude = request.headers.get('cf-iplongitude');
    const cfContinent = request.headers.get('cf-ipcontinent');
    const cfRegion = request.headers.get('cf-region');
    const cfTimezone = request.headers.get('cf-timezone');
    const cfASN = request.headers.get('cf-ipasn');
    const cfASNOrg = request.headers.get('cf-ipasn-org');

    if (cfCity) response.headers.set('X-Visitor-City', cfCity);
    if (cfCountry) response.headers.set('X-Visitor-Country', cfCountry);
    if (cfLatitude) response.headers.set('X-Visitor-Latitude', cfLatitude);
    if (cfLongitude) response.headers.set('X-Visitor-Longitude', cfLongitude);
    if (cfContinent) response.headers.set('X-Visitor-Continent', cfContinent);
    if (cfRegion) response.headers.set('X-Visitor-Region', cfRegion);
    if (cfTimezone) response.headers.set('X-Visitor-TimeZone', cfTimezone);
    if (cfASN) response.headers.set('X-Visitor-ASN', cfASN);
    if (cfASNOrg) response.headers.set('X-Visitor-ASN-Org', cfASNOrg);

    // Add True-Client-IP header (visitor's real IP)
    const clientIp =
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.ip;
    if (clientIp) {
      response.headers.set('True-Client-IP', clientIp);
      // Also set X-Forwarded-For for compatibility
      response.headers.set('X-Forwarded-For', clientIp);
    }

    // Add TLS client auth headers if available (comprehensive)
    const tlsClientAuthIssuer = request.headers.get('cf-client-auth-cert-issuer');
    const tlsClientAuthSubject = request.headers.get('cf-client-auth-cert-subject');
    const tlsClientAuthSerial = request.headers.get('cf-client-auth-cert-serial');
    const tlsClientAuthFingerprint = request.headers.get('cf-client-auth-cert-fingerprint');
    const tlsClientAuthVerified = request.headers.get('cf-client-auth-verified');

    if (tlsClientAuthIssuer || tlsClientAuthVerified === 'true') {
      response.headers.set('X-TLS-Client-Auth', 'verified');
      if (tlsClientAuthIssuer) {
        response.headers.set('X-TLS-Client-Issuer', tlsClientAuthIssuer);
      }
      if (tlsClientAuthSubject) {
        response.headers.set('X-TLS-Client-Subject', tlsClientAuthSubject);
      }
      if (tlsClientAuthSerial) {
        response.headers.set('X-TLS-Client-Serial', tlsClientAuthSerial);
      }
      if (tlsClientAuthFingerprint) {
        response.headers.set('X-TLS-Client-Fingerprint', tlsClientAuthFingerprint);
      }
    } else if (tlsClientAuthVerified === 'false') {
      response.headers.set('X-TLS-Client-Auth', 'not-verified');
    }

    // Remove X-Powered-By (already done in next.config.mjs with poweredByHeader: false)
    response.headers.delete('X-Powered-By');
    response.headers.delete('X-Powered-By-Next.js');

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // Return a basic response to prevent complete failure
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Note: API routes are now handled by middleware
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
