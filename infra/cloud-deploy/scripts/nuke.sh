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
    local bucket=$1 versions markers
    if [ -z "$bucket" ]; then return 0; fi
    if ! aws s3api head-bucket --bucket "$bucket" --region "$REGION" >/dev/null 2>&1; then
      info "S3 bucket already absent: $bucket"
      return 0
    fi

    info "Force-emptying versioned S3 bucket: $bucket"
    
    # Get versions and markers as JSON
    versions=$(aws s3api list-object-versions --bucket "$bucket" --region "$REGION" --query "{Objects: Versions[].{Key:Key,VersionId:VersionId}}" --output json 2>/dev/null || echo "null")
    markers=$(aws s3api list-object-versions --bucket "$bucket" --region "$REGION" --query "{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}" --output json 2>/dev/null || echo "null")

    if [ "$versions" != "null" ] && [ "$versions" != "{\"Objects\": null}" ]; then
      aws s3api delete-objects --bucket "$bucket" --region "$REGION" --delete "$versions" >/dev/null 2>&1 || true
    fi
    if [ "$markers" != "null" ] && [ "$markers" != "{\"Objects\": null}" ]; then
      aws s3api delete-objects --bucket "$bucket" --region "$REGION" --delete "$markers" >/dev/null 2>&1 || true
    fi

    if aws s3 rb "s3://$bucket" --force --region "$REGION" >/dev/null 2>&1; then
      info "Deleted S3 bucket: $bucket"
    else
      warn "Failed to delete S3 bucket: $bucket (might still contain versions)"
    fi
  }

  cleanup_ecs() {
    local cluster services service tasks task families family task_defs task_def
    local running_tasks pending_tasks
    local service_count

    for cluster in $(text_query ecs list-clusters --query "clusterArns[?contains(@, \`$PROJECT\`) ]"); do
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
    alb_arns=$(text_query elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, \`$PROJECT\`)].LoadBalancerArn")

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

    target_group_arns=$(text_query elbv2 describe-target-groups --query "TargetGroups[?contains(TargetGroupName, \`$PROJECT\`)].TargetGroupArn")
    for target_group in $target_group_arns; do
      if aws elbv2 delete-target-group --target-group-arn "$target_group" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted target group: $target_group"
      else
        warn "Failed to delete target group: $target_group"
      fi
    done
  }

  cleanup_acm() {
    local arn arns in_use_count attempts max_attempts
    info "Cleaning up ACM certificates matching domain prefix: $PROJECT"
    arns=$(text_query acm list-certificates --query "CertificateSummaryList[?contains(DomainName, \`$PROJECT\`)].CertificateArn")
    max_attempts=60   # 60 × 5s = 5 min ceiling
    for arn in $arns; do
      # The ACM Certificate.InUseBy field lags ALB deletion by 30-90s. Poll
      # until empty so the eventual delete-certificate succeeds on first try.
      for attempts in $(seq 1 "$max_attempts"); do
        in_use_count=$(aws acm describe-certificate --certificate-arn "$arn" --region "$REGION" \
          --query "length(Certificate.InUseBy)" --output text 2>/dev/null || echo "0")
        if [ "$in_use_count" = "0" ]; then
          break
        fi
        [ "$attempts" -eq 1 ] && info "Waiting for ACM cert to detach from $in_use_count association(s): $arn"
        sleep 5
      done
      if aws acm delete-certificate --certificate-arn "$arn" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted ACM certificate: $arn"
      else
        warn "Failed to delete ACM certificate: $arn (still in use after 5 min)"
      fi
    done
  }

  cleanup_route53_zones() {
    local zone_id zone_ids records record_count change_batch
    info "Cleaning up Route 53 hosted zones matching: $PROJECT"
    # Route 53 is global → no --region. Returned IDs look like /hostedzone/Z1234ABC.
    zone_ids=$(text_query route53 list-hosted-zones --query "HostedZones[?contains(Name, \`$PROJECT\`)].Id")
    for zone_id in $zone_ids; do
      # NS+SOA at the apex are auto-managed and rejected if you try to DELETE them.
      records=$(aws route53 list-resource-record-sets --hosted-zone-id "$zone_id" \
        --query "ResourceRecordSets[?Type!=\`NS\` && Type!=\`SOA\`]" --output json 2>/dev/null || echo "[]")
      record_count=$(echo "$records" | jq '\''length'\'' 2>/dev/null || echo 0)
      if [ "$record_count" -gt 0 ]; then
        change_batch=$(echo "$records" | jq '\''{Changes: [.[] | {Action: "DELETE", ResourceRecordSet: .}]}'\'')
        if aws route53 change-resource-record-sets --hosted-zone-id "$zone_id" --change-batch "$change_batch" >/dev/null 2>&1; then
          info "Cleared $record_count record(s) from zone: $zone_id"
        else
          warn "Failed to clear records from zone: $zone_id"
        fi
      fi
      if aws route53 delete-hosted-zone --id "$zone_id" >/dev/null 2>&1; then
        info "Deleted Route 53 hosted zone: $zone_id"
      else
        warn "Failed to delete Route 53 hosted zone: $zone_id"
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
    # Added /ecs/ and direct project search
    for group in $(text_query logs describe-log-groups --query "logGroups[?contains(logGroupName, \`$PROJECT\`)].logGroupName"); do
      if aws logs delete-log-group --log-group-name "$group" --region "$REGION" >/dev/null 2>&1; then
        info "Deleted log group: $group"
      else
        warn "Failed to delete log group: $group"
      fi
    done
  }

  cleanup_service_discovery() {
    local namespace_ids namespace_id services service operation_id status instances instance
    namespace_ids=$(text_query servicediscovery list-namespaces --query "Namespaces[?Name==\`$PROJECT\`].Id")

    for namespace_id in $namespace_ids; do
      services=$(text_query servicediscovery list-services --filters Name=NAMESPACE_ID,Values="$namespace_id",Condition=EQ --query "Services[].Id")
      # Deregister all instances first — otherwise delete-service errors with
      # "Service contains registered instances", which then blocks namespace
      # deletion and leaks the underlying Route53 private hosted zone.
      for service in $services; do
        instances=$(text_query servicediscovery list-instances --service-id "$service" --query "Instances[].Id")
        for instance in $instances; do
          aws servicediscovery deregister-instance --service-id "$service" --instance-id "$instance" --region "$REGION" >/dev/null 2>&1 \
            && info "Deregistered instance: $instance ($service)" \
            || warn "Failed to deregister instance: $instance ($service)"
        done
      done
      # Brief settle so Cloud Map marks instances gone before delete-service.
      [ -n "$services" ] && sleep 5
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
    for role in $(text_query iam list-roles --query "Roles[?contains(RoleName, \`$PROJECT\`)].RoleName"); do
      info "Cleaning IAM role: $role"

      policies=$(text_query iam list-attached-role-policies --role-name "$role" --query "AttachedPolicies[].PolicyArn")
      for policy in $policies; do
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" || warn "Failed to detach policy $policy from $role"
      done

      inline_policies=$(text_query iam list-role-policies --role-name "$role" --query "PolicyNames[]")
      for inline in $inline_policies; do
        aws iam delete-role-policy --role-name "$role" --policy-name "$inline" || warn "Failed to delete inline policy $inline from $role"
      done

      profiles=$(text_query iam list-instance-profiles-for-role --role-name "$role" --query "InstanceProfiles[].InstanceProfileName")
      for profile in $profiles; do
        aws iam remove-role-from-instance-profile --instance-profile-name "$profile" --role-name "$role" >/dev/null 2>&1 || true
        aws iam delete-instance-profile --instance-profile-name "$profile" >/dev/null 2>&1 || warn "Failed to delete instance profile $profile"
      done

      if aws iam delete-role --role-name "$role"; then
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

  cleanup_rds() {
    local id ids
    ids=$(text_query rds describe-db-instances --query "DBInstances[?contains(DBInstanceIdentifier, \`$PROJECT\`)].DBInstanceIdentifier")
    for id in $ids; do
      aws rds delete-db-instance --db-instance-identifier "$id" --skip-final-snapshot --delete-automated-backups --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted RDS instance: $id" || warn "Failed to delete RDS instance: $id"
    done
    ids=$(text_query rds describe-db-clusters --query "DBClusters[?contains(DBClusterIdentifier, \`$PROJECT\`)].DBClusterIdentifier")
    for id in $ids; do
      aws rds delete-db-cluster --db-cluster-identifier "$id" --skip-final-snapshot --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted RDS cluster: $id" || warn "Failed to delete RDS cluster: $id"
    done
  }

  cleanup_elasticache() {
    local id ids
    ids=$(text_query elasticache describe-cache-clusters --query "CacheClusters[?contains(CacheClusterId, \`$PROJECT\`)].CacheClusterId")
    for id in $ids; do
      aws elasticache delete-cache-cluster --cache-cluster-id "$id" --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted ElastiCache cluster: $id" || warn "Failed to delete ElastiCache cluster: $id"
    done
  }

  cleanup_efs() {
    local id ids mt mts
    ids=$(text_query efs describe-file-systems --query "FileSystems[?contains(Name, \`$PROJECT\`) || contains(CreationToken, \`$PROJECT\`)].FileSystemId")
    for id in $ids; do
      mts=$(text_query efs describe-mount-targets --file-system-id "$id" --query "MountTargets[].MountTargetId")
      for mt in $mts; do
        aws efs delete-mount-target --mount-target-id "$mt" --region "$REGION" >/dev/null 2>&1 || true
      done
      sleep 5
      aws efs delete-file-system --file-system-id "$id" --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted EFS: $id" || warn "Failed to delete EFS: $id"
    done
  }

  cleanup_lambda() {
    local fn fns
    fns=$(text_query lambda list-functions --query "Functions[?contains(FunctionName, \`$PROJECT\`)].FunctionName")
    for fn in $fns; do
      aws lambda delete-function --function-name "$fn" --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted Lambda: $fn" || warn "Failed to delete Lambda: $fn"
    done
  }

  cleanup_secrets() {
    local arn arns
    arns=$(text_query secretsmanager list-secrets --query "SecretList[?contains(Name, \`$PROJECT\`)].ARN")
    for arn in $arns; do
      aws secretsmanager delete-secret --secret-id "$arn" --force-delete-without-recovery --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted secret: $arn" || warn "Failed to delete secret: $arn"
    done
  }

  cleanup_orphan_ebs() {
    local vol vols
    vols=$(text_query ec2 describe-volumes --filters Name=status,Values=available --query "Volumes[].VolumeId")
    for vol in $vols; do
      aws ec2 delete-volume --volume-id "$vol" --region "$REGION" >/dev/null 2>&1 \
        && info "Deleted orphan EBS volume: $vol" || warn "Failed to delete EBS volume: $vol"
    done
  }

  warn_stragglers() {
    local out
    info "Stragglers scan (cost-bearing resources, NOT auto-deleted):"
    out=$(text_query ec2 describe-snapshots --owner-ids self --query "Snapshots[].SnapshotId")
    [ -n "$out" ] && warn "EBS snapshots present (manual review): $out"
    out=$(text_query rds describe-db-snapshots --query "DBSnapshots[].DBSnapshotIdentifier")
    [ -n "$out" ] && warn "RDS snapshots present (manual review): $out"
    out=$(text_query ec2 describe-images --owners self --query "Images[].ImageId")
    [ -n "$out" ] && warn "Custom AMIs present (manual review): $out"
    out=$(text_query ssm describe-parameters --query "Parameters[?contains(Name, \`$PROJECT\`)].Name")
    [ -n "$out" ] && warn "SSM parameters present: $out"
    out=$(text_query apigateway get-rest-apis --query "items[?contains(name, \`$PROJECT\`)].id")
    [ -n "$out" ] && warn "API Gateway REST APIs present: $out"
    return 0
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

  echo "  Deleting ACM certificates..."
  cleanup_acm

  echo "  Deleting Route 53 hosted zones..."
  cleanup_route53_zones

  echo "  Deleting RDS resources..."
  cleanup_rds

  echo "  Deleting ElastiCache resources..."
  cleanup_elasticache

  echo "  Deleting EFS resources..."
  cleanup_efs

  echo "  Deleting Lambda functions..."
  cleanup_lambda

  echo "  Deleting Secrets Manager secrets..."
  cleanup_secrets

  echo "  Deleting orphan EBS volumes..."
  cleanup_orphan_ebs

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

  warn_stragglers

  echo "  Final verification..."
  verify_empty "ECS clusters" "clusterArns[?contains(@, \"$PROJECT\")]" "ecs" "list-clusters"
  verify_empty "ALBs" "LoadBalancers[?contains(LoadBalancerName, \"$PROJECT\")].LoadBalancerArn" "elbv2" "describe-load-balancers"
  verify_empty "Target groups" "TargetGroups[?contains(TargetGroupName, \"$PROJECT\")].TargetGroupArn" "elbv2" "describe-target-groups"
  verify_empty "ECR repos" "repositories[?contains(repositoryName, \"$PROJECT\")].repositoryName" "ecr" "describe-repositories"
  verify_empty "Log groups" "logGroups[?contains(logGroupName, \"$PROJECT\")].logGroupName" "logs" "describe-log-groups"
  verify_empty "Service discovery namespaces" "Namespaces[?Name==\`$PROJECT\`].Id" "servicediscovery" "list-namespaces"
  verify_empty "ACM certificates" "CertificateSummaryList[?contains(DomainName, \`$PROJECT\`)].CertificateArn" "acm" "list-certificates"
  verify_empty "Route 53 hosted zones" "HostedZones[?contains(Name, \`$PROJECT\`)].Id" "route53" "list-hosted-zones"
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
