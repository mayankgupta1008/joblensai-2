resource "aws_ecr_repository" "joblensai_ecr" {
  name = var.ecr_repo_name
}
