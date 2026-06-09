# ─────────────────────────────────────────────────────────────
# ECS Module Entry Point
# ─────────────────────────────────────────────────────────────
# Resources are split into:
# - cluster.tf: ECS Cluster definition
# - logs.tf: CloudWatch log groups for all services
# - discovery.tf: Cloud Map Service Discovery (Private DNS)
# - app_services.tf: Microservices task definitions and services
# - infra_services.tf: MongoDB, Redis, and Kafka tasks/services
