import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client, { s3ClientForPresignedUrls } from "@/lib/s3Client.js";

const BUCKET = process.env.AWS_S3_BUCKET!;

export const FILE_CONFIG = {
  resume: {
    folder: "resumes",
    allowedMimeTypes: ["application/pdf"],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  "profile-picture": {
    folder: "profile-pictures",
    allowedMimeTypes: ["image/jpg", "image/jpeg", "image/png", "image/webp"],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
};

// ============ UTILITY FUNCTIONS ============

export const getPresignedUploadUrl = async (
  key: string,
  contentType: string,
) => {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3ClientForPresignedUrls, command, { expiresIn: 300 });
};

export const getPresignedViewUrl = async (key: string) => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3ClientForPresignedUrls, command, { expiresIn: 300 });
};

export const deleteFromS3 = async (key: string) => {
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await s3Client.send(command);
  return response.$metadata.httpStatusCode === 204;
};
