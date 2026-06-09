locals {
  bucket_name = "joblensai-terraform-state"
  table_name  = "joblensai-terraform-locks"

  # Shared ECS/VPC Config
  cluster_name                 = "joblensai-cluster"
  availability_zones           = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
  ecs_task_execution_role_name = "joblensai-ecs-task-execution-role"
  alb_name                     = "joblensai-alb"
  aws_region                   = "ap-south-1"
  project_name                 = "joblensai"

  # All microservices
  # port       : container port the service listens on
  # health_path: ECS container health check path
  microservices = {
    "api-gateway" = {
      port        = 80
      health_path = "/health"
    }
    "auth" = {
      port        = 5003
      health_path = "/api/auth/health"
    }
    "backend" = {
      port        = 5001
      health_path = "/api/backend/health"
    }
    "agent-service" = {
      port        = 5002
      health_path = "/api/agent-service/health"
    }
    "payment" = {
      port        = 5004
      health_path = "/api/payment/health"
    }
    "notification" = {
      port        = 5005
      health_path = "/api/notification/health"
    }
    "web" = {
      port        = 5173
      health_path = "/"
    }
  }
}

# ---------------------------------------------------------------
# Input variables — values come from terraform.tfvars
# ---------------------------------------------------------------

variable "project_name" {
  type = string
}

variable "aws_region" {
  type = string
}

variable "environment" {
  type = string
}

# Infrastructure connections
variable "mongodb_uri" {
  type      = string
  sensitive = true
}

variable "redis_url" {
  type = string
}

variable "aws_s3_bucket" {
  type = string
}

# Razorpay
variable "razorpay_key_id" {
  type      = string
  sensitive = true
}

variable "razorpay_key_secret" {
  type      = string
  sensitive = true
}

variable "razorpay_webhook_secret" {
  type      = string
  sensitive = true
}

variable "razorpay_plan_id" {
  type = string
}

# Google OAuth
variable "google_client_id" {
  type      = string
  sensitive = true
}

variable "google_client_secret" {
  type      = string
  sensitive = true
}

# JWT
variable "jwt_private_key_base64" {
  type      = string
  sensitive = true
}

variable "jwt_public_key_base64" {
  type = string
}

# Email (auth + notification services)
variable "email_service" {
  type = string
}

variable "email_username" {
  type = string
}

variable "email_password" {
  type      = string
  sensitive = true
}

# Agent service Gmail
variable "gmail_user" {
  type = string
}

variable "gmail_password" {
  type      = string
  sensitive = true
}

# MongoDB container root (local Docker only — not injected into ECS)
variable "mongo_init_root_username" {
  type = string
}

variable "mongo_init_root_password" {
  type      = string
  sensitive = true
}

# Kafka
variable "kafka_cluster_id" {
  type = string
}
