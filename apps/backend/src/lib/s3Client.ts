import { S3Client } from "@aws-sdk/client-s3";

// Configure endpoint, credentials, bucket name
const s3Client = new S3Client({
  endpoint: process.env.AWS_S3_ENDPOINT, // http://minio:9000 (local) or undefined (AWS)
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: !!process.env.AWS_S3_ENDPOINT, // Required for MinIO, false for AWS
});

export default s3Client;
