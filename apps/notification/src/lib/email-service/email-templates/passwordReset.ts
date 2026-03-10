export const passwordResetTemplate = (data: { resetUrl: string; userName: string }) => ({
  subject: "Reset Your Password",
  html: `
    <h2>Reset Your Password</h2>
    <p>Hi ${data.userName},</p>
    <p>Click below to reset your password (valid for 15 minutes):</p>
    <a href="${data.resetUrl}">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Thank you,</p>
    <p>JobLensAI Team</p>
  `,
});
