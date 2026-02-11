import { NextFunction, Request, Response } from "express";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import { redis } from "@joblensai/shared/src/common/redis.config.js";

// Idempotency key middleware to avoid duplicate payments
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!idempotencyKey) {
      return res.status(400).json({ error: "Missing idempotency key" });
    }

    // Step 1: Check if the order already exists in DB (Completed transactions)
    const existingOrder = await Payment.findOne({ idempotencyKey });

    if (existingOrder) {
      console.log(`[Idempotency] Already processed: ${idempotencyKey}`);
      return res.status(200).json(existingOrder);
    }

    // Step 2: Handle "In-Flight" requests using Redis Distributed Lock
    // NX = Only set if not exists, EX = Expire in 60 seconds
    const lockKey = `lock:idempotency:${idempotencyKey}`;
    const lockAcquired = await redis.set(lockKey, "processing", "EX", 60, "NX");

    if (!lockAcquired) {
      console.log(
        `[Idempotency] Conflict! Concurrent request: ${idempotencyKey}`,
      );
      return res.status(409).json({
        message: "Request is already being processed. Please wait.",
      });
    }

    // Step 3: Automatic Lock Release
    // We clear the lock as soon as the response is sent (whether success or error) to ensure the user can retry immediately if needed.
    res.on("finish", async () => {
      try {
        await redis.del(lockKey);
        console.log(`[Idempotency] Lock released for key: ${idempotencyKey}`);
      } catch (err) {
        console.error(
          `[Idempotency] Failed to release lock for key: ${idempotencyKey}`,
          err,
        );
      }
    });

    // Step 4: Proceed to controller
    next();
  } catch (error) {
    console.error("Error inside idempotencyMiddleware", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
