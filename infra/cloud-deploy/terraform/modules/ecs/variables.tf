variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "aws_region" {
  description = "AWS region for CloudWatch log groups"
  type        = string
}

variable "services" {
  description = "Map of service name to config (port, health_path)"
  type = map(object({
    port        = number
    health_path = string
  }))
}

variable "ecr_repo_urls" {
  description = "Map of service name to ECR repository URL"
  type        = map(string)
}

variable "credentials" {
  description = "Env vars injected into every backend service task definition (auth, backend, agent-service, payment, notification)"
  type        = map(string)
  sensitive   = true
}

variable "mongo_root_username" {
  description = "MongoDB root username (MONGO_INITDB_ROOT_USERNAME)"
  type        = string
}

variable "mongo_root_password" {
  description = "MongoDB root password (MONGO_INITDB_ROOT_PASSWORD)"
  type        = string
  sensitive   = true
}

variable "kafka_cluster_id" {
  description = "Kafka KRaft CLUSTER_ID (22-char base64). Generate with: kafka-storage random-uuid"
  type        = string
}

# ─────────────────────────────────────────────────────────────
# Wiring from sibling modules (vpc / security / alb / iam)
# ─────────────────────────────────────────────────────────────
variable "vpc_id" {
  description = "VPC ID — from module.vpc. Used by the Cloud Map private DNS namespace"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs — from module.vpc. ECS task ENIs land here"
  type        = list(string)
}

variable "api_gateway_sg_id" {
  description = "Security group for the api-gateway service — from module.security"
  type        = string
}

variable "internal_services_sg_id" {
  description = "Security group for all internal services — from module.security"
  type        = string
}

variable "alb_target_group_arn" {
  description = "ALB target group ARN for api-gateway — from module.alb"
  type        = string
}

variable "execution_role_arn" {
  description = "ECS task execution role ARN — from module.iam"
  type        = string
}

variable "task_role_arn" {
  description = "ECS task role ARN (application S3 access) — from module.iam"
  type        = string
}
