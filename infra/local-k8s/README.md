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

## Quick Start

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

## Teardown

```bash
./infra/local-k8s/scripts/stop-local.sh
# or
pnpm k8s:nuke
```
