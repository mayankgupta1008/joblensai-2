import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import {
  signAccessToken,
  signRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  JWT_PUBLIC_KEY,
  JWT_ISSUER,
  JWT_AUDIENCE,
} from "@/lib/jwt.js";
import {
  JobSeekerRegisterInput,
  RecruiterRegisterInput,
  JobSeekerLoginInput,
  RecruiterLoginInput,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import { sendPasswordResetEmail } from "@/lib/resetPasswordEmail.js";
import crypto from "crypto";

// Helper: Generate tokens and store refresh token in DB
const generateTokens = async (userId: string, res: Response) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  // Store refresh token in DB for revocation support
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Set refresh token as httpOnly cookie
  setRefreshTokenCookie(refreshToken, res);

  return accessToken;
};

export const registerJobSeeker = async (
  req: Request<{}, {}, JobSeekerRegisterInput>,
  res: Response,
) => {
  try {
    const { fullName, email, password, phoneNumber, currentLocation } =
      req.body;

    const existingUser = await JobSeeker.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const jobSeeker = await JobSeeker.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      currentLocation,
      role: "jobseeker",
    });

    const accessToken = await generateTokens(jobSeeker._id.toString(), res);

    res.status(201).json({
      accessToken,
      user: {
        id: jobSeeker._id,
        fullName: jobSeeker.fullName,
        email: jobSeeker.email,
        role: "jobseeker",
      },
    });
  } catch (error) {
    console.log("Error inside registerJobSeeker controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerRecruiter = async (
  req: Request<{}, {}, RecruiterRegisterInput>,
  res: Response,
) => {
  try {
    const { fullName, email, password, phoneNumber, companyName } = req.body;

    const existingUser = await Recruiter.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const recruiter = await Recruiter.create({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      companyName,
      role: "recruiter",
    });

    const accessToken = await generateTokens(recruiter._id.toString(), res);

    res.status(201).json({
      accessToken,
      user: {
        id: recruiter._id,
        fullName: recruiter.fullName,
        email: recruiter.email,
        role: "recruiter",
      },
    });
  } catch (error) {
    console.log("Error inside registerRecruiter controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginJobSeeker = async (
  req: Request<{}, {}, JobSeekerLoginInput>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    const jobSeeker = await JobSeeker.findOne({ email }).select("+password");
    if (!jobSeeker) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!jobSeeker.password) {
      return res.status(500).json({ message: "Invalid user data" });
    }

    const isPasswordValid = await bcrypt.compare(password, jobSeeker.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = await generateTokens(jobSeeker._id.toString(), res);

    res.status(200).json({
      accessToken,
      user: {
        id: jobSeeker._id,
        fullName: jobSeeker.fullName,
        email: jobSeeker.email,
        role: "jobseeker",
      },
    });
  } catch (error) {
    console.log("Error inside loginJobSeeker controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const loginRecruiter = async (
  req: Request<{}, {}, RecruiterLoginInput>,
  res: Response,
) => {
  try {
    const { email, password } = req.body;

    const recruiter = await Recruiter.findOne({ email }).select("+password");
    if (!recruiter) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!recruiter.password) {
      return res.status(500).json({ message: "Invalid user data" });
    }

    const isPasswordValid = await bcrypt.compare(password, recruiter.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const accessToken = await generateTokens(recruiter._id.toString(), res);

    res.status(200).json({
      accessToken,
      user: {
        id: recruiter._id,
        fullName: recruiter.fullName,
        email: recruiter.email,
        role: "recruiter",
      },
    });
  } catch (error) {
    console.log("Error inside loginRecruiter controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token provided" });
    }

    // Verify token signature
    const decoded = jwt.verify(refreshToken, JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string; type: string };

    // Check token type
    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    // Check if token exists in DB (not revoked)
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      return res.status(401).json({ message: "Token revoked or expired" });
    }

    // Find user (try JobSeeker first, then Recruiter)
    let user = await JobSeeker.findById(decoded.userId);
    let role = "jobseeker";
    if (!user) {
      user = await Recruiter.findById(decoded.userId);
      role = "recruiter";
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Issue new access token
    const newAccessToken = signAccessToken(decoded.userId);

    res.status(200).json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: role,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.log("Error inside refreshAccessToken controller", error);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Delete refresh token from DB (revoke it)
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    // Clear cookie
    clearRefreshTokenCookie(res);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error inside logout controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteJobSeeker = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    // Delete all refresh tokens for this user
    await RefreshToken.deleteMany({ userId });

    const jobSeeker = await JobSeeker.findByIdAndDelete(userId);
    if (!jobSeeker) {
      return res.status(400).json({ message: "User not found" });
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteJobSeeker controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRecruiter = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    // Delete all refresh tokens for this user
    await RefreshToken.deleteMany({ userId });

    const recruiter = await Recruiter.findByIdAndDelete(userId);
    if (!recruiter) {
      return res.status(400).json({ message: "User not found" });
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteRecruiter controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getJobSeekerProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const jobSeeker = await JobSeeker.findById(userId).select(
      "-password -googleId",
    );
    if (!jobSeeker) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json(jobSeeker);
  } catch (error) {
    console.log("Error inside getJobSeekerProfile controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getRecruiterProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const recruiter = await Recruiter.findById(userId).select(
      "-password -googleId",
    );
    if (!recruiter) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json(recruiter);
  } catch (error) {
    console.log("Error inside getRecruiterProfile controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    // Check for access token in Authorization header or cookie
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
    if (!token) return res.status(401).send();

    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string; type: string };

    // Only accept access tokens for validation
    if (decoded.type !== "access") {
      return res.status(401).send();
    }

    res.set("X-User-Id", decoded.userId);
    res.status(200).send();
  } catch {
    res.status(401).send();
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    let user = await JobSeeker.findOne({ email });
    let userType = "jobseeker";
    if (!user) {
      user = await Recruiter.findOne({ email });
      userType = "recruiter";
    }

    if (!user) {
      return res.status(200).json({ message: "Email doesn't exist" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    await sendPasswordResetEmail(email, resetToken);

    res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.log("Error inside forgotPassword controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resetPassword = async (
  req: Request<{ token: string }>,
  res: Response,
) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmNewPassword } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    let user = await JobSeeker.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      user = await Recruiter.findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() },
      });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Error inside resetPassword controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
