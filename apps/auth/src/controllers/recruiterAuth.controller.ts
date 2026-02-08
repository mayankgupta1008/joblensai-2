import {
  RecruiterRegisterInput,
  RecruiterLoginInput,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/jwt.js";
import { Request, Response } from "express";
import { clearRefreshTokenCookie } from "@/lib/jwt.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";

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
