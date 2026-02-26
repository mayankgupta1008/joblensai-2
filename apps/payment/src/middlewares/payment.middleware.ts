import type { NextFunction, Request, Response } from "express";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import { redisClient } from "@joblensai/shared/src/utils/redis.config.js";

// Idempotency key middleware to avoid duplicate payments
export const createSubscriptionrMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!idempotencyKey) {
      return res.status(400).json({ success: false, error: "Missing idempotency key" });
    }

    // Step 1: Check if the order already exists in DB (Completed transactions)
    const existingSubscription = await Payment.findOne({ idempotencyKey });

    if (existingSubscription) {
      console.log(`[Idempotency] Already processed: ${idempotencyKey}`);
      return res.status(200).json({ success: true, message: "Payment already processed" });
    }

    // Step 2: Handle "In-Flight" requests using Redis Distributed Lock
    // NX = Only set if not exists, EX = Expire in 60 seconds
    const lockKey = `lock:idempotency:${idempotencyKey}`;
    const lockAcquired = await redisClient.set(lockKey, "processing", "EX", 60, "NX");

    if (!lockAcquired) {
      console.log(`[Idempotency] Conflict! Concurrent request: ${idempotencyKey}`);
      return res.status(409).json({
        success: false,
        error: "Request is already being processed. Please wait.",
      });
    }

    // Step 3: Automatic Lock Release
    // We clear the lock as soon as the response is sent (whether success or error) to ensure the user can retry immediately if needed.
    res.on("finish", async () => {
      try {
        await redisClient.del(lockKey);
        console.log(`[Idempotency] Lock released for key: ${idempotencyKey}`);
      } catch (error) {
        console.error(`[Idempotency] Failed to release lock for key: ${idempotencyKey}`, error);
      }
    });

    // Step 4: Proceed to controller
    next();
  } catch (error) {
    console.error("Error inside idempotencyMiddleware", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const verifySubscriptionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { razorpay_subscription_id } = req.body;

    if (!razorpay_subscription_id) {
      return res.status(400).json({ success: false, error: "razorpay_subscription_id required" });
    }

    const existingPayment = await Payment.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
    });

    if (existingPayment?.paymentStatus === "SUCCESS") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
      });
    }

    next();
  } catch (error) {
    console.error("Error inside verifySubscriptionMiddleware", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const cancelSubscriptionMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    const user = await User.findById(userId).populate("subscriptionId");

    if (!user?.subscriptionId) {
      return res.status(404).json({ success: false, error: "No active subscription found" });
    }

    const subscription = user.subscriptionId as unknown as {
      cancelAtPeriodEnd: boolean;
    };

    if (subscription.cancelAtPeriodEnd) {
      return res
        .status(409)
        .json({ success: false, error: "Subscription already cancelled at period end" });
    }

    const lockKey = `lock:cancel_subscription:${userId}`;
    const lockAcquired = await redisClient.set(lockKey, "processing", "EX", 60, "NX");

    if (!lockAcquired) {
      console.log(`[Cancel Subscription] Conflict! Concurrent cancellation for user: ${userId}`);
      return res.status(409).json({
        success: false,
        error: "Subscription cancellation is already being processed. Please wait.",
      });
    }

    res.on("finish", async () => {
      try {
        await redisClient.del(lockKey);
        console.log(`[Cancel Subscription] Lock released for user: ${userId}`);
      } catch (error) {
        console.error(`[Cancel Subscription] Failed to release lock for user: ${userId}`, error);
      }
    });

    next();
  } catch (error) {
    console.error("Error inside cancelSubscription middleware", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
