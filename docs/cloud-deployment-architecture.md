# Joblens AI: Cloud Deployment Architecture

This document outlines the cloud infrastructure architecture used to deploy Joblens AI to AWS.

## 1. Overview

Joblens AI is an enterprise-grade microservice architecture comprising multiple backend Node.js microservices (Auth, Payment, Agent, Backend), a modern frontend web application, and resource-intensive distributed databases (Kafka, MongoDB, Redis, MinIO).

To deploy this massive technology stack within the strict **AWS Free Tier** constraints, we engineered a highly optimized, single-node cluster solution utilizing **K3s (Lightweight Kubernetes)** on a foundational **Amazon EC2** instance, augmented by Linux storage-level Memory Swaps.

## 2. Infrastructure: Why Raw EC2?

The primary requirement for this deployment was to host the entire microservice ecosystem entirely on **AWS Free Tier** hardware (specifically the `t3.micro` instance class).

While Amazon Elastic Kubernetes Service (EKS) and Elastic Container Service (ECS) are standard enterprise offerings, they enforce strict, hardware-level container limits:

- **EKS Network (ENI) Restriction:** AWS VPC CNI strictly blocks `t3.micro` nodes from hosting more than 4 Pods per server.
- **Memory Limitation:** A `t3.micro` server physically possesses only **1 GB of RAM**. Booting Apache Kafka and MongoDB alone requires significantly more than this, resulting in immediate `OOMKilled` (Out of Memory) crashes on standard deployments.

By bypassing managed PaaS offerings and provisioning a raw **EC2 Ubuntu Instance**, we gained `root` level access to the underlying Linux kernel, allowing us to implement advanced OS hardware modifications that bypass Free Tier physical constraints.

## 3. The 4GB Swapfile Hack (Virtual RAM)

Because Joblens AI requires approximately 3GB to 4GB of RAM to process high-throughput Kafka topics, background Next.js SSR rendering, and persistent MongoDB collections concurrently, 1GB of physical RAM is utterly insufficient.

To solve this, our startup terraform scripts dynamically allocate a **4GB Swapfile** directly onto the AWS Elastic Block Store (SSD Hard Drive) attached to the EC2 instance.

- The Linux kernel is instructed to utilize this 4GB block of solid-state storage as "Virtual RAM" whenever physical memory is exhausted.
- **The Result:** The entire massive data infrastructure (Kafka + Mongo + Redis + MinIO + K3s) seamlessly boots and runs concurrently on a 1GB Free Tier machine without crashing.

## 4. Cluster Orchestration: K3s (Lightweight Kubernetes)

Instead of relying on Docker Compose, the deployment utilizes **K3s**, an official CNCF-certified Kubernetes distribution originally developed by Rancher.

- **Hardware Efficiency:** K3s is incredibly fast and memory-optimized. It packages all Kubernetes master and worker components into a single, highly-compressed binary, allowing it to function flawlessly with minimal overhead.
- **Bypassing AWS Limits:** Because K3s operates its own internal Flannel network overlay rather than binding containers to physical AWS Elastic Network Interfaces (ENIs), the AWS 4-Pod limit completely vanishes. The K3s cluster can successfully schedule and route traffic to hundreds of Pods on the `t3.micro` machine.
- **Enterprise Tooling Equivalency:** K3s responds to `kubectl`, processes Helm charts natively, and natively supports GitOps continuous delivery via ArgoCD.

## 5. Deployment Workflow & GitOps

1. **Infrastructure as Code (Terraform):** The raw EC2 instance, VPC, Elastic IP, and Security Groups are entirely provisioned using HashiCorp Terraform.
2. **Automated Bootstrapping:** Terraform utilizes AWS `user_data` scripts to execute the Swapfile creation, dependency installation, and K3s cluster initialization before any human intervention occurs.
3. **Continuous Deployment (ArgoCD):** Once the K3s server initializes, the developer connects their external Workstation/Toolbox to the Kubeconfig. ArgoCD is deployed to the cluster, where it immediately synchronizes the `joblensai-2` GitHub repository and begins scheduling the Helm charts and Stateful YAML files to the server continuously.

## 6. Portfolio Impact

This specific architecture demonstrates a profound understanding of how cloud technologies physically operate beneath the abstraction layers of managed services (PaaS/SaaS).

By manually orchestrating Linux Kernel Virtual Memory (Swaps), implementing Infrastructure as Code via Terraform, and engineering a CNCF-certified Kubernetes distribution (K3s) onto profoundly restricted hardware, the engineer demonstrates the ability to architect complex enterprise systems efficiently, optimizing aggressively for both cost and scale.
