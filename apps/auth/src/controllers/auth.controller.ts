import type { Request, Response } from "express";
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
  clearAccessTokenCookie,
} from "@/lib/jwt.js";
import crypto from "crypto";
import { sendMessage, KAFKA_TOPICS } from "@joblensai/shared/src/utils/kafka.config.js";
import { getBaseUrl } from "@joblensai/shared/src/utils/getBaseUrl.js";
import { authenticator } from "otplib";
import QRCode from "qrcode";

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;

    // ✅ OPTIMIZATION 1: Check user existence AND hash password in parallel
    const [existingUser, hashedPassword] = await Promise.all([
      User.findOne({ email }),
      bcrypt.genSalt(10).then((salt) => bcrypt.hash(password, salt)),
    ]);

    if (existingUser) {
      return res.status(400).json({ success: false, error: "User Already Exists" });
    }

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    await generateTokens(user._id.toString(), user.role || "", req, res);

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || null,
        isProfileComplete: false,
        hasPassword: true,
      },
    });
  } catch (error) {
    console.log("Error inside register controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, error: "User Not Found" });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        error: "Please Login With Google, Or Use Forgot Password To Create Password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password!);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: "Invalid Password" });
    }

    await generateTokens(user._id.toString(), user.role || "", req, res);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || null,
        isProfileComplete: user.isProfileComplete || false,
        hasPassword: true,
      },
    });
  } catch (error) {
    console.log("Error inside login controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "If This Email is Registered, Reset Link Is Sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetUrl = `${getBaseUrl(req)}/reset-password/${resetToken}`;
    await sendMessage(KAFKA_TOPICS.NOTIFICATION_EMAIL, {
      type: "PASSWORD_RESET",
      to: email,
      data: { resetUrl, userName: user.fullName },
    });

    return res
      .status(200)
      .json({ success: true, message: "If This Email is Registered, Reset Link Is Sent." });
  } catch (error) {
    console.log("Error inside forgotPassword controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const setNewPassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { newPassword } = req.body;

    const [user, hashedPassword] = await Promise.all([
      User.findOne({ _id: userId }),
      bcrypt.genSalt(10).then((salt) => bcrypt.hash(newPassword, salt)),
    ]);

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or Expired Token" });
    }

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password Reset Successful" });
  } catch (error) {
    console.log("Error inside setNewPassword controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const resetPassword = async (req: Request<{ token: string }>, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // ✅ OPTIMIZATION: Find user AND hash password in parallel
    const [user, hashedPassword] = await Promise.all([
      User.findOne({
        resetToken: hashedToken,
        resetTokenExpiry: { $gt: new Date() },
      }),
      bcrypt.genSalt(10).then((salt) => bcrypt.hash(newPassword, salt)),
    ]);

    if (!user) {
      return res.status(400).json({ success: false, error: "Invalid or expired token" });
    }

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password Reset Successful" });
  } catch (error) {
    console.log("Error inside resetPassword controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
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
    clearAccessTokenCookie(res);

    return res.status(200).json({ success: true, message: "Logged Out Successfully" });
  } catch (error) {
    console.log("Error inside logout controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, error: "No Refresh Token Provided" });
    }

    // Verify token signature (sync CPU operation)
    const decoded = jwt.verify(refreshToken, JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string; type: string };

    // Check token type
    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, error: "Invalid Token Type" });
    }

    // ✅ OPTIMIZATION: Check token in DB AND fetch user in parallel.
    // findOneAndUpdate stamps lastUsedAt atomically so the Active Sessions UI
    // reflects real activity, not just creation time.
    const [storedToken, user] = await Promise.all([
      RefreshToken.findOneAndUpdate({ token: refreshToken }, { $set: { lastUsedAt: new Date() } }),
      User.findById(decoded.userId).select("+password"),
    ]);

    if (!storedToken) {
      return res.status(401).json({ success: false, error: "Token Revoked or Expired" });
    }

    if (!user) {
      return res.status(401).json({ success: false, error: "User Not Found" });
    }

    // Issue new access token and set as httpOnly cookie.
    // Note: role is read from the DB on every refresh, so once /profile/complete
    // sets the user's role, the next refresh stamps the JWT with the correct value.
    const newAccessToken = signAccessToken(decoded.userId, user.role || "");
    setAccessTokenCookie(newAccessToken, res);

    return res.status(200).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role || null,
        profilePictureKey: user.profilePictureKey || null,
        subscriptionId: user.subscriptionId || null,
        emailVerified: user.emailVerified || false,
        phoneNumber: user.phoneNumber || false,
        phoneNumberVerified: user.phoneNumberVerified || false,
        isProfileComplete: user.isProfileComplete || false,
        is2FAEnabled: user.is2FAEnabled || false,
        hasPassword: !!user.password,
      },
    });
  } catch (error) {
    console.log("Error inside refreshAccessToken controller", error);
    return res.status(401).json({ success: false, error: "Invalid refresh token" });
  }
};

export const validateToken = (req: Request, res: Response) => {
  try {
    // Check for access token in Authorization header or cookie
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
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

export const getSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const currentRefreshToken = req.cookies?.refreshToken;

    const sessions = await RefreshToken.find({
      userId,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastUsedAt: -1 })
      .lean();

    return res.status(200).json(
      sessions.map((s) => ({
        sid: s.sid,
        deviceName: s.deviceName,
        ip: s.ip,
        location: s.location,
        lastUsedAt: s.lastUsedAt,
        current: s.token === currentRefreshToken,
      }))
    );
  } catch (error) {
    console.log("Error inside getSessions controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const revokeSession = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { sid } = req.params;
    const currentRefreshToken = req.cookies?.refreshToken;

    // userId guard: user can only revoke their own sessions
    const session = await RefreshToken.findOne({ sid, userId });
    if (!session) {
      return res.status(404).json({ success: false, error: "Session not found" });
    }

    if (session.token === currentRefreshToken) {
      return res.status(400).json({
        success: false,
        error: "Cannot Revoke The Current Session. Use Logout Instead.",
      });
    }

    await RefreshToken.deleteOne({ _id: session._id });
    return res.status(200).json({ success: true, message: "Session Revoked Successfully" });
  } catch (error) {
    console.log("Error inside revokeSession controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const revokeAllOtherSessions = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const currentRefreshToken = req.cookies?.refreshToken;

    if (!currentRefreshToken) {
      // requireAuth ensures access token, but refresh cookie could theoretically be missing.
      // Refusing here protects the current session from being caught by the deleteMany.
      return res.status(401).json({ success: false, error: "Current Session Required" });
    }

    const result = await RefreshToken.deleteMany({
      userId,
      token: { $ne: currentRefreshToken },
    });

    return res.status(200).json({
      success: true,
      message: "Other Sessions Revoked Successfully",
      revokedCount: result.deletedCount,
    });
  } catch (error) {
    console.log("Error inside revokeAllOtherSessions controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    if (user.is2FAEnabled) {
      return res.status(400).json({ success: false, error: "2FA is already enabled" });
    }
    const secret = authenticator.generateSecret();
    const otpAuthUrl = authenticator.keyuri(user.email, "JobLensAI", secret);
    const qrCode = await QRCode.toDataURL(otpAuthUrl);
    await User.updateOne(
      { _id: userId },
      {
        $set: { twoFASecret: secret },
      }
    );
    return res.status(200).json({ secret, qrCode, otpAuthUrl });
  } catch (error) {
    console.log("Error inside setup2FA controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("+twoFASecret");
    if (!user) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }
    if (!user.twoFASecret) {
      return res.status(400).json({ success: false, error: "2FA Setup Not Initiated" });
    }
    const { token } = req.body;
    const isValid = authenticator.verify({ token, secret: user.twoFASecret });
    if (!isValid) {
      return res.status(400).json({ success: false, error: "Invalid 2FA Token" });
    }
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          is2FAEnabled: true,
        },
      }
    );
    return res.status(200).json({ success: true, message: "2FA Verified Successfully" });
  } catch (error) {
    console.log("Error inside verify2FA controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const validate2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("+twoFASecret");

    if (!user) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }

    if (!user.is2FAEnabled) {
      return res.status(400).json({ success: false, error: "2FA Not Enabled" });
    }

    const { token } = req.body;
    const isValid = authenticator.verify({ token, secret: user.twoFASecret! });

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid 2FA Token" });
    }

    return res.status(200).json({ success: true, message: "2FA Verified Successfully" });
  } catch (error) {
    console.log("Error inside validate2FA controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

export const disable2FA = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("+twoFASecret");

    if (!user) {
      return res.status(404).json({ success: false, error: "User Not Found" });
    }

    if (!user.is2FAEnabled) {
      return res.status(400).json({ success: false, error: "2FA Not Enabled" });
    }

    const { token } = req.body;
    const isValid = authenticator.verify({ token, secret: user.twoFASecret! });

    if (!isValid) {
      return res.status(401).json({ success: false, error: "Invalid 2FA Token" });
    }

    await User.updateOne(
      { _id: userId },
      {
        $set: {
          is2FAEnabled: false,
          twoFASecret: "",
        },
      }
    );
    return res.status(200).json({ success: true, message: "2FA Disabled Successfully" });
  } catch (error) {
    console.log("Error inside disable2FA controller", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
