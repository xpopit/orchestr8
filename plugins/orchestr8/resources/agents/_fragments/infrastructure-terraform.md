---
id: infrastructure-terraform
category: agent
tags: [terraform, iac, infrastructure-as-code, modules, state, providers, aws, gcp, azure, automation]
capabilities:
  - Terraform module design and composition
  - State management and remote backends
  - Multi-provider infrastructure
  - Workspace and environment strategies
  - Testing and validation patterns
  - CI/CD integration for Terraform
useWhen:
  - Designing Terraform infrastructure-as-code with modules for reusability, remote state in S3/GCS with locking, and workspaces for environment separation (dev, staging, prod)
  - Implementing Terraform provider configurations for AWS, GCP, Azure with resource provisioning using declarative HCL syntax and dependency management through implicit/explicit depends_on
  - Managing Terraform state safely with remote backends (S3 + DynamoDB, Terraform Cloud), state locking to prevent concurrent modifications, and sensitive data encryption
  - Building reusable Terraform modules with input variables, output values, locals for computed values, and versioning modules in Git with semantic version tags
  - Organizing Terraform projects with directory structure for environments, using terraform workspaces, and implementing CI/CD pipelines with terraform plan/apply automation
  - Handling Terraform lifecycle with terraform import for existing resources, terraform state commands for manipulation, and terraform destroy with -target for selective cleanup
estimatedTokens: 700
---

# Terraform Infrastructure Expert

Expert in Terraform infrastructure as code, module design, state management, and multi-cloud deployments.

## Module Design Patterns

### Reusable Module Structure
```hcl
# modules/vpc/main.tf
variable "name" {
  description = "VPC name"
  type        = string
}

variable "cidr" {
  description = "VPC CIDR block"
  type        = string
  validation {
    condition     = can(cidrhost(var.cidr, 0))
    error_message = "Must be valid IPv4 CIDR."
  }
}

variable "availability_zones" {
  description = "List of AZs"
  type        = list(string)
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

locals {
  common_tags = merge(var.tags, {
    ManagedBy = "Terraform"
    Module    = "vpc"
  })
}

resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = var.name
  })
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${var.name}-public-${var.availability_zones[count.index]}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.availability_zones)

  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "${var.name}-private-${var.availability_zones[count.index]}"
    Tier = "private"
  })
}

# modules/vpc/outputs.tf
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

# modules/vpc/versions.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

### Using Modules
```hcl
# environments/production/main.tf
module "vpc" {
  source = "../../modules/vpc"

  name               = "production-vpc"
  cidr               = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

  tags = {
    Environment = "production"
    Team        = "platform"
  }
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "production-eks"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "general"
      }

      tags = {
        Environment = "production"
      }
    }
  }
}
```

## State Management

### Remote Backend Configuration
```hcl
# S3 backend with DynamoDB locking
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID"

    # Prevent concurrent runs
    workspace_key_prefix = "workspaces"
  }
}

# GCS backend
terraform {
  backend "gcs" {
    bucket = "mycompany-terraform-state"
    prefix = "production/vpc"
  }
}

# Terraform Cloud
terraform {
  cloud {
    organization = "mycompany"
    workspaces {
      name = "production-vpc"
    }
  }
}
```

### State File Best Practices
```bash
# Initialize backend
terraform init -backend-config="bucket=mycompany-tf-state"

# Migrate state to new backend
terraform init -migrate-state

# Import existing resource
terraform import aws_instance.web i-1234567890abcdef0

# Move resource in state (refactoring)
terraform state mv aws_instance.old aws_instance.new

# Remove resource from state (without destroying)
terraform state rm aws_instance.deprecated

# Show specific resource
terraform state show aws_instance.web

# List all resources
terraform state list

# Pull remote state locally
terraform state pull > backup.tfstate
```

## Workspace Strategies

```bash
# Create workspace for environment isolation
terraform workspace new production
terraform workspace new staging
terraform workspace new development

# Select workspace
terraform workspace select production

# List workspaces
terraform workspace list

# Use workspace in configuration
resource "aws_instance" "web" {
  instance_type = terraform.workspace == "production" ? "t3.large" : "t3.micro"

  tags = {
    Environment = terraform.workspace
  }
}
```

## Advanced Patterns

### Dynamic Blocks
```hcl
variable "ingress_rules" {
  type = list(object({
    from_port   = number
    to_port     = number
    protocol    = string
    cidr_blocks = list(string)
  }))
  default = [
    { from_port = 80, to_port = 80, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] },
    { from_port = 443, to_port = 443, protocol = "tcp", cidr_blocks = ["0.0.0.0/0"] }
  ]
}

resource "aws_security_group" "web" {
  name   = "web-sg"
  vpc_id = aws_vpc.main.id

  dynamic "ingress" {
    for_each = var.ingress_rules
    content {
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      protocol    = ingress.value.protocol
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### For Expressions
```hcl
# Create map from list
locals {
  subnet_map = {
    for subnet in aws_subnet.private :
    subnet.availability_zone => subnet.id
  }

  # Filter and transform
  production_instances = {
    for k, v in var.instances :
    k => v.instance_type
    if v.environment == "production"
  }

  # Flatten nested structures
  all_ips = flatten([
    for subnet in aws_subnet.private : [
      for instance in subnet.instances : instance.private_ip
    ]
  ])
}
```

### Conditional Resources
```hcl
variable "enable_monitoring" {
  type    = bool
  default = false
}

resource "aws_cloudwatch_dashboard" "main" {
  count = var.enable_monitoring ? 1 : 0

  dashboard_name = "production-dashboard"
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [["AWS/EC2", "CPUUtilization"]]
        }
      }
    ]
  })
}

# Reference conditional resource
output "dashboard_arn" {
  value = var.enable_monitoring ? aws_cloudwatch_dashboard.main[0].dashboard_arn : null
}
```

## Data Sources and Dependencies

```hcl
# Fetch existing resources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Use data sources
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "t3.micro"

  tags = {
    Owner     = data.aws_caller_identity.current.arn
    Region    = data.aws_region.current.name
    ManagedBy = "Terraform"
  }
}

# Explicit dependencies
resource "aws_eip" "web" {
  instance = aws_instance.web.id
  vpc      = true

  depends_on = [aws_internet_gateway.main]
}
```

## Testing and Validation

### Input Validation
```hcl
variable "environment" {
  type        = string
  description = "Environment name"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "instance_count" {
  type = number

  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}
```

### Pre-commit Hooks
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/antonbabenko/pre-commit-terraform
    rev: v1.83.5
    hooks:
      - id: terraform_fmt
      - id: terraform_validate
      - id: terraform_docs
      - id: terraform_tflint
      - id: terraform_tfsec
      - id: terraform_checkov
```

### Terratest Example
```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVPCModule(t *testing.T) {
    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "name": "test-vpc",
            "cidr": "10.0.0.0/16",
            "availability_zones": []string{"us-east-1a", "us-east-1b"},
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcID := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcID)
}
```

## CI/CD Integration

```yaml
# GitHub Actions
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches:
      - main

jobs:
  terraform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0

      - name: Terraform fmt
        run: terraform fmt -check -recursive

      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Save plan
        uses: actions/upload-artifact@v3
        with:
          name: tfplan
          path: ./terraform/tfplan

      - name: Terraform Apply
        if: github.ref == 'refs/heads/main'
        run: terraform apply -auto-approve tfplan
```

## Best Practices 2025

1. **State Management**
   - Always use remote backend
   - Enable state locking
   - Encrypt state files
   - Never commit state to git

2. **Module Design**
   - One module per responsibility
   - Version pinning for stability
   - Comprehensive outputs
   - Input validation

3. **Security**
   - Use least privilege IAM
   - Scan with tfsec/checkov
   - Rotate credentials regularly
   - Use workload identity when possible

4. **Code Organization**
   - Environment-based directories
   - Shared modules repository
   - Consistent naming conventions
   - Meaningful resource names

5. **Change Management**
   - Always run `terraform plan` first
   - Use `-target` sparingly
   - Tag resources consistently
   - Document breaking changes

## Common Commands

```bash
# Initialize and upgrade providers
terraform init -upgrade

# Plan with variable file
terraform plan -var-file="production.tfvars"

# Apply specific resource
terraform apply -target=aws_instance.web

# Refresh state without applying
terraform refresh

# Show planned changes without modifying state
terraform plan -refresh-only

# Generate dependency graph
terraform graph | dot -Tsvg > graph.svg

# Output specific value
terraform output vpc_id

# Format all files
terraform fmt -recursive
```
