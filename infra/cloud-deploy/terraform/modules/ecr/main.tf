resource "aws_ecr_repository" "repos" {
  for_each     = toset(var.services)
  name         = "joblensai-${each.key}"
  force_delete = true
}
