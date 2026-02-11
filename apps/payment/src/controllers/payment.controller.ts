import { Request, Response } from "express";
import { razorpayInstance } from "@/lib/razorpay.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import crypto from "crypto";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    await Payment.create({
      userId,
      amount,
      currency: currency || "INR",
      razorpayOrderId: order.id,
      receipt: options.receipt,
      paymentStatus: "PENDING",
      idempotencyKey: idempotencyKey,
    });

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.log("Error inside createOrder controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Step 1: Verify signature (CRITICAL for security!)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: "FAILED" },
      );
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Step 2: Update payment as SUCCESS
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true },
    );

    // Step 3: Activate subscription
    const subscription = await Subscription.create({
      userId: payment?.userId,
      plan: "premium",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
    });

    // Step 4: Update User with subscriptionId ← ADD THIS
    await User.findByIdAndUpdate(payment?.userId, {
      subscriptionId: subscription._id,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error inside verifyOrder controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
