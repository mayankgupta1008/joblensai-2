variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "availability_zone" {
  description = "List of availability zones for default subnets (requires at least 3)"
  type        = list(string)
}

variable "joblensai_task_family" {
  description = "Family name for the ECS task definition"
  type        = string
}

variable "joblensai_task_name" {
  description = "Name of the container inside the ECS task definition"
  type        = string
}

variable "ecr_repo_url" {
  description = "ECR repository URL for the Docker image"
  type        = string
}

variable "container_port" {
  description = "Port exposed by the container and registered on the target group"
  type        = number
}

variable "ecs_task_execution_role_name" {
  description = "Name of the IAM role used by ECS to pull images and write logs"
  type        = string
}

variable "application_load_balancer" {
  description = "Name of the Application Load Balancer"
  type        = string
}

variable "target_group_name" {
  description = "Name of the ALB target group"
  type        = string
}

variable "joblensai_service_name" {
  description = "Name of the ECS service"
  type        = string
}
