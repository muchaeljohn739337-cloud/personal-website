import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prismaClient';
import { getPaymentProviderConfig } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startTime = Date.now();
  const health: Record<string, unknown> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  };

  // Database health check
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = {
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    health.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.status = 'degraded';
  }

  // Payment providers status
  const paymentConfig = getPaymentProviderConfig();
  health.paymentProviders = {
    stripe: paymentConfig.stripe.enabled,
    lemonsqueezy: paymentConfig.lemonsqueezy.enabled,
    nowpayments: paymentConfig.nowpayments.enabled,
    alchemypay: paymentConfig.alchemypay.enabled,
  };

  // Memory usage
  const memoryUsage = process.memoryUsage();
  health.memory = {
    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
    unit: 'MB',
  };

  // Environment checks
  health.environment = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;

  return NextResponse.json(health, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Response-Time': `${Date.now() - startTime}ms`,
    },
  });
}
