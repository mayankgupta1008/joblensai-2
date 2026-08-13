#!/bin/bash
# ============================================================
# Setup Gitea — Create user, repo, and push local code
# Run after Gitea is ready in Kind cluster
# ============================================================

set -e

GITEA_URL="http://localhost:3000"
GITEA_USER="developer"
GITEA_PASS="developer123"
GITEA_EMAIL="developer@local.dev"
REPO_NAME="joblensai"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "🔧 Setting up Gitea..."

# Wait for Gitea to be ready
echo "Waiting for Gitea to be ready..."
until curl -s "${GITEA_URL}/api/healthz" > /dev/null 2>&1; do
    echo "  Gitea not ready, waiting..."
    sleep 2
done
echo "✓ Gitea is ready"

# Create user via Gitea API (first user becomes admin)
echo "Creating Gitea user..."
curl -s -X POST "${GITEA_URL}/api/v1/admin/users" \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"${GITEA_USER}\",
        \"password\": \"${GITEA_PASS}\",
        \"email\": \"${GITEA_EMAIL}\",
        \"must_change_password\": false
    }" 2>/dev/null || true

# Try creating user via user registration if admin API fails
curl -s -X POST "${GITEA_URL}/user/sign_up" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "user_name=${GITEA_USER}&password=${GITEA_PASS}&retype=${GITEA_PASS}&email=${GITEA_EMAIL}" 2>/dev/null || true

# Get access token
echo "Getting access token..."
TOKEN_RESPONSE=$(curl -s -X POST "${GITEA_URL}/api/v1/users/${GITEA_USER}/tokens" \
    -u "${GITEA_USER}:${GITEA_PASS}" \
    -H "Content-Type: application/json" \
    -d '{"name": "deploy-token", "scopes": ["write:repository", "write:user"]}' 2>/dev/null || echo '{}')

TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"sha1":"[^"]*"' | cut -d'"' -f4 || true)

if [ -z "$TOKEN" ]; then
    echo "  Using basic auth (token creation may have failed)"
    AUTH_HEADER="-u ${GITEA_USER}:${GITEA_PASS}"
else
    echo "  Got access token"
    AUTH_HEADER="-H \"Authorization: token ${TOKEN}\""
fi

# Create repository
echo "Creating repository..."
curl -s -X POST "${GITEA_URL}/api/v1/user/repos" \
    -u "${GITEA_USER}:${GITEA_PASS}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${REPO_NAME}\",
        \"private\": false,
        \"auto_init\": false
    }" 2>/dev/null || true

echo "✓ Repository created"

# Configure git and push
echo "Pushing local code to Gitea..."
cd "$PROJECT_ROOT"

# Save current remote if exists
ORIGINAL_REMOTE=$(git remote get-url origin 2>/dev/null || echo "")

# Add/update gitea remote
git remote remove gitea 2>/dev/null || true
git remote add gitea "http://${GITEA_USER}:${GITEA_PASS}@localhost:3000/${GITEA_USER}/${REPO_NAME}.git"

# Auto-commit any uncommitted Helm charts for local development
echo "Checking for uncommitted Helm charts..."
UNTRACKED_CHARTS=$(git ls-files --others --exclude-standard -- 'apps/*/chart/*' 2>/dev/null)
MODIFIED_CHARTS=$(git diff --name-only -- 'apps/*/chart/*' 2>/dev/null)

if [ -n "$UNTRACKED_CHARTS" ] || [ -n "$MODIFIED_CHARTS" ]; then
    echo "  Found uncommitted chart changes, auto-committing for local dev..."
    git add apps/*/chart/ 2>/dev/null || true
    git commit -m "Auto-commit: Helm charts for local K8s" --no-verify 2>/dev/null || true
fi

# Push all branches
git push gitea --all --force 2>/dev/null || {
    echo "  First push, initializing..."
    git push gitea HEAD:main --force
}

echo ""
echo "✅ Gitea setup complete!"
echo "   URL: ${GITEA_URL}"
echo "   User: ${GITEA_USER}"
echo "   Repo: ${GITEA_URL}/${GITEA_USER}/${REPO_NAME}"
echo ""
echo "   ArgoCD will pull from: http://gitea.joblensai.svc.cluster.local:3000/${GITEA_USER}/${REPO_NAME}.git"
