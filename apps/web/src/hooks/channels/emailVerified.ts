// Single source of truth for the cross-tab "email-verified" BroadcastChannel.
// Importers: EmailVerificationPage (sender), CompleteProfileJobseeker (listener).
export const EMAIL_VERIFIED = "email-verified" as const;

export type EmailVerifiedMessage = { type: "EMAIL_VERIFIED" };
