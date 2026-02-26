import type { Request, Response } from "express";
import { razorpayInstance } from "@/lib/razorpay.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import crypto from "crypto";
import { generateAndUploadInvoice } from "@/lib/invoice.js";
import { sendMessage, KAFKA_TOPICS } from "@joblensai/shared/src/utils/kafka.config.js";

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const idempotencyKey = req.headers["x-idempotency-key"] as string;

    // Check if user already has an active subscription (populate gives us the full subscription)
    const user = await User.findById(userId).populate("subscriptionId");
    const subscription = user?.subscriptionId as unknown as {
      status: string;
      plan: string;
      endDate: Date;
    } | null;

    if (subscription?.status === "ACTIVE") {
      return res.status(409).json({
        success: false,
        error: "You already have an active subscription",
        currentPlan: subscription.plan,
        endDate: subscription.endDate,
      });
    }

    const { amount, currency } = req.body;

    const options = {
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      total_count: 12,
      customer_notify: 0 as const,
    };

    // Run these in parallel - they don't depend on each other
    const [razorpaySubscription, existingPayment] = await Promise.all([
      razorpayInstance.subscriptions.create(options),
      Payment.findOne({
        userId,
        razorpayCustomerId: { $ne: null },
      }),
    ]);

    let razorpayCustomerId = existingPayment?.razorpayCustomerId ?? null;

    if (!razorpayCustomerId) {
      try {
        const customer = await razorpayInstance.customers.create({
          email: user?.email,
          name: user?.fullName,
          contact: user?.phoneNumber ?? "",
        });
        razorpayCustomerId = customer.id;
      } catch (error: any) {
        // If customer already exists in Razorpay, fetch by email
        if (error?.error?.description?.includes("Customer already exists")) {
          const { items } = await razorpayInstance.customers.all({ count: 100 });
          const existing = items.find((c: any) => c.email === user?.email);
          if (existing) {
            razorpayCustomerId = existing.id;
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }

    await Payment.create({
      userId,
      amount,
      currency: currency || "INR",
      razorpaySubscriptionId: razorpaySubscription.id,
      receipt: `receipt_${userId}_${Date.now()}`,
      paymentStatus: "PENDING",
      idempotencyKey: idempotencyKey,
      razorpayCustomerId: razorpayCustomerId,
    });

    return res
      .status(201)
      .json({ success: true, subscription: razorpaySubscription, customerId: razorpayCustomerId });
  } catch (error) {
    console.log("Error inside createOrder controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const verifySubscription = async (req: Request, res: Response) => {
  try {
    const { plan, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Step 1: Verify signature (CRITICAL for security!)
    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpaySubscriptionId: razorpay_subscription_id },
        { paymentStatus: "FAILED" }
      );
      return res.status(401).json({ success: false, error: "Payment failed" });
    }

    // Step 2: Update payment as SUCCESS and fetch user in same query
    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);
    const tokenId = paymentDetails.token_id;
    const payment = await Payment.findOneAndUpdate(
      { razorpaySubscriptionId: razorpay_subscription_id },
      {
        paymentStatus: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        razorpayTokenId: tokenId,
      },
      { new: true }
    ).populate("userId");

    // Step 3: Expire old subscription (if exists) and create new one
    if (!payment || !payment.userId) {
      return res.status(404).json({ success: false, error: "Payment or User not found" });
    }

    const user = payment.userId as unknown as {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
      subscriptionId?: string;
    };

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

    // Run these in parallel - they don't depend on each other
    await Promise.all([
      Payment.findByIdAndUpdate(payment._id, {
        razorpayInvoiceId: invoiceResult.razorpayInvoiceId,
        invoiceS3Key: invoiceResult.s3Key,
      }),
      sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
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
      }),
    ]);

    if (user.subscriptionId) {
      await Subscription.findByIdAndUpdate(user.subscriptionId, {
        status: "EXPIRED",
      });
    }

    // Step 4: Create new subscription
    const subscription = await Subscription.create({
      userId: user._id, // Use user._id since payment.userId is now populated
      plan,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "ACTIVE",
      paymentId: payment._id,
    });

    // Step 5: Update user with new subscriptionId
    await User.findByIdAndUpdate(user._id, {
      subscriptionId: subscription._id,
    });

    res.status(200).json({ success: true, message: "Subscription verified successfully" });
  } catch (error) {
    console.log("Error inside verifyOrder controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    // Get subscription with its linked payment
    const user = await User.findById(userId).populate({
      path: "subscriptionId",
      populate: { path: "paymentId" },
    });

    const subscription = user?.subscriptionId as any;
    const payment = subscription?.paymentId;

    if (!payment?.razorpaySubscriptionId) {
      return res.status(404).json({ success: false, error: "No Razorpay subscription found" });
    }

    // Cancel on Razorpay (if this throws, catch block handles it)
    await razorpayInstance.subscriptions.cancel(payment.razorpaySubscriptionId, true);

    await Subscription.findByIdAndUpdate(subscription._id, {
      cancelAtPeriodEnd: true,
    });

    // After the Subscription.findByIdAndUpdate call
    await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
      type: "SUBSCRIPTION_CANCELLED",
      to: user?.email,
      data: {
        userName: user?.fullName,
        planName: subscription?.plan,
        endDate: subscription?.endDate?.toLocaleDateString(),
      },
    });

    res.status(200).json({
      success: true,
      message: "Subscription will be cancelled at the end of the current period",
    });
  } catch (error) {
    console.error("Error inside cancelSubscription controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
