import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    role: {
      type: String,
      enum: ["jobseeker", "recruiter", "admin"],
    },
    googleId: { type: String },
    phoneNumber: { type: String },
    profilePictureKey: { type: String },

    // Account Status
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null },
    emailVerificationExpiry: { type: Date, default: null },
    phoneNumberVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },

    // Reset Password
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },

    // Subscription
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },
    razorpayCustomerId: {
      type: String,
      default: null,
    },

    // 2FA
    is2FAEnabled: {
      type: Boolean,
      default: false,
    },
    twoFASecret: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export default mongoose.model("User", userSchema);
