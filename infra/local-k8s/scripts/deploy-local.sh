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

set -eE

CLUSTER_NAME="joblensai"
INFRA_DIR="infra/local-k8s"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─────────────────────────────────────────────────────────────
# Progress helpers: timestamped steps, failure location, live image pulls
# ─────────────────────────────────────────────────────────────
fmt_dur() { printf '%dm%02ds' $(($1 / 60)) $(($1 % 60)); }

# Step header with wall-clock time and time since the script started
step() { printf '\n[%s | +%s] %s\n' "$(date +%H:%M:%S)" "$(fmt_dur "$SECONDS")" "$*"; }

# On any failure, print which line/command died and when
trap 'echo "❌ Failed at line ${LINENO} after $(fmt_dur "$SECONDS"): ${BASH_COMMAND}" >&2' ERR

# Pre-pull every container image of the given manifests on each kind node, with no time limit
# (a pull finishes or errors; containerd aborts one stalled for 5m), so later rollout waits only
# time pod startup, never a slow download. Shows live progress: elapsed time, MB the node has
# received, speed. A failed pull warns and continues; the pod's own kubelet pull keeps retrying.
# Usage: prepull_images <label> <kubectl -f args...>
# ponytail: re-downloads per new cluster and per node; host cache + `kind load image-archive` if that hurts
prepull_images() {
    local label="$1"; shift
    local imgs total node img i t0 rx0 rx el pid size group_t0=$SECONDS
    imgs=$(kubectl create --dry-run=client "$@" -o jsonpath='{..containers[*].image} {..initContainers[*].image} ' \
        | tr ' ' '\n' | grep . | sort -u)
    total=$(echo "$imgs" | grep -c . || true)
    if [ "$total" -eq 0 ]; then
        echo "   ⚠️  No images found for ${label}; pods will pull on their own" >&2
        return 0
    fi
    echo "📥 Pre-pulling ${total} ${label} image(s) (no time limit; first run can take a few minutes)..."
    for node in $(kind get nodes --name "$CLUSTER_NAME"); do
        i=0
        for img in $imgs; do
            i=$((i + 1))
            # Already on the node: skip the registry round-trip (kubelet still re-checks ":latest" tags)
            if docker exec "$node" crictl inspecti "$img" >/dev/null 2>&1; then
                echo "   [${i}/${total}] ${img} → ${node}: ✓ already on node"
                continue
            fi
            echo "   [${i}/${total}] ${img} → ${node}"
            t0=$SECONDS
            rx0=$(docker exec "$node" cat /sys/class/net/eth0/statistics/rx_bytes)
            docker exec "$node" crictl pull "$img" >/dev/null &
            pid=$!
            while kill -0 "$pid" 2>/dev/null; do
                sleep 1
                el=$((SECONDS - t0))
                # Live line on a terminal (redrawn every second), one line per 10s when piped to a log
                if [ -t 1 ] || [ $((el % 10)) -eq 0 ]; then
                    rx=$(docker exec "$node" cat /sys/class/net/eth0/statistics/rx_bytes)
                    awk -v b=$((rx - rx0)) -v s="$el" -v tty="$([ -t 1 ] && echo 1)" 'BEGIN {
                        line = sprintf("        ⏳ %dm%02ds · %.1f MB received · %.1f MB/s", s / 60, s % 60, b / 1e6, b / 1e6 / s)
                        if (tty) printf "\r%s   ", line; else print line }'
                fi
            done
            if [ -t 1 ]; then printf '\r\033[K'; fi
            if wait "$pid"; then
                size=$(docker exec "$node" crictl inspecti -o go-template --template '{{.status.size}}' "$img" 2>/dev/null || echo 0)
                echo "        ✓ ready in $(fmt_dur $((SECONDS - t0))) ($(awk -v b="$size" 'BEGIN { printf "%.0f", b / 1e6 }') MB image)"
            else
                echo "        ⚠️  Could not pull ${img}; its pod will keep retrying on its own" >&2
            fi
        done
    done
    echo "   ✓ ${label} images ready in $(fmt_dur $((SECONDS - group_t0)))"
}

step "🚀 Starting Local GitOps Deployment to Kind cluster: $CLUSTER_NAME"

# ─────────────────────────────────────────────────────────────
# 1. Create Kind Cluster
# ─────────────────────────────────────────────────────────────
step "☸️  Checking Kind cluster '${CLUSTER_NAME}'..."
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
BUILDS=(
    "backend:local apps/backend/Dockerfile.prod"
    "agent-service:local apps/agent-service/Dockerfile.prod"
    "web:local apps/web/Dockerfile.prod"
    "auth:local apps/auth/Dockerfile.prod"
    "payment:local apps/payment/Dockerfile.prod"
    "notification:local apps/notification/Dockerfile.prod"
    "api-gateway:local apps/api-gateway/Dockerfile"
)

step "📦 Building Docker Images..."
i=0
for b in "${BUILDS[@]}"; do
    read -r tag dockerfile <<< "$b"
    i=$((i + 1)); t0=$SECONDS
    echo "   [${i}/${#BUILDS[@]}] ${tag} ← ${dockerfile}"
    docker build -t "$tag" -f "$dockerfile" .
    echo "   ✓ ${tag} built in $(fmt_dur $((SECONDS - t0)))"
done

# One kind call: a single `docker save` tar (shared base layers sent once), images already on the node skipped
step "🚚 Loading ${#BUILDS[@]} images into Kind cluster..."
t0=$SECONDS
TAGS=(); for b in "${BUILDS[@]}"; do TAGS+=("${b%% *}"); done
kind load docker-image "${TAGS[@]}" --name $CLUSTER_NAME
echo "   ✓ images loaded in $(fmt_dur $((SECONDS - t0)))"

# ─────────────────────────────────────────────────────────────
# 3. Install MetalLB (LoadBalancer Controller)
# ─────────────────────────────────────────────────────────────
step "🌐 Installing MetalLB..."
METALLB_MANIFEST=https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml
prepull_images "MetalLB" -f "$METALLB_MANIFEST"
kubectl apply -f "$METALLB_MANIFEST"

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
step "📁 Creating namespace joblensai..."
kubectl create namespace joblensai --dry-run=client -o yaml | kubectl apply -f -

# ─────────────────────────────────────────────────────────────
# 5. Install External Secrets Operator (ESO)
# ─────────────────────────────────────────────────────────────
step "🔐 Installing External Secrets Operator..."
helm repo add external-secrets https://charts.external-secrets.io 2>/dev/null || true
helm repo update external-secrets

if helm status external-secrets -n external-secrets >/dev/null 2>&1; then
    echo "✓ External Secrets Operator already installed"
else
    helm template external-secrets external-secrets/external-secrets --namespace external-secrets \
        | prepull_images "External Secrets" -f -
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
step "🗄️  Stateful Services (MongoDB, Redis, Kafka, S3, Vault, Gitea)..."
prepull_images "stateful" -f "${INFRA_DIR}/stateful/"

# Key material for local-kms (Vault auto-unseal): generated once, never in git
if ! kubectl get secret local-kms-seed -n joblensai >/dev/null 2>&1; then
    kubectl create secret generic local-kms-seed -n joblensai --from-literal=seed.yaml="Keys:
  Symmetric:
    Aes:
      - Metadata:
          KeyId: 0f8b2a6e-3c1d-4e5f-9a7b-2c4d6e8f0a1b
        BackingKeys:
          - $(openssl rand -hex 32)
Aliases:
  - AliasName: alias/vault-unseal
    TargetKeyId: 0f8b2a6e-3c1d-4e5f-9a7b-2c4d6e8f0a1b"
fi

echo "☸️ Applying Stateful Services..."
kubectl apply -f "${INFRA_DIR}/stateful/"

# ─────────────────────────────────────────────────────────────
# 7. Wait for Vault and Seed Secrets
# ─────────────────────────────────────────────────────────────
step "⏳ Waiting for Vault to be ready..."
# vault status exit code: 0 unsealed, 2 sealed/uninitialized, 1 not reachable yet
until kubectl exec -n joblensai vault-0 -- vault status >/dev/null 2>&1 || [ $? -eq 2 ]; do sleep 2; done
if [ "$(kubectl exec -n joblensai vault-0 -- vault status -format=json | jq -r .initialized)" = "false" ]; then
    echo "🔐 Initializing Vault (root token + recovery key → macOS Keychain)..."
    VAULT_INIT=$(kubectl exec -n joblensai vault-0 -- vault operator init -recovery-shares=1 -recovery-threshold=1 -format=json)
    security add-generic-password -U -a joblensai -s joblensai-vault-root-token -w "$(echo "$VAULT_INIT" | jq -r .root_token)"
    security add-generic-password -U -a joblensai -s joblensai-vault-recovery-key -w "$(echo "$VAULT_INIT" | jq -r '.recovery_keys_b64[0]')"
fi
kubectl rollout status statefulset/vault -n joblensai --timeout=120s

echo "🔐 Seeding Vault with development secrets..."
kubectl port-forward svc/vault -n joblensai 8200:8200 &
VAULT_PF_PID=$!
sleep 3

VAULT_TOKEN="$(security find-generic-password -a joblensai -s joblensai-vault-root-token -w)" "${SCRIPT_DIR}/seed-vault.sh"

kill $VAULT_PF_PID 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
# 8. Apply Monitoring Stack (Prometheus, Grafana, Loki, Promtail)
# ─────────────────────────────────────────────────────────────
step "📊 Applying Monitoring Stack..."
prepull_images "monitoring" -f "${INFRA_DIR}/monitoring/"
kubectl apply -f "${INFRA_DIR}/monitoring/"

# ─────────────────────────────────────────────────────────────
# 9. Apply SecretStore and ExternalSecrets
# ─────────────────────────────────────────────────────────────
step "🔑 Applying SecretStore and ExternalSecrets..."
kubectl apply -f "${INFRA_DIR}/secrets/secretstore-local.yaml"
kubectl apply -f "${INFRA_DIR}/secrets/external-secrets.yaml"

echo "⏳ Waiting for secrets to sync from Vault..."
sleep 5
kubectl wait --for=condition=Ready externalsecret/joblensai-secrets -n joblensai --timeout=60s || true

# ─────────────────────────────────────────────────────────────
# 10. Install ArgoCD
# ─────────────────────────────────────────────────────────────
step "🔄 Installing ArgoCD..."
ARGOCD_MANIFEST=https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
prepull_images "ArgoCD" -n argocd -f "$ARGOCD_MANIFEST"
kubectl apply -n argocd --server-side -f "$ARGOCD_MANIFEST"

echo "⏳ Waiting for ArgoCD components to be ready..."
for r in deployment/argocd-server deployment/argocd-repo-server deployment/argocd-dex-server \
         deployment/argocd-applicationset-controller deployment/argocd-notifications-controller \
         statefulset/argocd-application-controller deployment/argocd-redis; do
    kubectl rollout status "$r" -n argocd --timeout=15m
done
kubectl wait --namespace argocd --for=condition=Ready pod --all --timeout=15m

# ─────────────────────────────────────────────────────────────
# 11. Setup Gitea (Local Git Server)
# ─────────────────────────────────────────────────────────────
step "⏳ Waiting for Gitea to be ready..."
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
step "📦 Applying ArgoCD Applications..."
kubectl apply -f "${INFRA_DIR}/argocd/applications.yaml"

# ─────────────────────────────────────────────────────────────
# 12.5 Create Cloudflare Tunnel + Public Hostname via Zero Trust API
# ─────────────────────────────────────────────────────────────
step "☁️  Configuring Cloudflare Tunnel..."
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
  # Proper way to check each tunnel's name without --argjson
  TUNNEL_NAME=$(echo "$EXISTING_JSON" | jq -r --arg id "$id" '.result[] | select(.id == $id) | .name')
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
prepull_images "cloudflared" -f "${INFRA_DIR}/cloudflared/tunnel.yaml"
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
step "⏳ Waiting for ArgoCD to sync applications..."
sleep 10

echo "📊 ArgoCD Application Status:"
kubectl get applications -n argocd


# ─────────────────────────────────────────────────────────────
# 14. Setup Port Forwarding
# ─────────────────────────────────────────────────────────────
step "🌐 Setting up Port Forwarding..."
EXISTING_PID=$(lsof -t -i :8080 || true)
if [ ! -z "$EXISTING_PID" ]; then
    echo "🔹 Cleaning up existing port-forward (PID: $EXISTING_PID)..."
    kill -9 $EXISTING_PID || true
fi

# Get ArgoCD admin password
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

echo ""
echo "✅ Deployment Complete! (total $(fmt_dur "$SECONDS"))"
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
