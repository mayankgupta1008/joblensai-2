import { S3Client } from "@aws-sdk/client-s3";

const baseConfig = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: !!process.env.AWS_S3_ENDPOINT, // Required for MinIO, false for AWS
};

// Main client for server-to-server operations
const s3Client = new S3Client({
  ...baseConfig,
  endpoint: process.env.AWS_S3_ENDPOINT, // Required for MinIO, undefined for AWS
});

// For presigned URLs: use public endpoint in dev (browser needs localhost, not Docker hostname)
// In production, same client works everywhere
export const s3ClientForPresignedUrls =
  process.env.NODE_ENV === "development"
    ? new S3Client({
        ...baseConfig,
        endpoint: process.env.AWS_S3_PUBLIC_ENDPOINT,
      })
    : s3Client;

export default s3Client;
