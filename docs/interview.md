# Interview Preparation: Cloud Architecture

## The "Custom K3s on EC2" Approach

If an interviewer asks about your cloud architecture and why you used K3s instead of AWS EKS, this is the perfect way to explain it simply and effectively:

> _"I originally wanted to use AWS EKS for my microservices, but because of the AWS Free Tier limitations, I was restricted to machines with only 1GB of memory and a 4-pod limit. Instead of paying expensive hosting fees, I wrote a Terraform script to install K3s—a lightweight version of Kubernetes—directly onto a free EC2 server. I configured the Linux kernel to use hard drive space as memory (Swap), which allowed me to run massive modern database systems like Kafka and MongoDB alongside my React app for $0 a month. To the outside world, it functions exactly like standard enterprise Kubernetes using ArgoCD."_

---

## Architectural Deep Dive (For Follow-Up Questions)

Be prepared to discuss the engineering tradeoffs of this architecture. Recognizing the limits of your own design proves senior-level architectural maturity.

### Advantages of This Approach

- **Extreme Cost Efficiency:** Bypasses the ~$73/month EKS control plane fee and allows massive infrastructure to run on a single $0/month Free Tier `t3.micro` instance.
- **Bypass Cloud Provider Limits:** Bypasses AWS Elastic Network Interface (ENI) container limits, expanding the standard 4-pod limit on a micro instance to an essentially unlimited number via K3s internal networking (Flannel overlay).
- **High Engineering Resourcefulness:** Demonstrates a deep understanding of Linux kernel modification (Swapfiles) and Kubernetes networking beyond just pressing buttons in a managed cloud console.
- **Cloud Agnostic standard:** Unlike ECS, knowing K3s/Kubernetes ensures these skills transfer directly to Google Cloud (GKE) or Azure (AKS) environments, making you a more versatile engineer.
- **GitOps Ready:** It natively supports enterprise-grade deployment pipelines like ArgoCD and Helm charts.

### Disadvantages (Why Enterprises Don't Use This)

- **Single Point of Failure (SPOF):** The entire application relies on a single EC2 instance. If the underlying hardware fails or the OS crashes, there is 100% downtime. Enterprises mitigate this by spreading EKS across multiple servers and Availability Zones.
- **Performance Bottleneck (Disk I/O):** Utilizing SSD hard drive space as memory (Swap) is drastically slower than physical RAM. While it successfully prevents the 1GB server from crashing, heavy traffic loads hitting MongoDB or Kafka would cause the system to bottleneck and crawl due to high storage thrashing.
- **No Native Auto-Scaling:** EKS communicates with AWS to seamlessly spin up brand-new EC2 machines automatically when application load demands it. This static K3s architecture is permanently bound to the physical limits of its single machine.
- **Maintenance Overhead:** AWS manages EKS security patches, automated backups, and version upgrades for you. With raw K3s on EC2, you assume total responsibility for manually patching the Linux Server and the Kubernetes control plane.
- **Granular Security (IAM):** EKS allows you to give an individual pod specific permission to access an AWS resource (like an S3 bucket). With self-hosted K3s, you often have to give the _entire EC2 server_ access to that bucket, which is a known enterprise security risk.
