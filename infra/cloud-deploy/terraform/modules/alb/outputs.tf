output "alb_dns_name" {
  description = "Public DNS name of the ALB — use this to hit your api-gateway"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the ALB"
  value       = aws_lb.main.arn
}

output "api_gateway_target_group_arn" {
  description = "Target group ARN — passed to ECS api-gateway service"
  value       = aws_lb_target_group.api_gateway.arn
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}