resource "aws_service_discovery_private_dns_namespace" "joblensai" {
  name        = "joblensai"
  description = "Cloud Map private DNS namespace for JobLens AI microservices"
  vpc         = var.vpc_id
}

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
