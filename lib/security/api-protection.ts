/**
 * API Protection Middleware
 * Prevents unauthorized access to backend API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { checkRateLimit, rateLimitConfigs } from './rate-limit';
import { checkAPIAttempt } from './intrusion-detection';

export interface APIProtectionResult {
  allowed: boolean;
  response?: NextResponse;
  headers?: Record<string, string>;
}

export interface APIProtectionConfig {
  requireAuth?: boolean;
  requireRole?: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
  rateLimit?: keyof typeof rateLimitConfigs;
  maxRequests?: number;
  windowMs?: number;
  checkIP?: boolean;
}

/**
 * Protect API route with authentication, rate limiting, and role checks
 */
export async function protectAPI(
  request: NextRequest,
  config: APIProtectionConfig = {}
): Promise<APIProtectionResult> {
  const {
    requireAuth = true,
    requireRole,
    rateLimit = 'api',
    maxRequests,
    windowMs,
    checkIP = true,
  } = config;

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting
  const rateLimitConfig =
    maxRequests && windowMs ? { windowMs, maxRequests } : rateLimitConfigs[rateLimit];

  const rateLimitResult = checkRateLimit(`${ip}:${pathname}`, rateLimitConfig);

  if (!rateLimitResult.success) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          },
        }
      ),
    };
  }

  // 2. IP-based API attempt tracking
  if (checkIP) {
    const apiAttempt = checkAPIAttempt(ip, pathname);
    if (!apiAttempt.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Access denied',
            message: apiAttempt.message || 'Too many API requests from this IP',
            lockoutUntil: apiAttempt.lockoutUntil?.toISOString(),
          },
          {
            status: 403,
            headers: {
              'X-Lockout-Until': apiAttempt.lockoutUntil?.toISOString() || '',
            },
          }
        ),
      };
    }
  }

  // 3. Authentication Check
  if (requireAuth) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.id) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Unauthorized',
            message: 'Authentication required to access this endpoint',
          },
          { status: 401 }
        ),
      };
    }

    // 4. Role-based Access Control
    if (requireRole) {
      const userRole = token.role as string;
      const roleHierarchy: Record<string, number> = {
        USER: 1,
        MODERATOR: 2,
        ADMIN: 3,
        SUPER_ADMIN: 4,
      };

      const requiredLevel = roleHierarchy[requireRole] || 0;
      const userLevel = roleHierarchy[userRole] || 0;

      if (userLevel < requiredLevel) {
        return {
          allowed: false,
          response: NextResponse.json(
            {
              error: 'Forbidden',
              message: `This endpoint requires ${requireRole} role or higher`,
              requiredRole: requireRole,
              userRole: userRole,
            },
            { status: 403 }
          ),
        };
      }
    }
  }

  // 5. Return success with rate limit headers
  return {
    allowed: true,
    headers: {
      'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
    },
  };
}

/**
 * Public API routes that don't require authentication
 */
export const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/health',
  '/api/system/status',
  '/api/verification/global',
] as const;

/**
 * Check if an API route is public
 */
export function isPublicAPIRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Admin-only API routes
 */
export const ADMIN_API_ROUTES = ['/api/admin'] as const;

/**
 * Check if an API route requires admin access
 */
export function isAdminAPIRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Sensitive API routes that need extra protection
 */
export const SENSITIVE_API_ROUTES = [
  '/api/payments',
  '/api/crypto',
  '/api/tokens',
  '/api/web3',
  '/api/admin',
  '/api/passwords',
] as const;

/**
 * Check if an API route is sensitive
 */
export function isSensitiveAPIRoute(pathname: string): boolean {
  return SENSITIVE_API_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Get protection config for a specific route
 */
export function getRouteProtectionConfig(pathname: string): APIProtectionConfig {
  // Public routes
  if (isPublicAPIRoute(pathname)) {
    return {
      requireAuth: false,
      rateLimit: 'public',
      checkIP: true,
    };
  }

  // Admin routes
  if (isAdminAPIRoute(pathname)) {
    return {
      requireAuth: true,
      requireRole: 'ADMIN',
      rateLimit: 'sensitive',
      checkIP: true,
    };
  }

  // Sensitive routes
  if (isSensitiveAPIRoute(pathname)) {
    return {
      requireAuth: true,
      requireRole: 'USER',
      rateLimit: 'sensitive',
      checkIP: true,
    };
  }

  // Default: require auth, standard rate limit
  return {
    requireAuth: true,
    requireRole: 'USER',
    rateLimit: 'api',
    checkIP: true,
  };
}
