import { z } from "zod";

export const RegisterSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
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
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(
          /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
          "Password must contain at least one special character"
        )
        .regex(/\d/, "Password must contain at least one number"),
      confirmNewPassword: z.string(),
    })
    .strict()
    .refine((data) => data.newPassword === data.confirmNewPassword, {
      message: "Passwords do not match",
      path: ["confirmNewPassword"],
    }),
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

export const CompleteJobSeekerProfileSchema = z.object({
  body: z
    .object({
      role: z.literal("jobseeker"),
      // User fields (the controller fans these out to the User doc)
      phoneNumber: z
        .string()
        .min(7, "Phone number must be at least 7 digits")
        .max(20, "Phone number is too long"),
      profilePictureKey: z.string().optional(),

      // JobSeeker required
      currentLocation: z.string().min(1, "Current location is required"),
      currentTitle: z.string().min(1, "Current title is required"),
      experienceYears: z.number().min(0),
      bio: z.string().min(20, "Bio must be at least 20 characters"),
      skills: z.array(z.string().min(1)).min(3, "Please add at least 3 skills"),

      education: z
        .array(
          z.object({
            degree: z.string().min(1, "Degree is required"),
            university: z.string().min(1, "University is required"),
            graduationYear: z.number().min(1900).max(2100),
          })
        )
        .min(1, "Please add at least one education entry"),

      experience: z
        .array(
          z.object({
            company: z.string().min(1, "Company is required"),
            title: z.string().min(1, "Title is required"),
            duration: z.string().min(1, "Duration is required"),
            description: z.string().optional(),
          })
        )
        .min(1, "Please add at least one experience entry"),

      expectedSalary: z.object({
        min: z.number().min(0),
        max: z.number().min(0),
        currency: z.string().min(1),
      }),
      preferredLocations: z.array(z.string().min(1)).min(1),
      jobTypes: z.array(z.string().min(1)).min(1),
      noticePeriod: z.string().min(1),

      linkedinUrl: z.string().url().optional().or(z.literal("")),
      githubUrl: z.string().url().optional().or(z.literal("")),
      portfolioUrl: z.string().url().optional().or(z.literal("")),
      resumeKey: z.string().min(1, "Resume is required"),
    })
    .strict(),
});

export const CompleteRecruiterProfileSchema = z.object({
  body: z
    .object({
      role: z.literal("recruiter"),
      phoneNumber: z
        .string()
        .min(7, "Phone number must be at least 7 digits")
        .max(20, "Phone number is too long"),
      profilePictureKey: z.string().optional(),

      companyName: z.string().min(1, "Company name is required"),
      position: z.string().min(1, "Position is required"),
      location: z.string().min(1, "Location is required"),
      bio: z.string().min(20, "Bio must be at least 20 characters"),
      linkedinUrl: z.string().url().optional().or(z.literal("")),
    })
    .strict(),
});

export const CompleteProfileSchema = z.object({
  body: z.discriminatedUnion("role", [
    CompleteJobSeekerProfileSchema.shape.body,
    CompleteRecruiterProfileSchema.shape.body,
  ]),
});

// Extract TypeScript types to be used in Frontend & Backend
export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>["body"];
export type UpdateJobSeekerProfileInput = z.infer<typeof UpdateJobSeekerProfileSchema>["body"];
export type UpdateRecruiterProfileInput = z.infer<typeof UpdateRecruiterProfileSchema>["body"];
export type CompleteJobSeekerProfileInput = z.infer<typeof CompleteJobSeekerProfileSchema>["body"];
export type CompleteRecruiterProfileInput = z.infer<typeof CompleteRecruiterProfileSchema>["body"];
