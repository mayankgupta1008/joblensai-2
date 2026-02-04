import mongoose from "mongoose";
import { v4 } from "uuid";

const recruiterSchema = new mongoose.Schema(
  {
    // Core Identity
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    phoneNumber: { type: String },
    googleId: { type: String },
    role: { type: String, required: true, default: "recruiter" },

    // Company Info
    companyName: { type: String },
    companyId: { type: String, default: v4() },
    position: { type: String },
    location: { type: String },

    // Profile
    bio: { type: String },
    linkedinUrl: { type: String },
    profilePicture: { type: String },

    // Account Status
    emailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "recruiters",
  },
);

export default mongoose.model("Recruiter", recruiterSchema);
