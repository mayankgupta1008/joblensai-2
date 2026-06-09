# ─────────────────────────────────────────────────────────────
# MongoDB
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "mongodb" {
  family                   = "joblensai-mongodb"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.execution_role_arn

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
    subnets          = var.private_subnet_ids
    assign_public_ip = true
    security_groups  = [var.internal_services_sg_id]
  }
}

# ─────────────────────────────────────────────────────────────
# Redis
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "redis" {
  family                   = "joblensai-redis"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.execution_role_arn

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
    subnets          = var.private_subnet_ids
    assign_public_ip = true
    security_groups  = [var.internal_services_sg_id]
  }
}

# ─────────────────────────────────────────────────────────────
# Kafka
# ─────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "kafka" {
  family                   = "joblensai-kafka"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = var.execution_role_arn

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
    subnets          = var.private_subnet_ids
    assign_public_ip = true
    security_groups  = [var.internal_services_sg_id]
  }
}
