#!/bin/bash
set -e

# ---------------------------------------------------------------
# JobLens AI — AWS Nuke Script
# Deletes ALL joblensai resources on AWS → $0 charges after run.
#
# Destroys (in order):
#   1. All Terraform-managed resources (ECS, ALB, VPC, IAM, SSM, etc.)
#   2. ECR repositories + all images
#   3. Terraform state S3 bucket
#   4. Terraform DynamoDB locks table
#   5. Verification — confirms nothing is left
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
TOOLBOX="$DIR/aws-cli-docker.sh"
TF_DIR="infra/cloud-deploy/terraform/prod"
REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
PROJECT="joblensai"

# ---------------------------------------------------------------
# Check AWS credentials
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

echo ""
echo "========================================================"
echo "  JobLens AI — AWS Nuke"
echo "  Region : $REGION"
echo "  Project: $PROJECT"
echo ""
echo "  This will permanently delete ALL joblensai resources."
echo "  AWS charges will be $0 after this completes."
echo "========================================================"
echo ""
read -p "Type 'nuke' to confirm: " CONFIRM
if [ "$CONFIRM" != "nuke" ]; then
  echo "Cancelled."
  exit 0
fi

# ---------------------------------------------------------------
# Step 1: Terraform destroy
# Removes: ECS cluster, ALB, VPC, subnets, NAT gateway, EIPs,
#          security groups, IAM roles, SSM parameters,
#          CloudWatch log group, ASG, EC2 instances.
# ---------------------------------------------------------------
echo ""
echo ">>> [1/5] Terraform destroy..."
echo ""

TFVARS="$DIR/../terraform/prod/terraform.tfvars"
if [ -f "$TFVARS" ]; then
  "$TOOLBOX" bash -c "cd ${TF_DIR} && terraform init -input=false -reconfigure && terraform destroy -auto-approve" \
    && echo "    Terraform destroy complete." \
    || echo "    Warning: terraform destroy had errors (some resources may already be deleted — continuing)"
else
  echo "    No terraform.tfvars found — skipping terraform destroy."
  echo "    (Resources may still exist — check AWS Console manually)"
fi

# ---------------------------------------------------------------
# Step 2: Delete ECR repositories + all images
# (Not managed by Terraform — must be deleted separately)
# --force deletes the repo even if it has images inside.
# ---------------------------------------------------------------
echo ""
echo ">>> [2/5] Deleting ECR repositories + images..."
echo ""

for svc in auth backend payment notification agent-service web; do
  "$TOOLBOX" aws ecr delete-repository \
    --repository-name "${PROJECT}-${svc}" \
    --force \
    --region "${REGION}" > /dev/null 2>&1 \
    && echo "    Deleted: ${PROJECT}-${svc}" \
    || echo "    Not found (skip): ${PROJECT}-${svc}"
done

# ---------------------------------------------------------------
# Step 3: Empty + delete Terraform state S3 bucket
# Must empty first — AWS won't delete a non-empty bucket.
# ---------------------------------------------------------------
echo ""
echo ">>> [3/5] Deleting Terraform state S3 bucket..."
echo ""

"$TOOLBOX" aws s3 rm "s3://${PROJECT}-terraform-state" \
  --recursive \
  --region "${REGION}" > /dev/null 2>&1 || true

"$TOOLBOX" aws s3 rb "s3://${PROJECT}-terraform-state" \
  --force \
  --region "${REGION}" > /dev/null 2>&1 \
  && echo "    Deleted: s3://${PROJECT}-terraform-state" \
  || echo "    Not found (skip): s3://${PROJECT}-terraform-state"

# ---------------------------------------------------------------
# Step 4: Delete Terraform DynamoDB locks table
# ---------------------------------------------------------------
echo ""
echo ">>> [4/5] Deleting DynamoDB locks table..."
echo ""

"$TOOLBOX" aws dynamodb delete-table \
  --table-name "${PROJECT}-terraform-locks" \
  --region "${REGION}" > /dev/null 2>&1 \
  && echo "    Deleted: ${PROJECT}-terraform-locks" \
  || echo "    Not found (skip): ${PROJECT}-terraform-locks"

# ---------------------------------------------------------------
# Step 5: Verification — list anything still running
# ---------------------------------------------------------------
echo ""
echo ">>> [5/5] Verifying cleanup..."
echo ""

echo "  ECS clusters:"
"$TOOLBOX" aws ecs list-clusters \
  --region "${REGION}" \
  --query "clusterArns[?contains(@, '${PROJECT}')]" \
  --output text 2>/dev/null | grep . && echo "    WARNING: ECS clusters still exist!" || echo "    None found — OK"

echo ""
echo "  Load balancers:"
"$TOOLBOX" aws elbv2 describe-load-balancers \
  --region "${REGION}" \
  --query "LoadBalancers[?contains(LoadBalancerName, '${PROJECT}')].LoadBalancerName" \
  --output text 2>/dev/null | grep . && echo "    WARNING: Load balancers still exist!" || echo "    None found — OK"

echo ""
echo "  ECR repositories:"
"$TOOLBOX" aws ecr describe-repositories \
  --region "${REGION}" \
  --query "repositories[?contains(repositoryName, '${PROJECT}')].repositoryName" \
  --output text 2>/dev/null | grep . && echo "    WARNING: ECR repos still exist!" || echo "    None found — OK"

echo ""
echo "  EC2 instances:"
"$TOOLBOX" aws ec2 describe-instances \
  --region "${REGION}" \
  --filters "Name=tag:project,Values=${PROJECT}" "Name=instance-state-name,Values=running,pending,stopping,stopped" \
  --query "Reservations[*].Instances[*].InstanceId" \
  --output text 2>/dev/null | grep . && echo "    WARNING: EC2 instances still exist!" || echo "    None found — OK"

echo ""
echo "========================================================"
echo "  Nuke complete."
echo "  If all checks show 'None found' above, AWS charges = \$0"
echo "========================================================"
echo ""
