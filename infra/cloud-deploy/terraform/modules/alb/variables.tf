variable "alb_name" {
  description = "Name of the Application Load Balancer"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID from vpc module"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs from vpc module — ALB lives here"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "ALB security group ID from security module"
  type        = string
}