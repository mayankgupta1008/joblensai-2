import { Request, Response } from "express";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { s3ClientForPresignedUrls } from "@/lib/s3Client.js";
import { createId } from "@paralleldrive/cuid2";

const FILE_CONFIG = {
  resume: {
    folder: "resumes",
    allowedMimeTypes: ["application/pdf"],
    maxSize: 5 * 1024 * 1024,
  },

  "profile-picture": {
    folder: "profile-pictures",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxSize: 2 * 1024 * 1024,
  },
};

export const uploadFile = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside uploadFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const viewFile = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside viewFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside deleteFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
