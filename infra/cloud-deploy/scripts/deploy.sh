#!/bin/bash
set -e

# ---------------------------------------------------------------
# JobLens AI — Terraform Deploy Script
# Runs all Terraform commands inside Docker (no local installs needed).
# Usage:
#   ./infra/cloud-deploy/scripts/deploy.sh           → init + plan + apply
#   ./infra/cloud-deploy/scripts/deploy.sh init      → only init
#   ./infra/cloud-deploy/scripts/deploy.sh plan      → only plan
#   ./infra/cloud-deploy/scripts/deploy.sh apply     → only apply
#   ./infra/cloud-deploy/scripts/deploy.sh destroy   → destroy all (careful!)
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform/prod"

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
TFVARS="$DIR/../terraform/prod/terraform.tfvars"
if [ ! -f "$TFVARS" ]; then
  echo ""
  echo "ERROR: terraform.tfvars not found."
  echo "Copy the example and fill in your values:"
  echo "  cp $TF_DIR/terraform.tfvars.example $TF_DIR/terraform.tfvars"
  echo ""
  exit 1
fi

if grep -q "CHANGE_ME" "$TFVARS"; then
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
# Command router
# ---------------------------------------------------------------
COMMAND="${1:-all}"

case "$COMMAND" in

  init)
    run_tf init
    ;;

  plan)
    run_tf init -input=false
    run_tf plan
    ;;

  apply)
    run_tf init -input=false
    run_tf plan
    echo ""
    read -p "Apply the above plan? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      run_tf apply -auto-approve
      echo ""
      echo "Deploy complete. Your app URL:"
      run_tf output alb_dns_name
    else
      echo "Apply cancelled."
      exit 0
    fi
    ;;

  destroy)
    echo ""
    echo "WARNING: This will destroy ALL infrastructure on AWS."
    read -p "Type 'destroy' to confirm: " CONFIRM
    if [ "$CONFIRM" = "destroy" ]; then
      run_tf destroy -auto-approve
    else
      echo "Destroy cancelled."
      exit 0
    fi
    ;;

  all)
    run_tf init
    run_tf plan
    echo ""
    read -p "Apply the above plan? (yes/no): " CONFIRM
    if [ "$CONFIRM" = "yes" ]; then
      run_tf apply -auto-approve
      echo ""
      echo "Deploy complete. Your app URL:"
      run_tf output alb_dns_name
    else
      echo "Apply cancelled."
      exit 0
    fi
    ;;

  *)
    echo "Unknown command: $COMMAND"
    echo "Usage: $0 [init|plan|apply|destroy|all]"
    exit 1
    ;;

esac
