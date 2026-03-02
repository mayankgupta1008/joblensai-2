import cron from "node-cron";
import Subscription from "@joblensai/shared/src/models/subscription.model.js";
import Payment from "@joblensai/shared/src/models/payment.model.js";
import { sendMessage, KAFKA_TOPICS } from "@joblensai/shared/src/utils/kafka.config.js";
import { razorpayInstance } from "@joblensai/shared/src/utils/razorpayInstance.js";

// Run every day at midnight (00:00)
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("🕒 Running Subscription Renewal Check...");
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

      // 1. Find subscriptions ending in the next 24 hours
      const expiringSubscriptions = await Subscription.find({
        endDate: { $gte: tomorrow, $lt: dayAfterTomorrow },
        status: "ACTIVE",
        cancelAtPeriodEnd: false, // Only remind those who haven't cancelled
      }).populate("userId paymentId");

      for (const sub of expiringSubscriptions) {
        const user = sub.userId as any;
        let payment = sub.paymentId as any;
        if (!user) continue;

        console.log(`📩 Sending renewal reminder to: ${user.email}`);

        // 2. Trigger Kafka Notification
        // We'll need to make sure the notification service handles 'SUBSCRIPTION_REMINDER'
        await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
          type: "SUBSCRIPTION_REMINDER",
          to: user.email,
          data: {
            userName: user.fullName,
            planName: sub.plan,
            amount: payment.amount,
            currency: payment.currency,
            endDate: sub.endDate.toLocaleDateString(),
          },
        });

        // 3. Proactive Sync with Razorpay
        // Fetch latest status to ensure we're not reminding for something already cancelled/failed on Razorpay
        payment = await Payment.findOne({ _id: sub.paymentId });
        if (payment?.razorpaySubscriptionId) {
          const rzpSub = await razorpayInstance.subscriptions.fetch(payment.razorpaySubscriptionId);
          if (rzpSub.status !== "active") {
            await Subscription.findByIdAndUpdate(sub._id, { status: "EXPIRED" }); // Or sync status
          }
        }
      }
    } catch (error) {
      console.error("❌ Error in Subscription Renewal Cron:", error);
    }
  });

  console.log("✅ Subscription Cron Jobs Initialized");
};
