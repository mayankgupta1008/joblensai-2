import { z } from "zod";

// Base schemas for reuse
export const JobSeekerRegisterSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      phoneNumber: z.string().min(10, "Phone number must be valid"),
      currentLocation: z.string().min(2, "Location is required"),
    })
    .strict(),
});

export const RecruiterRegisterSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, "Name must be at least 2 characters"),
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      phoneNumber: z.string().min(10, "Phone number must be valid"),
      companyName: z.string().min(2, "Company name is required"),
    })
    .strict(),
});

export const JobSeekerLoginSchema = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

export const RecruiterLoginSchema = z.object({
  body: z
    .object({
      email: z.email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

// Extract TypeScript types to be used in Frontend & Backend
export type JobSeekerRegisterInput = z.infer<
  typeof JobSeekerRegisterSchema
>["body"];
export type RecruiterRegisterInput = z.infer<
  typeof RecruiterRegisterSchema
>["body"];
export type JobSeekerLoginInput = z.infer<typeof JobSeekerLoginSchema>["body"];
export type RecruiterLoginInput = z.infer<typeof RecruiterLoginSchema>["body"];
