# ─────────────────────────────────────────────────────────────
# Application Load Balancer — public facing
# Lives in public subnets, api-gateway is the only target
# ─────────────────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = var.alb_name
  load_balancer_type = "application"
  subnets            = var.public_subnet_ids
  security_groups    = [var.alb_sg_id]

  tags = { Name = var.alb_name }
}

# ─────────────────────────────────────────────────────────────
# Target Group — points to api-gateway container (nginx)
# Only one TG needed since all traffic flows through api-gateway
# ─────────────────────────────────────────────────────────────
resource "aws_lb_target_group" "api_gateway" {
  name        = "${var.project_name}-api-gateway-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = var.vpc_id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    matcher             = "200-399"
  }

  tags = { Name = "${var.project_name}-api-gateway-tg" }
}

# ─────────────────────────────────────────────────────────────
# Listener — HTTP:80 redirects everything to HTTPS:443
# ─────────────────────────────────────────────────────────────
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      protocol    = "HTTPS"
      port        = "443"
      status_code = "HTTP_301"
    }
  }
}