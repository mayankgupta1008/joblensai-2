import { Request, Response } from "express";
import {
  JobSeekerRegisterInput,
  JobSeekerLoginInput,
} from "@joblensai/shared/src/schemas/auth.schema.js";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/jwt.js";
import RefreshToken from "@joblensai/shared/src/models/refreshToken.model.js";
import { clearRefreshTokenCookie } from "@/lib/jwt.js";

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
