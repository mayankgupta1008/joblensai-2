# These outputs are consumed by other modules:
# - vpc_id           → security-groups, alb, ecs-cluster modules
# - public_subnet_ids  → alb module (ALB lives in public subnets)
# - private_subnet_ids → ecs-cluster, ecs-service modules (tasks live in private subnets)

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}
