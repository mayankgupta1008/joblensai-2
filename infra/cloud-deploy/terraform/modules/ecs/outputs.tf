output "alb_dns_name" {
  value = aws_alb.application_load_balancer.dns_name
}

output "cluster_name" {
  value = aws_ecs_cluster.joblensai_cluster.name
}
