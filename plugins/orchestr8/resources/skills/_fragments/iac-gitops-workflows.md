---
id: iac-gitops-workflows
category: skill
tags: [iac, gitops, cicd, automation, terraform, github-actions, atlantis]
capabilities:
  - GitOps workflows for infrastructure changes
  - Automated plan and apply with GitHub Actions
  - Pull request-based infrastructure reviews
  - Version pinning and tagging strategies
useWhen:
  - Implementing GitOps workflow for Terraform infrastructure with PR-based review and automated deployment pipeline
  - Building infrastructure CI/CD with GitHub Actions running terraform plan on PR and apply on merge to main
  - Designing Git-based infrastructure change management with code review, approval gates, and audit trail
  - Creating automated infrastructure deployment workflow with drift detection, rollback capability, and Slack notifications
  - Implementing infrastructure-as-code peer review process with automated cost estimation and security scanning
estimatedTokens: 620
---

# GitOps Workflows for IaC

Implement GitOps practices for infrastructure with automated planning, review, and deployment through pull requests.

## Version Pinning

```terraform
terraform {
  required_version = "~> 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## Tagging Strategy

```terraform
locals {
  common_tags = {
    Project     = "MyApp"
    Environment = var.environment
    ManagedBy   = "Terraform"
    CostCenter  = var.cost_center
    Owner       = var.team_email
  }
}

resource "aws_instance" "app" {
  tags = merge(local.common_tags, {
    Name = "app-server"
    Role = "application"
  })
}
```

## GitOps Workflow

```markdown
1. Developer creates branch
2. Modify Terraform code
3. Open pull request
4. CI runs:
   - terraform fmt -check
   - terraform validate
   - terraform plan
5. Plan posted as PR comment
6. Team reviews plan
7. Merge to main
8. CI runs terraform apply
9. Infrastructure updated
```

## Automated Plan Comments

```yaml
# .github/workflows/terraform-pr.yml
name: Terraform PR

on:
  pull_request:
    paths:
      - 'terraform/**'

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: hashicorp/setup-terraform@v2

      - name: Terraform Init
        run: terraform init
        working-directory: ./terraform/production

      - name: Terraform Plan
        id: plan
        run: terraform plan -no-color
        continue-on-error: true

      - uses: actions/github-script@v6
        with:
          script: |
            const output = `#### Terraform Plan 📋
            \`\`\`
            ${{ steps.plan.outputs.stdout }}
            \`\`\`

            *Pusher: @${{ github.actor }}, Action: \`${{ github.event_name }}\`*`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })
```

## Atlantis Integration

```yaml
# atlantis.yaml
version: 3
projects:
  - name: production
    dir: terraform/production
    workflow: production
    autoplan:
      when_modified: ["*.tf", "*.tfvars"]
      enabled: true

workflows:
  production:
    plan:
      steps:
        - init
        - plan
    apply:
      steps:
        - apply

# Pull request commands:
# atlantis plan - Run plan
# atlantis apply - Apply changes (after approval)
```

## Common Pitfalls

❌ **Avoid:**
- State file in Git
- Hardcoded credentials
- No state locking
- Large monolithic configs
- No versioning
- Ignoring drift

✅ **Best Practices:**
- Remote state with locking
- Environment variables for credentials
- Modular infrastructure
- Pin versions
- Regular drift checks
- Automated testing
