// Rate Limiter for API Protection
// Prevents abuse and ensures fair usage across users

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Default rate limit configs
    this.configs.set('default', { maxRequests: 100, windowMs: 60000 }); // 100/min
    this.configs.set('api', { maxRequests: 60, windowMs: 60000 }); // 60/min
    this.configs.set('auth', { maxRequests: 10, windowMs: 60000 }); // 10/min
    this.configs.set('ai', { maxRequests: 20, windowMs: 60000 }); // 20/min
    this.configs.set('upload', { maxRequests: 30, windowMs: 60000 }); // 30/min
    this.configs.set('webhook', { maxRequests: 100, windowMs: 60000 }); // 100/min

    this.startCleanup();
  }

  /**
   * Check if request is allowed
   */
  check(identifier: string, configName = 'default'): RateLimitResult {
    const config = this.configs.get(configName) || this.configs.get('default')!;
    const key = `${configName}:${identifier}`;
    const now = Date.now();

    let entry = this.limits.get(key);

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    entry.count++;
    this.limits.set(key, entry);

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetAt: entry.resetAt,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string, configName = 'default'): void {
    const key = `${configName}:${identifier}`;
    this.limits.delete(key);
  }

  /**
   * Get current usage for an identifier
   */
  getUsage(identifier: string, configName = 'default'): { used: number; limit: number } {
    const config = this.configs.get(configName) || this.configs.get('default')!;
    const key = `${configName}:${identifier}`;
    const entry = this.limits.get(key);

    return {
      used: entry?.count || 0,
      limit: config.maxRequests,
    };
  }

  /**
   * Add or update a rate limit config
   */
  setConfig(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  /**
   * Get all active limits (for monitoring)
   */
  getActiveLimits(): Map<string, RateLimitEntry> {
    return new Map(this.limits);
  }

  /**
   * Cleanup expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.limits.entries()) {
        if (now > entry.resetAt) {
          this.limits.delete(key);
        }
      }
    }, 60000);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

// Convenience function for API routes
export function checkRateLimit(identifier: string, configName = 'default'): RateLimitResult {
  return getRateLimiter().check(identifier, configName);
}

// Headers helper for responses
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}
