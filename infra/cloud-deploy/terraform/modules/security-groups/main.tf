# ---------------------------------------------------------------
# ALB Security Group
# The load balancer is the only thing exposed to the internet.
# Accepts HTTP (80) and HTTPS (443) from anywhere.
# All outbound allowed so it can forward traffic to ECS tasks.
# ---------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# ECS Tasks Security Group
# Your microservices run here.
# Inbound: ONLY from ALB — not directly from internet.
# Outbound: all allowed — needs to reach ECR (pull images),
#           infra services (MongoDB, Redis, Kafka), external APIs.
# ---------------------------------------------------------------
resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
  description = "Security group for ECS tasks (microservices)"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic only from ALB"
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-tasks-sg"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Infrastructure Security Group
# MongoDB, Redis, Kafka, MinIO run under this.
# Inbound: ONLY from ECS tasks — never from internet.
# Each service port is explicitly allowed for clarity.
# Outbound: all allowed.
# ---------------------------------------------------------------
resource "aws_security_group" "infra" {
  name        = "${var.project_name}-${var.environment}-infra-sg"
  description = "Security group for self-hosted infra (MongoDB, Redis, Kafka, MinIO)"
  vpc_id      = var.vpc_id

  ingress {
    description     = "MongoDB"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "Redis"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "Kafka broker"
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  ingress {
    description     = "MinIO API"
    from_port       = 9000
    to_port         = 9000
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-infra-sg"
    Environment = var.environment
  }
}
