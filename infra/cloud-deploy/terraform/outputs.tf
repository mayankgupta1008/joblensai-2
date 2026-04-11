# Printed after every terraform apply.
# alb_dns_name → your app's public URL until you attach a custom domain

output "alb_dns_name" {
  description = "Public URL of your application"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs_cluster.cluster_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for all ECS tasks"
  value       = module.ecs_cluster.log_group_name
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}
