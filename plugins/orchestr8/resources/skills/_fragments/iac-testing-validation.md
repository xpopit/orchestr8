---
id: iac-testing-validation
category: skill
tags: [iac, terraform, testing, terratest, validation, linting, security-scanning]
capabilities:
  - Infrastructure code testing with Terratest
  - Terraform validation and formatting checks
  - Security scanning with tfsec and Checkov
  - Cost estimation with Infracost
useWhen:
  - Testing Terraform modules with Terratest validating infrastructure correctness before production deployment
  - Implementing IaC CI/CD pipeline with automated terraform plan, tflint validation, and Checkov security scanning
  - Building pre-commit hooks for Terraform code quality checking formatting, security misconfigurations, and cost estimation
  - Creating test suites for infrastructure modules verifying VPC networking, security group rules, and IAM permissions
  - Validating Terraform configuration files with automated policy checks for encryption, public access, and compliance requirements
estimatedTokens: 600
---

# Infrastructure Testing & Validation

Test and validate infrastructure code with automated testing, security scanning, and cost analysis before deployment.

## Terratest (Go)

```go
package test

import (
    "testing"
    "github.com/gruntwork-io/terratest/modules/terraform"
    "github.com/stretchr/testify/assert"
)

func TestVPCCreation(t *testing.T) {
    t.Parallel()

    terraformOptions := &terraform.Options{
        TerraformDir: "../modules/vpc",
        Vars: map[string]interface{}{
            "environment":          "test",
            "cidr_block":          "10.0.0.0/16",
            "public_subnet_cidrs": []string{"10.0.1.0/24"},
        },
    }

    defer terraform.Destroy(t, terraformOptions)
    terraform.InitAndApply(t, terraformOptions)

    vpcId := terraform.Output(t, terraformOptions, "vpc_id")
    assert.NotEmpty(t, vpcId)
}
```

## Validation & Linting

```bash
# Terraform validate
terraform validate

# Format check
terraform fmt -check -recursive

# Security scanning
tfsec .
checkov -d .

# Cost estimation
infracost breakdown --path .
```

## Policy as Code (OPA/Sentinel)

```rego
# Open Policy Agent
package terraform.analysis

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_s3_bucket"
    not resource.change.after.versioning[_].enabled
    msg := sprintf("S3 bucket %s must have versioning enabled", [resource.address])
}

deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_instance"
    resource.change.after.instance_type == "t3.large"
    msg := "Production instances must be t3.xlarge or larger"
}
```

## CI/CD Pipeline

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    paths:
      - 'terraform/**'
  push:
    branches:
      - main

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0

      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform/production

      - name: Terraform Format
        run: terraform fmt -check

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -out=tfplan
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Comment Plan
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const plan = require('fs').readFileSync('tfplan', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `\`\`\`terraform\n${plan}\n\`\`\``
            })

  apply:
    needs: plan
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: hashicorp/setup-terraform@v2

      - name: Terraform Apply
        run: terraform apply -auto-approve
        working-directory: ./terraform/production
```

## Best Practices

✅ **Automated testing** - Test infrastructure code like application code
✅ **Security scanning** - Run tfsec/Checkov in CI
✅ **Validation first** - Always validate before plan
✅ **Format enforcement** - Use terraform fmt in CI
✅ **Cost awareness** - Review cost estimates before apply
✅ **Policy enforcement** - Use OPA for compliance rules
