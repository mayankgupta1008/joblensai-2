# ─────────────────────────────────────────────────────────────
# Execution Role — ECS agent: pull images, write logs
# ─────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_execution_role" {
  name               = var.ecs_task_execution_role_name
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

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
# Task Role — application code: S3, etc.
# ─────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_role" {
  name               = "${var.cluster_name}-task-role"
  assume_role_policy = data.aws_iam_policy_document.assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_s3" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}