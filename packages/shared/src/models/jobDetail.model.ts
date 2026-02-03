import mongoose from "mongoose";

const jobDetailSchema = new mongoose.Schema(
  {
    // Job Info
    jobTitle: { type: String, required: true },
    jobDescription: { type: String, required: true },
    requiredSkills: [{ type: String }],

    // Employer Info
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Recruiter",
    },

    // Location & Salary
    locationName: { type: String, required: true },
    minimumSalary: { type: Number },
    maximumSalary: { type: Number },
    currency: { type: String, default: "INR" },

    // Dates
    postedDate: { type: Date, default: Date.now },
    expirationDate: { type: Date },

    // Stats & Status
    applications: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "jobs",
  },
);

export const JobDetailModel = mongoose.model("JobDetail", jobDetailSchema);
