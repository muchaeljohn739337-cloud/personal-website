/**
 * Redis-based Rate Limiting for Distributed Environments
 * Falls back to in-memory if Redis is not available
 */

import { checkRateLimit as memoryRateLimit, RateLimitResult } from './rate-limit';

// Redis client type (using ioredis)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisClient: any = null;
let redisAvailable = false;

/**
 * Initialize Redis client for rate limiting
 */
export async function initRedisRateLimit(): Promise<boolean> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.warn('⚠️  REDIS_URL not set, using in-memory rate limiting');
    return false;
  }

  try {
    // Dynamic import to avoid issues if ioredis is not installed
    const Redis = (await import('ioredis')).default;
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    await (redisClient as unknown as { connect: () => Promise<void> }).connect();
    redisAvailable = true;
    console.log('✅ Redis rate limiting initialized');
    return true;
  } catch (error) {
    console.warn('⚠️  Redis connection failed, falling back to in-memory rate limiting:', error);
    redisAvailable = false;
    return false;
  }
}

interface RedisRateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
}

const defaultConfig: RedisRateLimitConfig = {
  windowSeconds: 900, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'ratelimit:',
};

/**
 * Check rate limit using Redis (with fallback to memory)
 */
export async function checkRedisRateLimit(
  identifier: string,
  config: Partial<RedisRateLimitConfig> = {}
): Promise<RateLimitResult> {
  // Fallback to memory-based rate limiting if Redis is not available
  if (!redisAvailable || !redisClient) {
    return memoryRateLimit(identifier, {
      windowMs: (config.windowSeconds || defaultConfig.windowSeconds) * 1000,
      maxRequests: config.maxRequests || defaultConfig.maxRequests,
    });
  }

  const { windowSeconds, maxRequests, keyPrefix } = { ...defaultConfig, ...config };
  const key = `${keyPrefix}${identifier}`;

  try {
    const current = await redisClient.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    const ttl = await redisClient.ttl(key);
    const resetTime = Date.now() + ttl * 1000;

    if (current > maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetTime,
        retryAfter: ttl,
      };
    }

    return {
      success: true,
      remaining: maxRequests - current,
      resetTime,
    };
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error);
    // Fallback to memory on Redis error
    return memoryRateLimit(identifier, {
      windowMs: windowSeconds * 1000,
      maxRequests,
    });
  }
}

/**
 * Rate limit configurations for different endpoint types
 */
export const redisRateLimitConfigs = {
  // Very strict for login attempts
  login: {
    windowSeconds: 900, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'ratelimit:login:',
  },
  // Strict for password reset
  passwordReset: {
    windowSeconds: 3600, // 1 hour
    maxRequests: 3,
    keyPrefix: 'ratelimit:pwreset:',
  },
  // Standard API limits
  api: {
    windowSeconds: 60,
    maxRequests: 60,
    keyPrefix: 'ratelimit:api:',
  },
  // 2FA verification attempts
  twoFactor: {
    windowSeconds: 300, // 5 minutes
    maxRequests: 5,
    keyPrefix: 'ratelimit:2fa:',
  },
  // Email verification resend
  emailVerification: {
    windowSeconds: 300, // 5 minutes
    maxRequests: 3,
    keyPrefix: 'ratelimit:emailverify:',
  },
};

/**
 * Middleware helper for API routes
 */
export async function withRateLimit(
  identifier: string,
  configKey: keyof typeof redisRateLimitConfigs = 'api'
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const config = redisRateLimitConfigs[configKey];
  const result = await checkRedisRateLimit(identifier, config);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };

  if (!result.success && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return {
    allowed: result.success,
    headers,
  };
}
