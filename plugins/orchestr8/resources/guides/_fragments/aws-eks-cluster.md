---
id: aws-eks-cluster
category: guide
tags: [aws, eks, kubernetes, terraform, infrastructure]
capabilities:
  - EKS cluster setup
  - Node groups
  - Security configuration
useWhen:
  - Deploying production AWS EKS 1.28+ clusters with Terraform requiring encrypted secrets, private endpoints, and audit logging
  - Building managed Kubernetes on AWS with node groups supporting ON_DEMAND or SPOT instances and autoscaling from 3-10 nodes
  - Setting up EKS with security hardening including KMS encryption for secrets, restricted public access CIDRs, and custom launch templates
  - Provisioning EKS infrastructure requiring IAM roles for RBAC, VPC configuration across public/private subnets, and cluster logging
  - Deploying Kubernetes clusters on AWS that need post-setup configuration like AWS Load Balancer Controller and EBS CSI driver
  - Building EKS environments where node groups run in private subnets with controlled internet egress via NAT gateways
estimatedTokens: 480
---

# AWS EKS Cluster Setup

```hcl
# EKS Cluster
resource "aws_eks_cluster" "main" {
  name     = var.cluster_name
  role_arn = aws_iam_role.eks_cluster.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["YOUR_IP/32"]  # Restrict access
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks.arn
    }
    resources = ["secrets"]
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator"]
}

# EKS Node Group
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-nodes"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = aws_subnet.private[*].id

  scaling_config {
    desired_size = 3
    max_size     = 10
    min_size     = 3
  }

  instance_types = ["t3.large"]
  capacity_type  = "ON_DEMAND"  # or SPOT for cost savings

  update_config {
    max_unavailable = 1
  }

  # Use custom launch template for disk encryption
  launch_template {
    id      = aws_launch_template.eks_nodes.id
    version = "$Latest"
  }
}

# IAM roles (simplified)
resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}
```

**Post-setup:** Install AWS Load Balancer Controller, EBS CSI driver, and configure IRSA.
