# ---------------------------------------------------------------
# General
# ---------------------------------------------------------------
variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "joblensai"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "prod"
}

variable "instance_type" {
  description = "EC2 instance type for ECS container instances"
  type        = string
  default     = "t3.medium"
}

# ---------------------------------------------------------------
# Infrastructure connections (packages/shared/.env.example)
# Used by ALL microservices via the shared package
# ---------------------------------------------------------------
variable "mongodb_uri" {
  description = "MongoDB connection URI (e.g. mongodb://user:pass@mongodb:27017/joblensai?authSource=admin)"
  type        = string
  sensitive   = true
}

variable "redis_url" {
  description = "Redis connection URL (e.g. redis://redis:6379)"
  type        = string
  sensitive   = true
}

variable "aws_s3_bucket" {
  description = "S3 / MinIO bucket name"
  type        = string
  default     = "joblensai"
}

# MinIO credentials used by services to connect to self-hosted MinIO
# Named minio_access_key / minio_secret_key to avoid clash with ECS task role
variable "minio_access_key" {
  description = "MinIO access key (AWS_ACCESS_KEY_ID equivalent for MinIO)"
  type        = string
  sensitive   = true
}

variable "minio_secret_key" {
  description = "MinIO secret key (AWS_SECRET_ACCESS_KEY equivalent for MinIO)"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------
# Razorpay (packages/shared/.env.example + apps/payment/.env.example)
# ---------------------------------------------------------------
variable "razorpay_key_id" {
  description = "Razorpay API key ID"
  type        = string
  sensitive   = true
}

variable "razorpay_key_secret" {
  description = "Razorpay API key secret"
  type        = string
  sensitive   = true
}

variable "razorpay_webhook_secret" {
  description = "Razorpay webhook verification secret"
  type        = string
  sensitive   = true
}

variable "razorpay_plan_id" {
  description = "Razorpay subscription plan ID"
  type        = string
  sensitive   = false
}

# ---------------------------------------------------------------
# Auth (apps/auth/.env.example)
# ---------------------------------------------------------------
variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  sensitive   = true
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
}

# Auth uses RSA keypair for JWT — NOT a simple shared secret
# Generate with: openssl genrsa -out private.pem 2048
#                openssl rsa -in private.pem -pubout -out public.pem
#                base64 -i private.pem | tr -d '\n'
variable "jwt_private_key_base64" {
  description = "RSA private key for JWT signing (base64 encoded, no newlines)"
  type        = string
  sensitive   = true
}

variable "jwt_public_key_base64" {
  description = "RSA public key for JWT verification (base64 encoded, no newlines)"
  type        = string
  sensitive   = true
}

# Auth also sends emails (e.g. verification, password reset)
variable "email_service" {
  description = "Email service provider (e.g. gmail)"
  type        = string
  sensitive   = false
  default     = "gmail"
}

variable "email_username" {
  description = "Email account username / address"
  type        = string
  sensitive   = true
}

variable "email_password" {
  description = "Email account password or Gmail app password"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------
# Agent service (apps/agent-service/.env.example)
# Uses a separate Gmail account for AI-generated email sending
# ---------------------------------------------------------------
variable "gmail_user" {
  description = "Gmail address used by agent-service for AI email sending"
  type        = string
  sensitive   = true
}

variable "gmail_password" {
  description = "Gmail app password for agent-service"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------
# MongoDB container init (.env.example root)
# ---------------------------------------------------------------
variable "mongo_init_root_username" {
  description = "MongoDB root username (MONGO_INITDB_ROOT_USERNAME)"
  type        = string
  sensitive   = true
}

variable "mongo_init_root_password" {
  description = "MongoDB root password (MONGO_INITDB_ROOT_PASSWORD)"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------
# MinIO container (.env.example root)
# ---------------------------------------------------------------
variable "minio_root_user" {
  description = "MinIO root username (MINIO_ROOT_USER)"
  type        = string
  sensitive   = true
}

variable "minio_root_password" {
  description = "MinIO root password (MINIO_ROOT_PASSWORD)"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------
# Kafka (.env.example root)
# ---------------------------------------------------------------
variable "kafka_cluster_id" {
  description = "Kafka KRaft cluster ID (base64 encoded UUID)"
  type        = string
  sensitive   = false
  default     = "Mk3OEYBSD34fcwNTJENDM2Qk"
}
