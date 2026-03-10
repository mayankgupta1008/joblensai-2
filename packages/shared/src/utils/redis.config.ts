import { Redis } from "ioredis";

export const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
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
