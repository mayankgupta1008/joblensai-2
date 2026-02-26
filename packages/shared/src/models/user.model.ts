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
    role: {
      type: String,
      enum: ["jobseeker", "recruiter", "admin"],
      required: true,
    },
    googleId: { type: String },
    phoneNumber: { type: String },
    profilePictureKey: { type: String },

    // Account Status
    emailVerified: { type: Boolean, default: false },
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
  },
  {
    timestamps: true,
    collection: "users",
  }
);

export default mongoose.model("User", userSchema);
