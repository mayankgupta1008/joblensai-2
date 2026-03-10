import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "PASSWORD_RESET",
        "PAYMENT_FAILED",
        "SUBSCRIPTION_STARTED",
        "SUBSCRIPTION_CANCELLED",
        "SUBSCRIPTION_REMINDER",
        "SUBSCRIPTION_RENEWED",
        "SUBSCRIPTION_RENEWAL_FAILED",
        "JOB_APPLIED",
        "JOB_INTERVIEW",
        "JOB_OFFER",
        "JOB_REJECTED",
        "JOB_ACCEPTED",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

// Compound index for fetching user's unread notifications efficiently
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
