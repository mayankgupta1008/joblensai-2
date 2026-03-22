#!/bin/bash

# ==============================================================================
# JobLens AI - Local Kind Deployment Script
# ==============================================================================
# This script automates the build and deployment process for the Kind cluster.
# Usage: pnpm k8s:deploy (or ./infra/local-k8s/scripts/deploy-local.sh from root)
# ==============================================================================

set -e # Exit on error

CLUSTER_NAME="joblensai"
INFRA_DIR="infra/local-k8s"

echo "🚀 Starting Local Deployment to Kind cluster: $CLUSTER_NAME"
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "✓ Cluster '${CLUSTER_NAME}' already exists"
else
    echo "Creating cluster '${CLUSTER_NAME}'..."
    kind create cluster --name "${CLUSTER_NAME}" --config "${INFRA_DIR}/kind-config.yaml"
    echo "✓ Cluster '${CLUSTER_NAME}' created successfully"
fi

echo "📦 Building Docker Images..."
docker build -t backend:local -f apps/backend/Dockerfile.prod .
docker build -t agent-service:local -f apps/agent-service/Dockerfile.prod .
docker build -t web:local -f apps/web/Dockerfile.prod .
docker build -t auth:local -f apps/auth/Dockerfile.prod .
docker build -t payment:local -f apps/payment/Dockerfile.prod .
docker build -t notification:local -f apps/notification/Dockerfile.prod .

echo "🚚 Loading images into Kind cluster..."
kind load docker-image backend:local --name $CLUSTER_NAME
kind load docker-image agent-service:local --name $CLUSTER_NAME
kind load docker-image web:local --name $CLUSTER_NAME
kind load docker-image auth:local --name $CLUSTER_NAME
kind load docker-image payment:local --name $CLUSTER_NAME
kind load docker-image notification:local --name $CLUSTER_NAME

echo "Installing Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

# Create namespace
kubectl create namespace joblensai --dry-run=client -o yaml | kubectl apply -f -

# Apply stateful services (MongoDB, Redis, Kafka, Minio)
echo "☸️ Applying Stateful Services..."
kubectl apply -f "${INFRA_DIR}/stateful/"

echo "Waiting for application pods to be ready..."
kubectl wait --for=condition=ready pod --all --timeout=300s

echo "🌐 Setting up Port Forwarding..."
EXISTING_PID=$(lsof -t -i :8080 || true)
if [ ! -z "$EXISTING_PID" ]; then
    echo "🔹 Cleaning up existing port-forward (PID: $EXISTING_PID)..."
    kill -9 $EXISTING_PID || true
fi

kubectl port-forward service/ingress-nginx-controller -n ingress-nginx 8080:80