import mongoose from "mongoose";

const jobSeekerSchema = new mongoose.Schema(
  {
    // Core Identity
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    phoneNumber: { type: String },
    googleId: { type: String },
    role: { type: String, required: true, default: "jobseeker" },

    // Professional Profile
    currentLocation: { type: String },
    currentTitle: { type: String },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String },
    skills: [{ type: String }],

    // Education
    education: [
      {
        degree: { type: String },
        university: { type: String },
        graduationYear: { type: Number },
      },
    ],

    // Work Experience
    experience: [
      {
        company: { type: String },
        title: { type: String },
        duration: { type: String },
        description: { type: String },
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
    profilePicture: { type: String },

    // Account Status
    emailVerified: { type: Boolean, default: false },

    // Reset Password
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "jobseekers",
  },
);

export default mongoose.model("JobSeeker", jobSeekerSchema);
