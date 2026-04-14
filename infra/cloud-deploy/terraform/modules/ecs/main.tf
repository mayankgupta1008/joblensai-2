# ─────────────────────────────────────────────────────────────
# ECS Cluster
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "joblensai_cluster" {
  name = var.cluster_name
}

# ─────────────────────────────────────────────────────────────
# Default VPC + Subnets
# ─────────────────────────────────────────────────────────────
resource "aws_default_vpc" "default_vpc" {}

resource "aws_default_subnet" "default_subnet_a" {
  availability_zone = var.availability_zones[0]
}

resource "aws_default_subnet" "default_subnet_b" {
  availability_zone = var.availability_zones[1]
}

resource "aws_default_subnet" "default_subnet_c" {
  availability_zone = var.availability_zones[2]
}

# ─────────────────────────────────────────────────────────────
# IAM — Execution Role (ECS agent: pull images, write logs)
# ─────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = var.ecs_task_execution_role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ─────────────────────────────────────────────────────────────
# IAM — Task Role (application code: S3, etc.)
# Attached to running containers so the AWS SDK picks up credentials
# automatically — no static AWS_ACCESS_KEY_ID/SECRET needed.
# ─────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_role" {
  name               = "${var.cluster_name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_s3" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# ─────────────────────────────────────────────────────────────
# CloudWatch Log Groups — one per service (7-day retention)
# ─────────────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "services" {
  for_each          = var.services
  name              = "/ecs/joblensai-${each.key}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "mongodb" {
  name              = "/ecs/joblensai-mongodb"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/ecs/joblensai-redis"
  retention_in_days = 7
}

# ─────────────────────────────────────────────────────────────
# ECS Service Connect Namespace
# Allows services to reach each other by name, e.g. http://auth:5003
# ─────────────────────────────────────────────────────────────
resource "aws_service_discovery_http_namespace" "joblensai" {
  name        = "joblensai"
  description = "ECS Service Connect namespace for JobLens AI microservices"
}

# ─────────────────────────────────────────────────────────────
# ECS Task Definitions — one per service
#
# Environment variable strategy:
#   api-gateway → routing vars only (DNS names for Service Connect)
#   web         → none (static Nginx, env vars unused at runtime)
#   all others  → full credentials map from terraform.tfvars
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "joblensai-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = var.ecr_repo_urls[each.key]
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          name          = each.key
          protocol      = "tcp"
        }
      ]

      memory = 512
      cpu    = 256

      environment = (
        each.key == "api-gateway" ? [
          { name = "AUTH_URL",         value = "auth" },
          { name = "BACKEND_URL",      value = "backend" },
          { name = "AGENT_URL",        value = "agent-service" },
          { name = "PAYMENT_URL",      value = "payment" },
          { name = "NOTIFICATION_URL", value = "notification" },
          { name = "FRONTEND_URL",     value = "web" },
          { name = "DNS_RESOLVER",     value = "169.254.169.253" }
        ] : each.key == "web" ? [] : [
          for k, v in var.credentials : { name = k, value = v }
        ]
      )

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/joblensai-${each.key}"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  depends_on = [aws_cloudwatch_log_group.services]
}

# ─────────────────────────────────────────────────────────────
# ALB — api-gateway is the only public entry point
# All traffic goes to Nginx, which routes internally via Service Connect
# ─────────────────────────────────────────────────────────────
resource "aws_alb" "application_load_balancer" {
  name               = var.alb_name
  load_balancer_type = "application"
  subnets = [
    aws_default_subnet.default_subnet_a.id,
    aws_default_subnet.default_subnet_b.id,
    aws_default_subnet.default_subnet_c.id,
  ]
  security_groups = [aws_security_group.load_balancer_security_group.id]
}

resource "aws_security_group" "load_balancer_security_group" {
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb_target_group" "api_gateway" {
  name        = "joblensai-api-gateway-tg"
  port        = 80
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_default_vpc.default_vpc.id

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    matcher             = "200-399"
  }
}

resource "aws_lb_listener" "listener" {
  load_balancer_arn = aws_alb.application_load_balancer.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_gateway.arn
  }
}

# ─────────────────────────────────────────────────────────────
# Security Groups
# ─────────────────────────────────────────────────────────────
resource "aws_security_group" "service_security_group" {
  # Allow traffic from the ALB (reaches api-gateway)
  ingress {
    from_port       = 0
    to_port         = 0
    protocol        = "-1"
    security_groups = [aws_security_group.load_balancer_security_group.id]
  }

  # Allow all intra-service traffic for Service Connect
  ingress {
    from_port = 0
    to_port   = 0
    protocol  = "-1"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─────────────────────────────────────────────────────────────
# ECS Services — one per microservice
# Only api-gateway attaches to the ALB; all others are internal
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = "joblensai-${each.key}"
  cluster         = aws_ecs_cluster.joblensai_cluster.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  launch_type     = "FARGATE"
  desired_count   = 1

  # Only api-gateway is wired to the ALB target group
  dynamic "load_balancer" {
    for_each = each.key == "api-gateway" ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.api_gateway.arn
      container_name   = "api-gateway"
      container_port   = 80
    }
  }

  # Service Connect: registers each internal service in the namespace so
  # api-gateway can reach them by DNS name (e.g. http://auth:5003)
  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.joblensai.arn

    dynamic "service" {
      for_each = each.key != "api-gateway" ? [1] : []
      content {
        port_name      = each.key
        discovery_name = each.key
        client_alias {
          port = each.value.port
        }
      }
    }
  }

  network_configuration {
    subnets = [
      aws_default_subnet.default_subnet_a.id,
      aws_default_subnet.default_subnet_b.id,
      aws_default_subnet.default_subnet_c.id,
    ]
    assign_public_ip = true
    security_groups  = [aws_security_group.service_security_group.id]
  }

  depends_on = [aws_lb_listener.listener]
}

# ─────────────────────────────────────────────────────────────
# MongoDB — self-hosted, internal only (Service Connect: mongodb:27017)
# ⚠️  No EFS attached — data is ephemeral across task restarts.
#     Use MongoDB Atlas for persistent production data.
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "mongodb" {
  family                   = "joblensai-mongodb"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "mongodb"
      image     = "mongo:7"
      essential = true

      portMappings = [
        {
          containerPort = 27017
          hostPort      = 27017
          name          = "mongodb"
          protocol      = "tcp"
        }
      ]

      cpu    = 512
      memory = 1024

      environment = [
        { name = "MONGO_INITDB_ROOT_USERNAME", value = var.mongo_root_username },
        { name = "MONGO_INITDB_ROOT_PASSWORD", value = var.mongo_root_password }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/joblensai-mongodb"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  depends_on = [aws_cloudwatch_log_group.mongodb]
}

resource "aws_ecs_service" "mongodb" {
  name            = "joblensai-mongodb"
  cluster         = aws_ecs_cluster.joblensai_cluster.id
  task_definition = aws_ecs_task_definition.mongodb.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.joblensai.arn

    service {
      port_name      = "mongodb"
      discovery_name = "mongodb"
      client_alias {
        port = 27017
      }
    }
  }

  network_configuration {
    subnets = [
      aws_default_subnet.default_subnet_a.id,
      aws_default_subnet.default_subnet_b.id,
      aws_default_subnet.default_subnet_c.id,
    ]
    assign_public_ip = true
    security_groups  = [aws_security_group.service_security_group.id]
  }
}

# ─────────────────────────────────────────────────────────────
# Redis — self-hosted, internal only (Service Connect: redis:6379)
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "redis" {
  family                   = "joblensai-redis"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "redis"
      image     = "redis:7-alpine"
      essential = true

      portMappings = [
        {
          containerPort = 6379
          hostPort      = 6379
          name          = "redis"
          protocol      = "tcp"
        }
      ]

      cpu    = 256
      memory = 512

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/joblensai-redis"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  depends_on = [aws_cloudwatch_log_group.redis]
}

resource "aws_ecs_service" "redis" {
  name            = "joblensai-redis"
  cluster         = aws_ecs_cluster.joblensai_cluster.id
  task_definition = aws_ecs_task_definition.redis.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  service_connect_configuration {
    enabled   = true
    namespace = aws_service_discovery_http_namespace.joblensai.arn

    service {
      port_name      = "redis"
      discovery_name = "redis"
      client_alias {
        port = 6379
      }
    }
  }

  network_configuration {
    subnets = [
      aws_default_subnet.default_subnet_a.id,
      aws_default_subnet.default_subnet_b.id,
      aws_default_subnet.default_subnet_c.id,
    ]
    assign_public_ip = true
    security_groups  = [aws_security_group.service_security_group.id]
  }
}
