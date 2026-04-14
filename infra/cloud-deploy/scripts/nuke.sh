#!/bin/bash

# ---------------------------------------------------------------
# JobLens AI — AWS "Super Nuke" Script
# ---------------------------------------------------------------
# Forcefully deletes ALL joblensai resources on AWS.
# 
# Resolves the "Self-Destruct" bug by:
#   1. Targeting only app modules in Terraform destroy.
#   2. Forcefully clearing ECS/ALB via CLI as a fallback.
#   3. Deleting State storage manually at the very end.
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform"
REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
PROJECT="joblensai"

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo "ERROR: AWS credentials not set."
  exit 1
fi

echo "========================================================"
echo "  JobLens AI — AWS Super Nuke"
echo "  Project: $PROJECT"
echo "========================================================"
echo ""
read -p "Type 'nuke' to confirm: " CONFIRM
if [ "$CONFIRM" != "nuke" ]; then
  echo "Cancelled."
  exit 0
fi

# ---------------------------------------------------------------
# Step 0: Local Cleanup
# Removes leftover state files and backend configurations
# ---------------------------------------------------------------
echo ">>> [0/5] Local Cleanup..."
rm -f "${TF_DIR}/backend.tf"
rm -f "${TF_DIR}"/*.tfstate*
rm -rf "${TF_DIR}/.terraform"
echo "    Local Terraform artifacts removed."

# ---------------------------------------------------------------
# Step 1: Targeted Terraform destroy
# ---------------------------------------------------------------
echo ">>> [1/5] Targeted Terraform destroy..."
TFVARS="$DIR/../terraform/terraform.tfvars"
if [ -f "$TFVARS" ]; then
  # Only destroy app modules first to avoid state-bucket deletion during process
  # If init fails (e.g. bucket already deleted), we ignore and move to CLI cleanup
  "$TOOLBOX" bash -c "cd ${TF_DIR} && (terraform init -input=false -reconfigure && terraform destroy -auto-approve -target=module.ecsCluster -target=module.ecrRepos || true)" || echo "    Terraform backend unreachable — proceeding to CLI cleanup."
else
  echo "    No terraform.tfvars found — skipping Step 1."
fi

# ---------------------------------------------------------------
# Step 2: Forceful CLI Cleanup (The Safety Net)
# ---------------------------------------------------------------
echo ""
echo ">>> [2/5] Forceful CLI Cleanup (ECS + ALB + IAM + Logs)..."

# Pass required variables into the container environment
export PROJECT REGION
"$TOOLBOX" bash -c '
  # 1. Force Clear ECS Services and Clusters
  CLUSTERS=$(aws ecs list-clusters --region "${REGION}" --query "clusterArns[?contains(@, \"${PROJECT}\")]" --output text)
  for CLUSTER in $CLUSTERS; do
    echo "    Cleaning cluster: $CLUSTER"
    SERVICES=$(aws ecs list-services --cluster "$CLUSTER" --region "${REGION}" --output text --query "serviceArns")
    for SERVICE in $SERVICES; do
      aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --desired-count 0 --region "${REGION}" > /dev/null 2>&1
      aws ecs delete-service --cluster "$CLUSTER" --service "$SERVICE" --force --region "${REGION}" > /dev/null 2>&1
      echo "      Deleted service: $SERVICE"
    done
    aws ecs delete-cluster --cluster "$CLUSTER" --region "${REGION}" > /dev/null 2>&1 && echo "      Deleted cluster: $CLUSTER"
  done

  # 2. Delete Load Balancers
  ALBS=$(aws elbv2 describe-load-balancers --region "${REGION}" --query "LoadBalancers[?contains(LoadBalancerName, \"${PROJECT}\")].LoadBalancerArn" --output text)
  for ALB in $ALBS; do
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB" --region "${REGION}" > /dev/null 2>&1
    echo "    Deleted ALB: $ALB"
  done

  # 3. Delete ECR repositories
  REPOS=$(aws ecr describe-repositories --region "${REGION}" --query "repositories[?contains(repositoryName, \"${PROJECT}\")].repositoryName" --output text)
  for REPO in $REPOS; do
    aws ecr delete-repository --repository-name "$REPO" --force --region "${REGION}" > /dev/null 2>&1
    echo "    Deleted ECR: $REPO"
  done

  # 4. Delete CloudWatch Log Groups
  LOG_GROUPS=$(aws logs describe-log-groups --region "${REGION}" --query "logGroups[?contains(logGroupName, \"${PROJECT}\")].logGroupName" --output text)
  for LG in $LOG_GROUPS; do
    aws logs delete-log-group --log-group-name "$LG" --region "${REGION}" > /dev/null 2>&1
    echo "    Deleted Log Group: $LG"
  done

  # 5. Delete IAM Roles
  ROLES=$(aws iam list-roles --query "Roles[?contains(RoleName, \"${PROJECT}\")].RoleName" --output text)
  for ROLE in $ROLES; do
    echo "    Deleting IAM Role: $ROLE"
    # 1. Detach all managed policies
    POLICIES=$(aws iam list-attached-role-policies --role-name "$ROLE" --query "AttachedPolicies[*].PolicyArn" --output text)
    for POLICY in $POLICIES; do
      aws iam detach-role-policy --role-name "$ROLE" --policy-arn "$POLICY" > /dev/null 2>&1
    done
    # 2. Delete all inline policies
    INLINE_POLICIES=$(aws iam list-role-policies --role-name "$ROLE" --query "PolicyNames" --output text)
    for INLINE in $INLINE_POLICIES; do
      aws iam delete-role-policy --role-name "$ROLE" --policy-name "$INLINE" > /dev/null 2>&1
    done
    # 3. Remove from instance profiles
    PROFILES=$(aws iam list-instance-profiles-for-role --role-name "$ROLE" --query "InstanceProfiles[*].InstanceProfileName" --output text)
    for PROFILE in $PROFILES; do
      aws iam remove-role-from-instance-profile --instance-profile-name "$PROFILE" --role-name "$ROLE" > /dev/null 2>&1
    done
    aws iam delete-role --role-name "$ROLE" > /dev/null 2>&1
  done

  # 6. Delete Service Discovery Namespaces
  NAMESPACES=$(aws servicediscovery list-namespaces --region "${REGION}" --query "Namespaces[?Name==\`${PROJECT}\`].Id" --output text)
  for NS in $NAMESPACES; do
    aws servicediscovery delete-namespace --id "$NS" --region "${REGION}" > /dev/null 2>&1
    echo "    Deleted Service Discovery Namespace: $NS"
  done

  # 7. Delete Target Groups
  TGS=$(aws elbv2 describe-target-groups --region "${REGION}" --query "TargetGroups[?contains(TargetGroupName, \"${PROJECT}\")].TargetGroupArn" --output text)
  for TG in $TGS; do
    aws elbv2 delete-target-group --target-group-arn "$TG" --region "${REGION}" > /dev/null 2>&1
    echo "    Deleted Target Group: $TG"
  done
'

# ---------------------------------------------------------------
# Step 3: Delete Terraform state S3 bucket
# ---------------------------------------------------------------
echo ""
echo ">>> [3/5] Deleting Terraform state S3 bucket..."
"$TOOLBOX" aws s3 rb "s3://${PROJECT}-terraform-state" --force --region "${REGION}" > /dev/null 2>&1 \
  && echo "    Deleted: s3://${PROJECT}-terraform-state" || echo "    State bucket not found (skip)."

# ---------------------------------------------------------------
# Step 4: Delete Terraform DynamoDB locks table
# ---------------------------------------------------------------
echo ""
echo ">>> [4/5] Deleting DynamoDB locks table..."
"$TOOLBOX" aws dynamodb delete-table --table-name "${PROJECT}-terraform-locks" --region "${REGION}" > /dev/null 2>&1 \
  && echo "    Deleted: ${PROJECT}-terraform-locks" || echo "    Lock table not found (skip)."

# ---------------------------------------------------------------
# Step 5: Consolidated Verification
# ---------------------------------------------------------------
echo ""
echo ">>> [5/5] Final Verification..."

export PROJECT REGION
"$TOOLBOX" bash -c '
  # Helper to check and print status
  check_status() {
    local category=$1
    local query=$2
    local warning=$3
    local output=$(aws $category --region "${REGION}" --query "$query" --output text 2>/dev/null)
    if echo "$output" | grep -q "[^[:space:]]"; then
      echo "    WARNING: $warning still exist!"
      return 1
    else
      echo "    $warning: None found."
      return 0
    fi
  }

  echo "  Computing:"
  check_status "ecs list-clusters" "clusterArns[?contains(@, \"${PROJECT}\")]" "ECS Clusters"

  echo "  Networking:"
  check_status "elbv2 describe-load-balancers" "LoadBalancers[?contains(LoadBalancerName, \"${PROJECT}\")]" "Load Balancers"
  check_status "elbv2 describe-target-groups" "TargetGroups[?contains(TargetGroupName, \"${PROJECT}\")]" "Target Groups"

  echo "  Storage/Registry:"
  check_status "ecr describe-repositories" "repositories[?contains(repositoryName, \"${PROJECT}\")]" "ECR Repos"

  echo "  Identity/Monitoring:"
  check_status "iam list-roles" "Roles[?contains(RoleName, \"${PROJECT}\")]" "IAM Roles"
  check_status "logs describe-log-groups" "logGroups[?contains(logGroupName, \"${PROJECT}\")]" "Log Groups"

  echo ""
  echo "========================================================"
  echo "  Super Nuke complete."
  echo "  Final Verification: Check the AWS Console if any WARNINGs appeared."
  echo "========================================================"
'
echo ""
