#!/bin/bash

# ==============================================================================
# JobLens AI - Local Kind Cleanup Script
# ==============================================================================
# This script deletes all resources created by the deployment script.
# Usage: pnpm k8s:stop (or ./infra/local-k8s/scripts/stop-local.sh from root)
# ==============================================================================

INFRA_DIR="infra/local-k8s"

echo "🛑 Stopping and cleaning up local Kubernetes resources..."

# Kill any existing port-forward process on 8080
EXISTING_PID=$(lsof -t -i :8080 || true)
if [ ! -z "$EXISTING_PID" ]; then
    echo "🔹 Stopping port-forward (PID: $EXISTING_PID)..."
    kill -9 $EXISTING_PID || true
fi

# Delete stateful services
echo "🔹 Deleting stateful services..."
kubectl delete -f "${INFRA_DIR}/stateful/" --ignore-not-found=true

# Delete Ingress Controller
echo "🔹 Deleting Ingress Controller..."
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml --ignore-not-found=true

echo "✅ Cleanup completed successfully!"
echo "Current pod status:"
kubectl get pods