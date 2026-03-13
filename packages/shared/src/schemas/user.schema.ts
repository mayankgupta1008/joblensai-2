import { z } from "zod";

export const RegisterSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      role: z.enum(["jobseeker", "recruiter"]),
    })
    .strict(),
});

export const LoginSchema = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const ForgotPasswordSchema = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
    })
    .strict(),
});

export const ResetPasswordSchema = z.object({
  body: z
    .object({
      newPassword: z.string().min(6, "Password must be at least 6 characters"),
      confirmNewPassword: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const UpdateJobSeekerProfileSchema = z.object({
  body: z
    .object({
      // Professional
      currentLocation: z.string().optional(),
      currentTitle: z.string().optional(),
      experienceYears: z.number().min(0).optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),

      // Education
      education: z
        .array(
          z.object({
            degree: z.string().optional(),
            university: z.string().optional(),
            graduationYear: z.number().min(1900).max(2100).optional(),
          })
        )
        .optional(),

      // Experience
      experience: z
        .array(
          z.object({
            company: z.string().optional(),
            title: z.string().optional(),
            duration: z.string().optional(),
            description: z.string().optional(),
          })
        )
        .optional(),

      // Job Preferences
      expectedSalary: z
        .object({
          min: z.number().min(0).optional(),
          max: z.number().min(0).optional(),
          currency: z.string().optional(),
        })
        .optional(),
      preferredLocations: z.array(z.string()).optional(),
      jobTypes: z.array(z.string()).optional(),
      noticePeriod: z.string().optional(),

      // Links
      linkedinUrl: z.string().url().optional(),
      githubUrl: z.string().url().optional(),
      portfolioUrl: z.string().url().optional(),
      resumeUrl: z.string().url().optional(),
    })
    .strict(),
});

export const UpdateRecruiterProfileSchema = z.object({
  body: z
    .object({
      companyName: z.string().optional(),
      companyId: z.string().optional(),
      position: z.string().optional(),
      location: z.string().optional(),
      bio: z.string().optional(),
      linkedinUrl: z.string().url().optional(),
    })
    .strict(),
});

// Extract TypeScript types to be used in Frontend & Backend
export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>["body"];
export type UpdateJobSeekerProfileInput = z.infer<typeof UpdateJobSeekerProfileSchema>["body"];
export type UpdateRecruiterProfileInput = z.infer<typeof UpdateRecruiterProfileSchema>["body"];
