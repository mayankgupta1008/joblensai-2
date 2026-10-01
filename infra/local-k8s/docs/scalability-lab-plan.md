# JobLens AI — Kubernetes Scalability, Failure & Sharding Lab (Interview-Prep Plan)

> **How to run this plan:** you run every task yourself. After each task, paste your outputs and observations in chat. Claude reviews them like an interviewer would: one worked example, then your turn, then follow-up questions. Steps use `- [ ]` checkboxes. **No repo file changes until you approve the "Files" list for that task.**

**Goal:** Learn system-design basics hands-on: vertical and horizontal scaling, load balancing, autoscaling, statelessness, self-healing, graceful shutdown, rate limiting, caching, queues and partitions, replication, and sharding. You do it by running JobLens AI on local kind, loading it with k6, breaking it on purpose, and watching it live in FreeLens.

**Architecture:** `pnpm k8s:deploy` builds the kind cluster `joblensai` (1 control-plane + 2 workers). Infra YAML (`infra/local-k8s/**`) is applied with kubectl. App Helm charts (`apps/*/chart/**`) reach the cluster only through a commit → `pnpm k8s:push` → in-cluster Gitea → ArgoCD. metrics-server feeds the HPA and `kubectl top`. k6 runs as a throwaway Pod inside the cluster. The MongoDB replication and sharding labs run in their own namespaces, so the app database is never touched.

**Tech stack (verified on this Mac, 2026-10-01):** kind v0.33.0 (default node image Kubernetes v1.37.0), kubectl v1.37.1, Helm v4.3.0, ArgoCD `stable` manifests, metrics-server (latest release), k6 (`grafana/k6` image), MongoDB 8.2, `apache/kafka` (KRaft), FreeLens.

**Spec:** your chat requests on 2026-10-01: deploy everything on local k8s → stress test → watch pods scale, crash, and get recreated (FreeLens) → database sharding → full system-design understanding for interviews.

## Global constraints

- **Two delivery paths.** `infra/local-k8s/**` is applied with `kubectl apply` (the deploy script) and needs no commit. `apps/*/chart/**` must be **committed and pushed** (`pnpm k8s:push`). ArgoCD checks Git at most every 3 min (`timeout.reconciliation` is 120 s plus up to 60 s jitter, per the ArgoCD docs).
- **`pnpm k8s:push` commits everything.** It runs `git add -A` + `git commit -m "Local dev: <date>"` on your current branch, then pushes local `main` to Gitea ([push-to-gitea.sh](../scripts/push-to-gitea.sh)). Anything uncommitted, including this file, gets committed. Stay on `main`, because ArgoCD tracks `targetRevision: main`.
- **ArgoCD self-heal reverts manual edits.** All 7 ArgoCD apps use `automated: {prune: true, selfHeal: true}` ([applications.yaml](../argocd/applications.yaml)), so a manual `kubectl scale/edit/patch` on a chart-managed object gets undone (self-heal retries after about 5 s, per the ArgoCD docs). For experiments, either change Git or pause that app (Task 7 prep).
- **Numbers come from docs or from you.** Every "Expected" value cites a doc. Where no doc applies, the step says **Predict → measure**: write your prediction down before you run it.

## Review focus (most likely to fool you)

1. **"My change did nothing."** ArgoCD self-heal reverted it, or a chart change was never committed and pushed.
2. **HPA shows `<unknown>`.** metrics-server is missing (Task 1), or the container has no CPU request (k8s docs: no request means utilization is undefined and the HPA takes no action).
3. **The load generator is the bottleneck.** k6 runs on the same Docker VM as your app, so watch the k6 pod's CPU too. Never load-test through `kubectl port-forward`: it selects one matching Pod (k8s docs) and tunnels everything through kubectl.
4. **A `503` on `/api/auth/*` is the gateway rate limiter, not a crash.** The limit is 5 r/s per client IP with burst 10 ([nginx.conf.template:85](../../../apps/api-gateway/nginx.conf.template), `:133`), and nginx's default rejection status is 503.
5. **Stateful pods stay put when a worker dies.** local-path PVs carry node affinity for the node where they were created (local-path-provisioner README).

## Concept map: interview topic → where it lives in JobLens → task

| Concept                                                       | Where in your code/infra                                                                     | Task |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---- |
| Capacity, requests vs limits, QoS                             | `resources:` in every `values-local.yaml` (Node apps: 50m/128Mi requests, 250m/256Mi limits) | 2, 3 |
| Vertical scaling (scale up)                                   | In-place Pod resize; Docker Desktop VM size                                                  | 4    |
| Horizontal scaling + L4 load balancing                        | `replicaCount`, ClusterIP Service, kube-proxy (iptables mode = random backend)               | 5    |
| L7 gateway / reverse proxy                                    | `apps/api-gateway/nginx.conf.template` (auth_request, upstreams)                             | 5, 8 |
| Autoscaling (HPA)                                             | Charts have the `autoscaling.enabled` switch but **no `hpa.yaml`**                           | 6    |
| Self-healing, probes, restart back-off                        | `livenessProbe` / `readinessProbe` in values-local                                           | 7    |
| Graceful shutdown                                             | SIGTERM handled only in auth + notification                                                  | 7    |
| Node failure, PDB, drain                                      | kind workers, local-path PVs                                                                 | 7    |
| Stateless vs stateful app logic                               | payment `node-cron`, socket.io, nginx in-memory rate limit + cache                           | 8    |
| Idempotency + distributed lock                                | `payment.middleware.ts` (Redis `SET NX EX` + DB check)                                       | 8    |
| Rate limiting (local vs distributed)                          | nginx `limit_req` zone per gateway pod                                                       | 8    |
| Caching + invalidation                                        | nginx `proxy_cache` on `/_validate_token` (200 cached 5 min)                                 | 8    |
| Connection pooling                                            | mongoose default pool (`maxPoolSize` 100 per client)                                         | 8    |
| Message queue, partitions, consumer groups, at-least-once     | Kafka topic `notification.email` (1 partition), group `notification-service`                 | 9    |
| Replication, elections, quorum                                | MongoDB replica-set lab                                                                      | 10   |
| Sharding / partitioning, shard key, hot spots, scatter-gather | MongoDB sharding lab using your `notifications` / `users` / `jobs` models                    | 11   |

## Approval list: every file this plan touches

| #   | File                                                                                                                  | Change                                                                                                                                                      | Why (proof)                                                                                                                                                                                                                                                         | Task |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| 1   | [stateful/mongodb.yaml:21](../stateful/mongodb.yaml)                                                                  | `mongo:latest` → `mongo:8.2`                                                                                                                                | MongoDB 8.0.21–8.0.29 / 8.3.0–8.3.8 exit at startup on Linux kernel 6.19–7.0.13 (SERVER-125742). kind nodes are Docker containers on the same Docker Desktop VM kernel. Your docker-compose already pins 8.2, which was verified working on this Mac on 2026-09-24. | 1    |
| 2   | [scripts/deploy-local.sh](../scripts/deploy-local.sh)                                                                 | Install metrics-server + `--kubelet-insecure-tls`                                                                                                           | The HPA needs `metrics.k8s.io`, "provided by an add-on named Metrics Server, which needs to be launched separately" (k8s HPA docs). kubeadm kubelet serving certs are self-signed, so metrics-server needs the flag (kubeadm docs + metrics-server README).         | 1    |
| 3   | [kind-config.yaml](../kind-config.yaml)                                                                               | Add 2 `worker` nodes                                                                                                                                        | Needed for the node-failure, drain, and PDB labs. kind can't change an existing cluster, so this needs `pnpm k8s:nuke` first.                                                                                                                                       | 1    |
| 4   | [stateful/kafka.yaml](../stateful/kafka.yaml)                                                                         | Add `KAFKA_LOG_DIRS=/var/lib/kafka/data`                                                                                                                    | The PVC is mounted at `/var/lib/kafka/data` (`:52`), but `log.dirs` is never set, so Kafka falls back to `/tmp/kafka-logs` on the container's throwaway filesystem (proof in Task 9). Applied **after** you watch the data loss happen.                             | 9    |
| 5   | `infra/local-k8s/loadtest/backend-health.js` (new)                                                                    | k6 ramp script                                                                                                                                              | Load generator                                                                                                                                                                                                                                                      | 4    |
| 6   | `apps/backend/chart/templates/hpa.yaml` (new) + [values-local.yaml:74](../../../apps/backend/chart/values-local.yaml) | HPA template + `autoscaling` values                                                                                                                         | No chart has an HPA template today (`git ls-files apps/*/chart`)                                                                                                                                                                                                    | 6    |
| 7   | auth / api-gateway charts                                                                                             | Same HPA pattern (**your turn**). The gateway also needs a replicas guard at [deployment.yaml:9](../../../apps/api-gateway/chart/templates/deployment.yaml) | k8s docs: remove `spec.replicas` when an HPA manages the workload                                                                                                                                                                                                   | 6    |
| 8   | `apps/backend/chart/templates/pdb.yaml` (new, **your turn**)                                                          | PodDisruptionBudget                                                                                                                                         | Drain lab                                                                                                                                                                                                                                                           | 7    |
| 9   | `infra/local-k8s/labs/mongo-replicaset.yaml` (new)                                                                    | 3-member replica set in namespace `mongo-rs`                                                                                                                | Replication lab, isolated from the app DB                                                                                                                                                                                                                           | 10   |
| 10  | `infra/local-k8s/labs/mongo-sharded.yaml` (new)                                                                       | config RS + 2 shards + mongos in namespace `mongo-shard`                                                                                                    | Sharding lab, isolated from the app DB                                                                                                                                                                                                                              | 11   |

**Not changed (verified fine):** the 6 Node/web Deployment templates already render `replicas` only when `autoscaling.enabled` is false ([backend deployment.yaml:8-10](../../../apps/backend/chart/templates/deployment.yaml)). That is exactly what the k8s docs and the ArgoCD best-practice doc ask for, so HPA and ArgoCD won't fight. No ArgoCD, ingress, or secrets change is needed.

**Code bugs found but NOT fixed by this plan** (you observe them in Tasks 7–9, then we decide on fixes together):

- No SIGTERM handler in backend / payment / agent-service. All three run `CMD ["node", "dist/index.js"]`, so Node is PID 1.
- Payment `node-cron` runs inside every payment pod ([cron.ts:9](../../../apps/payment/src/lib/cron.ts), started at [index.ts:35](../../../apps/payment/src/index.ts)).
- The cron's `SUBSCRIPTION_REMINDER` payload has no `userId` ([cron.ts:38-44](../../../apps/payment/src/lib/cron.ts)), but the consumer builds `new Notification({ userId: emailData.data.userId, … })` ([email.consumer.ts:128-133](../../../apps/notification/src/lib/email-service/email.consumer.ts)) and the model marks `userId` as `required`. Every reminder message fails validation.
- The socket.io client uses default transports ([socket-client.ts:4-11](../../../apps/web/src/lib/socket-client.ts)), so it needs sticky sessions once notification has more than 1 replica (Task 8).
- `connectionStateRecovery` is enabled together with the Redis adapter ([socket.ts:7-16](../../../apps/notification/src/lib/socket.ts)). The socket.io docs list the Redis adapter as not supporting it, so recovery silently does nothing.
- Kafka `log.dirs` is unset, so data lives in `/tmp/kafka-logs` inside the container and is lost on every Kafka container restart (Task 9).
- Side note, unrelated to scaling: the gateway has no `location` for `/api/job` (backend mounts job routes there), and it proxies `/api/agent/`, while agent-service mounts `/api/agent-service/*`. Per nginx matching rules, both fall through to `location /` (web) or 404. Verify with curl before trusting it.
- Backend [values-prod.yaml](../../../apps/backend/chart/values-prod.yaml) sets `autoscaling.enabled: true`, but there's no `hpa.yaml`. Rendered for prod, you'd get a Deployment with no `replicas` field ("Defaults to 1", per the k8s API reference) and no HPA, so prod would run 1 pod with no autoscaling. File #6 fixes that too.

---

## Task 0: Pre-flight (no file changes)

**Concept: capacity starts with hardware.** kind nodes are Docker containers ("a tool for running local Kubernetes clusters using Docker container 'nodes'", per kind.sigs.k8s.io). The kind docs say extra nodes "will not add more real compute capacity". Every pod shares the Docker Desktop VM.

- [ ] **Step 1:** Start Docker Desktop. Open Settings → Resources and write down the CPUs and Memory.
- [ ] **Step 2:** Record the kernel and capacity.

```bash
docker info --format 'CPUs={{.NCPU}} Mem={{.MemTotal}} Kernel={{.KernelVersion}}'
```

Decision rule (SERVER-125742): if the kernel is between 6.19 and 7.0.13, MongoDB 8.0.21–8.0.29 and 8.3.0–8.3.8 exit at startup, and the ticket says affected kernels made MongoDB crash after about 60 s. Kernel 7.0.14+ "restored the previous userspace behavior". Keep the `mongo:8.2` pin from Task 1 either way, because `latest` is not reproducible.

- [ ] **Step 3:** Check the tools: `kind version` (v0.33.0), `kubectl version --client` (v1.37.1), `helm version --short` (v4.3.0). k6 is **not** needed on the Mac because it runs as a Pod. `brew install k6` is optional.
- [ ] **Step 4:** Run `kind get clusters`. If `joblensai` is listed and you approved the kind-config change, run `pnpm k8s:nuke`. This deletes the cluster and every PVC, which is fine because local data is throwaway. Why: [deploy-local.sh](../scripts/deploy-local.sh) only creates the cluster when it's missing, so a new kind-config is silently ignored for an existing cluster.
- [ ] **Step 5:** Confirm you're on `main`: `git branch --show-current`.

---

## Task 1: Pre-deploy fixes (needs your approval)

**Files:**

- Modify: `infra/local-k8s/stateful/mongodb.yaml:21`
- Modify: `infra/local-k8s/kind-config.yaml` (append 2 workers)
- Modify: `infra/local-k8s/scripts/deploy-local.sh` (new section 3b)

- [ ] **Step 1: Pin MongoDB.**

```diff
-          image: mongo:latest
+          image: mongo:8.2
```

- [ ] **Step 2: Add workers** (append at the end of `nodes:`).

```diff
       - containerPort: 443
         hostPort: 443
         protocol: TCP
+  - role: worker
+  - role: worker
```

What changes (verified in the kind source, `kubeadminit/init.go`): kind removes the control-plane taint **only when `len(allNodes) == 1`**. With workers, the control-plane keeps `node-role.kubernetes.io/control-plane:NoSchedule`, so app pods run on the 2 workers. The ingress-nginx kind manifest tolerates that taint and uses `hostPort: 80/443`, but it only selects `kubernetes.io/os: linux`, so the controller may land on any node. App access stays through the script's `kubectl port-forward … 8080:80`, which works from any node. `kind load docker-image` "Loads docker images from host into all or specified nodes" (`kind load docker-image --help`), so `pullPolicy: Never` keeps working on workers.

- [ ] **Step 3: Add metrics-server to the deploy script.** Insert this after section `# 3. Install Ingress Controller` and before `# 4. Create Namespace`. It mirrors the script's existing ingress `kubectl patch … args/-` pattern.

```bash
# ─────────────────────────────────────────────────────────────
# 3b. Install metrics-server (HPA + kubectl top)
# ─────────────────────────────────────────────────────────────
echo "📈 Installing metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[
  {"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}
]' 2>/dev/null || true
kubectl rollout status deployment/metrics-server -n kube-system --timeout=120s
```

- [ ] **Step 4: Check the shell syntax.** `bash -n infra/local-k8s/scripts/deploy-local.sh` should print nothing.

---

## Task 2: Deploy everything + connect FreeLens

- [ ] **Step 1:** Run `pnpm k8s:deploy`. It ends with a **blocking** `kubectl port-forward … 8080:80`, so leave that terminal open and use a second one.
- [ ] **Step 2: Nodes.**

```bash
kubectl get nodes -o wide
kubectl describe node joblensai-control-plane | grep Taints
```

Expected: 3 nodes `Ready`, and the control-plane shows the `control-plane:NoSchedule` taint (kind source, Task 1 Step 2).

- [ ] **Step 3: Pods + placement.** Run `kubectl get pods -A -o wide`. Every pod should be `Running`. Write down which node each StatefulSet pod (mongodb-0, kafka-0, redis-0 …) landed on, because you'll need it in Task 7.
- [ ] **Step 4: GitOps state.** Run `kubectl get applications -n argocd`. All 7 apps should be `Synced` / `Healthy`.
- [ ] **Step 5: Smoke test.** `curl -s http://localhost:8080/health` should print `OK` (served by the gateway's `location = /health`).
- [ ] **Step 6: Metrics API.** `kubectl top nodes` and `kubectl top pods -n joblensai` should show numbers, not "Metrics API not available".
- [ ] **Step 7: Mongo stability.** Run `kubectl get pod mongodb-0 -n joblensai -w` for 3 minutes. RESTARTS should stay `0` (the kernel issue showed up as a crash after about 60 s).
- [ ] **Step 8: Capacity snapshot.** Run `kubectl describe nodes | grep -A 8 "Allocated resources"` and note the CPU and memory **requests** % per worker. This is what the scheduler fills up, not actual usage.
- [ ] **Step 9: FreeLens.** `kubectl config get-contexts` should list `kind-joblensai` (kind names contexts `kind-<cluster>`). Add that context in FreeLens and pin: Workloads → Pods (namespace `joblensai`), Deployments, StatefulSets; Config → Horizontal Pod Autoscalers; Events; Nodes.

  What FreeLens will and won't show:
  - **Pod/node CPU and memory columns** come from metrics-server. A FreeLens user writes: "metrics-server is enough for the quick glance columns in modern Freelens versions, but not for the whole UI" (p4block, 2026-07-07).
  - **Detailed charts** need Prometheus with kubelet cAdvisor + kube-state-metrics + node-exporter data (same source). FreeLens issue #791 reports that detection works with the Prometheus Community chart.
  - **Your Prometheus** ([prometheus.yaml](../monitoring/prometheus.yaml)) only scrapes app `/metrics` + node-exporter, so expect empty FreeLens charts. Use the columns, Events, the HPA view, and `kubectl top` instead. Adding cAdvisor/kube-state-metrics is **not in this plan** (it needs RBAC + new manifests). Ask if you want it.

- [ ] **Step 10: Terminal live views.** These match FreeLens; run them in split panes during every test. macOS has no `watch`, so use a loop.

```bash
kubectl get pods -n joblensai -o wide -w
kubectl get events -n joblensai --watch
while true; do clear; kubectl top pods -n joblensai; sleep 5; done
```

---

## Task 3: Requests, limits, QoS (concept check, 10 min)

**Concept:** **requests** are what the scheduler reserves, and the HPA measures utilization **as a % of the request** (k8s HPA docs). **Limits** are enforced differently: "CPU limits are enforced by CPU throttling", while memory limits are enforced "with out of memory (OOM) kills" (k8s resource docs). Your Node apps request 50m CPU and are capped at 250m ([values-local.yaml:66-72](../../../apps/backend/chart/values-local.yaml)).

- [ ] **Step 1:** Print backend's QoS class.

```bash
kubectl get pod -n joblensai -l app.kubernetes.io/instance=backend -o jsonpath='{.items[0].status.qosClass}{"\n"}'
```

Note that `app.kubernetes.io/instance` is the Helm release name, and ArgoCD uses the Application name as the release name (ArgoCD Helm docs).

- [ ] **Step 2 (your turn):** Explain in 3 lines why a pod using 100m CPU shows **200 %** in the HPA. Then explain what happens to a Node.js pod that wants 400m but is limited to 250m.

---

## Task 4: Baseline load test + vertical scaling

**Files:**

- Create: `infra/local-k8s/loadtest/backend-health.js`

**Concept:** **Vertical scaling** means a bigger box (more CPU/RAM per instance). It's simple, but it is capped by node size, it remains a single point of failure, and it often needs a restart. Node.js "runs JavaScript code in the Event Loop … and offers a Worker Pool" (Node.js docs), so one Node process uses about one core for JS.

- [ ] **Step 1: Write the k6 script.** Thresholds use the k6 docs syntax. k6 exits non-zero if a threshold fails.

```js
import http from "k6/http";
import { check } from "k6";

const TARGET = __ENV.TARGET || "http://backend.joblensai.svc.cluster.local:5001/api/backend/health";

export const options = {
  scenarios: {
    ramp: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 20 },
        { duration: "3m", target: 50 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<200"],
  },
};

export default function () {
  const res = http.get(TARGET);
  check(res, { "status 200": (r) => r.status === 200 });
}
```

- [ ] **Step 2: Run the baseline (1 replica).** k6 reads the script from stdin when the file name is `-` (k6 docs, "Running k6").

```bash
kubectl run k6 -n joblensai --rm -i --restart=Never --image=grafana/k6 -- \
  run -e TARGET=http://backend.joblensai.svc.cluster.local:5001/api/backend/health - \
  < infra/local-k8s/loadtest/backend-health.js
```

**Predict → measure:** write down your guess for max RPS and p95 first. Then record `http_reqs` (rate), `http_req_duration` p95, `http_req_failed`, backend CPU (FreeLens / `kubectl top`), and the **k6 pod's own CPU**.

- [ ] **Step 3: Scale up live, without a restart.** In-place resize has been stable since k8s v1.35 and needs kubectl ≥ v1.32; you have v1.37.1. The container name is the chart name, `joblensai-backend`.

```bash
POD=$(kubectl get pod -n joblensai -l app.kubernetes.io/instance=backend -o jsonpath='{.items[0].metadata.name}')
kubectl patch pod "$POD" -n joblensai --subresource resize \
  -p '{"spec":{"containers":[{"name":"joblensai-backend","resources":{"limits":{"cpu":"1"}}}]}}'
kubectl get pod "$POD" -n joblensai -o jsonpath='{.status.containerStatuses[0].resources}{"\n"}{.status.containerStatuses[0].restartCount}{"\n"}'
```

Re-run Step 2. Then repeat with `"cpu":"2"`. **Predict → measure:** how much does 1 → 2 CPU help a single Node process?

- [ ] **Step 4:** Note what ArgoCD does. ArgoCD manages the **Deployment**; this Pod-level resize isn't in Git. Confirm the app stays `Synced`. Then delete the pod and watch the new one come back at 250m.
- [ ] **Step 5 (your turn): permanent vertical scaling.** Set backend `resources.limits.cpu: 500m` in values-local.yaml → `pnpm k8s:push` → watch FreeLens: a new ReplicaSet appears and the old pod terminates. Explain **why** pods restarted.

**Interview drill:** When is vertical scaling the right call? Name 3 limits of scaling up. Why do Node.js services usually scale out instead of up? What does a Vertical Pod Autoscaler do differently from an HPA?

---

## Task 5: Horizontal scaling + load balancing

**Concept:** **Horizontal scaling** means more identical, stateless instances behind a load balancer. kube-proxy (iptables mode, which is kind's default) installs rules that "select a backend Pod at random" (k8s virtual-IPs docs). That's L4, per connection. Your nginx gateway is L7.

- [ ] **Step 1: Try it the imperative way.**

```bash
kubectl scale deployment backend -n joblensai --replicas=3
kubectl get deploy backend -n joblensai -w
```

**Predict → measure:** what does ArgoCD `selfHeal` do within a few seconds?

- [ ] **Step 2: Do it the declarative way.** Set `replicaCount: 3` in [backend values-local.yaml:4](../../../apps/backend/chart/values-local.yaml) → `pnpm k8s:push` → wait up to 3 min, or click Sync in the ArgoCD UI (`kubectl port-forward svc/argocd-server -n argocd 9090:443`).
- [ ] **Step 3: Check endpoints.**

```bash
kubectl get endpointslices -n joblensai -l kubernetes.io/service-name=backend -o wide
```

You should see 3 ready endpoints (FreeLens → Network → Endpoints).

- [ ] **Step 4:** Re-run the Task 4 Step 2 k6 command. Compare RPS, p95, and per-pod CPU with the 1-replica run. If you look at Grafana: app metrics jump between pods. [prometheus.yaml](../monitoring/prometheus.yaml) scrapes each **Service DNS name** (`static_configs`), and kube-proxy sends each scrape to a random pod. Trust `kubectl top` / FreeLens for per-pod numbers.
- [ ] **Step 5 (your turn): capacity planning.** From your numbers, compute RPS per pod at p95 < 200 ms, then how many pods 3× today's traffic needs. Write the math and I'll challenge it.
- [ ] **Step 6: Run out of cluster.** Set `replicaCount: 40` → push.

```bash
kubectl get pods -n joblensai --field-selector=status.phase=Pending
kubectl describe pod <one-pending-pod> -n joblensai | tail -5
```

Expected (k8s resource docs): `Pending` with a `FailedScheduling` … `Insufficient cpu` (or memory) event, because scheduling sums **requests** against node allocatable. Afterwards, set `replicaCount` back to 1 and push.

**Interview drill:** What's the difference between L4 and L7 load balancing? Why must instances be stateless? What breaks with in-memory sessions? What adds nodes when pods are Pending in the cloud (Cluster Autoscaler / Karpenter)?

---

## Task 6: HPA. Worked example: backend (then your turn)

**Files:**

- Create: `apps/backend/chart/templates/hpa.yaml`
- Modify: `apps/backend/chart/values-local.yaml:74-75`

**Concept:** `desiredReplicas = ceil(currentReplicas × currentMetricValue / desiredMetricValue)`. The control loop runs every 15 s. Default behaviour: scale-up allows `+100%` or `+4 pods` per 15 s with no stabilization. Scale-down uses a **300 s stabilization window** (k8s HPA docs).

- [ ] **Step 1: Failing check first (no HPA renders today).**

```bash
helm template backend apps/backend/chart -f apps/backend/chart/values-local.yaml | grep -c "kind: HorizontalPodAutoscaler"
```

Expected: `0`.

- [ ] **Step 2: Create `apps/backend/chart/templates/hpa.yaml`.** This is copied from `helm create` (Helm v4.3.0) with the chart's own `chart.*` helpers.

```yaml
{{- if .Values.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "chart.fullname" . }}
  labels:
    {{- include "chart.labels" . | nindent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "chart.fullname" . }}
  minReplicas: {{ .Values.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.autoscaling.maxReplicas }}
  metrics:
    {{- if .Values.autoscaling.targetCPUUtilizationPercentage }}
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetCPUUtilizationPercentage }}
    {{- end }}
    {{- if .Values.autoscaling.targetMemoryUtilizationPercentage }}
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: {{ .Values.autoscaling.targetMemoryUtilizationPercentage }}
    {{- end }}
{{- end }}
```

- [ ] **Step 3: Enable it in values-local.yaml.** The keys match values-prod.yaml.

```diff
 autoscaling:
-  enabled: false
+  enabled: true
+  minReplicas: 1
+  maxReplicas: 5
+  targetCPUUtilizationPercentage: 70
```

- [ ] **Step 4: Check that it passes.**

```bash
helm template backend apps/backend/chart -f apps/backend/chart/values-local.yaml | grep -c "kind: HorizontalPodAutoscaler"
helm template backend apps/backend/chart -f apps/backend/chart/values-local.yaml | grep -n "^  replicas:"
```

Expected: `1`, and no `replicas:` line. The Deployment template drops it when autoscaling is on, which is what the k8s docs ask for: "you should remove the `spec.replicas` field".

- [ ] **Step 5:** Run `pnpm k8s:push`, then `kubectl get hpa -n joblensai`. Expected: `backend  Deployment/backend  cpu: <n>%/70%  1  5  1`.
- [ ] **Step 6:** Start k6 (Task 4 Step 2) and watch FreeLens → Config → Horizontal Pod Autoscalers, plus:

```bash
kubectl get hpa -n joblensai -w
kubectl describe hpa backend -n joblensai | tail -15
```

Record when replicas went 1 → 2 → … and the `SuccessfulRescale` events.

- [ ] **Step 7:** When k6 ends, time the scale-down. Expected: replicas hold for about 5 min (the 300 s window) before dropping.
- [ ] **Step 8 (your turn): request sensitivity.** Use the formula to predict how backend scales with `requests.cpu: 50m` vs `200m` under the same load. Change the value, push, measure, and explain.
- [ ] **Step 9 (your turn): HPA for auth** (same 3 steps). Then the **api-gateway**: its Deployment always renders `replicas` ([deployment.yaml:9](../../../apps/api-gateway/chart/templates/deployment.yaml)), so first add the `{{- if not .Values.autoscaling.enabled }}` guard, then hpa.yaml and the values. Don't autoscale payment or notification until Tasks 8–9, which show why.

**Interview drill:** Walk through the HPA formula with numbers. Why is scale-down slower than scale-up? What's flapping? When would you scale on RPS or queue lag instead of CPU (custom metrics, KEDA)? How do readiness probes and cold start affect autoscaling?

---

## Task 7: Crash lab (self-healing, probes, OOM, shutdown, node failure)

**Prep: pause and resume ArgoCD for the app you break.** The ArgoCD docs say: "When the `enabled` field is set to false, controller will skip automated sync."

```bash
kubectl -n argocd patch application backend --type merge -p '{"spec":{"syncPolicy":{"automated":{"enabled":false}}}}'
kubectl -n argocd get application backend -o jsonpath='{.spec.syncPolicy.automated}{"\n"}'   # must show "enabled":false
# resume (re-applying applications.yaml would NOT remove the patched field, so patch it back):
kubectl -n argocd patch application backend --type merge -p '{"spec":{"syncPolicy":{"automated":{"enabled":true}}}}'
```

If the get command doesn't show `enabled`, your ArgoCD build doesn't have the field. Fall back to `kubectl -n argocd patch application backend --type json -p '[{"op":"remove","path":"/spec/syncPolicy/automated"}]'` and restore with `kubectl apply -f infra/local-k8s/argocd/applications.yaml`.

Facts from the k8s pod-lifecycle docs used below:

- Restart back-off is "exponential back-off delay (10s, 20s, 40s …) capped at five minutes, and is reset after ten minutes of successful execution".
- On termination, "the kubelet sends the SIGTERM signal to the main process (PID 1) … waits for a grace period (default 30 seconds) … then … SIGKILL".
- Terminating pods are removed from ready endpoints.

- [ ] **7.1 Kill a pod.** With backend at 2+ replicas and k6 running: `kubectl delete pod -n joblensai <one-backend-pod>`. Watch FreeLens: the ReplicaSet creates a replacement. Record time-to-Ready and any k6 errors.
- [ ] **7.2 Graceful vs not.** Backend has **no** SIGTERM handler. auth has one ([index.ts:70](../../../apps/auth/src/index.ts)). Both run `node dist/index.js` as PID 1. The docker-node docs say: "a Node.js process running as PID 1 will not respond to SIGINT … and similar signals." **Predict → measure:**

```bash
time kubectl delete pod -n joblensai -l app.kubernetes.io/instance=backend --wait
time kubectl delete pod -n joblensai -l app.kubernetes.io/instance=auth --wait
```

Explain the difference you see. Also note that auth's handler calls `process.exit(0)` without `server.close()`. What happens to in-flight requests?

- [ ] **7.3 OOMKilled → CrashLoopBackOff.** Pause backend first. The request must be ≤ the limit or the API rejects it.

```bash
kubectl set resources deployment backend -n joblensai --requests=memory=32Mi --limits=memory=40Mi
kubectl get pods -n joblensai -l app.kubernetes.io/instance=backend -w
kubectl get pod <pod> -n joblensai -o jsonpath='{.status.containerStatuses[0].lastState}{"\n"}'
```

Expected (k8s memory docs): `reason: OOMKilled`, `exitCode: 137`, RESTARTS climbing, then `CrashLoopBackOff` with growing gaps. If 40Mi doesn't OOM, go lower. Afterwards, resume ArgoCD, which restores the chart values.

- [ ] **7.4 Liveness failure** (pause first).

```bash
kubectl patch deployment backend -n joblensai --type json -p '[{"op":"replace","path":"/spec/template/spec/containers/0/livenessProbe/httpGet/path","value":"/does-not-exist"}]'
```

Expected: `Liveness probe failed: HTTP probe failed with statuscode: 404` events, then restarts. Timing comes from your values: initialDelay 60 s, period 30 s, failureThreshold 3.

- [ ] **7.5 Readiness failure.** Same command with `readinessProbe`. **Predict → measure:** does the pod restart? Is it still in `kubectl get endpointslices … backend`?
- [ ] **7.6 Node failure.** Find a worker that runs app pods, then:

```bash
docker stop joblensai-worker
kubectl get nodes -w
```

Expected: the node goes `NotReady`. Pods are evicted only after the automatic `tolerationSeconds=300` for `node.kubernetes.io/not-ready` / `unreachable` (k8s taint docs). Then Deployment pods get recreated on the other worker. **StatefulSet pods on that node can't move**, because local-path PVs carry `kubernetes.io/hostname` node affinity. Afterwards run `docker start joblensai-worker`.

- [ ] **7.7 Drain + PDB (your turn: write `templates/pdb.yaml`).** Start from the k8s doc example (`policy/v1`, `minAvailable`, `selector.matchLabels`). Use `{{- include "chart.selectorLabels" . | nindent 6 }}` for the selector. Then:

```bash
kubectl drain joblensai-worker2 --ignore-daemonsets --delete-emptydir-data
kubectl uncordon joblensai-worker2
```

Expected (k8s drain docs): an eviction that would violate the PDB is refused with 429, and drain keeps retrying. Try it with 1 replica + `minAvailable: 1`, then with 2 replicas.

- [ ] **7.8 Restarts under load.** Put backend back to 1 replica and no HPA, then run k6. **Predict → measure:** with CPU capped at 250m, does `/api/backend/health` ever exceed the 5 s liveness timeout and trigger restarts? This is how cascading failures start.

**Interview drill:** Liveness vs readiness vs startup probes: what should each check (never dependencies in liveness)? What's graceful shutdown + connection draining (preStop, SIGTERM, grace period)? What is MTTR? What's the difference between voluntary and involuntary disruptions (PDBs only cover voluntary)?

---

## Task 8: What breaks when YOUR code scales out

**Concept:** horizontal scaling only works if every replica is interchangeable. Anything kept **inside one process** (timers, sockets, counters, caches) changes behaviour when you add replicas.

- [ ] **8.1 Duplicate cron.** Scale payment to 2 (values-local `replicaCount: 2` → push), then:

```bash
kubectl logs -n joblensai -l app.kubernetes.io/instance=payment --prefix --tail=500 | grep "Cron Jobs Initialized"
```

Expected: 1 line **per pod**, which means each pod will send every midnight reminder (and make every Razorpay fetch) once. **Your turn:** compare 3 fixes: (a) a k8s CronJob (`concurrencyPolicy: Forbid`); note the k8s docs warn a CronJob can still create multiple Jobs in rare cases, so the job must be idempotent; (b) a Redis lock `SET … NX EX`, the same pattern as your [payment.middleware.ts:29-30](../../../apps/payment/src/middlewares/payment.middleware.ts); (c) leader election. Pick one and defend it.

- [ ] **8.2 socket.io with 3 notification pods.**

  Facts:
  - The client uses default transports ([socket-client.ts:4-11](../../../apps/web/src/lib/socket-client.ts)), so it starts with HTTP long-polling.
  - The gateway proxies `/socket.io/` to the notification **ClusterIP** ([nginx.conf.template:193](../../../apps/api-gateway/nginx.conf.template)), and kube-proxy picks a random pod per connection.
  - The socket.io docs require that with multiple servers "All subsequent requests from that client (including HTTP long-polling requests) are routed to the same server" (sticky sessions). They add: "When you configure the Socket.IO client to not use HTTP long-polling … sticky sessions are no longer required", with the caveat that clients in restrictive networks may then fail to connect.
  - The server enables `connectionStateRecovery` ([socket.ts:7-12](../../../apps/notification/src/lib/socket.ts)) together with the Redis adapter ([socket.ts:16](../../../apps/notification/src/lib/socket.ts)). The socket.io docs mark the Redis adapter **not compatible**: "Persisting the packets is not compatible with the Redis PUB/SUB mechanism."

  Experiment: set notification `replicaCount: 3` → push → open the web app logged in → DevTools → Network → filter `socket.io`. **Predict → measure:** do polling requests fail? With which status/error? Does the socket end up connected?

  **Your turn:** compare 3 fixes: (a) `transports: ["websocket"]`, (b) sticky routing at the gateway (nginx `hash` on a cookie; this needs per-pod upstream addresses), (c) Service/ingress session affinity. And what would you do about connection-state recovery?

- [ ] **8.3 The rate limit multiplies with gateway pods.** `limit_req_zone` "sets parameters for a shared memory zone", which belongs to one nginx instance, so each gateway pod counts separately. Rejected requests get `503` (nginx docs). Run a steady 30 RPS (k6 `constant-arrival-rate` executor, per the k6 docs) against `/api/auth/health` through the gateway, first with 1 and then with 2 gateway replicas (`replicaCount: 2` in the api-gateway values-local → push), and compare the `503` checks:

  ```bash
  cat <<'EOF' | kubectl run k6 -n joblensai --rm -i --restart=Never --image=grafana/k6 -- run -
  import http from 'k6/http';
  import { check } from 'k6';
  export const options = {
    scenarios: { steady: { executor: 'constant-arrival-rate', rate: 30, timeUnit: '1s', duration: '1m', preAllocatedVUs: 10, maxVUs: 50 } },
  };
  export default function () {
    const res = http.get('http://api-gateway.joblensai.svc.cluster.local/api/auth/health');
    check(res, { 'is 200': (r) => r.status === 200, 'is 503': (r) => r.status === 503 });
  }
  EOF
  ```

  **Your turn:** how would you make it global? (A shared store such as Redis, or limiting at the edge.)

- [ ] **8.4 The auth cache is per pod and delays revocation.** `/_validate_token` responses are cached `200 → 5m`, `401/403 → 1m` in `/tmp` of each gateway pod ([nginx.conf.template:108-111](../../../apps/api-gateway/nginx.conf.template)). **Your turn:** what's the hit ratio with N gateway pods? How long can a revoked token still work? Is that acceptable?
- [ ] **8.5 Connection pools multiply.** The MongoDB Node driver defaults to `maxPoolSize` **100** per `MongoClient` (MongoDB docs), and each pod has its own client.

```bash
MU=$(kubectl get secret joblensai-secrets -n joblensai -o jsonpath='{.data.MONGO_INITDB_ROOT_USERNAME}' | base64 -d)
MP=$(kubectl get secret joblensai-secrets -n joblensai -o jsonpath='{.data.MONGO_INITDB_ROOT_PASSWORD}' | base64 -d)
kubectl exec -n joblensai mongodb-0 -- mongosh -u "$MU" -p "$MP" --authenticationDatabase admin --quiet --eval 'db.serverStatus().connections'
```

Compare `current` with backend at 1 vs 5 pods under k6.

**Interview drill:** What makes a service stateless? How do you run a singleton job in a replicated service? What are idempotency keys, and how does your payment middleware use one? What's the difference between local and distributed rate limiting? How do you invalidate a cache?

---

## Task 9: Kafka: consumers, partitions, broker crash

**Files:**

- Modify (Step 5 only, after you've seen the problem): `infra/local-k8s/stateful/kafka.yaml` env block, after `CLUSTER_ID`

**Concept: two different things "scale" in Kafka.**

1. **Consumers** (your notification pods) scale with replicas, but parallelism per consumer group is capped by partitions: "there cannot be more consumer instances in a consumer group than partitions" (Kafka docs). Your topic is created with `numPartitions: 1` ([kafka.config.ts:44-50](../../../packages/shared/src/utils/kafka.config.ts)), and the group is `notification-service` ([email.consumer.ts:22](../../../apps/notification/src/lib/email-service/email.consumer.ts)).
2. **Brokers** (`kafka-0`) are stateful. Adding brokers doesn't move data: new servers "will not automatically be assigned any data partitions, so unless partitions are moved to them they won't be doing any work until new topics are created" (Kafka 4.1 ops docs). Kafka also needs "a unique broker id" per server (same doc). Your StatefulSet template gives every pod the same `KAFKA_NODE_ID=1` ([kafka.yaml:28-29](../stateful/kafka.yaml)), a single voter `1@localhost:9093` (`:40-41`), and one advertised address `kafka:9092` (`:34-35`). So `kubectl scale sts kafka --replicas=3` cannot work here. Real multi-broker clusters need per-pod IDs and listeners, a replication factor ≥ 3, and partition reassignment. That's usually an operator's job (e.g. Strimzi), which is concept-only in this plan.

**Proof that today a Kafka restart wipes the data:**

- The `apache/kafka` image README says: "If properties are provided via environment variables only, all required properties must be specified." Your kafka.yaml is env-only and has no `KAFKA_LOG_DIRS`.
- Kafka source (`ServerLogConfigs`): `log.dirs` "If not set, the value in log.dir is used", and `log.dir` defaults to `/tmp/kafka-logs`.
- k8s Volumes docs: "After a crash, kubelet restarts the container with a clean state."

Helper used below (works in zsh and bash):

```bash
kt() { kubectl exec -i -n joblensai kafka-0 -- /opt/kafka/bin/"$@"; }
```

- [ ] **Step 1: Inspect the current state** and prove where the data really lives.

```bash
kt kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic notification.email
kt kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group notification-service
kubectl exec -n joblensai kafka-0 -- sh -c 'grep -E "^log\.dirs?=" /opt/kafka/config/server.properties; echo "--- PVC:"; ls /var/lib/kafka/data; echo "--- /tmp:"; ls /tmp'
```

The image's launch script starts `kafka-server-start.sh /opt/kafka/config/server.properties`, which is why that file is checked.

- [ ] **Step 2: Send safe test messages.** An unknown `type` only hits the consumer's `default:` branch, which logs `Unknown email type: …` ([email.consumer.ts:203-205](../../../apps/notification/src/lib/email-service/email.consumer.ts)). No email, no DB write.

```bash
for i in 1 2 3 4 5 6; do echo "{\"type\":\"LAB_TEST\",\"n\":$i}"; done | kt kafka-console-producer.sh --bootstrap-server localhost:9092 --topic notification.email
kubectl logs -n joblensai -l app.kubernetes.io/instance=notification --prefix --tail=50 | grep LAB_TEST
```

- [ ] **Step 3: More consumers than partitions.** Set notification `replicaCount: 3` → push → re-run the group `--describe` and Step 2. **Predict → measure:** how many members own a partition? Which pod logs the messages? A Medium writer puts it this way: an extra consumer "will remain idle", and a rebalance means "Message consumption pauses temporarily" (Arvind Kumar, 2025-04-20).
- [ ] **Step 4: Add partitions.**

```bash
kt kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic notification.email --partitions 3
```

Re-run the group `--describe`, then send 12 messages with Step 2 (`seq 1 12`). **Predict → measure:** how do they spread over pods?

Caveats from the Kafka docs: adding partitions "doesn't change the partitioning of existing data", and `hash(key) % number_of_partitions` mapping gets shuffled. Your producer sends no key ([kafka.config.ts:21-24](../../../packages/shared/src/utils/kafka.config.ts)), so ordering only holds inside one partition. `ensureTopicExists` only creates a missing topic ([kafka.config.ts:38-42](../../../packages/shared/src/utils/kafka.config.ts)); it never changes partitions of an existing one.

- [ ] **Step 5: Kill the broker while producers and consumers are live (BEFORE the fix).** In terminal A, run a producer from its own pod so it survives the broker kill:

```bash
i=0; while true; do i=$((i+1)); echo "{\"type\":\"LAB_TEST\",\"n\":$i}"; sleep 1; done | \
  kubectl run kprod -n joblensai --rm -i --restart=Never --image=apache/kafka:latest --command -- \
  /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:9092 --topic notification.email
```

In terminal B, run `kubectl logs -n joblensai -l app.kubernetes.io/instance=notification --prefix -f | grep -E "LAB_TEST|Kafka|kafka"`.

In terminal C, run `kubectl delete pod kafka-0 -n joblensai` and watch it come back in FreeLens (same name + same PVC, because it's a StatefulSet).

**Predict → measure:**

- (a) What do the producer and consumers print while the broker is down? KafkaJS defaults are 5 retries, 300 ms initial wait, 30 s max (KafkaJS docs). After that, `restartOnFailure` restarts the consumer by default for retriable errors. Your app's `sendMessage` logs `❌ Kafka send failed` and throws ([kafka.config.ts:25-28](../../../packages/shared/src/utils/kafka.config.ts)).
- (b) After the restart: does the topic still exist, with how many partitions? Do the group's committed offsets still exist?
- (c) Which `n` values never got consumed?

- [ ] **Step 6: Apply the fix (approval #4)**, then repeat Step 5.

```diff
             - name: CLUSTER_ID
               value: "MkU3OEVBNTcwNTJENDM2Qk"
+            - name: KAFKA_LOG_DIRS
+              value: "/var/lib/kafka/data"
```

```bash
kubectl apply -f infra/local-k8s/stateful/kafka.yaml
kubectl rollout status sts/kafka -n joblensai
kubectl rollout restart deployment/notification -n joblensai   # recreates the topic via ensureTopicExists on startup
kubectl exec -n joblensai kafka-0 -- ls /var/lib/kafka/data
```

The `ls` should now show Kafka files on the PVC. Repeat Step 5. **Predict → measure:** do the topic and offsets survive? Does any `n` get logged **twice**? That's at-least-once delivery.

- [ ] **Step 7 (optional): a poison message.** The real reminder payload has no `userId` (see the bugs list), so `Notification.save()` throws inside `eachMessage` before any email goes out. Reproduce it with a fake address:

```bash
echo '{"type":"SUBSCRIPTION_REMINDER","to":"lab@example.invalid","data":{}}' | kt kafka-console-producer.sh --bootstrap-server localhost:9092 --topic notification.email
```

**Predict → measure:** does the consumer retry the same message forever and block that partition? If it gets stuck, scale notification to 0, then run `kt kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group notification-service --topic notification.email --reset-offsets --to-latest --execute`, then scale back.

**Interview drill:** Why are partitions the unit of parallelism? Where is ordering guaranteed, and where not? What happens during a rebalance? At-least-once vs exactly-once, and how do you make consumers idempotent? What's a dead-letter queue? The outbox pattern: what happens to a signup's verification email if Kafka is down at that moment? How do replication factor, `min.insync.replicas`, and `acks=all` work together? Why is a broker a StatefulSet, not a Deployment?

---

## Task 10: MongoDB replication lab (HA, elections, quorum)

**Files:**

- Create: `infra/local-k8s/labs/mongo-replicaset.yaml`. It's not under `stateful/`, so the deploy script never applies it.

**Concept:** **replication** is the same data on several nodes, which gives HA and read scaling but **not** write scaling. The MongoDB election docs give these facts: `electionTimeoutMillis` default 10 s, median election about 12 s, "cannot process write operations until the election completes", and a majority of voting members is needed (3 members → you can lose 1).

- [ ] **Step 1: Create the lab file.** It has no auth, so it's lab-only. Never do this outside a local cluster.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mongo-rs
---
apiVersion: v1
kind: Service
metadata:
  name: rs
  namespace: mongo-rs
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: rs
  ports:
    - port: 27017
      name: mongod
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: rs
  namespace: mongo-rs
spec:
  serviceName: rs
  replicas: 3
  selector:
    matchLabels:
      app: rs
  template:
    metadata:
      labels:
        app: rs
    spec:
      containers:
        - name: mongod
          image: mongo:8.2
          args: ["--replSet", "rs0", "--bind_ip_all", "--wiredTigerCacheSizeGB", "0.25"]
          ports:
            - containerPort: 27017
              name: mongod
          resources:
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
```

- [ ] **Step 2: Start it and initiate.** The `rs.initiate` shape comes from the MongoDB deploy tutorial.

```bash
kubectl apply -f infra/local-k8s/labs/mongo-replicaset.yaml
kubectl -n mongo-rs rollout status sts/rs
kubectl -n mongo-rs exec rs-0 -- mongosh --quiet --eval 'rs.initiate({_id:"rs0", members:[
  {_id:0, host:"rs-0.rs.mongo-rs.svc.cluster.local:27017"},
  {_id:1, host:"rs-1.rs.mongo-rs.svc.cluster.local:27017"},
  {_id:2, host:"rs-2.rs.mongo-rs.svc.cluster.local:27017"}]})'
kubectl -n mongo-rs exec rs-0 -- mongosh --quiet --eval 'db.hello().primary'
```

- [ ] **Step 3: Kill the primary.** Delete the pod `db.hello().primary` named, then poll from a survivor every 2 s:

```bash
kubectl -n mongo-rs exec rs-1 -- mongosh --quiet --eval 'db.hello().primary'
```

Record how long there was no primary, and compare it with the docs' ~12 s median.

- [ ] **Step 4: Lose the majority.** Run `kubectl -n mongo-rs scale sts rs --replicas=1`. **Predict → measure:** can you write?
- [ ] **Step 5: Clean up.** `kubectl delete -f infra/local-k8s/labs/mongo-replicaset.yaml` (this deletes the namespace and its PVCs).

**Interview drill:** Replication vs sharding: which solves read load, which solves write/data growth? What do write concern `majority` and read preference `secondary` trade off (consistency vs availability)? Why 3 members and not 2?

---

## Task 11: MongoDB sharding lab

**Files:**

- Create: `infra/local-k8s/labs/mongo-sharded.yaml`

**Concept (MongoDB docs):** a sharded cluster = **shards**, where "each shard must be deployed as a replica set" + **mongos** routers + **config servers** ("must be deployed as a replica set (CSRS)"). Production uses 3-member replica sets; this lab uses 1-member sets to save RAM. **Targeted** queries include the shard key; **broadcast** (scatter-gather) queries hit every shard. Hashed keys spread data evenly but turn range queries into broadcasts. Unique indexes on a sharded collection must be prefixed by the shard key, and "you cannot specify a unique constraint on a hashed index".

- [ ] **Step 1: Create the lab file.** `mongos` starts at `replicas: 0`, because it needs an initiated config RS first.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: mongo-shard
---
apiVersion: v1
kind: Service
metadata:
  name: cfg
  namespace: mongo-shard
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: cfg
  ports:
    - port: 27019
      name: mongod
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: cfg
  namespace: mongo-shard
spec:
  serviceName: cfg
  replicas: 1
  selector:
    matchLabels:
      app: cfg
  template:
    metadata:
      labels:
        app: cfg
    spec:
      containers:
        - name: mongod
          image: mongo:8.2
          args:
            [
              "--configsvr",
              "--replSet",
              "cfgrs",
              "--port",
              "27019",
              "--bind_ip_all",
              "--wiredTigerCacheSizeGB",
              "0.25",
            ]
          ports:
            - containerPort: 27019
              name: mongod
          resources:
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: shard-a
  namespace: mongo-shard
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: shard-a
  ports:
    - port: 27018
      name: mongod
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: shard-a
  namespace: mongo-shard
spec:
  serviceName: shard-a
  replicas: 1
  selector:
    matchLabels:
      app: shard-a
  template:
    metadata:
      labels:
        app: shard-a
    spec:
      containers:
        - name: mongod
          image: mongo:8.2
          args:
            [
              "--shardsvr",
              "--replSet",
              "shardA",
              "--port",
              "27018",
              "--bind_ip_all",
              "--wiredTigerCacheSizeGB",
              "0.25",
            ]
          ports:
            - containerPort: 27018
              name: mongod
          resources:
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: shard-b
  namespace: mongo-shard
spec:
  clusterIP: None
  publishNotReadyAddresses: true
  selector:
    app: shard-b
  ports:
    - port: 27018
      name: mongod
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: shard-b
  namespace: mongo-shard
spec:
  serviceName: shard-b
  replicas: 1
  selector:
    matchLabels:
      app: shard-b
  template:
    metadata:
      labels:
        app: shard-b
    spec:
      containers:
        - name: mongod
          image: mongo:8.2
          args:
            [
              "--shardsvr",
              "--replSet",
              "shardB",
              "--port",
              "27018",
              "--bind_ip_all",
              "--wiredTigerCacheSizeGB",
              "0.25",
            ]
          ports:
            - containerPort: 27018
              name: mongod
          resources:
            requests:
              cpu: 50m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          volumeMounts:
            - name: data
              mountPath: /data/db
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: mongos
  namespace: mongo-shard
spec:
  selector:
    app: mongos
  ports:
    - port: 27017
      name: mongos
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongos
  namespace: mongo-shard
spec:
  replicas: 0
  selector:
    matchLabels:
      app: mongos
  template:
    metadata:
      labels:
        app: mongos
    spec:
      containers:
        - name: mongos
          image: mongo:8.2
          command:
            [
              "mongos",
              "--configdb",
              "cfgrs/cfg-0.cfg.mongo-shard.svc.cluster.local:27019",
              "--bind_ip_all",
            ]
          ports:
            - containerPort: 27017
              name: mongos
          resources:
            requests:
              cpu: 50m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 256Mi
```

- [ ] **Step 2: Bring it up.** The order follows the MongoDB "Deploy a Self-Managed Sharded Cluster" tutorial.

```bash
kubectl apply -f infra/local-k8s/labs/mongo-sharded.yaml
kubectl -n mongo-shard rollout status sts/cfg && kubectl -n mongo-shard rollout status sts/shard-a && kubectl -n mongo-shard rollout status sts/shard-b
kubectl -n mongo-shard exec cfg-0 -- mongosh --port 27019 --quiet --eval 'rs.initiate({_id:"cfgrs", configsvr:true, members:[{_id:0, host:"cfg-0.cfg.mongo-shard.svc.cluster.local:27019"}]})'
kubectl -n mongo-shard exec shard-a-0 -- mongosh --port 27018 --quiet --eval 'rs.initiate({_id:"shardA", members:[{_id:0, host:"shard-a-0.shard-a.mongo-shard.svc.cluster.local:27018"}]})'
kubectl -n mongo-shard exec shard-b-0 -- mongosh --port 27018 --quiet --eval 'rs.initiate({_id:"shardB", members:[{_id:0, host:"shard-b-0.shard-b.mongo-shard.svc.cluster.local:27018"}]})'
kubectl -n mongo-shard scale deploy mongos --replicas=1 && kubectl -n mongo-shard rollout status deploy/mongos
kubectl -n mongo-shard exec deploy/mongos -- mongosh --quiet --eval '
  sh.addShard("shardA/shard-a-0.shard-a.mongo-shard.svc.cluster.local:27018");
  sh.addShard("shardB/shard-b-0.shard-b.mongo-shard.svc.cluster.local:27018");
  sh.status()'
```

- [ ] **Step 3: Experiment A, hashed key on your `notifications` model.** The query pattern is "by userId" ([notification.model.ts:53](../../../packages/shared/src/models/notification.model.ts)). Shard the **empty** collection first: since 8.0, "the operation creates 1 chunk per shard by default and migrates across the cluster" (MongoDB hashed-sharding docs).

```bash
kubectl -n mongo-shard exec deploy/mongos -- mongosh --quiet --eval '
  sh.shardCollection("lab.notifications", { userId: "hashed" });
  const n = db.getSiblingDB("lab").notifications;
  const users = Array.from({ length: 1000 }, () => new ObjectId());
  let batch = [];
  for (let i = 0; i < 200000; i++) {
    batch.push({ userId: users[i % 1000], type: "JOB_APPLIED", title: "t", message: "m", isRead: i % 3 === 0, createdAt: new Date() });
    if (batch.length === 5000) { n.insertMany(batch); batch = []; }
  }
  n.getShardDistribution()'
```

**Predict → measure:** what split do you expect between shardA and shardB?

- [ ] **Step 4: Experiment B, targeted vs broadcast.**

```bash
kubectl -n mongo-shard exec deploy/mongos -- mongosh --quiet --eval '
  const n = db.getSiblingDB("lab").notifications;
  const uid = n.findOne().userId;
  printjson(n.find({ userId: uid }).explain().queryPlanner.winningPlan.shards.map(s => s.shardName));
  printjson(n.find({ isRead: false }).explain().queryPlanner.winningPlan.shards.map(s => s.shardName));'
```

Expected (MongoDB query-router + explain docs): a 1-shard list for the `userId` query (targeted), and both shards plus a top-level `SHARD_MERGE` for `isRead` (broadcast).

- [ ] **Step 5: Experiment C, hot shard from a monotonic range key.** The default range size is 128 MB, and the balancer only migrates when shards differ by **3× the range size** (384 MB). Lab data is too small for that, so lower the range size to 1 MB (allowed 1–1024).

```bash
kubectl -n mongo-shard exec deploy/mongos -- mongosh --quiet --eval '
  db.getSiblingDB("config").settings.updateOne({ _id: "chunksize" }, { $set: { _id: "chunksize", value: 1 } }, { upsert: true });
  sh.shardCollection("lab.events", { createdAt: 1 });
  const e = db.getSiblingDB("lab").events;
  for (let b = 0; b < 20; b++) e.insertMany(Array.from({ length: 2500 }, () => ({ createdAt: new Date(), pad: "x".repeat(200) })));
  e.getShardDistribution()'
```

Re-run `getShardDistribution()` every minute for 5 minutes. **Predict → measure:** where do new inserts land? Does the balancer move data later? How does a hashed key avoid this?

- [ ] **Step 6: Experiment D, why not shard `users`?** Your [user.model.ts:9-13](../../../packages/shared/src/models/user.model.ts) has `email: { unique: true }`.

```bash
kubectl -n mongo-shard exec deploy/mongos -- mongosh --quiet --eval '
  const u = db.getSiblingDB("lab").users;
  u.createIndex({ email: 1 }, { unique: true });
  u.insertOne({ email: "a@b.c" });
  try { sh.shardCollection("lab.users", { _id: "hashed" }); } catch (err) { print(err.message); }'
```

Expected (MongoDB unique-index docs): it refuses, because the unique `email` index isn't prefixed by the shard key. **Your turn:** what are 2 ways to keep email unique and still shard?

- [ ] **Step 7: Experiment E, a shard goes down.** Run `kubectl -n mongo-shard scale sts shard-b --replicas=0`, then re-run Step 4's queries. **Predict → measure:** which query still works? Afterwards, scale it back to 1. This is why production shards are 3-member replica sets.
- [ ] **Step 8 (your turn): pick a shard key for `jobs`.** Fields are in [jobDetail.model.ts](../../../packages/shared/src/models/jobDetail.model.ts): `employerId`, `locationName`, `postedDate`, `requiredSkills`. Queries to serve: latest jobs, jobs by recruiter, jobs by location. Judge each candidate on cardinality, frequency, monotonicity, and targeting. I'll push back.
- [ ] **Step 9: Clean up.** `kubectl delete -f infra/local-k8s/labs/mongo-sharded.yaml`

**Interview drill:** Sharding vs partitioning vs replication. What makes a good shard key (cardinality, frequency, monotonicity)? Hot spots. Scatter-gather cost. Global uniqueness. Consistent hashing vs range partitioning. Resharding cost. Cross-shard transactions.

---

## Task 12: Wrap-up (your interview story)

- [ ] **Step 1:** Fill a results table: RPS/pod at p95 < 200 ms, scale-up and scale-down times, time-to-recover for pod kill / OOM / node stop, Mongo failover time, shard distributions.
- [ ] **Step 2:** Write a 2-minute STAR story: "I load-tested my microservices on Kubernetes, found X, fixed/proposed Y". Claude will grill you on it.
- [ ] **Step 3:** Clean up: `kubectl delete ns mongo-rs mongo-shard --ignore-not-found`, then `pnpm k8s:nuke` when you're done.

---

## Sources (all fetched 2026-10-01)

- k8s HPA: <https://kubernetes.io/docs/concepts/workloads/autoscaling/horizontal-pod-autoscale/>
- metrics-server README: <https://github.com/kubernetes-sigs/metrics-server>
- kubeadm kubelet serving certs: <https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/>
- ArgoCD: <https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/> · <https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/> · <https://argo-cd.readthedocs.io/en/stable/user-guide/helm/>
- kind: <https://kind.sigs.k8s.io/> · <https://kind.sigs.k8s.io/docs/user/configuration/> · <https://kind.sigs.k8s.io/docs/user/quick-start/> · <https://github.com/kubernetes-sigs/kind/releases/tag/v0.33.0> · <https://github.com/kubernetes-sigs/kind/blob/main/pkg/cluster/internal/create/actions/kubeadminit/init.go>
- ingress-nginx kind manifest: <https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml>
- local-path-provisioner: <https://github.com/rancher/local-path-provisioner>
- Pod lifecycle: <https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/>
- Memory/OOM: <https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/>
- Requests/limits: <https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/>
- In-place resize: <https://kubernetes.io/docs/tasks/configure-pod-container/resize-container-resources/>
- PDB: <https://kubernetes.io/docs/tasks/run-application/configure-pdb/> · Drain: <https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/>
- Taint-based eviction: <https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/>
- kube-proxy: <https://kubernetes.io/docs/reference/networking/virtual-ips/>
- port-forward: <https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/>
- Deployment API (`replicas` defaults to 1): <https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/deployment-v1/>
- Volumes (container files ephemeral): <https://kubernetes.io/docs/concepts/storage/volumes/>
- CronJob: <https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/>
- Node.js as PID 1: <https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md> · Event loop: <https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop>
- k6: <https://grafana.com/docs/k6/latest/set-up/install-k6/> · <https://grafana.com/docs/k6/latest/get-started/running-k6/> · <https://grafana.com/docs/k6/latest/using-k6/scenarios/executors/ramping-vus/> · <https://grafana.com/docs/k6/latest/using-k6/thresholds/>
- nginx limit_req: <https://nginx.org/en/docs/http/ngx_http_limit_req_module.html>
- KafkaJS: <https://kafka.js.org/docs/consuming> · <https://kafka.js.org/docs/configuration> (retry defaults, restartOnFailure)
- Kafka: <https://kafka.apache.org/41/operations/basic-kafka-operations/> (cluster expansion, unique broker id) · <https://kafka.apache.org/10/operations/basic-kafka-operations/> (adding partitions caveat) · <https://kafka.apache.org/10/getting-started/introduction/> (consumers ≤ partitions) · <https://github.com/apache/kafka/blob/trunk/docker/examples/README.md> (env-only config) · <https://github.com/apache/kafka/blob/trunk/docker/jvm/launch> · <https://github.com/apache/kafka/blob/trunk/server-common/src/main/java/org/apache/kafka/server/config/ServerLogConfigs.java> (`log.dir` default) · <https://github.com/apache/kafka/blob/trunk/config/server.properties>
- socket.io: <https://socket.io/docs/v4/using-multiple-nodes/> · <https://socket.io/docs/v4/connection-state-recovery>
- FreeLens metrics: <https://fosc.space/blog/2026-07-07-lightweight-lens-metrics-talos/> (p4block) · <https://github.com/freelensapp/freelens/issues/791>
- Medium (full text read via freedium-mirror.cfd): Arvind Kumar, "Kafka Consumer Groups — What Happens When You Add One More Consumer?" (2025-04-20) <https://codefarm0.medium.com/kafka-consumer-groups-what-happens-when-you-add-one-more-consumer-d07cfe2fedbc> · Bhargav Shah, "Horizontal Pod Autoscaler (HPA) in Kubernetes" (2020-09-26; `--kubelet-insecure-tls`, "missing request for cpu", ~5 min cooldown) <https://shahbhargav.medium.com/horizontal-pod-autoscaler-hpa-in-kubernetes-f72917679528> · Sunny Kr., "Sharded MongoDB in Kubernetes StatefulSets on GKE" (2018-01-02; same 1 config + 2 single-member shard RS + mongos topology) <https://medium.com/google-cloud/sharded-mongodb-in-kubernetes-statefulsets-on-gke-ba08c7c0c0b0>
- MongoDB: <https://www.mongodb.com/docs/manual/core/sharded-cluster-components/> · <https://www.mongodb.com/docs/manual/core/index-unique/> · <https://www.mongodb.com/docs/manual/core/hashed-sharding/> · <https://www.mongodb.com/docs/manual/core/ranged-sharding/> · <https://www.mongodb.com/docs/manual/core/sharded-cluster-query-router/> · <https://www.mongodb.com/docs/manual/reference/explain-results/> · <https://www.mongodb.com/docs/manual/tutorial/deploy-shard-cluster/> · <https://www.mongodb.com/docs/manual/core/sharding-balancer-administration/> · <https://www.mongodb.com/docs/manual/tutorial/modify-chunk-size-in-sharded-cluster/> · <https://www.mongodb.com/docs/manual/core/replica-set-elections/> · <https://www.mongodb.com/docs/drivers/node/current/connect/connection-options/connection-pools/>
- MongoDB kernel issue: <https://jira.mongodb.org/browse/SERVER-121912> · <https://jira.mongodb.org/browse/SERVER-125742>
