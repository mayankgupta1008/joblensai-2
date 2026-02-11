import { NextFunction, Request, Response } from "express";
import Payment from "@joblensai/shared/src/models/payment.model.js";

// Idempotency key middleware to avoid duplicate payments
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const idempotencyKey = req.headers["x-idempotency-key"];

    if (!idempotencyKey) {
      return res.status(400).json({ error: "Missing idempotency key" });
    }

    // Check if the order already exists
    const order = await Payment.findOne({ idempotencyKey });

    if (order) {
      console.log(
        `[Idempotency] Duplicate request found for key: ${idempotencyKey}`,
      );
      return res.status(200).json(order);
    }

    next();
  } catch (error) {
    console.error("Error inside idempotencyMiddleware", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
