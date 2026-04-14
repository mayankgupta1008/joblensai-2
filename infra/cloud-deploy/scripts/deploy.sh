#!/bin/bash
set -e

# ---------------------------------------------------------------
# JobLens AI — Terraform Deploy Script
# Runs all Terraform commands inside Docker (no local installs needed).
#
# Usage:
#   ./infra/cloud-deploy/scripts/deploy.sh           → init + plan + apply + push (full deploy)
#   ./infra/cloud-deploy/scripts/deploy.sh init      → only init
#   ./infra/cloud-deploy/scripts/deploy.sh plan      → only plan
#   ./infra/cloud-deploy/scripts/deploy.sh apply     → apply infra + push images
#   ./infra/cloud-deploy/scripts/deploy.sh push      → build + push Docker images to ECR
#   ./infra/cloud-deploy/scripts/deploy.sh push <svc>→ push a single service (e.g. push backend)
#   ./infra/cloud-deploy/scripts/deploy.sh destroy   → destroy all infrastructure (careful!)
#
# State management (automatic — no manual steps needed):
#   First run  → local state → apply creates S3 bucket → state auto-migrates to S3
#   After nuke → same as first run (S3 gone, detected automatically)
#   All others → S3 backend used directly
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform"
BACKEND_FILE="$DIR/../terraform/backend.tf"
S3_BUCKET="joblensai-terraform-state"
TF_REGION="ap-south-1"

# ---------------------------------------------------------------
# Check AWS credentials are exported in the current shell.
# Never stored on disk — only passed as env vars into the container.
# ---------------------------------------------------------------
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo ""
  echo "ERROR: AWS credentials not set."
  echo ""
  echo "Export them first:"
  echo "  export AWS_ACCESS_KEY_ID=your_key"
  echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
  echo ""
  exit 1
fi

# ---------------------------------------------------------------
# Check terraform.tfvars exists and has no CHANGE_ME values left
# ---------------------------------------------------------------
TFVARS="$DIR/../terraform/terraform.tfvars"
if [ ! -f "$TFVARS" ]; then
  echo ""
  echo "ERROR: terraform.tfvars not found."
  echo "Copy the example and fill in your values:"
  echo "  cp $TF_DIR/terraform.tfvars.example $TF_DIR/terraform.tfvars"
  echo ""
  exit 1
fi

if grep -v "^#" "$TFVARS" | grep -q "CHANGE_ME"; then
  echo ""
  echo "ERROR: terraform.tfvars still has CHANGE_ME values."
  echo "Fill in all secrets before deploying."
  echo ""
  grep -n "CHANGE_ME" "$TFVARS"
  echo ""
  exit 1
fi

# ---------------------------------------------------------------
# Helper — runs a terraform command inside the Docker container
# ---------------------------------------------------------------
run_tf() {
  echo ""
  echo ">>> terraform $*"
  echo ""
  "$TOOLBOX" bash -c "cd $TF_DIR && terraform $*"
}

# ---------------------------------------------------------------
# S3 backend helpers
# ---------------------------------------------------------------

# Returns 0 if the S3 state bucket already exists on AWS
bucket_exists() {
  "$TOOLBOX" aws s3api head-bucket \
    --bucket "$S3_BUCKET" \
    --region "$TF_REGION" > /dev/null 2>&1
}

# Writes backend.tf pointing at the S3 bucket (generated at runtime, not committed)
write_backend() {
  cat > "$BACKEND_FILE" << 'EOF'
terraform {
  backend "s3" {
    bucket         = "joblensai-terraform-state"
    key            = "terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "joblensai-terraform-locks"
    encrypt        = true
  }
}
EOF
}

# Smart init — automatically picks local vs S3 backend:
#   No bucket yet        → remove backend.tf → local state
#   Bucket exists, no backend.tf → write it → migrate local state to S3
#   Bucket exists, backend.tf present → normal S3 init
smart_init() {
  if bucket_exists; then
    if [ ! -f "$BACKEND_FILE" ]; then
      echo ""
      echo "  S3 state bucket found — migrating local state to S3..."
      write_backend
      "$TOOLBOX" bash -c "cd $TF_DIR && terraform init -migrate-state -force-copy -input=false"
    else
      run_tf init -input=false
    fi
  else
    rm -f "$BACKEND_FILE"
    run_tf init -input=false
  fi
}

# Called after every terraform apply — migrates state to S3 on first deploy
migrate_after_apply() {
  if [ ! -f "$BACKEND_FILE" ]; then
    echo ""
    echo "  Migrating Terraform state to S3..."
    write_backend
    "$TOOLBOX" bash -c "cd $TF_DIR && terraform init -migrate-state -force-copy -input=false"
    echo "  State is now stored in S3. Safe to delete local terraform.tfstate."
  fi
}

# ---------------------------------------------------------------
# Command router
# ---------------------------------------------------------------
COMMAND="${1:-all}"

case "$COMMAND" in

  init)
    smart_init
    ;;

  plan)
    smart_init
    run_tf plan
    ;;

  apply)
    smart_init
    run_tf plan
    echo ""
    read -p "Apply the above plan? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      echo "Ensuring ECR repositories exist..."
      run_tf apply -target=module.ecrRepos -auto-approve || true
      
      echo "Building and pushing Docker images..."
      "$DIR/push-images.sh"
      
      echo "Applying full infrastructure..."
      run_tf apply -auto-approve
      migrate_after_apply
      
      echo ""
      echo "Deploy complete. Your ALB URL:"
      run_tf output alb_dns_name
    else
      echo "Apply cancelled."
      exit 0
    fi
    ;;

  push)
    # Build + push Docker images to ECR (runs on host, not in toolbox)
    # Optionally pass a single service name as second argument
    "$DIR/push-images.sh" "${2:-}"
    ;;

  destroy)
    echo ""
    echo "WARNING: This will destroy ALL infrastructure on AWS."
    read -p "Type 'destroy' to confirm: " CONFIRM
    if [ "$CONFIRM" = "destroy" ]; then
      smart_init
      run_tf destroy -auto-approve
      rm -f "$BACKEND_FILE"
    else
      echo "Destroy cancelled."
      exit 0
    fi
    ;;

  all)
    smart_init
    run_tf plan
    echo ""
    read -p "Apply the above plan? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      echo "Ensuring ECR repositories exist..."
      run_tf apply -target=module.ecrRepos -auto-approve || true

      echo "Building and pushing Docker images..."
      "$DIR/push-images.sh"

      echo "Applying full infrastructure..."
      run_tf apply -auto-approve
      migrate_after_apply

      echo ""
      echo "Deploy complete. Your ALB URL:"
      run_tf output alb_dns_name
    else
      echo "Apply cancelled."
      exit 0
    fi
    ;;

  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [init|plan|apply|push|destroy|all]"
    exit 1
    ;;

esac
