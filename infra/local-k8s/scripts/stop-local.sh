#!/bin/bash

# ==============================================================================
# JobLens AI - Local Kind Cleanup Script
# ==============================================================================
# This script completely removes the Kind cluster for a clean slate.
# Usage: pnpm k8s:stop (or ./infra/local-k8s/scripts/stop-local.sh from root)
# ==============================================================================

CLUSTER_NAME="joblensai"

echo "🛑 Completely cleaning up local Kind cluster..."

# Kill any existing port-forward processes
echo "🔹 Stopping port-forward processes..."
for PORT in 8080 8200; do
    EXISTING_PID=$(lsof -t -i :$PORT 2>/dev/null || true)
    if [ ! -z "$EXISTING_PID" ]; then
        echo "   Killing process on :$PORT (PID: $EXISTING_PID)"
        kill -9 $EXISTING_PID 2>/dev/null || true
    fi
done

# Delete the entire Kind cluster
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "🔹 Deleting Kind cluster '${CLUSTER_NAME}'..."
    kind delete cluster --name "${CLUSTER_NAME}"
    echo "✓ Cluster deleted"
else
    echo "✓ Cluster '${CLUSTER_NAME}' doesn't exist"
fi

echo ""
echo "✅ Cleanup completed!"
echo "   Run 'pnpm k8s:deploy' to create a fresh cluster"