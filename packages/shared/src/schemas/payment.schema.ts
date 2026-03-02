import { z } from "zod";

export const CreateSubscriptionBodySchema = z.object({
  body: z.object({
    amount: z.number().positive().max(10000000),
    currency: z.string().length(3).default("INR"),
  }),
});

export const VerifySubscriptionBodySchema = z.object({
  body: z.object({
    plan: z.string().min(1).max(50),
    razorpay_subscription_id: z.string().startsWith("sub_"),
    razorpay_payment_id: z.string().startsWith("pay_"),
    razorpay_signature: z.string().length(64),
  }),
});

export type CreateSubscriptionBodyType = z.infer<typeof CreateSubscriptionBodySchema>;
export type VerifySubscriptionBodyType = z.infer<typeof VerifySubscriptionBodySchema>;
