import type { Request, Response } from "express";
import { razorpayInstance } from "@joblensai/shared/src/utils/razorpayInstance.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";
import User from "@joblensai/shared/src/models/user.model.js";
import crypto from "crypto";
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

    // Get or create Razorpay customer (fail_existing: 0 returns existing customer if email matches)
    let razorpayCustomerId = user?.razorpayCustomerId;
    if (!razorpayCustomerId) {
      const customer = await razorpayInstance.customers.create({
        name: user?.fullName,
        email: user?.email,
        contact: user?.phoneNumber || undefined,
        fail_existing: "0" as unknown as 0,
      });
      razorpayCustomerId = customer.id;
      await User.findByIdAndUpdate(userId, { razorpayCustomerId });
    }

    const options = {
      plan_id: process.env.RAZORPAY_PLAN_ID!,
      total_count: 120,
      customer_notify: 0 as const,
      customer_id: razorpayCustomerId,
    };

    const razorpaySubscription = await razorpayInstance.subscriptions.create(options);

    await Payment.create({
      userId,
      amount,
      currency: currency || "INR",
      razorpaySubscriptionId: razorpaySubscription.id,
      receipt: `receipt_${userId}_${Date.now()}`,
      paymentStatus: "PENDING",
      idempotencyKey: idempotencyKey,
    });

    return res.status(201).json({ success: true, subscription: razorpaySubscription });
  } catch (error) {
    console.log("Error inside createOrder controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const verifySubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { plan, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Step 1: Verify signature (CRITICAL for security!)
    const body = razorpay_payment_id + "|" + razorpay_subscription_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    const userForValidation = await User.findById(userId).populate("subscriptionId");
    let payment = await Payment.findOne({ razorpaySubscriptionId: razorpay_subscription_id });

    if (expectedSignature !== razorpay_signature) {
      await Promise.all([
        Payment.findOneAndUpdate(
          { razorpaySubscriptionId: razorpay_subscription_id },
          { paymentStatus: "FAILED" }
        ),
        sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
          type: "PAYMENT_FAILED",
          to: userForValidation?.email,
          data: {
            userName: userForValidation?.fullName,
            planName: plan,
            amount: payment?.amount,
            currency: payment?.currency,
            startDate: new Date().toLocaleDateString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          },
        }),
      ]);
      return res.status(401).json({ success: false, error: "Payment failed" });
    }

    // Step 2: Update payment as SUCCESS and fetch user in same query
    payment = await Payment.findOneAndUpdate(
      { razorpaySubscriptionId: razorpay_subscription_id },
      {
        paymentStatus: "SUCCESS",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
      { new: true }
    ).populate("userId");

    // Step 3: Expire old subscription (if exists) and create new one
    if (!payment || !payment.userId) {
      return res.status(404).json({ success: false, error: "Payment or User not found" });
    }

    const user = payment!.userId as unknown as {
      _id: string;
      fullName: string;
      email: string;
      phoneNumber?: string;
      subscriptionId?: string;
    };

    await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
      type: "SUBSCRIPTION_STARTED",
      to: user.email,
      data: {
        userId: user._id.toString(),
        paymentId: payment._id.toString(),
        userName: user.fullName,
        phoneNumber: user.phoneNumber,
        planName: plan,
        amount: payment.amount,
        currency: payment.currency,
        startDate: new Date().getTime(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(),
      },
    });

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

export const razorpayWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSignature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

    const isValid = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (isValid !== webhookSignature) {
      return res.status(401).json({ success: false, error: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;
    const razorpaySubId = payload.subscription.entity.id;
    const payment = await Payment.findOne({ razorpaySubscriptionId: razorpaySubId }).populate(
      "userId"
    );
    const user = payment?.userId as any;

    switch (event) {
      case "subscription.charged": {
        const paymentId = payload.payment.entity.id;
        const [subscription, alreadyProcessed] = await Promise.all([
          Subscription.findOne({ paymentId: payment?._id }),
          Payment.findOne({ razorpayPaymentId: paymentId }),
        ]);

        if (alreadyProcessed || !subscription) break;

        const newEndDate = new Date(subscription.endDate.getTime() + 30 * 24 * 60 * 60 * 1000);

        await Promise.all([
          Subscription.findByIdAndUpdate(subscription._id, { endDate: newEndDate }),

          Payment.findByIdAndUpdate(payment?._id, { razorpayPaymentId: paymentId }),

          sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
            type: "SUBSCRIPTION_RENEWED",
            to: user?.email,
            data: {
              userId: user?._id.toString(),
              paymentId: payment?._id.toString(),
              userName: user?.fullName,
              phoneNumber: user?.phoneNumber,
              planName: subscription?.plan,
              amount: payment?.amount,
              currency: payment?.currency,
              startDate: subscription?.endDate?.getTime(),
              endDate: newEndDate.getTime(),
            },
          }),
        ]);

        break;
      }
      case "subscription.halted": {
        const haltedSubscription = await Subscription.findOne({
          paymentId: payment?._id,
        });

        if (!haltedSubscription || haltedSubscription.status === "HALTED") break;

        await Promise.all([
          Subscription.findByIdAndUpdate(haltedSubscription._id, { status: "HALTED" }),

          sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
            type: "SUBSCRIPTION_RENEWAL_FAILED",
            to: user?.email,
            data: {
              userName: user?.fullName,
              planName: haltedSubscription?.plan,
              endDate: haltedSubscription?.endDate?.toLocaleDateString(),
            },
          }),
        ]);
        break;
      }
      case "subscription.cancelled": {
        const cancelledSubscription = await Subscription.findOne({
          paymentId: payment?._id,
        });

        if (!cancelledSubscription || cancelledSubscription.status === "CANCELLED") break;

        await Promise.all([
          Subscription.findByIdAndUpdate(cancelledSubscription._id, { status: "CANCELLED" }),

          sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
            type: "SUBSCRIPTION_CANCELLED",
            to: user?.email,
            data: {
              userName: user?.fullName,
              planName: cancelledSubscription?.plan,
              endDate: cancelledSubscription?.endDate?.toLocaleDateString(),
            },
          }),
        ]);
        break;
      }
      default: {
        console.log("Unknown webhook event:", event);
        break;
      }
    }

    res.status(200).json({ success: true, message: "Webhook verified successfully" });
  } catch (error) {
    console.log("Error inside razorpayWebhook controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
