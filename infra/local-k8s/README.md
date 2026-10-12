# Local Kubernetes (KinD + MetalLB + ArgoCD GitOps)

This directory sets up a local Kubernetes cluster using **KinD** that mirrors bare-metal and production environments using **MetalLB** for Load Balancing and **ArgoCD** for GitOps.

---

## Architecture Overview

```
[ Your Mac Host / Browser ]
       │
       ▼ (http://172.18.255.200 or http://localhost:8080)
[ MetalLB (Layer-2 LoadBalancer IP Pool: 172.18.255.200-250) ]
       │
       ▼
[ API Gateway Service (type: LoadBalancer, Port: 80) ]
       │
       ▼ (apps/api-gateway/nginx.conf.template)
┌───────┬───────────────┬──────────────────────┬─────────────┐
▼       ▼               ▼                      ▼             ▼
[web]  [auth-service]  [backend-service]  [payment-service] [notification-service]
```

- **LoadBalancer Provider:** **MetalLB** assigns external IPs from the local Docker CIDR (`172.18.255.200 - 172.18.255.250`).
- **Entrypoint:** `api-gateway` Service runs as `spec.type: LoadBalancer`. This matches Cloud (AWS EKS) and Bare-Metal contracts with 0% code differences.
- **GitOps:** ArgoCD synchronizes microservices from local Gitea using Helm (`values-local.yaml`).

---

## macOS Prerequisites (For Direct IP Access)

On macOS, Docker Desktop runs inside a lightweight Linux VM. To allow your macOS host to route traffic directly to the MetalLB Docker bridge IP (`172.18.255.200`), install `docker-mac-net-connect`:

```bash
brew install chipmk/tap/docker-mac-net-connect
sudo brew services start chipmk/tap/docker-mac-net-connect
```

Verify service is running:

```bash
sudo brew services list
```

---

## Quick Start (Local Kind)

### 1. Deploy the Cluster

```bash
./infra/local-k8s/scripts/deploy-local.sh
# or from root
pnpm k8s:deploy
```

### 2. Verify MetalLB IP Assignment

```bash
kubectl get svc api-gateway -n joblensai
```

Expected output:

```
NAME          TYPE           CLUSTER-IP     EXTERNAL-IP      PORT(S)
api-gateway   LoadBalancer   10.96.x.x      172.18.255.200   80:3xxxx/TCP
```

### 3. Access the Application

- **Direct MetalLB IP:** `http://172.18.255.200/` (or `http://172.18.255.200/health`)
- **Port-Forward Fallback:** `http://localhost:8080` (auto-started by deploy script)

---

## Bare Metal Deployment (Production)

For production on bare metal (or VMs), use **MetalLB + Cloudflare Tunnel** for secure public access without public IPs or port forwarding.

### Architecture (Bare Metal + Cloudflare Tunnel)

```
Internet → joblensai.in (DNS) → Cloudflare Edge → cloudflared (outbound tunnel) → api-gateway (LoadBalancer) → Microservices
```

### Prerequisites

1. **Bare metal server** (or VMs) with Kubernetes (kubeadm, k3s, Talos, etc.)
2. **Domain** (e.g., `joblensai.in`) managed by Cloudflare
3. **Cloudflare Zero Trust** account (free)

### Setup Steps

#### 1. Install Kubernetes on Bare Metal

```bash
# Example: k3s (lightweight)
curl -sfL https://get.k3s.io | sh -s - --disable=traefik

# Or kubeadm for full control
# https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/
```

#### 2. Install MetalLB with Your LAN Subnet

Update `infra/local-k8s/metallb/metallb-config.yaml` with your LAN IP range:

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: local-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.1.200-192.168.1.250 # Your LAN range (adjust to your network)
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-adv
  namespace: metallb-system
spec:
  ipAddressPools:
    - local-pool
```

Apply:

```bash
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.8/config/manifests/metallb-native.yaml
kubectl apply -f infra/local-k8s/metallb/metallb-config.yaml
```

#### 3. Create Cloudflare Tunnel

1. Go to **Cloudflare Dashboard → Zero Trust → Networks → Tunnels**
2. Click **Create a tunnel** → Name: `joblensai-baremetal`
3. Copy the **tunnel token** (long base64 string)

#### 4. Create Kubernetes Secret with Tunnel Token

```bash
kubectl create secret generic cloudflared-token \
  --namespace joblensai \
  --from-literal=tunnel-token="YOUR_TUNNEL_TOKEN_HERE"
```

#### 5. Deploy Cloudflare Tunnel (cloudflared)

```bash
kubectl apply -f infra/local-k8s/cloudflared/tunnel.yaml
```

#### 6. Configure Tunnel Public Hostname

In Cloudflare Tunnel config:

- **Subdomain:** `@` (for `joblensai.in`) or `www`
- **Domain:** `joblensai.in`
- **Service:** `HTTP://api-gateway.joblensai.svc.cluster.local:80`

#### 7. DNS Configuration

Cloudflare auto-creates CNAME if proxied (orange cloud):

- `joblensai.in` → `<tunnel-id>.cfargotunnel.com` (Proxied)

#### 8. Deploy Applications via ArgoCD

Follow the same GitOps flow:

```bash
# Push code to your Git server (Gitea, GitHub, GitLab)
# ArgoCD will sync all services including cloudflared
```

### Access

- **Public:** `https://joblensai.in` (Cloudflare handles SSL, DDoS, WAF)
- **Internal/LAN:** `http://<MetalLB-IP>` (direct to MetalLB IP)

---

## Teardown

```bash
./infra/local-k8s/scripts/stop-local.sh
# or
pnpm k8s:nuke
```
