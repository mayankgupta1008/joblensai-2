#!/bin/bash

# ==============================================================================
# JobLens AI - Local Kind Cleanup Script
# ==============================================================================
# This script deletes all resources created by the deployment script.
# Usage: ./scripts/stop-local.sh
# ==============================================================================

echo "🛑 Stopping and cleaning up local Kubernetes resources..."

# Kill any existing port-forward process on 8080
EXISTING_PID=$(lsof -t -i :8080 || true)
if [ ! -z "$EXISTING_PID" ]; then
    echo "🔹 Stopping port-forward (PID: $EXISTING_PID)..."
    kill -9 $EXISTING_PID || true
fi

# Delete project resources (excluding cert-manager-issuer.yaml which isn't applied locally)
echo "🔹 Deleting all project resources..."
find k8s -name '*.yaml' ! -name 'cert-manager-issuer.yaml' -exec kubectl delete -f {} --ignore-not-found=true \;

# Delete Ingress Controller
echo "🔹 Deleting Ingress Controller..."
kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml --ignore-not-found=true

echo "✅ Cleanup completed successfully!"
echo "Current pod status:"
kubectl get pods