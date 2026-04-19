variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "availability_zones" {
  description = "List of availability zones for default subnets (requires at least 3)"
  type        = list(string)
}

variable "ecs_task_execution_role_name" {
  description = "Name of the IAM role used by ECS to pull images and write logs"
  type        = string
}

variable "alb_name" {
  description = "Name of the Application Load Balancer"
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
