#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------
# JobLens AI — AWS "Super Nuke" Script
# ---------------------------------------------------------------
# Forcefully deletes joblensai resources on AWS.
# This is a best-effort project-scoped teardown, not an account-wide wipe.
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform"
TFVARS_PATH="$DIR/../terraform/terraform.tfvars"
PROJECT="joblensai"
REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
APP_S3_BUCKET=""

if [ -f "$TFVARS_PATH" ]; then
  TFVARS_REGION="$(sed -n 's/^[[:space:]]*aws_region[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "$TFVARS_PATH" | head -n 1)"
  TFVARS_BUCKET="$(sed -n 's/^[[:space:]]*aws_s3_bucket[[:space:]]*=[[:space:]]*"\([^"]*\)".*/\1/p' "$TFVARS_PATH" | head -n 1)"
  [ -n "$TFVARS_REGION" ] && REGION="$TFVARS_REGION"
  [ -n "$TFVARS_BUCKET" ] && APP_S3_BUCKET="$TFVARS_BUCKET"
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "ERROR: AWS credentials not set."
  exit 1
fi

echo "========================================================"
echo "  JobLens AI — AWS Super Nuke"
echo "  Project : $PROJECT"
echo "  Region  : $REGION"
[ -n "$APP_S3_BUCKET" ] && echo "  App S3  : $APP_S3_BUCKET"
echo "========================================================"
echo ""
read -p "Type 'nuke' to confirm: " CONFIRM
if [ "$CONFIRM" != "nuke" ]; then
  echo "Cancelled."
  exit 0
fi

echo ">>> [1/5] Targeted Terraform destroy..."
if [ -f "$TFVARS_PATH" ]; then
  AWS_DEFAULT_REGION="$REGION" "$TOOLBOX" bash -c "cd ${TF_DIR} && (terraform init -input=false && terraform destroy -auto-approve -target=module.ecsCluster -target=module.ecrRepos || true)" \
    || echo "    Terraform unreachable — falling back to CLI cleanup."
else
  echo "    terraform.tfvars not found — skipping Terraform destroy."
fi

echo ">>> [2/5] Local Cleanup..."
rm -f "${TF_DIR}/backend.tf"
rm -rf "${TF_DIR}/.terraform" "${TF_DIR}"/*.tfstate* 2>/dev/null || true
echo "    Local artifacts removed."

echo ">>> [3-5] CLI Cleanup & Verification..."
export PROJECT REGION APP_S3_BUCKET
"$TOOLBOX" bash -c '
  set -euo pipefail

  PROJECT="${PROJECT:?missing PROJECT}"
  REGION="${REGION:-${AWS_DEFAULT_REGION:-ap-south-1}}"
  APP_S3_BUCKET="${APP_S3_BUCKET:-}"
  WARNINGS=0

  info() {
    echo "    $*"
  }

  warn() {
    echo "    WARNING: $*" >&2
    WARNINGS=1
  }

  text_query() {
    local out
    out=$(aws "$@" --region "$REGION" --output text 2>/dev/null || true)
    if [ -z "$out" ] || [ "$out" = "None" ]; then
      return 0
    fi
    printf "%s\n" "$out" | tr "\t" "\n"
  }

  delete_bucket() {
    local bucket=$1
    if [ -z "$bucket" ]; then
      return 0
    fi
    if ! aws s3api head-bucket --bucket "$bucket" --region "$REGION" >/dev/null 2>&1; then
      info "S3 bucket already absent: $bucket"
      return 0
    fi
    if aws s3 rb "s3://$bucket" --force --region "$REGION" >/dev/null 2>&1; then
      info "Deleted S3 bucket: $bucket"
    else
      warn "Failed to delete S3 bucket: $bucket"
    fi
  }

  cleanup_ecs() {
    local cluster services service tasks task families family task_defs task_def
    local running_tasks pending_tasks
    local service_count

    for cluster in $(text_query ecs list-clusters --query "clusterArns[?contains(@, \"$PROJECT\")]"); do
      service_count=0
      info "Cleaning ECS cluster: $cluster"

      services=$(text_query ecs list-services --cluster "$cluster" --query "serviceArns[]")
      for service in $services; do
        service_count=1
        aws ecs update-service --cluster "$cluster" --service "$service" --desired-count 0 --region "$REGION" >/dev/null 2>&1 || true
        if aws ecs delete-service --cluster "$cluster" --service "$service" --force --region "$REGION" >/dev/null 2>&1; then
          info "Deleted ECS service: $service"
        else
          warn "Failed to delete ECS service: $service"
        fi
      done

      if [ "$service_count" -eq 1 ]; then
        aws ecs wait services-inactive --cluster "$cluster" --services $services --region "$REGION" >/dev/null 2>&1 || true
      fi

      running_tasks=$(text_query ecs list-tasks --cluster "$cluster" --desired-status RUNNING --query "taskArns[]")
      pending_tasks=$(text_query ecs list-tasks --cluster "$cluster" --desired-status PENDING --query "taskArns[]")
      tasks=$(printf "%s\n%s\n" "$running_tasks" "$pending_tasks" | sed "/^$/d" | sort -u)
      for task in $tasks; do
        if aws ecs stop-task --cluster "$cluster" --task "$task" --reason "joblensai nuke" --region "$REGION" >/dev/null 2>&1; then
          info "Stopped ECS task: $task"
        else
          warn "Failed to stop ECS task: $task"
        fi
      done

      if aws ecs delete-cluster --cluster "$cluster" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted ECS cluster: $cluster"
      else
        warn "Failed to delete ECS cluster: $cluster"
      fi
    done

    for family in $(text_query ecs list-task-definition-families --family-prefix "$PROJECT" --query "families[]"); do
      task_defs=$(text_query ecs list-task-definitions --family-prefix "$family" --status ACTIVE --query "taskDefinitionArns[]")
      for task_def in $task_defs; do
        if aws ecs deregister-task-definition --task-definition "$task_def" --region "$REGION" >/dev/null 2>&1; then
          info "Deregistered task definition: $task_def"
        else
          warn "Failed to deregister task definition: $task_def"
        fi
      done
    done
  }

  cleanup_alb() {
    local alb_arns arn target_group_arns target_group
    alb_arns=$(text_query elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, \"$PROJECT\")].LoadBalancerArn")

    for arn in $alb_arns; do
      if aws elbv2 delete-load-balancer --load-balancer-arn "$arn" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted ALB: $arn"
      else
        warn "Failed to delete ALB: $arn"
      fi
    done

    if [ -n "$alb_arns" ]; then
      aws elbv2 wait load-balancers-deleted --load-balancer-arns $alb_arns --region "$REGION" >/dev/null 2>&1 || true
    fi

    target_group_arns=$(text_query elbv2 describe-target-groups --query "TargetGroups[?contains(TargetGroupName, \"$PROJECT\")].TargetGroupArn")
    for target_group in $target_group_arns; do
      if aws elbv2 delete-target-group --target-group-arn "$target_group" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted target group: $target_group"
      else
        warn "Failed to delete target group: $target_group"
      fi
    done
  }

  cleanup_ecr() {
    local repo
    info "Cleaning up ECR repositories matching prefix: $PROJECT"
    for repo in $(text_query ecr describe-repositories --query "repositories[?contains(repositoryName, \`$PROJECT\`)].repositoryName"); do
      if aws ecr delete-repository --repository-name "$repo" --force --region "$REGION" >/dev/null 2>&1; then
        info "Deleted ECR repo: $repo"
      else
        warn "Failed to delete ECR repo: $repo"
      fi
    done
  }

  cleanup_logs() {
    local group
    for group in $(text_query logs describe-log-groups --query "logGroups[?contains(logGroupName, \"$PROJECT\")].logGroupName"); do
      if aws logs delete-log-group --log-group-name "$group" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted log group: $group"
      else
        warn "Failed to delete log group: $group"
      fi
    done
  }

  cleanup_service_discovery() {
    local namespace_ids namespace_id services service operation_id status
    namespace_ids=$(text_query servicediscovery list-namespaces --query "Namespaces[?Name==\`$PROJECT\`].Id")

    for namespace_id in $namespace_ids; do
      services=$(text_query servicediscovery list-services --filters Name=NAMESPACE_ID,Values="$namespace_id",Condition=EQ --query "Services[].Id")
      for service in $services; do
        if aws servicediscovery delete-service --id "$service" --region "$REGION" >/dev/null 2>&1; then
          info "Deleted service discovery service: $service"
        else
          warn "Failed to delete service discovery service: $service"
        fi
      done

      operation_id=$(aws servicediscovery delete-namespace --id "$namespace_id" --region "$REGION" --query "OperationId" --output text 2>/dev/null || true)
      if [ -z "$operation_id" ] || [ "$operation_id" = "None" ]; then
        warn "Failed to delete service discovery namespace: $namespace_id"
        continue
      fi

      info "Delete namespace requested: $namespace_id"
      for _ in $(seq 1 24); do
        status=$(aws servicediscovery get-operation --operation-id "$operation_id" --region "$REGION" --query "Operation.Status" --output text 2>/dev/null || true)
        if [ "$status" = "SUCCESS" ]; then
          info "Deleted service discovery namespace: $namespace_id"
          break
        fi
        if [ "$status" = "FAIL" ]; then
          warn "Service discovery namespace delete failed: $namespace_id"
          break
        fi
        sleep 5
      done
    done
  }

  cleanup_iam() {
    local role policies policy inline_policies inline profiles profile
    for role in $(text_query iam list-roles --query "Roles[?contains(RoleName, \"$PROJECT\")].RoleName"); do
      info "Cleaning IAM role: $role"

      policies=$(text_query iam list-attached-role-policies --role-name "$role" --query "AttachedPolicies[].PolicyArn")
      for policy in $policies; do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" >/dev/null 2>&1 || warn "Failed to detach policy $policy from $role"
      done

      inline_policies=$(text_query iam list-role-policies --role-name "$role" --query "PolicyNames[]")
      for inline in $inline_policies; do
        aws iam delete-role-policy --role-name "$role" --policy-name "$inline" >/dev/null 2>&1 || warn "Failed to delete inline policy $inline from $role"
      done

      profiles=$(text_query iam list-instance-profiles-for-role --role-name "$role" --query "InstanceProfiles[].InstanceProfileName")
      for profile in $profiles; do
        aws iam remove-role-from-instance-profile --instance-profile-name "$profile" --role-name "$role" >/dev/null 2>&1 || true
        aws iam delete-instance-profile --instance-profile-name "$profile" >/dev/null 2>&1 || warn "Failed to delete instance profile $profile"
      done

      if aws iam delete-role --role-name "$role" >/dev/null 2>&1; then
        info "Deleted IAM role: $role"
      else
        warn "Failed to delete IAM role: $role"
      fi
    done
  }

  verify_empty() {
    local label=$1
    local query=$2
    local service=$3
    local command=$4
    local out

    out=$(aws "$service" "$command" --region "$REGION" --query "$query" --output text 2>/dev/null || true)
    if [ -n "$out" ] && [ "$out" != "None" ]; then
      warn "$label still exist: $out"
    else
      info "$label: none found."
    fi
  }

  cleanup_vpc_networking() {
    local nat_ids nat_id eip_allocs eip
    info "Cleaning up VPC Networking (NAT Gateways & Elastic IPs)..."

    # 1. Delete NAT Gateways
    nat_ids=$(text_query ec2 describe-nat-gateways --filter "Name=tag:Name,Values=*$PROJECT*" --query "NatGateways[?State!=\`deleted\`].NatGatewayId")
    for nat_id in $nat_ids; do
      if aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted NAT Gateway: $nat_id (Waiting for deletion...)"
        aws ec2 wait nat-gateway-deleted --nat-gateway-ids "$nat_id" --region "$REGION" >/dev/null 2>&1 || true
      else
        warn "Failed to delete NAT Gateway: $nat_id"
      fi
    done

    # 2. Release Unassociated Elastic IPs (matching project or orphans)
    # We look for IPs that have no AssociationId
    eip_allocs=$(text_query ec2 describe-addresses --query "Addresses[?AssociationId==null].AllocationId")
    for eip in $eip_allocs; do
      if aws ec2 release-address --allocation-id "$eip" --region "$REGION" >/dev/null 2>&1; then
        info "Released Elastic IP: $eip"
      else
        warn "Could not release Elastic IP $eip (might still be in use)"
      fi
    done
  }

  echo "  Deleting ECS resources..."
  cleanup_ecs

  echo "  Deleting ALB resources..."
  cleanup_alb

  echo "  Deleting VPC networking..."
  cleanup_vpc_networking

  echo "  Deleting ECR repositories..."
  cleanup_ecr

  echo "  Deleting CloudWatch logs..."
  cleanup_logs

  echo "  Deleting service discovery resources..."
  cleanup_service_discovery

  echo "  Cleaning IAM roles..."
  cleanup_iam

  echo "  Deleting state storage..."
  delete_bucket "$PROJECT-terraform-state"
  if [ -n "$APP_S3_BUCKET" ] && [ "$APP_S3_BUCKET" != "$PROJECT-terraform-state" ]; then
    delete_bucket "$APP_S3_BUCKET"
  fi
  if aws dynamodb describe-table --table-name "$PROJECT-terraform-locks" --region "$REGION" >/dev/null 2>&1; then
    if aws dynamodb delete-table --table-name "$PROJECT-terraform-locks" --region "$REGION" >/dev/null 2>&1; then
      info "Deleted DynamoDB table: $PROJECT-terraform-locks"
    else
      warn "Failed to delete DynamoDB table: $PROJECT-terraform-locks"
    fi
  else
    info "DynamoDB table already absent: $PROJECT-terraform-locks"
  fi

  echo "  Final verification..."
  verify_empty "ECS clusters" "clusterArns[?contains(@, \"$PROJECT\")]" "ecs" "list-clusters"
  verify_empty "ALBs" "LoadBalancers[?contains(LoadBalancerName, \"$PROJECT\")].LoadBalancerArn" "elbv2" "describe-load-balancers"
  verify_empty "Target groups" "TargetGroups[?contains(TargetGroupName, \"$PROJECT\")].TargetGroupArn" "elbv2" "describe-target-groups"
  verify_empty "ECR repos" "repositories[?contains(repositoryName, \"$PROJECT\")].repositoryName" "ecr" "describe-repositories"
  verify_empty "Log groups" "logGroups[?contains(logGroupName, \"$PROJECT\")].logGroupName" "logs" "describe-log-groups"
  verify_empty "Service discovery namespaces" "Namespaces[?Name==\`$PROJECT\`].Id" "servicediscovery" "list-namespaces"
  verify_empty "IAM roles" "Roles[?contains(RoleName, \"$PROJECT\")].RoleName" "iam" "list-roles"
  verify_empty "Terraform state bucket" "Buckets[?Name==\`$PROJECT-terraform-state\`].Name" "s3api" "list-buckets"
  verify_empty "DynamoDB locks table" "TableNames[?contains(@, \`$PROJECT-terraform-locks\`)]" "dynamodb" "list-tables"
  if [ -n "$APP_S3_BUCKET" ] && [ "$APP_S3_BUCKET" != "$PROJECT-terraform-state" ]; then
    verify_empty "Application S3 bucket" "Buckets[?Name==\`$APP_S3_BUCKET\`].Name" "s3api" "list-buckets"
  fi

  echo "========================================================"
  if [ "$WARNINGS" -eq 0 ]; then
    echo "  Super Nuke complete."
  else
    echo "  Super Nuke finished with warnings."
  fi
  echo "========================================================"

  exit "$WARNINGS"
'
