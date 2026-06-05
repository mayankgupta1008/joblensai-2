terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

module "tf_state" {
  source      = "./modules/tf-state"
  bucket_name = local.bucket_name
  table_name  = local.table_name
}

module "vpc" {
  source             = "./modules/vpc"
  name               = local.project_name
  availability_zones = local.availability_zones
}

module "security" {
  source       = "./modules/security"
  vpc_id       = module.vpc.vpc_id
  project_name = local.project_name
}

module "ecrRepos" {
  source   = "./modules/ecr"
  services = keys(local.microservices)
}

module "ecsCluster" {
  source = "./modules/ecs"

  cluster_name                 = local.cluster_name
  availability_zones           = local.availability_zones
  ecs_task_execution_role_name = local.ecs_task_execution_role_name
  alb_name                     = local.alb_name
  aws_region                   = local.aws_region
  services                     = local.microservices
  ecr_repo_urls                = module.ecrRepos.repo_urls

  mongo_root_username = var.mongo_init_root_username
  mongo_root_password = var.mongo_init_root_password
  kafka_cluster_id    = var.kafka_cluster_id

  # Credentials injected as env vars into every backend service task definition.
  # api-gateway and web are excluded (Nginx containers, no app credentials needed).
  # AWS_ACCESS_KEY_ID/SECRET are intentionally omitted — the ECS task IAM role
  # handles S3 access automatically via instance metadata.
  credentials = {
    MONGODB_URI             = var.mongodb_uri
    REDIS_URL               = var.redis_url
    AWS_REGION              = var.aws_region
    AWS_S3_BUCKET           = var.aws_s3_bucket
    RAZORPAY_KEY_ID         = var.razorpay_key_id
    RAZORPAY_KEY_SECRET     = var.razorpay_key_secret
    RAZORPAY_WEBHOOK_SECRET = var.razorpay_webhook_secret
    RAZORPAY_PLAN_ID        = var.razorpay_plan_id
    GOOGLE_CLIENT_ID        = var.google_client_id
    GOOGLE_CLIENT_SECRET    = var.google_client_secret
    JWT_PRIVATE_KEY_BASE64  = var.jwt_private_key_base64
    JWT_PUBLIC_KEY_BASE64   = var.jwt_public_key_base64
    EMAIL_SERVICE           = var.email_service
    EMAIL_USERNAME          = var.email_username
    EMAIL_PASSWORD          = var.email_password
    GMAIL_USER              = var.gmail_user
    GMAIL_PASSWORD          = var.gmail_password
    KAFKA_BROKERS           = "kafka.joblensai:9092"
  }
}
