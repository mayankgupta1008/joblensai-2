terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

module "tf_state" {
  source      = "./modules/tf-state"
  bucket_name = local.bucket_name
  table_name  = local.table_name
}

module "ecrRepo" {
  source        = "./modules/ecr"
  ecr_repo_name = local.ecr_repo_name
}

module "ecsCluster" {
  source = "./modules/ecs"

  cluster_name                 = local.joblensiai_cluster_name
  availability_zone            = local.availability_zones
  joblensai_task_family        = local.joblensai_task_family
  joblensai_task_name          = local.joblensai_task_name
  ecr_repo_url                 = module.ecrRepo.repo_url
  container_port               = local.container_port
  ecs_task_execution_role_name = local.ecs_task_execution_role_name
  application_load_balancer    = local.application_load_balancer_name
  target_group_name            = local.target_group_name
  joblensai_service_name       = local.joblensai_service_name
}
