# ---------------------------------------------------------------
# Application Load Balancer
# Lives in public subnets — receives all internet traffic.
# internal = false → internet-facing (has a public DNS name)
# load_balancer_type = "application" → ALB (vs NLB for TCP)
# ---------------------------------------------------------------
resource "aws_lb" "main" {
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  # Protects against accidental deletion via Terraform
  enable_deletion_protection = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Target Groups (one per microservice)
# A target group = a pool of ECS tasks that can receive traffic.
# ALB forwards requests to a target group, which picks a healthy task.
#
# port = the port your container listens on
# protocol = HTTP (ALB handles HTTPS termination, internal is HTTP)
# target_type = "ip" → required for ECS tasks in awsvpc network mode
#
# health_check → ALB pings this endpoint every 30s.
# If task returns non-200, ALB stops sending traffic to it.
# ECS then replaces the unhealthy task.
# ---------------------------------------------------------------
resource "aws_lb_target_group" "web" {
  name        = "${var.project_name}-${var.environment}-web-tg"
  port        = 5173
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "auth" {
  name        = "${var.project_name}-${var.environment}-auth-tg"
  port        = 5003
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/auth/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.project_name}-${var.environment}-backend-tg"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/backend/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "payment" {
  name        = "${var.project_name}-${var.environment}-payment-tg"
  port        = 3004
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/payment/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "notification" {
  name        = "${var.project_name}-${var.environment}-notif-tg"
  port        = 5005
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/notification/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

resource "aws_lb_target_group" "agent" {
  name        = "${var.project_name}-${var.environment}-agent-tg"
  port        = 5002
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/agent/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
    timeout             = 5
    matcher             = "200-299"
  }

  tags = { Environment = var.environment }
}

# ---------------------------------------------------------------
# HTTP Listener (port 80)
# The ALB "ear" — listens for incoming HTTP traffic.
# Contains routing rules that map URL paths to target groups.
# Rules are evaluated top to bottom by priority (lower = first).
# Default action = web frontend (catches everything not matched).
# ---------------------------------------------------------------
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  # Default rule — any request not matched by rules below goes to web
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# ---------------------------------------------------------------
# Listener Rules — path-based routing
# Each rule matches a URL path prefix and forwards to a target group.
# priority → order of evaluation (lower number = checked first)
# condition → what path pattern triggers this rule
# action    → forward to which target group
# ---------------------------------------------------------------
resource "aws_lb_listener_rule" "auth" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  condition {
    path_pattern {
      values = ["/api/auth/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auth.arn
  }
}

resource "aws_lb_listener_rule" "backend" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 20

  condition {
    path_pattern {
      values = ["/api/backend/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_lb_listener_rule" "payment" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 30

  condition {
    path_pattern {
      values = ["/api/payment/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment.arn
  }
}

resource "aws_lb_listener_rule" "notification" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 40

  condition {
    path_pattern {
      values = ["/api/notification/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.notification.arn
  }
}

resource "aws_lb_listener_rule" "agent" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 50

  condition {
    path_pattern {
      values = ["/api/agent/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.agent.arn
  }
}
