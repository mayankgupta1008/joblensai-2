# ─────────────────────────────────────────────────────────────
# ECS Cluster
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "joblensai_cluster" {
  name = var.cluster_name
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

# Cloud Map registration perms for ECS deployment v2 lifecycle hooks
# (PRE_SCALE_UP / RECONCILE_SERVICE). Service-linked role policy can lag;
# attaching explicitly avoids "Invalid Cloud Map permissions" rollbacks.
resource "aws_iam_role_policy" "ecs_task_execution_servicediscovery" {
  role = aws_iam_role.ecs_task_execution_role.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "servicediscovery:RegisterInstance",
        "servicediscovery:DeregisterInstance",
        "servicediscovery:DiscoverInstances",
        "servicediscovery:Get*",
        "servicediscovery:List*",
        "servicediscovery:UpdateInstanceCustomHealthStatus",
        "route53:GetHealthCheck",
        "route53:CreateHealthCheck",
        "route53:UpdateHealthCheck",
        "route53:ChangeResourceRecordSets",
        "route53:DeleteHealthCheck"
      ]
      Resource = "*"
    }]
  })
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

resource "aws_cloudwatch_log_group" "kafka" {
  name              = "/ecs/joblensai-kafka"
  retention_in_days = 7
}

# ─────────────────────────────────────────────────────────────
# Cloud Map Service Discovery Namespace (private DNS)
# Creates Route53 private hosted zone "joblensai" so internal
# services resolve via real A records (auth.joblensai → task IP).
# Replaces ECS Service Connect — needed because nginx OSS resolver
# uses VPC DNS, not the Envoy-injected /etc/hosts entries that SC
# would populate.
# ─────────────────────────────────────────────────────────────
resource "aws_service_discovery_private_dns_namespace" "joblensai" {
  name        = "joblensai"
  description = "Cloud Map private DNS namespace for JobLens AI microservices"
  vpc         = aws_default_vpc.default_vpc.id
}

# ─────────────────────────────────────────────────────────────
# Cloud Map Service Discovery — one DNS service per microservice
# (excluding api-gateway, which is only a client). Each registers
# an A record like auth.joblensai → <task IP>. Multiple tasks
# produce multivalue answers.
# ─────────────────────────────────────────────────────────────
resource "aws_service_discovery_service" "services" {
  for_each = { for k, v in var.services : k => v if k != "api-gateway" }

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.joblensai.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "mongodb" {
  name = "mongodb"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.joblensai.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "redis" {
  name = "redis"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.joblensai.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
}

resource "aws_service_discovery_service" "kafka" {
  name = "kafka"

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.joblensai.id
    dns_records {
      ttl  = 10
      type = "A"
    }
    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }
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
    path                = "/health"
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

  # Cloud Map registration: register each internal service so its task IP
  # is published as a Route53 A record (e.g. auth.joblensai → 172.x.x.x).
  # api-gateway is the only client and is not registered.
  dynamic "service_registries" {
    for_each = each.key != "api-gateway" ? [1] : []
    content {
      registry_arn = aws_service_discovery_service.services[each.key].arn
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

  service_registries {
    registry_arn = aws_service_discovery_service.mongodb.arn
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

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
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
# Kafka — self-hosted, internal only (Service Connect: kafka:9092)
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "kafka" {
  family                   = "joblensai-kafka"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name      = "kafka"
      image     = "apache/kafka:latest"
      essential = true

      portMappings = [
        {
          containerPort = 9092
          hostPort      = 9092
          name          = "kafka"
          protocol      = "tcp"
        },
        {
          containerPort = 9093
          hostPort      = 9093
          name          = "kafka-controller"
          protocol      = "tcp"
        }
      ]

      cpu    = 512
      memory = 1024

      environment = [
        { name = "KAFKA_NODE_ID", value = "1" },
        { name = "KAFKA_PROCESS_ROLES", value = "controller,broker" },
        { name = "KAFKA_CONTROLLER_QUORUM_VOTERS", value = "1@localhost:9093" },
        { name = "KAFKA_LISTENERS", value = "PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093" },
        { name = "KAFKA_ADVERTISED_LISTENERS", value = "PLAINTEXT://kafka.joblensai:9092" },
        { name = "KAFKA_LISTENER_SECURITY_PROTOCOL_MAP", value = "PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT" },
        { name = "KAFKA_INTER_BROKER_LISTENER_NAME", value = "PLAINTEXT" },
        { name = "KAFKA_CONTROLLER_LISTENER_NAMES", value = "CONTROLLER" },
        { name = "KAFKA_LOG_DIRS", value = "/var/lib/kafka/data" },
        { name = "KAFKA_AUTO_CREATE_TOPICS_ENABLE", value = "true" },
        { name = "KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR", value = "1" },
        { name = "KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR", value = "1" },
        { name = "KAFKA_TRANSACTION_STATE_LOG_MIN_ISR", value = "1" },
        { name = "KAFKA_LOG_RETENTION_HOURS", value = "168" },
        { name = "KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS", value = "0" },
        { name = "CLUSTER_ID", value = var.kafka_cluster_id },
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/joblensai-kafka"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  depends_on = [aws_cloudwatch_log_group.kafka]
}

resource "aws_ecs_service" "kafka" {
  name            = "joblensai-kafka"
  cluster         = aws_ecs_cluster.joblensai_cluster.id
  task_definition = aws_ecs_task_definition.kafka.arn
  launch_type     = "FARGATE"
  desired_count   = 1

  service_registries {
    registry_arn = aws_service_discovery_service.kafka.arn
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
