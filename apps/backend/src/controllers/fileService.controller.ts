import { Request, Response } from "express";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { s3ClientForPresignedUrls } from "@/lib/s3Client.js";
import { createId } from "@paralleldrive/cuid2";
import JobSeeker from "@joblensai/shared/src/models/jobSeeker.model.js";
import User from "@joblensai/shared/src/models/user.model.js";

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
    const userId = req.headers["x-user-id"] as string;
    const { fileType, fileName, contentType } = req.body;

    // 1. Validate fileType exists in config
    const config = FILE_CONFIG[fileType as keyof typeof FILE_CONFIG];
    if (!config) {
      return res.status(400).json({ message: "Invalid file type" });
    }

    // 2. Validate MIME type
    if (!config.allowedMimeTypes.includes(contentType)) {
      return res.status(400).json({ message: "Invalid content type" });
    }

    // 3. Generate unique key (prevents overwrites)
    const ext = fileName.split(".").pop();
    const key = `${config.folder}/${userId}/${createId()}.${ext}`;

    if (fileType === "resume") {
      await JobSeeker.findOneAndUpdate({ userId }, { resumeKey: key });
    } else if (fileType === "profile-picture") {
      await User.findByIdAndUpdate(userId, { profilePictureKey: key });
    }

    // 4. Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3ClientForPresignedUrls, command, {
      expiresIn: 300, // 5 minutes - per AWS best practices
    });

    return res.status(200).json({ presignedUrl, key });
  } catch (error) {
    console.error("Error inside uploadFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const viewFile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { fileType } = req.query;

    if (fileType === "resume") {
      const jobSeeker = await JobSeeker.findOne({ userId });
      if (!jobSeeker?.resumeKey) {
        return res.status(404).json({ message: "Resume not found" });
      }
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: jobSeeker.resumeKey,
      });
      const presignedUrl = await getSignedUrl(
        s3ClientForPresignedUrls,
        command,
        {
          expiresIn: 300,
        },
      );
      return res.status(200).json({ presignedUrl });
    } else if (fileType === "profile-picture") {
      const user = await User.findById(userId);
      if (!user?.profilePictureKey) {
        return res.status(404).json({ message: "Profile picture not found" });
      }
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: user.profilePictureKey,
      });
      const presignedUrl = await getSignedUrl(
        s3ClientForPresignedUrls,
        command,
        {
          expiresIn: 300,
        },
      );
      return res.status(200).json({ presignedUrl });
    }
  } catch (error) {
    console.log("Error inside viewFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { fileType } = req.query;

    if (fileType === "resume") {
      const jobSeeker = await JobSeeker.findOne({ userId });
      if (!jobSeeker?.resumeKey) {
        return res.status(404).json({ message: "Resume not found" });
      }
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: jobSeeker.resumeKey,
      });
      const delFile = await s3Client.send(command);
      if (delFile.$metadata.httpStatusCode === 204) {
        await JobSeeker.findOneAndUpdate({ userId }, { resumeKey: null });
        return res.status(200).json({ message: "Resume deleted successfully" });
      }
    } else if (fileType === "profile-picture") {
      const user = await User.findById(userId);
      if (!user?.profilePictureKey) {
        return res.status(404).json({ message: "Profile picture not found" });
      }
      const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: user.profilePictureKey,
      });
      const delFile = await s3Client.send(command);
      if (delFile.$metadata.httpStatusCode === 204) {
        await User.findByIdAndUpdate(userId, { profilePictureKey: null });
        return res
          .status(200)
          .json({ message: "Profile picture deleted successfully" });
      }
    }
  } catch (error) {
    console.log("Error inside deleteFile controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
