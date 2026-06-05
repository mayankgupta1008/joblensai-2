output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

# Public subnet IDs — consumed by the ALB module.
output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

# Private subnet IDs — consumed by the ECS service network_configuration
# and the EC2 Auto Scaling group.
output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.nat[*].id
}
