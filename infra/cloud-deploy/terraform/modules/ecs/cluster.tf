resource "aws_ecs_cluster" "joblensai_cluster" {
  name = var.cluster_name
}
