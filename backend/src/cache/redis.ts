import { createClient } from "redis";
import logger from "../utils/logger";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        logger.error("Max reconnection attempts reached");
        return new Error("Max reconnection attempts reached");
      }
      return Math.min(retries * 100, 5000);
    },
  },
});

redisClient.on("error", (err) => logger.error("Redis Client Error", { error: err.message }));

// Connect at application startup
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis client connected successfully");
  } catch (error) {
    logger.error("Failed to connect to Redis", { error });
    process.exit(1);
  }
};

export { connectRedis, redisClient };

export const cache = {
  get: async (key: string) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error("Cache get error", { key, error });
      return null;
    }
  },
  set: async (key: string, value: any, ttl?: number) => {
    try {
      const stringValue = JSON.stringify(value);
      if (ttl) {
        await redisClient.setEx(key, ttl, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
    } catch (error) {
      logger.error("Cache set error", { key, error });
    }
  },
  invalidate: async (pattern: string) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error("Cache invalidation error", { pattern, error });
    }
  },
};
