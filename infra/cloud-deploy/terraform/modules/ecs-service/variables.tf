variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region (used for CloudWatch log config)"
  type        = string
}

variable "service_name" {
  description = "Name of the service (e.g. auth, backend, web)"
  type        = string
}

variable "cluster_id" {
  description = "ID of the ECS cluster"
  type        = string
}

variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets where tasks will run"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID to attach to tasks (ecs_tasks_sg or infra_sg)"
  type        = string
}

variable "container_image" {
  description = "Full ECR image URI including tag (e.g. 123456.dkr.ecr.ap-south-1.amazonaws.com/joblensai-auth:latest)"
  type        = string
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
}

variable "cpu" {
  description = "Task CPU units (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Task memory in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Number of task instances to run"
  type        = number
  default     = 1
}

variable "environment_variables" {
  description = "Non-sensitive environment variables for the container"
  type = list(object({
    name  = string
    value = string
  }))
  default = []
}

variable "secrets" {
  description = "Sensitive env vars fetched from SSM Parameter Store at container startup"
  type = list(object({
    name      = string
    valueFrom = string
  }))
  default = []
}

variable "capacity_provider_name" {
  description = "Name of the ECS capacity provider (from ecs-cluster module)"
  type        = string
}

variable "log_group_name" {
  description = "CloudWatch log group name (from ecs-cluster module)"
  type        = string
}

variable "enable_load_balancer" {
  description = "Whether to attach this service to an ALB target group. False for infra services (MongoDB, Redis, Kafka)."
  type        = bool
  default     = true
}

variable "target_group_arn" {
  description = "ALB target group ARN. Required when enable_load_balancer = true."
  type        = string
  default     = ""
}
