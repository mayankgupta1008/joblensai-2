import { Request, Response } from "express";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import { signToken } from "../lib/jwt.js";
import bcrypt from "bcryptjs";
import {
  JobSeekerRegisterInput,
  RecruiterRegisterInput,
} from "@joblensai/shared/src/schemas/auth.schema.js";

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

    const token = signToken(jobSeeker);

    res.status(201).json({
      token,
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

    const token = signToken(recruiter);

    res.status(201).json({
      token,
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
