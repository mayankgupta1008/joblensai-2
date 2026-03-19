import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  ...(process.env.NODE_ENV === "production" ? { tls: {} } : {}), // TLS only in production
};

// Redis instance for direct use
export const redisClient = new Redis(redisConnection);

redisClient.on("error", (error) => {
  console.error("Redis error inside redis.config file: ", error);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connected");
  } catch (error) {
    console.error("❌ Redis connection error:", error);
    throw error;
  }
};
