import mongoose from "mongoose";

const jobSeekerSchema = new mongoose.Schema(
  {
    // Core Identity
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },

    // Professional Profile
    currentLocation: { type: String, required: true },
    currentTitle: { type: String },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String },
    skills: [{ type: String }],

    // Education
    education: {
      degree: { type: String },
      university: { type: String },
      graduationYear: { type: Number },
    },

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
    openToWork: { type: Boolean, default: true },
    noticePeriod: { type: String },

    // Profile Links
    linkedinUrl: { type: String },
    githubUrl: { type: String },
    portfolioUrl: { type: String },
    profilePicture: { type: String },

    // Account Status
    emailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: "jobseekers",
  },
);

export const JobSeekerModel = mongoose.model("JobSeeker", jobSeekerSchema);
