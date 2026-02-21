import type { Request, Response } from "express";
import { razorpayInstance } from "@/lib/razorpay.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import crypto from "crypto";
import { generateAndUploadInvoice } from "@/lib/invoice.js";
import { sendMessage, KAFKA_TOPICS } from "@joblensai/shared/src/utils/kafka.config.js";

export const createOrder = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user already has an active subscription
    const user = await User.findById(userId).populate("subscriptionId");
    if (user?.subscriptionId) {
      const subscription = await Subscription.findById(user.subscriptionId);
      if (subscription?.status === "ACTIVE") {
        return res.status(400).json({
          message: "You already have an active subscription",
          currentPlan: subscription.plan,
          endDate: subscription.endDate,
        });
      }
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

    const { plan, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Step 0: Check if payment already processed (idempotency protection)
    const existingPayment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (existingPayment?.paymentStatus === "SUCCESS") {
      return res.status(200).json({ success: true, message: "Payment already verified" });
    }

    // Step 1: Verify signature (CRITICAL for security!)
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { paymentStatus: "FAILED" }
      );
      return res.status(400).json({ error: "Payment failed" });
    }

    // Step 2: Update payment as SUCCESS
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        paymentStatus: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    );

    // Step 3: Expire old subscription (if exists) and create new one
    const user = await User.findById(payment?.userId);

    if (!user || !payment) {
      return res.status(404).json({ error: "User or Payment not found" });
    }

    const invoiceResult = await generateAndUploadInvoice({
      user: {
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber ?? undefined,
      },
      payment: {
        _id: payment._id.toString(),
        amount: payment.amount,
        currency: payment.currency,
      },
      planName: plan,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await Payment.findByIdAndUpdate(payment._id, {
      razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
      invoiceS3Key: invoiceResult.s3Key,
    });

    await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
      type: "SUBSCRIPTION_STARTED",
      to: user.email,
      pdfKey: invoiceResult.s3Key,
      data: {
        userName: user.fullName,
        planName: plan,
        amount: payment.amount,
        currency: payment.currency,
        startDate: new Date().toLocaleDateString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      },
    });

    let previousSubscriptionId = null;

    if (user.subscriptionId) {
      await Subscription.findByIdAndUpdate(user.subscriptionId, {
        status: "EXPIRED",
      });
      previousSubscriptionId = user.subscriptionId;
    }

    // Step 4: Create new subscription (linked to previous)
    const subscription = await Subscription.create({
      userId: payment.userId,
      plan,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      renewedFromId: previousSubscriptionId,
      paymentId: payment._id,
    });

    // Step 5: Update user with new subscriptionId
    await User.findByIdAndUpdate(payment.userId, {
      subscriptionId: subscription._id,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error inside verifyOrder controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
