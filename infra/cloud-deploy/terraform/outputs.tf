# Printed after every terraform apply.
# alb_dns_name → your app's public URL until you attach a custom domain

output "alb_dns_name" {
  description = "Public URL of your application"
  value       = module.alb.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecsCluster.cluster_name
}

output "api_gateway_target_group_arn" {
  description = "ARN of the API Gateway target group"
  value       = module.alb.api_gateway_target_group_arn
}
