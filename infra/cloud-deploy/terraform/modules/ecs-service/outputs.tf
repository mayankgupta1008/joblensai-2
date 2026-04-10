# service_name → used by CI/CD deploy script to target the right service
# task_definition_arn → useful for debugging, checking current deployed version
# task_role_arn → if you need to add more IAM permissions to a specific service

output "service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "task_definition_arn" {
  description = "ARN of the latest task definition"
  value       = aws_ecs_task_definition.main.arn
}

output "task_role_arn" {
  description = "ARN of the task IAM role (container's runtime role)"
  value       = aws_iam_role.task.arn
}

output "task_execution_role_arn" {
  description = "ARN of the task execution IAM role"
  value       = aws_iam_role.task_execution.arn
}
