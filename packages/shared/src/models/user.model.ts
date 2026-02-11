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
      enum: ["jobseeker", "recruiter"],
      required: true,
    },
    googleId: { type: String },
    phoneNumber: { type: String },
    profilePicture: { type: String },

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
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Add the user to other collections before saving it in database
userSchema.pre("save", async function () {
  if (this.isNew) {
    if (this.role === "jobseeker") {
      await mongoose.model("JobSeekerProfile").create({ userId: this._id });
    } else if (this.role === "recruiter") {
      await mongoose.model("RecruiterProfile").create({ userId: this._id });
    }
  }
});

// Cascade delete: When user is deleted, also delete their profile, tokens, payments & subscription
userSchema.pre("findOneAndDelete", async function () {
  const user = await this.model.findOne(this.getFilter());
  if (user) {
    // Delete profile based on role
    if (user.role === "jobseeker") {
      await mongoose.model("JobSeekerProfile").deleteOne({ userId: user._id });
    } else if (user.role === "recruiter") {
      await mongoose.model("RecruiterProfile").deleteOne({ userId: user._id });
    }
    // Delete all refresh tokens
    await mongoose.model("RefreshToken").deleteMany({ userId: user._id });
    // Delete all payment records
    await mongoose.model("Payment").deleteMany({ userId: user._id });
    // Delete ALL subscriptions (entire history)
    await mongoose.model("Subscription").deleteMany({ userId: user._id });
  }
});

export default mongoose.model("User", userSchema);
