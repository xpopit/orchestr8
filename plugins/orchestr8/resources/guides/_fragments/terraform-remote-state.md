---
id: terraform-remote-state
category: guide
tags: [terraform, state, s3, dynamodb, infrastructure]
capabilities:
  - Remote state configuration
  - State locking
  - S3 backend setup
useWhen:
  - Configuring Terraform remote state on S3 with DynamoDB locking for team collaboration preventing concurrent apply conflicts
  - Setting up Terraform backend requiring encrypted S3 state storage with KMS, versioning for rollback, and strict access controls
  - Implementing infrastructure-as-code workflows where multiple engineers need shared state with atomic locking during terraform apply
  - Building Terraform state management with separate state files per environment (dev, staging, prod) using key path organization
  - Deploying S3 backend with security hardening including public access blocks, bucket versioning, and server-side encryption
  - Setting up Terraform state infrastructure requiring DynamoDB table with LockID for preventing race conditions during state updates
estimatedTokens: 350
---

# Terraform Remote State Setup

## S3 Backend Configuration

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "myproject-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID"
    dynamodb_table = "terraform-state-lock"
  }
}

# S3 Bucket for state (create separately)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "myproject-terraform-state"
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.terraform.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB table for state locking
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**Usage:**
1. Create S3 bucket and DynamoDB table manually first
2. Configure backend in `backend.tf`
3. Run `terraform init` to migrate state
