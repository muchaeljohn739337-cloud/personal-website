/**
 * API Guard - Reusable protection for API route handlers
 * Use this in individual API route files for additional protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { protectAPI, type APIProtectionConfig } from './api-protection';

/**
 * Wrapper function to protect API route handlers
 */
export function withAPIGuard(
  handler: (req: NextRequest, context?: any) => Promise<Response>,
  config: APIProtectionConfig = {}
) {
  return async (req: NextRequest, context?: any): Promise<Response> => {
    // Apply protection
    const protection = await protectAPI(req, config);

    if (!protection.allowed) {
      return protection.response || NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Add rate limit headers to response
    const response = await handler(req, context);
    const responseWithHeaders = new NextResponse(response.body, response);

    if (protection.headers) {
      Object.entries(protection.headers).forEach(([key, value]) => {
        responseWithHeaders.headers.set(key, value);
      });
    }

    return responseWithHeaders;
  };
}

/**
 * Check if user has required role
 */
export async function requireRole(
  request: NextRequest,
  requiredRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR'
): Promise<{ allowed: boolean; token?: any; response?: NextResponse }> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const userRole = token.role as string;
  const roleHierarchy: Record<string, number> = {
    USER: 1,
    MODERATOR: 2,
    ADMIN: 3,
    SUPER_ADMIN: 4,
  };

  const requiredLevel = roleHierarchy[requiredRole] || 0;
  const userLevel = roleHierarchy[userRole] || 0;

  if (userLevel < requiredLevel) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Forbidden',
          message: `This endpoint requires ${requiredRole} role or higher`,
          requiredRole,
          userRole,
        },
        { status: 403 }
      ),
    };
  }

  return { allowed: true, token };
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ allowed: boolean; token?: any; response?: NextResponse }> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || !token.id) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return { allowed: true, token };
}

