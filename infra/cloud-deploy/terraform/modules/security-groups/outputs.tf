# alb_sg_id       → used by alb module
# ecs_tasks_sg_id → used by ecs-service module
# infra_sg_id     → used by ecs-service module for MongoDB, Redis, Kafka, MinIO tasks

output "alb_sg_id" {
  description = "Security group ID for the ALB"
  value       = aws_security_group.alb.id
}

output "ecs_tasks_sg_id" {
  description = "Security group ID for ECS tasks"
  value       = aws_security_group.ecs_tasks.id
}

output "infra_sg_id" {
  description = "Security group ID for infra services"
  value       = aws_security_group.infra.id
}
