import { Redis } from "ioredis";

// Use the service's REDIS_URL or fallback to localhost
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Shared Redis Instance
 * In a microservices environment, this will connect to the Redis defined
 * in the individual service's .env file.
 */
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 20, // Default strategy (no BullMQ logic needed)
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("✅ Redis connected");
});
