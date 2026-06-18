import mongoose from "mongoose";

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Basic
    currentLocation: { type: String },

    // Address
    permanentAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zip: { type: String },
    },
    differentCurrentAddress: { type: Boolean, default: false },
    currentAddress: {
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zip: { type: String },
    },

    // Work Experience
    experience: [
      {
        title: { type: String },
        experienceRange: { type: String },
        from: { type: Date },
        to: { type: Date },
        current: { type: Boolean, default: false },
        bio: { type: String },
        skills: [{ type: String }],
      },
    ],

    // Education
    education: [
      {
        degree: { type: String },
        university: { type: String },
        from: { type: Date },
        to: { type: Date },
      },
    ],

    // Job Preferences
    expectedSalary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "INR" },
    },
    preferredLocations: [{ type: String }],
    jobTypes: [{ type: String }],
    noticePeriod: { type: String },

    // Profile Links
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    resumeKey: { type: String },
  },
  {
    timestamps: true,
    collection: "jobseeker",
  }
);

export default mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
