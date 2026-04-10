# ---------------------------------------------------------------
# IAM Task Execution Role
# Used by the ECS AGENT (not your container) to:
#   - Pull the Docker image from ECR
#   - Fetch secrets from SSM Parameter Store
#   - Write container logs to CloudWatch
# Every service gets its own role for least-privilege.
# ---------------------------------------------------------------
resource "aws_iam_role" "task_execution" {
  name = "${var.project_name}-${var.environment}-${var.service_name}-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = { Environment = var.environment }
}

# Attach AWS managed policy — covers ECR pull + CloudWatch logs
resource "aws_iam_role_policy_attachment" "task_execution" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Extra policy — allows fetching SecureString secrets from SSM Parameter Store
# The managed policy above does NOT include SSM access
resource "aws_iam_role_policy" "task_execution_ssm" {
  name = "${var.project_name}-${var.environment}-${var.service_name}-ssm-policy"
  role = aws_iam_role.task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameters",
        "ssm:GetParameter",
        "kms:Decrypt"
      ]
      Resource = "*"
    }]
  })
}

# ---------------------------------------------------------------
# IAM Task Role
# Used by YOUR CONTAINER while it is running.
# This is the role process.env.AWS_* credentials inside the container point to.
# Add permissions here when your app needs to access S3, SES, etc.
# ---------------------------------------------------------------
resource "aws_iam_role" "task" {
  name = "${var.project_name}-${var.environment}-${var.service_name}-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })

  tags = { Environment = var.environment }
}

# S3 access — for MinIO replacement / file uploads (agent-service, backend)
resource "aws_iam_role_policy" "task_s3" {
  name = "${var.project_name}-${var.environment}-${var.service_name}-s3-policy"
  role = aws_iam_role.task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = "*"
    }]
  })
}

# ---------------------------------------------------------------
# ECS Task Definition
# The blueprint for a running container.
#
# network_mode = "awsvpc" → each task gets its own ENI + IP
#                           same concept as K8s pod networking
#                           required for ALB target_type = "ip"
#
# requires_compatibilities = ["EC2"] → runs on EC2, not Fargate
#
# cpu/memory → total resources for the task
#              container can use up to this amount
#
# container_definitions → JSON array describing the container:
#   - image: full ECR URI
#   - portMappings: which port to expose
#   - environment: non-sensitive env vars (plain key/value)
#   - secrets: sensitive env vars fetched from SSM at startup
#   - logConfiguration: sends stdout/stderr to CloudWatch
# ---------------------------------------------------------------
resource "aws_ecs_task_definition" "main" {
  family                   = "${var.project_name}-${var.environment}-${var.service_name}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_execution.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([{
    name      = var.service_name
    image     = var.container_image
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    # Non-sensitive env vars passed directly
    environment = var.environment_variables

    # Sensitive env vars — ECS fetches from SSM at container startup
    # Container sees them as normal env vars (e.g. process.env.JWT_SECRET)
    secrets = var.secrets

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = var.log_group_name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = var.service_name
      }
    }
  }])

  tags = { Environment = var.environment }
}

# ---------------------------------------------------------------
# ECS Service
# Ensures the desired number of task instances are always running.
# Handles: task placement, rolling deploys, health checks, scaling.
#
# desired_count → how many task copies to run (usually 1 for dev/learning)
#
# capacity_provider_strategy → use our EC2 capacity provider
#   weight = 100 → use this provider for 100% of tasks
#   base = 1    → always place at least 1 task via this provider
#
# network_configuration → awsvpc mode requires explicit subnet + SG
#   assign_public_ip = false → tasks are in private subnets, use NAT
#
# deployment_minimum_healthy_percent = 50 → during rolling deploy,
#   keep at least 50% of tasks running (zero-downtime deploys)
# deployment_maximum_percent = 200 → can run 200% temporarily
#   (new tasks start before old ones stop)
#
# load_balancer block → only created when enable_load_balancer = true
#   registers tasks with ALB target group so ALB can route to them
# ---------------------------------------------------------------
resource "aws_ecs_service" "main" {
  name            = "${var.project_name}-${var.environment}-${var.service_name}"
  cluster         = var.cluster_id
  task_definition = aws_ecs_task_definition.main.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = var.capacity_provider_name
    weight            = 100
    base              = 1
  }

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.security_group_id]
    assign_public_ip = false
  }

  deployment_minimum_healthy_percent = 50
  deployment_maximum_percent         = 200

  # Only attach to ALB if this service has a load balancer (not infra services)
  dynamic "load_balancer" {
    for_each = var.enable_load_balancer ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
  }

  # Ignore task_definition changes from outside Terraform (e.g. CI/CD deploys)
  # CI/CD updates the image tag → ECS updates the task definition
  # Without this, next terraform apply would revert to the old image tag
  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  tags = { Environment = var.environment }
}
