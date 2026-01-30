import mongoose from "mongoose";

const recruiterSchema = new mongoose.Schema(
  {
    // Core Identity
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },

    // Company Info
    company: { type: String, required: true },
    companyId: { type: Number },
    position: { type: String },
    location: { type: String },

    // Profile
    bio: { type: String },
    specializations: [{ type: String }],
    linkedinUrl: { type: String },
    profilePicture: { type: String },

    // Stats
    activeJobPostings: { type: Number, default: 0 },
    totalHires: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 },
    avgResponseTime: { type: String },

    // Account Status
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "recruiters",
  },
);

export const RecruiterModel = mongoose.model("Recruiter", recruiterSchema);
