import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

// Set this to true to enable maintenance mode
let MAINTENANCE_MODE = false;

// Protected routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/api/admin', '/api/user'];

// Admin-only routes
const ADMIN_ROUTES = ['/admin', '/api/admin'];

// Auth routes (redirect if already logged in)
const AUTH_ROUTES = ['/auth/login', '/auth/register'];

// Security shield enabled
const SECURITY_SHIELD_ENABLED = true;

// Paths that should still be accessible during maintenance
const ALLOWED_PATHS = ['/maintenance', '/blocked', '/_next', '/favicon.ico', '/static'];

// Admin paths that bypass maintenance (with proper auth)
const ADMIN_BYPASS_PATHS = ['/admin', '/api/admin'];

// Paths to protect with extra security
const SENSITIVE_PATHS = ['/api/payments', '/api/wallet', '/api/withdraw', '/api/admin'];

// Pentesting tool signatures
const PENTESTER_SIGNATURES = [
  'sqlmap',
  'nikto',
  'nmap',
  'burp',
  'owasp',
  'metasploit',
  'hydra',
  'gobuster',
  'dirbuster',
  'wfuzz',
  'nuclei',
];

// Suspicious path patterns
const SUSPICIOUS_PATHS = [
  '/.git',
  '/.env',
  '/wp-admin',
  '/phpmyadmin',
  '/admin.php',
  '/config.php',
  '/backup',
  '/phpinfo',
  '/server-status',
];

// =============================================================================
// IN-MEMORY SECURITY STATE
// =============================================================================

const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, number>();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const loginAttempts = new Map<
  string,
  { count: number; lastAttempt: number; lockoutUntil?: number }
>();
let systemLockdown = false;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getClientIP(headers: Headers): string {
  return (
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '127.0.0.1'
  );
}

function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip);
}

function markSuspicious(ip: string): void {
  const count = (suspiciousIPs.get(ip) || 0) + 1;
  suspiciousIPs.set(ip, count);
  if (count >= 10) {
    blockedIPs.add(ip);
  }
}

function detectPentester(userAgent: string, path: string): boolean {
  const ua = userAgent.toLowerCase();

  // Check user agent for pentesting tools
  for (const sig of PENTESTER_SIGNATURES) {
    if (ua.includes(sig)) {
      return true;
    }
  }

  // Check for suspicious paths
  for (const suspPath of SUSPICIOUS_PATHS) {
    if (path.includes(suspPath)) {
      return true;
    }
  }

  return false;
}

function detectSQLInjection(url: string): boolean {
  const patterns = [
    /union\s+select/i,
    /or\s+1\s*=\s*1/i,
    /'\s*or\s*'/i,
    /;\s*drop\s+table/i,
    /;\s*delete\s+from/i,
  ];
  return patterns.some((p) => p.test(url));
}

function detectXSS(url: string): boolean {
  const patterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /eval\s*\(/i];
  return patterns.some((p) => p.test(url));
}

function triggerLockdown(reason: string): void {
  systemLockdown = true;
  MAINTENANCE_MODE = true;
  console.error(`[SECURITY LOCKDOWN] ${reason}`);
}

// =============================================================================
// MAIN MIDDLEWARE
// =============================================================================

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const ip = getClientIP(request.headers);
  const userAgent = request.headers.get('user-agent') || '';
  const fullUrl = pathname + search;

  // ==========================================================================
  // AUTHENTICATION CHECKS
  // ==========================================================================

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check admin access
  if (isAdminRoute && token) {
    const userRole = token.role as string;
    if (userRole !== 'ADMIN') {
      // Non-admin trying to access admin routes
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ==========================================================================
  // SECURITY SHIELD CHECKS
  // ==========================================================================

  if (SECURITY_SHIELD_ENABLED) {
    // Check system lockdown
    if (systemLockdown) {
      if (!pathname.startsWith('/maintenance') && !pathname.startsWith('/_next')) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }

    // Check blocked IPs
    if (isIPBlocked(ip)) {
      return NextResponse.redirect(new URL('/blocked', request.url));
    }

    // Detect pentesting attempts
    if (detectPentester(userAgent, pathname)) {
      markSuspicious(ip);
      console.log(`[SECURITY] Pentester detected from ${ip}: ${userAgent}`);

      // Return 403 with warning
      return new NextResponse(
        JSON.stringify({
          error: 'Unauthorized security testing detected',
          message:
            'This activity has been logged and reported to administrators. Authorized security testing requires prior written approval.',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Detect SQL injection
    if (detectSQLInjection(fullUrl)) {
      markSuspicious(ip);
      console.log(`[SECURITY] SQL injection attempt from ${ip}: ${fullUrl}`);

      // Check if this is a repeated attack
      const suspCount = suspiciousIPs.get(ip) || 0;
      if (suspCount >= 5) {
        triggerLockdown(`Multiple SQL injection attempts from ${ip}`);
      }

      return new NextResponse(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Detect XSS attempts
    if (detectXSS(fullUrl)) {
      markSuspicious(ip);
      console.log(`[SECURITY] XSS attempt from ${ip}: ${fullUrl}`);

      return new NextResponse(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // ==========================================================================
  // MAINTENANCE MODE
  // ==========================================================================

  if (MAINTENANCE_MODE) {
    // Check if the path is allowed
    const isAllowedPath = ALLOWED_PATHS.some(
      (path) => pathname === path || pathname.startsWith(path + '/')
    );

    // Check admin bypass
    const isAdminPath = ADMIN_BYPASS_PATHS.some((path) => pathname.startsWith(path));
    const hasAdminToken = request.cookies.get('admin_token')?.value;

    if (isAdminPath && hasAdminToken) {
      // Allow admin access during maintenance
      return NextResponse.next();
    }

    // If not an allowed path, redirect to maintenance
    if (!isAllowedPath && pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  // ==========================================================================
  // ADD SECURITY HEADERS
  // ==========================================================================

  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Shield-Status', systemLockdown ? 'lockdown' : 'active');

  // Extra headers for sensitive paths
  if (SENSITIVE_PATHS.some((p) => pathname.startsWith(p))) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
    );
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }

  return response;
}

// =============================================================================
// EXPORTED CONTROL FUNCTIONS
// =============================================================================

export function enableMaintenanceMode(): void {
  MAINTENANCE_MODE = true;
}

export function disableMaintenanceMode(): void {
  MAINTENANCE_MODE = false;
  systemLockdown = false;
}

export function blockIP(ip: string): void {
  blockedIPs.add(ip);
}

export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
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
