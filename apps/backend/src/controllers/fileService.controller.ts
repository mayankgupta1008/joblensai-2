import { Request, Response } from "express";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@/lib/s3Client.js";
import cuid from "cuid";

export const getUploadUrl = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside getUploadUrl controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDownloadUrl = async (req: Request, res: Response) => {
  try {
  } catch (error) {
    console.log("Error inside getDownloadUrl controller", error);
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
