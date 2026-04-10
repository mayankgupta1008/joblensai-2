# ---------------------------------------------------------------
# ECS Cluster
# A logical grouping of EC2 instances and tasks.
# Just a name — the real work happens in the capacity provider.
# container_insights → enables CloudWatch metrics per service/task
# ---------------------------------------------------------------
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# CloudWatch Log Group
# All container logs from every ECS task go here.
# retention_in_days = 30 → logs older than 30 days auto-deleted (cost saving)
# ---------------------------------------------------------------
resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.environment}"
  retention_in_days = 30

  tags = {
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Latest ECS-Optimised AMI (Amazon Linux 2)
# Instead of hardcoding an AMI ID (which changes per region and expires),
# we fetch the latest one from AWS SSM Parameter Store at apply time.
# This ensures EC2 instances always have the latest ECS agent pre-installed.
# ---------------------------------------------------------------
data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

# ---------------------------------------------------------------
# IAM Role for EC2 Instances
# EC2 instances need permission to:
#   - Register themselves with the ECS cluster
#   - Pull Docker images from ECR
#   - Send logs to CloudWatch
#   - Report metrics to CloudWatch
# We attach AWS's managed policy which covers all of this.
# ---------------------------------------------------------------
resource "aws_iam_role" "ecs_instance" {
  name = "${var.project_name}-${var.environment}-ecs-instance-role"

  # Trust policy — allows EC2 service to assume this role
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })

  tags = { Environment = var.environment }
}

resource "aws_iam_role_policy_attachment" "ecs_instance" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

# Instance Profile — the wrapper that attaches the IAM role to an EC2 instance
# You attach a profile, not a role directly, to EC2
resource "aws_iam_instance_profile" "ecs_instance" {
  name = "${var.project_name}-${var.environment}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance.name
}

# ---------------------------------------------------------------
# EC2 Security Group
# For the EC2 instances in the ASG (not the ECS tasks).
# In awsvpc network mode, tasks get their own ENI and security group.
# EC2 instances just need:
#   - Inbound within VPC (ECS agent internal communication)
#   - All outbound (reach ECR, CloudWatch, ECS endpoints via NAT)
# ---------------------------------------------------------------
resource "aws_security_group" "ec2_instances" {
  name        = "${var.project_name}-${var.environment}-ec2-sg"
  description = "Security group for ECS EC2 container instances"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow all traffic within VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-sg"
    Environment = var.environment
  }
}

# ---------------------------------------------------------------
# Launch Template
# A blueprint for every EC2 instance the ASG creates.
# image_id      → the ECS-optimized AMI fetched above
# instance_type → from variables (default t3.medium)
# user_data     → runs on first boot, registers instance with ECS cluster
#                 ECS_CLUSTER tells the ECS agent which cluster to join
#                 ECS_ENABLE_CONTAINER_METADATA enables task metadata endpoint
# ---------------------------------------------------------------
resource "aws_launch_template" "ecs" {
  name_prefix   = "${var.project_name}-${var.environment}-ecs-"
  image_id      = data.aws_ssm_parameter.ecs_ami.value
  instance_type = var.instance_type

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_instance.name
  }

  vpc_security_group_ids = [aws_security_group.ec2_instances.id]

  # base64encode required — EC2 expects user data as base64
  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
    echo ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-${var.environment}-ecs-instance"
      Environment = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ---------------------------------------------------------------
# Auto Scaling Group
# Manages the pool of EC2 instances.
# min_size        → never go below this (high availability floor)
# max_size        → never exceed this (cost ceiling)
# desired_capacity → start with this many instances
# AmazonECSManaged tag → REQUIRED for ECS capacity provider to work
#                        tells ECS it can manage this ASG
# ---------------------------------------------------------------
resource "aws_autoscaling_group" "ecs" {
  name                = "${var.project_name}-${var.environment}-ecs-asg"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = var.min_size
  max_size            = var.max_size
  desired_capacity    = var.desired_capacity

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  # Protects instances with running tasks from being terminated during scale-in
  protect_from_scale_in = true

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-${var.environment}-ecs-instance"
    propagate_at_launch = true
  }

  lifecycle {
    ignore_changes = [desired_capacity]
  }
}

# ---------------------------------------------------------------
# ECS Capacity Provider
# Links the ASG to the ECS cluster.
# This is what enables cluster autoscaling:
#   - ECS needs to run more tasks → not enough EC2 capacity
#   - Capacity Provider triggers the ASG to launch more EC2s
#   - New EC2 registers with cluster → ECS places tasks on it
#
# target_capacity = 80 → keep EC2 utilisation at 80%
#                        leaves 20% headroom for new tasks to land instantly
# ---------------------------------------------------------------
resource "aws_ecs_capacity_provider" "main" {
  name = "${var.project_name}-${var.environment}-cp"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.ecs.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = 2
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 80
    }
  }
}

# Attaches the capacity provider to the cluster
# default_capacity_provider_strategy → all new tasks use this provider by default
resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = [aws_ecs_capacity_provider.main.name]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = aws_ecs_capacity_provider.main.name
  }
}
