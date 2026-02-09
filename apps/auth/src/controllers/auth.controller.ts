import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "@joblensai/shared/src/models/user.model.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import {
  signAccessToken,
  setAccessTokenCookie,
  clearRefreshTokenCookie,
  JWT_PUBLIC_KEY,
  JWT_ISSUER,
  JWT_AUDIENCE,
  generateTokens,
} from "@/lib/jwt.js";
import { sendPasswordResetEmail } from "@/lib/resetPasswordEmail.js";
import crypto from "crypto";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    await generateTokens(user._id.toString(), user.role, res);

    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error inside register controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "Please login with Google, or use Forgot Password to create a password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    await generateTokens(user._id.toString(), user.role, res);

    res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.log("Error inside login controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;

    const userFields =
      "fullName email phoneNumber role profilePicture emailVerified isProfileComplete";

    const profile =
      role === "jobseeker"
        ? await JobSeeker.findOne({ userId }).populate("userId", userFields)
        : await Recruiter.findOne({ userId }).populate("userId", userFields);

    if (!profile) {
      return res.status(400).json({ message: "Profile not found" });
    }

    const { userId: user, ...profileData } = profile.toObject();
    return res.status(200).json({ ...user, ...profileData });
  } catch (error) {
    console.log("Error inside getProfile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;

    // No validation needed - middleware already did it!
    // req.body is already validated by validateRole middleware

    // UPDATE the profile
    const updatedProfile =
      role === "jobseeker"
        ? await JobSeeker.findOneAndUpdate({ userId }, req.body, {
            new: true,
            runValidators: true,
          })
        : await Recruiter.findOneAndUpdate({ userId }, req.body, {
            new: true,
            runValidators: true,
          });

    if (!updatedProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(updatedProfile);
  } catch (error) {
    console.log("Error inside updateProfile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    clearRefreshTokenCookie(res);

    return res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteAccount controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
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

    return res.status(200).json({ message: "Password reset email sent" });
  } catch (error) {
    console.log("Error inside forgotPassword controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
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

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Error inside resetPassword controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
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

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error inside logout controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
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

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Issue new access token and set as httpOnly cookie
    const newAccessToken = signAccessToken(decoded.userId, user.role);
    setAccessTokenCookie(newAccessToken, res);

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
      },
    });
  } catch (error) {
    console.log("Error inside refreshAccessToken controller", error);
    return res.status(401).json({ message: "Invalid refresh token" });
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
    }) as { userId: string; role: string; type: string };

    // Only accept access tokens for validation
    if (decoded.type !== "access") {
      return res.status(401).send();
    }

    res.set("X-User-Id", decoded.userId);
    res.set("X-User-Role", decoded.role);
    return res.status(200).send();
  } catch (error) {
    console.log("Error inside validateToken controller", error);
    return res.status(401).send();
  }
};
