output "repo_urls" {
  description = "Map of service name to ECR repository URL"
  value       = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}
