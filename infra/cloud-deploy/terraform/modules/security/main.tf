# ─────────────────────────────────────────────────────────────
# ALB SG — public facing, HTTP + HTTPS from internet
# ─────────────────────────────────────────────────────────────
resource "aws_security_group" "alb_sg" {
  name   = "${var.project_name}-alb-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-alb-sg" }
}

# ─────────────────────────────────────────────────────────────
# API Gateway SG — only accepts traffic from ALB
# nginx routes internally to other services
# ─────────────────────────────────────────────────────────────
resource "aws_security_group" "api_gateway_sg" {
  name   = "${var.project_name}-api-gateway-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-api-gateway-sg" }
}

# ─────────────────────────────────────────────────────────────
# Internal services SG — auth, backend, notification, payment, web
# Only accepts traffic from api-gateway, NOT from ALB directly
# ─────────────────────────────────────────────────────────────
resource "aws_security_group" "internal_services_sg" {
  name   = "${var.project_name}-internal-services-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.api_gateway_sg.id]
  }

  # Allow intra-SG traffic so services reach each other and mongo/redis/kafka
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-internal-services-sg" }
}