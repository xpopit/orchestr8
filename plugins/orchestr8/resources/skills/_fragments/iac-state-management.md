---
id: iac-state-management
category: skill
tags: [iac, terraform, state, remote-backend, s3, locking, drift-detection]
capabilities:
  - Remote state configuration with S3 and DynamoDB
  - State locking and consistency management
  - Terraform workspace management for multi-environment
  - Drift detection and state reconciliation
useWhen:
  - Setting up Terraform remote state in S3 with DynamoDB locking preventing concurrent modification conflicts
  - Managing multi-environment infrastructure state with workspace isolation and backend configuration per environment
  - Implementing state locking strategy for distributed team preventing race conditions during parallel terraform apply
  - Detecting infrastructure drift between Terraform state and actual AWS resources with scheduled compliance checks
  - Migrating local Terraform state to remote backend with state file backup and recovery procedures
estimatedTokens: 650
---

# Infrastructure State Management

Manage Terraform state with remote backends, locking, and drift detection for reliable multi-user infrastructure workflows.

## Remote State Management

```terraform
# backend.tf
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "production/infrastructure"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"  # State locking

    # Workspace support
    workspace_key_prefix = "env"
  }
}

# Access remote state from another project
data "terraform_remote_state" "vpc" {
  backend = "s3"
  config = {
    bucket = "mycompany-terraform-state"
    key    = "production/vpc"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  subnet_id = data.terraform_remote_state.vpc.outputs.subnet_id
  # ...
}
```

## Workspaces

```bash
# Create and manage multiple environments
terraform workspace new development
terraform workspace new staging
terraform workspace new production

# Switch between workspaces
terraform workspace select production

# Use in code
resource "aws_instance" "app" {
  instance_type = terraform.workspace == "production" ? "t3.large" : "t3.micro"

  tags = {
    Environment = terraform.workspace
  }
}
```

## Drift Detection

```bash
# Detect configuration drift
terraform plan -detailed-exitcode

# Exit codes:
# 0 = No changes
# 1 = Error
# 2 = Changes detected (drift)
```

## State Locking

```terraform
# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name    = "Terraform State Locks"
    Purpose = "Prevent concurrent state modifications"
  }
}
```

## Data Sources

```terraform
# Use existing resources
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_instance" "app" {
  ami               = data.aws_ami.ubuntu.id
  availability_zone = data.aws_availability_zones.available.names[0]
}
```

## Sensitive Data Handling

```terraform
variable "database_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

output "db_endpoint" {
  value     = aws_db_instance.main.endpoint
  sensitive = true
}
```

## Best Practices

✅ **Remote state** - Never store state files locally in production
✅ **State locking** - Use DynamoDB for S3 backend locking
✅ **Encryption** - Enable encryption for state files
✅ **Workspaces** - Manage multiple environments
✅ **Regular drift checks** - Run terraform plan to detect drift
✅ **Sensitive values** - Mark sensitive variables and outputs
