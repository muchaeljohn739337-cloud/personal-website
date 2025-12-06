import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Set this to true to enable maintenance mode
const MAINTENANCE_MODE = true;

// Paths that should still be accessible during maintenance
const ALLOWED_PATHS = [
  '/maintenance',
  '/auth/login',
  '/auth/register',
  '/api/auth',
  '/dashboard',
  '/admin',
  '/_next',
  '/favicon.ico',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip maintenance mode if disabled
  if (!MAINTENANCE_MODE) {
    return NextResponse.next();
  }

  // Check if the path is allowed
  const isAllowedPath = ALLOWED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + '/')
  );

  // Allow API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // If not an allowed path, redirect to maintenance
  if (!isAllowedPath && pathname !== '/maintenance') {
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
