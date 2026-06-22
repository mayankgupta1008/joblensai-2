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
      // Basic
      currentLocation: z.string().optional(),

      // Address
      permanentAddress: z
        .object({
          line1: z.string().optional(),
          line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          zip: z.string().optional(),
        })
        .optional(),
      differentCurrentAddress: z.boolean().optional(),
      currentAddress: z
        .object({
          line1: z.string().optional(),
          line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          country: z.string().optional(),
          zip: z.string().optional(),
        })
        .optional(),

      // Experience
      experience: z
        .array(
          z.object({
            title: z.string().optional(),
            experienceRange: z.string().optional(),
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
            current: z.boolean().optional(),
            bio: z.string().optional(),
            skills: z.array(z.string()).optional(),
          })
        )
        .optional(),

      // Education
      education: z
        .array(
          z.object({
            degree: z.string().optional(),
            university: z.string().optional(),
            from: z.coerce.date().optional(),
            to: z.coerce.date().optional(),
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
      linkedinUrl: z.url().optional(),
      githubUrl: z.url().optional(),
      portfolioUrl: z.url().optional(),
      resumeKey: z.string().optional(),
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
      linkedinUrl: z.url().optional(),
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

      email: z.email(),

      // JobSeeker required
      currentLocation: z.string().min(1, "Current location is required"),

      permanentAddress: z.object({
        line1: z.string().min(1, "Address line 1 is required"),
        line2: z.string().optional().or(z.literal("")),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State / Province is required"),
        country: z.string().min(1, "Country is required"),
        zip: z.string().min(1, "ZIP / Postal code is required"),
      }),
      differentCurrentAddress: z.boolean().optional(),
      currentAddress: z
        .object({
          line1: z.string().min(1, "Address line 1 is required"),
          line2: z.string().optional().or(z.literal("")),
          city: z.string().min(1, "City is required"),
          state: z.string().min(1, "State / Province is required"),
          country: z.string().min(1, "Country is required"),
          zip: z.string().min(1, "ZIP / Postal code is required"),
        })
        .optional(),

      experience: z.array(
        z.object({
          title: z.string().min(1, "Job title is required"),
          experienceRange: z.string().min(1, "Years of experience is required"),
          from: z.coerce.date({ error: "Start date is required" }),
          to: z.coerce.date().optional(),
          current: z.boolean().optional(),
          bio: z.string().min(20, "Bio must be at least 20 characters"),
          skills: z.array(z.string().min(1)).min(1, "Please add at least one skill"),
        })
      ),

      education: z.array(
        z.object({
          degree: z.string().min(1, "Degree is required"),
          university: z.string().min(1, "University is required"),
          from: z.coerce.date({ error: "Start date is required" }),
          to: z.coerce.date({ error: "End date is required" }),
        })
      ),

      expectedSalary: z.object({
        min: z.number({ error: "Minimum salary is required" }).min(0, "Must be 0 or more"),
        max: z.number({ error: "Maximum salary is required" }).min(0, "Must be 0 or more"),
        currency: z.string().min(1, "Currency is required"),
      }),
      preferredLocations: z
        .array(z.string().min(1))
        .min(1, "Select at least one preferred location"),
      jobTypes: z.array(z.string().min(1)).min(1, "Select at least one job type"),
      noticePeriod: z.string().min(1, "Notice period is required"),

      linkedinUrl: z.string().min(1, "LinkedIn URL is required").url("Enter a valid LinkedIn URL"),
      githubUrl: z.string().min(1, "GitHub URL is required").url("Enter a valid GitHub URL"),
      portfolioUrl: z.url().optional().or(z.literal("")),
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

      email: z.email(),
      companyName: z.string().min(1, "Company name is required"),
      position: z.string().min(1, "Position is required"),
      location: z.string().min(1, "Location is required"),
      bio: z.string().min(20, "Bio must be at least 20 characters"),
      linkedinUrl: z.string().min(1, "LinkedIn URL is required").url("Enter a valid LinkedIn URL"),
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
