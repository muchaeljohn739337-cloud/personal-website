import Redis from "ioredis";

let redis: Redis | null = null;
let connectionAttempted = false;

export function getRedis(): Redis | null {
  // DISABLED FOR LOCAL DEVELOPMENT - Redis not required
  if (!connectionAttempted) {
    console.warn(
      "⚠️  Redis disabled for local development. Features will use in-memory fallback."
    );
    connectionAttempted = true;
  }
  return null;

  /* ORIGINAL CODE - COMMENTED OUT
  if (redis !== null || connectionAttempted) return redis;

  const url = config.redisUrl || process.env.REDIS_URL;
  if (!url) {
    console.warn(
      "⚠️  REDIS_URL not set. Redis features disabled (OTP, rate limits use in-memory fallback)."
    );
    connectionAttempted = true;
    redis = null;
    return redis;
  }

  try {
    redis = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false, // Don't queue commands when disconnected
      retryStrategy: () => null, // Don't retry failed connections
    });

    redis.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
      // Don't crash the app on Redis errors
    });

    // Attempt connection but don't block startup if it fails
    redis
      .connect()
      .then(() => console.log("✅ Redis client connected"))
      .catch((e) => {
        console.warn("⚠️  Redis connect failed:", e.message);
        console.warn(
          "   Continuing without Redis. Features will use in-memory fallback."
        );
        redis = null;
      });

    connectionAttempted = true;
    return redis;
  } catch (e) {
    console.error("❌ Failed to initialize Redis:", e);
    connectionAttempted = true;
    redis = null;
    return redis;
  }
  */
}
