#!/bin/bash

# ==============================================================================
# JobLens AI - Local Kind Deployment Script (GitOps with ArgoCD)
# ==============================================================================
# This script sets up a production-like GitOps environment locally using:
# - Kind (Kubernetes in Docker)
# - Gitea (local Git server)
# - ArgoCD (GitOps controller)
# - ESO + Vault (secrets management)
# ==============================================================================

set -e

CLUSTER_NAME="joblensai"
INFRA_DIR="infra/local-k8s"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Local GitOps Deployment to Kind cluster: $CLUSTER_NAME"

# ─────────────────────────────────────────────────────────────
# 1. Create Kind Cluster
# ─────────────────────────────────────────────────────────────
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "✓ Cluster '${CLUSTER_NAME}' already exists"
else
    echo "Creating cluster '${CLUSTER_NAME}'..."
    kind create cluster --name "${CLUSTER_NAME}" --config "${INFRA_DIR}/kind-config.yaml"
    echo "✓ Cluster '${CLUSTER_NAME}' created successfully"
fi

# ─────────────────────────────────────────────────────────────
# 2. Build and Load Docker Images
# ─────────────────────────────────────────────────────────────
echo "📦 Building Docker Images..."
docker build -t backend:local -f apps/backend/Dockerfile.prod .
docker build -t agent-service:local -f apps/agent-service/Dockerfile.prod .
docker build -t web:local -f apps/web/Dockerfile.prod .
docker build -t auth:local -f apps/auth/Dockerfile.prod .
docker build -t payment:local -f apps/payment/Dockerfile.prod .
docker build -t notification:local -f apps/notification/Dockerfile.prod .
docker build -t api-gateway:local -f apps/api-gateway/Dockerfile .

echo "🚚 Loading images into Kind cluster..."
kind load docker-image backend:local --name $CLUSTER_NAME
kind load docker-image agent-service:local --name $CLUSTER_NAME
kind load docker-image web:local --name $CLUSTER_NAME
kind load docker-image auth:local --name $CLUSTER_NAME
kind load docker-image payment:local --name $CLUSTER_NAME
kind load docker-image notification:local --name $CLUSTER_NAME
kind load docker-image api-gateway:local --name $CLUSTER_NAME

# ─────────────────────────────────────────────────────────────
# 3. Install MetalLB (LoadBalancer Controller)
# ─────────────────────────────────────────────────────────────
echo "🌐 Installing MetalLB..."
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml

echo "⏳ Waiting for MetalLB Controller deployment to rollout..."
kubectl rollout status deployment/controller -n metallb-system

echo "🌐 Applying MetalLB IP Pool..."
# Kind's Docker network is dual-stack, so pick the IPv4 subnet explicitly
SUBNET=$(docker network inspect kind -f '{{range .IPAM.Config}}{{println .Subnet}}{{end}}' | grep -E '^[0-9]+\.[0-9]+\.' | head -n1)
if [ -z "$SUBNET" ]; then
  echo "❌ No IPv4 subnet found on the kind Docker network" >&2
  exit 1
fi

# Compute the pool from the real subnet: last 56..6 addresses (51 IPs), works for any mask
BASE=${SUBNET%/*}
MASK=${SUBNET#*/}
set -- $(echo "$BASE" | tr '.' ' ')
BASE_INT=$(( ($1 << 24) | ($2 << 16) | ($3 << 8) | $4 ))
SIZE=$(( 1 << (32 - MASK) ))
int2ip() { echo "$(( ($1 >> 24) & 255 )).$(( ($1 >> 16) & 255 )).$(( ($1 >> 8) & 255 )).$(( $1 & 255 ))"; }
METALLB_RANGE="$(int2ip $(( BASE_INT + SIZE - 56 )))-$(int2ip $(( BASE_INT + SIZE - 6 )))"
echo "   Detected Kind subnet: ${SUBNET} → MetalLB pool: ${METALLB_RANGE}"

# Retry until the MetalLB webhook is actually serving
APPLIED=0
for i in $(seq 1 30); do
  if sed "s|__METALLB_RANGE__|${METALLB_RANGE}|g" "${INFRA_DIR}/metallb/metallb-config.yaml" | kubectl apply -f -; then
    APPLIED=1
    break
  fi
  echo "   MetalLB webhook not ready yet, retrying ($i/30)..."
  sleep 2
done
[ "$APPLIED" = 1 ] || { echo "❌ Failed to apply MetalLB config" >&2; exit 1; }

# ─────────────────────────────────────────────────────────────
# 4. Create Namespace
# ─────────────────────────────────────────────────────────────
kubectl create namespace joblensai --dry-run=client -o yaml | kubectl apply -f -

# ─────────────────────────────────────────────────────────────
# 5. Install External Secrets Operator (ESO)
# ─────────────────────────────────────────────────────────────
echo "🔐 Installing External Secrets Operator..."
helm repo add external-secrets https://charts.external-secrets.io 2>/dev/null || true
helm repo update external-secrets

if helm status external-secrets -n external-secrets >/dev/null 2>&1; then
    echo "✓ External Secrets Operator already installed"
else
    helm install external-secrets external-secrets/external-secrets \
        --namespace external-secrets \
        --create-namespace \
        --wait
    echo "✓ External Secrets Operator installed"
fi

echo "⏳ Waiting for ESO to be fully ready..."
kubectl rollout status deployment/external-secrets-webhook -n external-secrets --timeout=120s
kubectl wait --for=condition=Established crd/clustersecretstores.external-secrets.io --timeout=60s

# ─────────────────────────────────────────────────────────────
# 6. Apply Stateful Services (MongoDB, Redis, Kafka, S3, Vault, Gitea)
# ─────────────────────────────────────────────────────────────
# Pre-pull with no time limit (a pull finishes or errors; containerd aborts one stalled for 5m),
# so the rollout waits below only time pod startup, never a slow download.
# ponytail: re-downloads per new cluster and per node; host cache + `kind load image-archive` if that hurts
echo "📥 Pre-pulling stateful images (first run can take a few minutes)..."
for img in $(kubectl apply --dry-run=client -f "${INFRA_DIR}/stateful/" -o jsonpath='{..image}'); do
    for node in $(kind get nodes --name "$CLUSTER_NAME"); do
        echo "   ${img} → ${node}"
        docker exec "$node" crictl pull "$img" >/dev/null \
            || echo "   ⚠️  Could not pull ${img}; its pod will keep retrying on its own" >&2
    done
done

echo "☸️ Applying Stateful Services..."
kubectl apply -f "${INFRA_DIR}/stateful/"

# ─────────────────────────────────────────────────────────────
# 7. Wait for Vault and Seed Secrets
# ─────────────────────────────────────────────────────────────
echo "⏳ Waiting for Vault to be ready..."
kubectl rollout status statefulset/vault -n joblensai --timeout=120s

echo "🔐 Seeding Vault with development secrets..."
kubectl port-forward svc/vault -n joblensai 8200:8200 &
VAULT_PF_PID=$!
sleep 3

"${SCRIPT_DIR}/seed-vault.sh"

kill $VAULT_PF_PID 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
# 8. Apply Monitoring Stack (Prometheus, Grafana, Loki, Promtail)
# ─────────────────────────────────────────────────────────────
echo "📊 Applying Monitoring Stack..."
kubectl apply -f "${INFRA_DIR}/monitoring/"

# ─────────────────────────────────────────────────────────────
# 9. Apply SecretStore and ExternalSecrets
# ─────────────────────────────────────────────────────────────
echo "🔑 Applying SecretStore and ExternalSecrets..."
kubectl apply -f "${INFRA_DIR}/secrets/secretstore-local.yaml"
kubectl apply -f "${INFRA_DIR}/secrets/external-secrets.yaml"

echo "⏳ Waiting for secrets to sync from Vault..."
sleep 5
kubectl wait --for=condition=Ready externalsecret/joblensai-secrets -n joblensai --timeout=60s || true

# ─────────────────────────────────────────────────────────────
# 10. Install ArgoCD
# ─────────────────────────────────────────────────────────────
echo "🔄 Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "⏳ Waiting for ArgoCD components to be ready..."
kubectl rollout status deployment/argocd-server -n argocd --timeout=15m
kubectl rollout status deployment/argocd-repo-server -n argocd --timeout=15m
kubectl rollout status deployment/argocd-dex-server -n argocd --timeout=15m
kubectl rollout status deployment/argocd-applicationset-controller -n argocd --timeout=15m
kubectl rollout status deployment/argocd-notifications-controller -n argocd --timeout=15m
kubectl rollout status statefulset/argocd-application-controller -n argocd --timeout=15m
kubectl rollout status statefulset/argocd-redis -n argocd --timeout=15m
kubectl wait --namespace argocd --for=condition=Ready pod --all --timeout=15m

# ─────────────────────────────────────────────────────────────
# 11. Setup Gitea (Local Git Server)
# ─────────────────────────────────────────────────────────────
echo "⏳ Waiting for Gitea to be ready..."
kubectl rollout status statefulset/gitea -n joblensai --timeout=120s

echo "🔧 Setting up Gitea and pushing code..."
kubectl port-forward svc/gitea -n joblensai 3000:3000 &
GITEA_PF_PID=$!
sleep 5

"${SCRIPT_DIR}/setup-gitea.sh"

kill $GITEA_PF_PID 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
# 12. Apply ArgoCD Applications
# ─────────────────────────────────────────────────────────────
echo "📦 Applying ArgoCD Applications..."
kubectl apply -f "${INFRA_DIR}/argocd/applications.yaml"

# ─────────────────────────────────────────────────────────────
# 12.5 Create Cloudflare Tunnel + Public Hostname via Zero Trust API
# ─────────────────────────────────────────────────────────────
echo "☁️  Configuring Cloudflare Tunnel..."
source "${SCRIPT_DIR}/../../../.envrc" 2>/dev/null || true

if [ -z "$CF_ACCOUNT_ID" ]; then
  echo "❌ CF_ACCOUNT_ID not set — tunnel cannot be created" >&2
  echo "   Add it to .envrc: export CF_ACCOUNT_ID=<your-account-id>" >&2
  echo "   Find it at the bottom-left of any Cloudflare dashboard page" >&2
  exit 1
fi

if [ -z "$CF_API_TOKEN" ]; then
  echo "❌ CF_API_TOKEN not set — tunnel cannot be created" >&2
  echo "   Add it to .envrc: export CF_API_TOKEN=<account-scoped api token>" >&2
  echo "   Create at: Dashboard → My Profile → API Tokens → Create Token" >&2
  echo "   (permission: Account → Cloudflare Tunnel → Edit)" >&2
  exit 1
fi

# Reuse the existing joblensai-prod tunnel (never creates joblensai / jobl).
# The API ?name= param does a substring match, so we verify the exact name here.
echo "🔍 Checking for existing tunnel 'joblensai-prod'..."
EXISTING_JSON=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/cfd_tunnel?name=joblensai-prod" \
  -H "Authorization: Bearer ${CF_API_TOKEN}")
EXISTING_IDS=$(echo "$EXISTING_JSON" | jq -r '.result[].id' 2>/dev/null)

FOUND=0
for id in $EXISTING_IDS; do
  TUNNEL_NAME=$(echo "$EXISTING_JSON" | jq -r --argjson id "$id" '.result[] | select(.id == $id) | .name')
  if [ "$TUNNEL_NAME" = "joblensai-prod" ]; then
    TUNNEL_ID="$id"
    FOUND=1
    break
  fi
done

if [ "$FOUND" -eq 1 ]; then
  echo "   Found existing tunnel: ${TUNNEL_ID} (joblensai-prod) — reusing it, ingress will be overwritten"
else
  echo "❌ No existing tunnel 'joblensai-prod' found — no new tunnel is created" >&2
  exit 1
fi

# 2. Configure ingress rules (map public hostnames → api-gateway)
echo "🌐 Configuring ingress rules (joblensai.in + www → api-gateway.joblensai:80)..."
INGRESS_JSON=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/configurations" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data "{
    \"config\": {
      \"ingress\": [
        {\"hostname\": \"joblensai.in\", \"service\": \"http://api-gateway.joblensai.svc.cluster.local:80\"},
        {\"hostname\": \"www.joblensai.in\", \"service\": \"http://api-gateway.joblensai.svc.cluster.local:80\"},
        {\"service\": \"http_status:404\"}
      ]
    }
  }")
if ! echo "$INGRESS_JSON" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "❌ Failed to configure ingress:" >&2
  echo "$INGRESS_JSON" | jq -r '.errors[]?.message // .error_message // "unknown error"' >&2
  exit 1
fi
echo "   Ingress mapped: joblensai.in, www.joblensai.in → api-gateway"

# 3. Fetch the tunnel's own connector token and inject it into the secret.
# This binds the cloudflared pod (which runs `tunnel run --token`) to the
# API-created tunnel, so no stale dashboard token is ever needed.
echo "🔑 Generating cloudflared connector token..."
CONNECTOR_JSON=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/cfd_tunnel/${TUNNEL_ID}/token" \
  -H "Authorization: Bearer ${CF_API_TOKEN}" \
  -H "Content-Type: application/json")
CONNECTOR_TOKEN=$(echo "$CONNECTOR_JSON" | jq -r '.result' | tr -d '"')
if [ -z "$CONNECTOR_TOKEN" ]; then
  echo "❌ Failed to generate connector token:" >&2
  echo "$CONNECTOR_JSON" | jq -r '.errors[]?.message // .error_message // "unknown error"' >&2
  exit 1
fi
echo "   Connector token fetched for tunnel ${TUNNEL_ID}"

echo "🔑 Applying cloudflared secret..."
kubectl create secret generic cloudflared-token \
  --namespace joblensai \
  --from-literal=tunnel-token="$CONNECTOR_TOKEN" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "🌐 Applying cloudflared Deployment..."
kubectl apply -f "${INFRA_DIR}/cloudflared/tunnel.yaml"

echo "⏳ Waiting for cloudflared to be ready..."
kubectl rollout status deployment/cloudflared -n joblensai --timeout=5m || {
  echo "❌ cloudflared rollout failed" >&2
  echo "   Check: kubectl get pods -n joblensai -l app=cloudflared" >&2
  echo "   Check: kubectl logs -n joblensai -l app=cloudflared -f" >&2
  exit 1
}

kubectl wait --namespace joblensai \
  --for=condition=Ready pod -l app=cloudflared --timeout=5m || {
  echo "❌ cloudflared pods did not reach Ready" >&2
  kubectl get pods -n joblensai -l app=cloudflared
  exit 1
}

READY_REPLICAS=$(kubectl get deployment cloudflared -n joblensai -o jsonpath='{.status.readyReplicas}')
if [ "$READY_REPLICAS" != "2" ]; then
  echo "❌ cloudflared not fully ready: got ${READY_REPLICAS}/2 replicas, expected 2" >&2
  exit 1
fi
echo "✓ Cloudflare Tunnel ready (${READY_REPLICAS} replicas)"


# ─────────────────────────────────────────────────────────────
# 13. Wait for ArgoCD to Deploy Services
# ─────────────────────────────────────────────────────────────
echo "⏳ Waiting for ArgoCD to sync applications..."
sleep 10

echo "📊 ArgoCD Application Status:"
kubectl get applications -n argocd


# ─────────────────────────────────────────────────────────────
# 14. Setup Port Forwarding
# ─────────────────────────────────────────────────────────────
echo ""
echo "🌐 Setting up Port Forwarding..."
EXISTING_PID=$(lsof -t -i :8080 || true)
if [ ! -z "$EXISTING_PID" ]; then
    echo "🔹 Cleaning up existing port-forward (PID: $EXISTING_PID)..."
    kill -9 $EXISTING_PID || true
fi

# Get ArgoCD admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "📌 Access Points:"
echo "   App:        http://localhost:8080"
echo "   Grafana:    http://localhost:3001 (port-forward separately)"
echo "   ArgoCD:     https://localhost:9090 (port-forward separately)"
echo "   Gitea:      http://localhost:3000 (port-forward separately)"
echo ""
echo "🔑 ArgoCD Credentials:"
echo "   Username: admin"
echo "   Password: ${ARGOCD_PASSWORD}"
echo ""
echo "🔧 Useful Commands:"
echo "   kubectl port-forward svc/argocd-server -n argocd 9090:443  # ArgoCD UI"
echo "   kubectl port-forward svc/gitea -n joblensai 3000:3000      # Gitea UI"
echo "   kubectl port-forward svc/grafana -n joblensai 3001:3000    # Grafana UI"
echo "   kubectl get applications -n argocd                         # App status"
echo ""
# Port-forward api-gateway as local entrypoint (or access via MetalLB IP)
kubectl port-forward service/api-gateway -n joblensai 8080:80
