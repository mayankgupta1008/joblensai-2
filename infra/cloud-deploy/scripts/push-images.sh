#!/bin/bash
set -e

# ---------------------------------------------------------------
# JobLens AI — Docker Build + Push to ECR
#
# Builds Dockerfile.prod for every microservice and pushes to ECR.
# Run AFTER `deploy.sh apply` (ECR repos must exist first).
#
# Usage:
#   ./push-images.sh              # build + push all services
#   ./push-images.sh backend      # build + push one service
# ---------------------------------------------------------------

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WORKSPACE_DIR="$( cd "$DIR/../../.." && pwd )"
REGION="${AWS_DEFAULT_REGION:-ap-south-1}"
PROJECT="joblensai"

ALL_SERVICES=("api-gateway" "auth" "backend" "agent-service" "payment" "notification" "web")

get_dockerfile() {
  case "$1" in
    api-gateway)   echo "apps/api-gateway/Dockerfile" ;;
    auth)          echo "apps/auth/Dockerfile.prod" ;;
    backend)       echo "apps/backend/Dockerfile.prod" ;;
    agent-service) echo "apps/agent-service/Dockerfile.prod" ;;
    payment)       echo "apps/payment/Dockerfile.prod" ;;
    notification)  echo "apps/notification/Dockerfile.prod" ;;
    web)           echo "apps/web/Dockerfile.prod" ;;
    *)             echo "" ;;
  esac
}

# ---------------------------------------------------------------
# Determine which services to build
# ---------------------------------------------------------------
if [ -n "$1" ]; then
  DOCKERFILE="$(get_dockerfile "$1")"
  if [ -z "$DOCKERFILE" ]; then
    echo ""
    echo "ERROR: Unknown service '$1'"
    echo "Valid services: ${ALL_SERVICES[*]}"
    echo ""
    exit 1
  fi
  TARGET_SERVICES=("$1")
else
  TARGET_SERVICES=("${ALL_SERVICES[@]}")
fi

# ---------------------------------------------------------------
# Check prerequisites
# ---------------------------------------------------------------
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
  echo ""
  echo "ERROR: AWS credentials not set."
  echo "Export them first:"
  echo "  export AWS_ACCESS_KEY_ID=your_key"
  echo "  export AWS_SECRET_ACCESS_KEY=your_secret"
  echo ""
  exit 1
fi

command -v aws    >/dev/null 2>&1 || { echo "ERROR: aws CLI not found."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found."; exit 1; }

# ---------------------------------------------------------------
# Get AWS account ID + ECR registry URL
# ---------------------------------------------------------------
echo ""
echo "Fetching AWS account ID..."
ACCOUNT_ID=$(aws sts get-caller-identity \
  --query Account \
  --output text \
  --region "$REGION")
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
echo "  Account : $ACCOUNT_ID"
echo "  Registry: $ECR_REGISTRY"

# ---------------------------------------------------------------
# Login to ECR
# ---------------------------------------------------------------
echo ""
echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ECR_REGISTRY"
echo "  Login successful."

# ---------------------------------------------------------------
# Build + push each service
# ---------------------------------------------------------------
echo ""
FAILED=()

for SERVICE in "${TARGET_SERVICES[@]}"; do
  DOCKERFILE="$(get_dockerfile "$SERVICE")"
  ECR_REPO="${ECR_REGISTRY}/${PROJECT}-${SERVICE}"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Service : $SERVICE"
  echo "  From    : $DOCKERFILE"
  echo "  To      : $ECR_REPO:latest"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if docker build \
      -f "${WORKSPACE_DIR}/${DOCKERFILE}" \
      -t "${ECR_REPO}:latest" \
      "${WORKSPACE_DIR}"; then

    echo "  Pushing..."
    docker push "${ECR_REPO}:latest"
    echo "  Done: $SERVICE"
  else
    echo "  FAILED: $SERVICE (build error — see above)"
    FAILED+=("$SERVICE")
  fi

  echo ""
done

# ---------------------------------------------------------------
# Summary
# ---------------------------------------------------------------
echo "========================================================"
if [ ${#FAILED[@]} -eq 0 ]; then
  echo "  All images pushed successfully to ECR."
  echo "  ECS will pull new images on next task start."
else
  echo "  Completed with errors. Failed services:"
  for F in "${FAILED[@]}"; do echo "    - $F"; done
  exit 1
fi
echo "========================================================"
