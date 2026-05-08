import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { UAParser } from "ua-parser-js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import geoip from "geoip-lite";

// Make req.userId / req.userRole available to handlers that run after requireAuth.
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
    userRole?: string;
  }
}

const lookupLocation = (ip: string | null): string | null => {
  if (!ip || ip === "::1" || ip.startsWith("127.")) return null;
  const geo = geoip.lookup(ip);
  if (!geo?.country) return null;
  const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(geo.country) ?? geo.country;
};

// Turn a raw User-Agent string into "Chrome on macOS" for display in Active Sessions UI.
export const parseDeviceName = (userAgent: string | null | undefined): string | null => {
  if (!userAgent) return null;
  const { browser, os } = UAParser(userAgent);
  if (browser.name && os.name) return `${browser.name} on ${os.name}`;
  return browser.name || os.name || null;
};

const JWT_PRIVATE_KEY = Buffer.from(process.env.JWT_PRIVATE_KEY_BASE64!, "base64").toString("utf8");

export const JWT_PUBLIC_KEY = Buffer.from(process.env.JWT_PUBLIC_KEY_BASE64!, "base64").toString(
  "utf8"
);

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

// Middleware: verifies access token from cookie/header and attaches userId/role to req.
// 401s on missing, malformed, expired, or non-access tokens.
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ["RS256"],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string; role: string; type: string };

    if (decoded.type !== "access") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    return next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

// Helper: Generate tokens and store refresh token in DB
export const generateTokens = async (userId: string, role: string, req: Request, res: Response) => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, role);

  const deviceName = parseDeviceName(req.headers["user-agent"]);
  const ip = req.ip ?? null;
  const location = lookupLocation(ip);

  // Drop prior tokens for this device — refresh cookie is shared across tabs of the same origin,
  // so the previous row is already orphaned. Keeps Active Sessions to one row per device.
  await RefreshToken.deleteMany({ userId, deviceName, ip });

  // Store refresh token in DB for revocation support
  await RefreshToken.create({
    token: refreshToken,
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    deviceName,
    ip,
    location,
  });

  // Set tokens as httpOnly cookies
  setAccessTokenCookie(accessToken, res);
  setRefreshTokenCookie(refreshToken, res);
};
