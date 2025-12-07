// In-Memory Cache with TTL for high-performance data access
// Reduces database load and improves response times

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  memoryUsage: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, memoryUsage: 0 };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.startCleanup();
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set a value in cache with TTL (in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds = 300): void {
    // Evict if at max size
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 0,
    });

    this.stats.size = this.cache.size;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }

  /**
   * Clear all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.size = this.cache.size;
    return count;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      memoryUsage: this.estimateMemoryUsage(),
    };
  }

  /**
   * Get or set with callback (cache-aside pattern)
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlSeconds);
    return data;
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    let minHits = Infinity;
    let lruKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < minHits) {
        minHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
      this.stats.size = this.cache.size;
    }, 60000); // Every minute
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(entry.data).length * 2;
      size += 24; // Object overhead
    }
    return size;
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Singleton instance
let cacheInstance: MemoryCache | null = null;

export function getCache(): MemoryCache {
  if (!cacheInstance) {
    cacheInstance = new MemoryCache(2000);
  }
  return cacheInstance;
}

// Convenience functions
export function cacheGet<T>(key: string): T | null {
  return getCache().get<T>(key);
}

export function cacheSet<T>(key: string, data: T, ttlSeconds = 300): void {
  getCache().set(key, data, ttlSeconds);
}

export async function cacheGetOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  return getCache().getOrSet(key, fetcher, ttlSeconds);
}

export function cacheInvalidate(pattern: string): number {
  return getCache().invalidatePattern(pattern);
}

export function getCacheStats(): CacheStats {
  return getCache().getStats();
}
