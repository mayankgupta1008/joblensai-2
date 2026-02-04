import { Request, Response } from "express";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import Recruiter from "@joblensai/shared/src/models/recruiter.model.js";
import { signToken } from "../lib/jwt.js";
import bcrypt from "bcryptjs";
import {
  JobSeekerRegisterInput,
  RecruiterRegisterInput,
  JobSeekerLoginInput,
  RecruiterLoginInput,
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

    // Check if password exists (since it's not selected by default in schema)
    if (!jobSeeker.password) {
      return res.status(500).json({ message: "Invalid user data" });
    }

    const isPasswordValid = await bcrypt.compare(password, jobSeeker.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = signToken(jobSeeker);
    res.status(200).json({
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

    // Check if password exists (since it's not selected by default in schema)
    if (!recruiter.password) {
      return res.status(500).json({ message: "Invalid user data" });
    }

    const isPasswordValid = await bcrypt.compare(password, recruiter.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = signToken(recruiter);
    res.status(200).json({
      token,
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

export const deleteJobSeeker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jobSeeker = await JobSeeker.findByIdAndDelete(id);
    if (!jobSeeker) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteJobSeeker controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteRecruiter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const recruiter = await Recruiter.findByIdAndDelete(id);
    if (!recruiter) {
      return res.status(400).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error inside deleteRecruiter controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getJobSeekerProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jobSeeker = await JobSeeker.findById(id).select(
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
    const { id } = req.params;
    const recruiter = await Recruiter.findById(id).select(
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
