locals {
  bucket_name   = "joblensai-terraform-state"
  table_name    = "joblensai-terraform-locks"
  ecr_repo_name = "joblensai-ecr"

  joblensiai_cluster_name      = "joblensai-cluster"
  availability_zones           = ["us-east-1a", "us-east-1b", "us-east-1c"]
  joblensai_task_family        = "joblensai-task"
  joblensai_task_name          = "joblensai-backend"
  container_port               = 5001
  ecs_task_execution_role_name = "joblensai-ecs-task-execution-role"
  application_load_balancer_name = "joblensai-alb"
  target_group_name            = "joblensai-tg"
  joblensai_service_name       = "joblensai-service"
}
