# Printed after every terraform apply.
# alb_dns_name → your app's public URL until you attach a custom domain

output "alb_dns_name" {
  description = "Public URL of your application"
  value       = module.ecsCluster.alb_dns_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecsCluster.cluster_name
}
