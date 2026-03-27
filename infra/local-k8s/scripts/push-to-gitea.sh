#!/bin/bash
# ============================================================
# Push changes to Gitea for local K8s testing
# Usage: pnpm k8s:push
# ============================================================

set -e

GITEA_USER="developer"
GITEA_PASS="developer123"
REPO_NAME="joblensai"

echo "🚀 Pushing changes to Gitea..."

# Check if there are any changes to commit
if [[ -n $(git status --porcelain) ]]; then
    echo "📦 Found uncommitted changes, committing..."
    git add -A
    git commit -m "Local dev: $(date +%Y-%m-%d\ %H:%M:%S)" --no-verify
else
    echo "✓ No new changes to commit"
fi

# Ensure gitea remote exists
git remote remove gitea 2>/dev/null || true
git remote add gitea "http://${GITEA_USER}:${GITEA_PASS}@localhost:3000/${GITEA_USER}/${REPO_NAME}.git"

# Check if port-forward is already running
if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "🔌 Starting port-forward to Gitea..."
    kubectl port-forward svc/gitea -n joblensai 3000:3000 &
    PF_PID=$!
    sleep 2
    CLEANUP_PF=true
else
    echo "✓ Gitea port-forward already running"
    CLEANUP_PF=false
fi

# Push to Gitea
echo "📤 Pushing to Gitea..."
git push gitea main --force

# Cleanup port-forward if we started it
if [ "$CLEANUP_PF" = true ]; then
    echo "🧹 Cleaning up port-forward..."
    kill $PF_PID 2>/dev/null || true
fi

echo ""
echo "✅ Push complete! ArgoCD will sync within ~3 minutes."
echo "   To sync immediately: kubectl get applications -n argocd"
echo "   Or use ArgoCD UI: kubectl port-forward svc/argocd-server -n argocd 9090:443"
