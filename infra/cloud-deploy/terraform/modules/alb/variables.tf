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

variable "domain_name" {
  description = "Root domain to serve the app on (e.g. joblensai.in)"
  type        = string
}

variable "route53_delegation_set_id" {
  description = "Reusable delegation set ID — fixes the zone's 4 nameservers across recreations. Empty = AWS assigns random NS."
  type        = string
  default     = ""
}