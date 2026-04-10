# ---------------------------------------------------------------
# Locals
# ---------------------------------------------------------------
locals {
  ecr_registry   = "224976804927.dkr.ecr.ap-south-1.amazonaws.com"
  minio_endpoint = "http://minio:9000"
}

# ---------------------------------------------------------------
# SSM Parameter Store — Secrets
# All sensitive values stored as SecureString (AES-256 encrypted).
# ECS fetches and injects as env vars at container startup.
# ---------------------------------------------------------------

# Infrastructure connections
resource "aws_ssm_parameter" "mongodb_uri" {
  name  = "/${var.project_name}/${var.environment}/mongodb_uri"
  type  = "SecureString"
  value = var.mongodb_uri
}

resource "aws_ssm_parameter" "redis_url" {
  name  = "/${var.project_name}/${var.environment}/redis_url"
  type  = "SecureString"
  value = var.redis_url
}

resource "aws_ssm_parameter" "minio_access_key" {
  name  = "/${var.project_name}/${var.environment}/minio_access_key"
  type  = "SecureString"
  value = var.minio_access_key
}

resource "aws_ssm_parameter" "minio_secret_key" {
  name  = "/${var.project_name}/${var.environment}/minio_secret_key"
  type  = "SecureString"
  value = var.minio_secret_key
}

# Razorpay
resource "aws_ssm_parameter" "razorpay_key_id" {
  name  = "/${var.project_name}/${var.environment}/razorpay_key_id"
  type  = "SecureString"
  value = var.razorpay_key_id
}

resource "aws_ssm_parameter" "razorpay_key_secret" {
  name  = "/${var.project_name}/${var.environment}/razorpay_key_secret"
  type  = "SecureString"
  value = var.razorpay_key_secret
}

resource "aws_ssm_parameter" "razorpay_webhook_secret" {
  name  = "/${var.project_name}/${var.environment}/razorpay_webhook_secret"
  type  = "SecureString"
  value = var.razorpay_webhook_secret
}

# Auth
resource "aws_ssm_parameter" "google_client_id" {
  name  = "/${var.project_name}/${var.environment}/google_client_id"
  type  = "SecureString"
  value = var.google_client_id
}

resource "aws_ssm_parameter" "google_client_secret" {
  name  = "/${var.project_name}/${var.environment}/google_client_secret"
  type  = "SecureString"
  value = var.google_client_secret
}

resource "aws_ssm_parameter" "jwt_private_key_base64" {
  name  = "/${var.project_name}/${var.environment}/jwt_private_key_base64"
  type  = "SecureString"
  value = var.jwt_private_key_base64
}

resource "aws_ssm_parameter" "jwt_public_key_base64" {
  name  = "/${var.project_name}/${var.environment}/jwt_public_key_base64"
  type  = "SecureString"
  value = var.jwt_public_key_base64
}

resource "aws_ssm_parameter" "email_username" {
  name  = "/${var.project_name}/${var.environment}/email_username"
  type  = "SecureString"
  value = var.email_username
}

resource "aws_ssm_parameter" "email_password" {
  name  = "/${var.project_name}/${var.environment}/email_password"
  type  = "SecureString"
  value = var.email_password
}

# Agent service
resource "aws_ssm_parameter" "gmail_user" {
  name  = "/${var.project_name}/${var.environment}/gmail_user"
  type  = "SecureString"
  value = var.gmail_user
}

resource "aws_ssm_parameter" "gmail_password" {
  name  = "/${var.project_name}/${var.environment}/gmail_password"
  type  = "SecureString"
  value = var.gmail_password
}

# MongoDB container init
resource "aws_ssm_parameter" "mongo_init_root_username" {
  name  = "/${var.project_name}/${var.environment}/mongo_init_root_username"
  type  = "SecureString"
  value = var.mongo_init_root_username
}

resource "aws_ssm_parameter" "mongo_init_root_password" {
  name  = "/${var.project_name}/${var.environment}/mongo_init_root_password"
  type  = "SecureString"
  value = var.mongo_init_root_password
}

# MinIO container
resource "aws_ssm_parameter" "minio_root_user" {
  name  = "/${var.project_name}/${var.environment}/minio_root_user"
  type  = "SecureString"
  value = var.minio_root_user
}

resource "aws_ssm_parameter" "minio_root_password" {
  name  = "/${var.project_name}/${var.environment}/minio_root_password"
  type  = "SecureString"
  value = var.minio_root_password
}

# ---------------------------------------------------------------
# VPC
# ---------------------------------------------------------------
module "vpc" {
  source       = "../modules/vpc"
  project_name = var.project_name
  environment  = var.environment
}

# ---------------------------------------------------------------
# Security Groups
# ---------------------------------------------------------------
module "security_groups" {
  source       = "../modules/security-groups"
  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# ---------------------------------------------------------------
# ALB
# ---------------------------------------------------------------
module "alb" {
  source            = "../modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  alb_sg_id         = module.security_groups.alb_sg_id
}

# ---------------------------------------------------------------
# ECS Cluster
# ---------------------------------------------------------------
module "ecs_cluster" {
  source             = "../modules/ecs-cluster"
  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  instance_type      = var.instance_type
  min_size           = 1
  max_size           = 3
  desired_capacity   = 1
}

# ---------------------------------------------------------------
# Infrastructure Services (self-hosted, no ALB)
# ---------------------------------------------------------------

module "mongodb" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "mongodb"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.infra_sg_id
  container_image        = "mongo:7.0"
  container_port         = 27017
  cpu                    = 512
  memory                 = 1024
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = false

  secrets = [
    { name = "MONGO_INITDB_ROOT_USERNAME", valueFrom = aws_ssm_parameter.mongo_init_root_username.arn },
    { name = "MONGO_INITDB_ROOT_PASSWORD", valueFrom = aws_ssm_parameter.mongo_init_root_password.arn }
  ]
}

module "redis" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "redis"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.infra_sg_id
  container_image        = "redis:7.2-alpine"
  container_port         = 6379
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = false
}

module "kafka" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "kafka"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.infra_sg_id
  container_image        = "apache/kafka:latest"
  container_port         = 9092
  cpu                    = 512
  memory                 = 1024
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = false

  # Matches root .env.example exactly (apache/kafka image, no KAFKA_CFG_ prefix)
  environment_variables = [
    { name = "KAFKA_NODE_ID", value = "1" },
    { name = "KAFKA_PROCESS_ROLES", value = "controller,broker" },
    { name = "KAFKA_CONTROLLER_QUORUM_VOTERS", value = "1@kafka:9093" },
    { name = "KAFKA_LISTENERS", value = "PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093" },
    { name = "KAFKA_ADVERTISED_LISTENERS", value = "PLAINTEXT://kafka:9092" },
    { name = "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP", value = "PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT" },
    { name = "KAFKA_INTER_BROKER_LISTENER_NAME", value = "PLAINTEXT" },
    { name = "KAFKA_CONTROLLER_LISTENER_NAMES", value = "CONTROLLER" },
    { name = "KAFKA_LOG_DIRS", value = "/var/lib/kafka/data" },
    { name = "KAFKA_AUTO_CREATE_TOPICS_ENABLE", value = "true" },
    { name = "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR", value = "1" },
    { name = "KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR", value = "1" },
    { name = "KAFKA_TRANSACTION_STATE_LOG_MIN_ISR", value = "1" },
    { name = "KAFKA_LOG_RETENTION_HOURS", value = "168" },
    { name = "KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS", value = "0" },
    { name = "CLUSTER_ID", value = var.kafka_cluster_id }
  ]
}

module "minio" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "minio"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.infra_sg_id
  container_image        = "minio/minio:latest"
  container_port         = 9000
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = false

  secrets = [
    { name = "MINIO_ROOT_USER", valueFrom = aws_ssm_parameter.minio_root_user.arn },
    { name = "MINIO_ROOT_PASSWORD", valueFrom = aws_ssm_parameter.minio_root_password.arn }
  ]
}

# ---------------------------------------------------------------
# Application Services
# Shared env vars match packages/shared/.env.example exactly.
# ---------------------------------------------------------------

module "auth" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "auth"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-auth:latest"
  container_port         = 5003
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.auth_tg_arn

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "5003" },
    { name = "AWS_REGION", value = var.aws_region },
    { name = "AWS_S3_ENDPOINT", value = local.minio_endpoint },
    { name = "AWS_S3_BUCKET", value = var.aws_s3_bucket },
    { name = "EMAIL_SERVICE", value = var.email_service }
  ]

  secrets = [
    { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
    { name = "REDIS_URL", valueFrom = aws_ssm_parameter.redis_url.arn },
    { name = "JWT_PRIVATE_KEY_BASE64", valueFrom = aws_ssm_parameter.jwt_private_key_base64.arn },
    { name = "JWT_PUBLIC_KEY_BASE64", valueFrom = aws_ssm_parameter.jwt_public_key_base64.arn },
    { name = "GOOGLE_CLIENT_ID", valueFrom = aws_ssm_parameter.google_client_id.arn },
    { name = "GOOGLE_CLIENT_SECRET", valueFrom = aws_ssm_parameter.google_client_secret.arn },
    { name = "EMAIL_USERNAME", valueFrom = aws_ssm_parameter.email_username.arn },
    { name = "EMAIL_PASSWORD", valueFrom = aws_ssm_parameter.email_password.arn },
    { name = "RAZORPAY_KEY_ID", valueFrom = aws_ssm_parameter.razorpay_key_id.arn },
    { name = "RAZORPAY_KEY_SECRET", valueFrom = aws_ssm_parameter.razorpay_key_secret.arn },
    { name = "AWS_ACCESS_KEY_ID", valueFrom = aws_ssm_parameter.minio_access_key.arn },
    { name = "AWS_SECRET_ACCESS_KEY", valueFrom = aws_ssm_parameter.minio_secret_key.arn }
  ]
}

module "backend" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "backend"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-backend:latest"
  container_port         = 5000
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.backend_tg_arn

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "5000" },
    { name = "AWS_REGION", value = var.aws_region },
    { name = "AWS_S3_ENDPOINT", value = local.minio_endpoint },
    { name = "AWS_S3_BUCKET", value = var.aws_s3_bucket }
  ]

  secrets = [
    { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
    { name = "REDIS_URL", valueFrom = aws_ssm_parameter.redis_url.arn },
    { name = "JWT_PUBLIC_KEY_BASE64", valueFrom = aws_ssm_parameter.jwt_public_key_base64.arn },
    { name = "RAZORPAY_KEY_ID", valueFrom = aws_ssm_parameter.razorpay_key_id.arn },
    { name = "RAZORPAY_KEY_SECRET", valueFrom = aws_ssm_parameter.razorpay_key_secret.arn },
    { name = "AWS_ACCESS_KEY_ID", valueFrom = aws_ssm_parameter.minio_access_key.arn },
    { name = "AWS_SECRET_ACCESS_KEY", valueFrom = aws_ssm_parameter.minio_secret_key.arn }
  ]
}

module "payment" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "payment"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-payment:latest"
  container_port         = 5004
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.payment_tg_arn

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "5004" },
    { name = "RAZORPAY_PLAN_ID", value = var.razorpay_plan_id }
  ]

  secrets = [
    { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
    { name = "REDIS_URL", valueFrom = aws_ssm_parameter.redis_url.arn },
    { name = "JWT_PUBLIC_KEY_BASE64", valueFrom = aws_ssm_parameter.jwt_public_key_base64.arn },
    { name = "RAZORPAY_KEY_ID", valueFrom = aws_ssm_parameter.razorpay_key_id.arn },
    { name = "RAZORPAY_KEY_SECRET", valueFrom = aws_ssm_parameter.razorpay_key_secret.arn },
    { name = "RAZORPAY_WEBHOOK_SECRET", valueFrom = aws_ssm_parameter.razorpay_webhook_secret.arn }
  ]
}

module "notification" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "notification"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-notification:latest"
  container_port         = 5005
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.notification_tg_arn

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "5005" },
    { name = "EMAIL_SERVICE", value = var.email_service }
  ]

  secrets = [
    { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
    { name = "REDIS_URL", valueFrom = aws_ssm_parameter.redis_url.arn },
    { name = "JWT_PUBLIC_KEY_BASE64", valueFrom = aws_ssm_parameter.jwt_public_key_base64.arn },
    { name = "EMAIL_USERNAME", valueFrom = aws_ssm_parameter.email_username.arn },
    { name = "EMAIL_PASSWORD", valueFrom = aws_ssm_parameter.email_password.arn }
  ]
}

module "agent_service" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "agent-service"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-agent-service:latest"
  container_port         = 5002
  cpu                    = 512
  memory                 = 1024
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.agent_tg_arn

  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "AGENT_PORT", value = "5002" },
    { name = "AWS_REGION", value = var.aws_region }
  ]

  secrets = [
    { name = "MONGODB_URI", valueFrom = aws_ssm_parameter.mongodb_uri.arn },
    { name = "GMAIL_USER", valueFrom = aws_ssm_parameter.gmail_user.arn },
    { name = "GMAIL_PASSWORD", valueFrom = aws_ssm_parameter.gmail_password.arn }
  ]
}

module "web" {
  source                 = "../modules/ecs-service"
  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  service_name           = "web"
  cluster_id             = module.ecs_cluster.cluster_id
  cluster_name           = module.ecs_cluster.cluster_name
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  security_group_id      = module.security_groups.ecs_tasks_sg_id
  container_image        = "${local.ecr_registry}/joblensai-web:latest"
  container_port         = 5173
  cpu                    = 256
  memory                 = 512
  desired_count          = 1
  capacity_provider_name = module.ecs_cluster.capacity_provider_name
  log_group_name         = module.ecs_cluster.log_group_name
  enable_load_balancer   = true
  target_group_arn       = module.alb.web_tg_arn

  # VITE_RAZORPAY_KEY_ID is a build-time var (baked into Docker image during CI/CD build)
  # Only runtime vars go here
  environment_variables = [
    { name = "NODE_ENV", value = "production" },
    { name = "VITE_API_URL", value = "http://${module.alb.alb_dns_name}" }
  ]
}
