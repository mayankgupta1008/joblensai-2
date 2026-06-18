import { actionButton, baseEmailTemplate, paragraph } from "./emailCSS.js";

export const passwordResetTemplate = (data: { resetUrl: string; userName: string }) => ({
  subject: "Reset Your Password",
  html: baseEmailTemplate({
    title: "Reset Your Password",
    preheader: "Use this secure link to reset your JobLensAI password.",
    children: `
      ${paragraph(`Hi ${data.userName},`)}
      ${paragraph("Click below to reset your password. This link is valid for 15 minutes.")}
      <div style="margin:24px 0;">${actionButton(data.resetUrl, "Reset Password")}</div>
      ${paragraph("If you didn't request this, you can safely ignore this email.")}
    `,
  }),
});
