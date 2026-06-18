import { actionButton, baseEmailTemplate, paragraph } from "./emailCSS.js";

export const emailVerificationTemplate = (data: { verificationUrl: string; userName: string }) => ({
  subject: "Verify Your Email",
  html: baseEmailTemplate({
    title: "Verify Your Email",
    preheader: "Confirm your email address to finish setting up JobLensAI.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph("Confirm your email address to complete your JobLensAI account setup. This link is valid for 15 minutes.")}
      <div style="margin:24px 0;">${actionButton(data.verificationUrl, "Verify Email")}</div>
      ${paragraph("If you didn't create this account, you can safely ignore this email.")}
    `,
  }),
});
