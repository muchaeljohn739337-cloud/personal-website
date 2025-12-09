import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

import { getLoadBalancer } from './lib/infrastructure/load-balancer';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  response.headers.set('X-Connection-ID', connectionId);
  response.headers.set('X-System-Status', loadBalancer.getMetrics().status);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
