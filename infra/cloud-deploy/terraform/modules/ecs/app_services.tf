# ─────────────────────────────────────────────────────────────
# ECS Task Definitions — one per service
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "joblensai-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.execution_role_arn
  task_role_arn            = var.task_role_arn

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
          { name = "AUTH_URL", value = "auth.joblensai" },
          { name = "BACKEND_URL", value = "backend.joblensai" },
          { name = "AGENT_URL", value = "agent-service.joblensai" },
          { name = "PAYMENT_URL", value = "payment.joblensai" },
          { name = "NOTIFICATION_URL", value = "notification.joblensai" },
          { name = "FRONTEND_URL", value = "web.joblensai" },
          { name = "DNS_RESOLVER", value = "169.254.169.253" },
          { name = "MONGO_EXPRESS_URL", value = "mongo-express.joblensai" },
          { name = "KAFKA_UI_URL", value = "kafka-ui.joblensai" },
          { name = "REDIS_INSIGHT_URL", value = "redis-insight.joblensai" },
          { name = "MINIO_URL", value = "minio.joblensai" }
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
# ECS Services — one per microservice
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_service" "services" {
  for_each = var.services

  name            = "joblensai-${each.key}"
  cluster         = aws_ecs_cluster.joblensai_cluster.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  launch_type     = "FARGATE"
  desired_count   = 1

  dynamic "load_balancer" {
    for_each = each.key == "api-gateway" ? [1] : []
    content {
      target_group_arn = var.alb_target_group_arn
      container_name   = "api-gateway"
      container_port   = 80
    }
  }

  dynamic "service_registries" {
    for_each = each.key != "api-gateway" ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.services[each.key].arn
    }
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    assign_public_ip = true
    security_groups  = [each.key == "api-gateway" ? var.api_gateway_sg_id : var.internal_services_sg_id]
  }
}
