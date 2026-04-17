import { Redis } from "ioredis";
import type { RedisOptions } from "ioredis";

// Connection priority:
//   1. REDIS_URL  (idiomatic; rediss:// auto-enables TLS, redis:// stays plain)
//   2. REDIS_HOST + REDIS_PORT  (legacy)
// TLS is opt-in via REDIS_TLS=true. NODE_ENV alone is unreliable — self-hosted
// Redis containers also run with NODE_ENV=production and don't speak TLS.
const url = process.env.REDIS_URL;
const useTLS = process.env.REDIS_TLS === "true";

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  ...(useTLS ? { tls: {} } : {}),
};

export const redisClient = url
  ? new Redis(url, useTLS ? { tls: {} } : {})
  : new Redis(redisConnection);

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
