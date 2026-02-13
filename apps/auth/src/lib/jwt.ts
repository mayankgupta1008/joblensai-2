import jwt from "jsonwebtoken";
import { Response } from "express";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";

const JWT_PRIVATE_KEY = Buffer.from(
  process.env.JWT_PRIVATE_KEY_BASE64!,
  "base64",
).toString("utf8");

export const JWT_PUBLIC_KEY = Buffer.from(
  process.env.JWT_PUBLIC_KEY_BASE64!,
  "base64",
).toString("utf8");

export const JWT_ISSUER = "joblensai-auth";
export const JWT_AUDIENCE = "joblensai";

// Access token - short lived, for API calls
export const signAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role, type: "access" }, JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "15m",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

// Refresh token - long lived, used to get new access tokens
export const signRefreshToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role, type: "refresh" }, JWT_PRIVATE_KEY, {
    algorithm: "RS256",
    expiresIn: "7d",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
};

// Set access token as httpOnly cookie
export const setAccessTokenCookie = (accessToken: string, res: Response) => {
  res.cookie("accessToken", accessToken, {
    maxAge: 15 * 60 * 1000, // 15 minutes
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};

// Set refresh token as httpOnly cookie
export const setRefreshTokenCookie = (refreshToken: string, res: Response) => {
  res.cookie("refreshToken", refreshToken, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
};

// Clear refresh token cookie
export const clearRefreshTokenCookie = (res: Response) => {
  res.cookie("refreshToken", "", { maxAge: 0 });
};

export const clearAccessTokenCookie = (res: Response) => {
  res.cookie("accessToken", "", { maxAge: 0 });
};

// Helper: Generate tokens and store refresh token in DB
export const generateTokens = async (
  userId: string,
  role: string,
  res: Response,
) => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);

  // Store refresh token in DB for revocation support
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Set tokens as httpOnly cookies
  setAccessTokenCookie(accessToken, res);
  setRefreshTokenCookie(refreshToken, res);
};
