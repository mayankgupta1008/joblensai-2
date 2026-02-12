import nodemailer from "nodemailer";
import { getBaseUrl } from "@joblensai/shared/src/utils/getBaseUrl.js";
import { Request } from "express";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE, // e.g., "gmail"
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  req: Request,
) => {
  try {
    const resetUrl = `${getBaseUrl(req)}/auth/reset-password/${resetToken}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Reset Your Password</h2>
        <p>Click the link below to reset your password. This link is valid for 15 minutes.</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error inside resetPasswordEmail:", error);
    return false;
  }
};
