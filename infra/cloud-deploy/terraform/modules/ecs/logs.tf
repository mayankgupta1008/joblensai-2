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
