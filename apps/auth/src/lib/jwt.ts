import jwt from "jsonwebtoken";
import { Response } from "express";

export const signToken = (userId: string, res: Response) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // In miliseconds
    httpOnly: true, // Prevent XSS attacks cross-site scripting attacks
    sameSite: "strict", // CSRF attacks - Cross Site Request Forgery attacks
    secure: process.env.NODE_ENV === "production", // Only works on HTTPS
  });

  return token;
};
