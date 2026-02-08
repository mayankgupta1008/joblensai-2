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
      newPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
      confirmNewPassword: z
        .string()
        .min(6, "Password must be at least 6 characters"),
    })
    .strict(),
});

// Extract TypeScript types to be used in Frontend & Backend
export type RegisterInput = z.infer<typeof RegisterSchema>["body"];
export type LoginInput = z.infer<typeof LoginSchema>["body"];
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>["body"];
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>["body"];
