# alb_arn        → used by ecs-service module to register tasks with the ALB
# alb_dns_name   → printed after terraform apply, this is your app's public URL
# *_tg_arn       → each ecs-service needs its target group ARN to register tasks

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "Public DNS name of the ALB — your app's entry point"
  value       = aws_lb.main.dns_name
}

output "http_listener_arn" {
  description = "ARN of the HTTP listener"
  value       = aws_lb_listener.http.arn
}

output "web_tg_arn" {
  description = "Target group ARN for web service"
  value       = aws_lb_target_group.web.arn
}

output "auth_tg_arn" {
  description = "Target group ARN for auth service"
  value       = aws_lb_target_group.auth.arn
}

output "backend_tg_arn" {
  description = "Target group ARN for backend service"
  value       = aws_lb_target_group.backend.arn
}

output "payment_tg_arn" {
  description = "Target group ARN for payment service"
  value       = aws_lb_target_group.payment.arn
}

output "notification_tg_arn" {
  description = "Target group ARN for notification service"
  value       = aws_lb_target_group.notification.arn
}

output "agent_tg_arn" {
  description = "Target group ARN for agent service"
  value       = aws_lb_target_group.agent.arn
}
