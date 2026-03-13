import mongoose from "mongoose";

const recruiterProfileSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Company Info
    companyName: { type: String },
    companyId: { type: String },
    position: { type: String },
    location: { type: String },

    // Profile
    bio: { type: String },
    linkedinUrl: { type: String },
  },
  {
    timestamps: true,
    collection: "recruiter",
  }
);

export default mongoose.model("RecruiterProfile", recruiterProfileSchema);
