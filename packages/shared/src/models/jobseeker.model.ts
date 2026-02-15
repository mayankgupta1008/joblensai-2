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
    resumeKey: { type: String },
  },
  {
    timestamps: true,
    collection: "jobseeker",
  },
);

export default mongoose.model("JobSeekerProfile", jobSeekerProfileSchema);
