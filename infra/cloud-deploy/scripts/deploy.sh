#!/bin/bash
set -e

# ---------------------------------------------------------------
# JobLens AI — Terraform Deploy Script
# Runs all Terraform commands inside Docker (no local installs needed).
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform"
BACKEND_FILE="$DIR/../terraform/backend.tf"
S3_BUCKET="joblensai-terraform-state"
REGION="${AWS_DEFAULT_REGION:-ap-south-1}"

# Credentials check
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "ERROR: AWS credentials not set. Export AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
  exit 1
fi

# tfvars check
TFVARS="$DIR/../terraform/terraform.tfvars"
if [ ! -f "$TFVARS" ] || grep -v "^#" "$TFVARS" | grep -q "CHANGE_ME"; then
  echo "ERROR: terraform.tfvars missing or contains CHANGE_ME values."
  exit 1
fi

# Helpers
run_tf() {
  echo -e "\n>>> terraform $*\n"
  "$TOOLBOX" bash -c "cd $TF_DIR && terraform $*"
}

bucket_exists() {
  "$TOOLBOX" aws s3api head-bucket --bucket "$S3_BUCKET" --region "$REGION" > /dev/null 2>&1
}

write_backend() {
  cat > "$BACKEND_FILE" << EOF
terraform {
  backend "s3" {
    bucket         = "$S3_BUCKET"
    key            = "terraform.tfstate"
    region         = "$REGION"
    dynamodb_table = "joblensai-terraform-locks"
    encrypt        = true
  }
}
EOF
}

smart_init() {
  if bucket_exists; then
    [ ! -f "$BACKEND_FILE" ] && { echo "  Migrating local state to S3..."; write_backend; "$TOOLBOX" bash -c "cd $TF_DIR && terraform init -migrate-state -force-copy -input=false"; } || run_tf init -input=false
  else
    rm -f "$BACKEND_FILE"
    run_tf init -input=false
  fi
}

migrate_after_apply() {
  if [ ! -f "$BACKEND_FILE" ]; then
    echo "  Migrating state to S3..."
    write_backend
    "$TOOLBOX" bash -c "cd $TF_DIR && terraform init -migrate-state -force-copy -input=false"
  fi
}

do_apply() {
  smart_init
  run_tf plan
  read -p "Apply plan? (yes/no): " CONFIRM
  if [ "$CONFIRM" = "yes" ]; then
    run_tf apply -target=module.ecrRepos -auto-approve || true
    "$DIR/push-images.sh"
    run_tf apply -auto-approve
    migrate_after_apply
    echo -e "\nDeploy complete. ALB URL:"
    run_tf output alb_dns_name
  else
    echo "Cancelled."
  fi
}

# Command router
COMMAND="${1:-all}"
case "$COMMAND" in
  init)    smart_init ;;
  plan)    smart_init; run_tf plan ;;
  apply)   do_apply ;;
  push)    "$DIR/push-images.sh" "${2:-}" ;;
  destroy)
    read -p "Type 'destroy' to confirm: " CONFIRM
    if [ "$CONFIRM" = "destroy" ]; then
      smart_init; run_tf destroy -auto-approve; rm -f "$BACKEND_FILE"
    else
      echo "Cancelled."
    fi
    ;;
  all)     do_apply ;;
  *)       echo "Usage: $0 [init|plan|apply|push|destroy|all]"; exit 1 ;;
esac
