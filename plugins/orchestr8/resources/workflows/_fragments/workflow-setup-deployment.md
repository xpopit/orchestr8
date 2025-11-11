---
id: workflow-setup-deployment
category: pattern
tags: [workflow, cicd, deployment, devops, automation, infrastructure, monitoring, pipeline, release]
capabilities:
  - Complete CI/CD pipeline setup from build to production
  - Multi-stage pipeline with quality gates
  - Infrastructure as Code (IaC) provisioning
  - Safe production deployment with rollback capability
  - Monitoring and observability setup
useWhen:
  - CI/CD pipeline setup requiring GitHub Actions workflow, test automation, staging environments, and production deployment
  - Deployment automation needing Infrastructure as Code with Terraform/CloudFormation, multi-stage pipeline, and quality gates
  - Production infrastructure configuration requiring containerization, orchestration, monitoring, and observability setup
  - Safe deployment workflow implementation needing blue-green deployment, canary releases, rollback capability, and health checks
estimatedTokens: 650
---

# Deployment & CI/CD Setup Pattern

**Methodology:** Design → Pipeline → Infrastructure → Deploy → Monitor

**Combined Pattern:** Merges CI/CD setup and production deployment workflows

## Part 1: CI/CD Pipeline Setup (0-60%)

### Phase 1: Pipeline Design (0-20%)
**Goals:** Design pipeline architecture and deployment strategy

**Key Activities:**
- Parse platform and target infrastructure (GitHub Actions, GitLab CI, AWS, GCP, K8s)
- Design pipeline stages (build → test → scan → deploy)
- Choose deployment strategy (blue-green, canary, rolling updates)
- Plan environment structure (dev, staging, production)
- Define quality gates and approval requirements

**Output:** CI/CD architecture diagram and deployment strategy document

### Phase 2: Pipeline Configuration (20-60%)
**Goals:** Configure complete CI/CD pipeline

**Parallel Tracks:**

**Track A: Build Pipeline (20-45%)**
- Configure triggers (push, PR, tag, schedule)
- Set up build job (compile, bundle, package)
- Configure dependency caching for speed
- Add artifact storage and versioning
- Set up Docker image build (multi-stage Dockerfile)

**Track B: Test & Quality (25-50%)**
- Configure test execution (unit, integration, E2E)
- Set up code coverage reporting (threshold: 80%+)
- Add linting and formatting checks
- Configure test result publishing
- Implement parallel test execution

**Track C: Security Scanning (30-55%)**
- Add dependency vulnerability scanning (npm audit, Snyk)
- Configure SAST (static analysis security testing)
- Add container image scanning (Trivy, Clair)
- Set up secrets scanning (prevent credential leaks)
- Configure security gate thresholds (block on critical/high)

**Track D: Deployment Jobs (35-60%)**
- Configure environment-specific deployments
- Set up deployment credentials and secrets (least privilege)
- Add health check validation post-deploy
- Configure rollback procedures (automated or manual)
- Set up deployment notifications (Slack, email)

**Output:** Complete CI/CD pipeline configuration files

## Part 2: Infrastructure & Deployment (60-100%)

### Phase 3: Infrastructure Provisioning (60-85%)
**Goals:** Set up deployment infrastructure

**Parallel Tracks:**

**Track A: Infrastructure as Code (60-75%)**
- Create Terraform/Pulumi/CloudFormation configurations
- Define staging and production environments
- Configure networking, load balancers, databases
- Set up DNS records and SSL certificates
- Apply infrastructure with state management

**Track B: Secrets & Configuration (65-80%)**
- Configure secrets management (HashiCorp Vault, AWS Secrets Manager, K8s Secrets)
- Set up environment-specific configurations
- Add CI/CD service account credentials
- Configure RBAC and IAM permissions (principle of least privilege)

**Track C: Monitoring Setup (70-85%)**
- Set up application monitoring (Prometheus, Datadog, New Relic)
- Configure log aggregation (ELK, CloudWatch)
- Add error tracking (Sentry, Rollbar)
- Create deployment dashboards and alerts
- Configure uptime monitoring and status page

**Output:** Fully provisioned infrastructure with monitoring

### Phase 4: Production Deployment (85-100%)
**Goals:** Deploy safely to production with validation

**Pre-flight Checks (85-90%):**
- Verify all tests pass in CI/CD
- Check code coverage meets threshold
- Verify no critical vulnerabilities
- Confirm target environment healthy
- Take pre-deployment backup

**Deployment Execution (90-95%):**
- Deploy new version using chosen strategy:
  - **Blue-Green:** Deploy to new environment, switch traffic atomically
  - **Canary:** Deploy to subset (10% traffic), gradually increase to 100%
  - **Rolling:** Update instances incrementally with health checks
- Execute health checks on new instances
- Gradually shift traffic with monitoring
- Validate key user flows work correctly

**Post-Deployment Validation (95-100%):**
- Run smoke tests on production
- Verify all endpoints responding
- Monitor error rates (should not spike >5%)
- Check response time metrics
- Validate monitoring and alerting active
- Document deployment and results

**Output:** Application deployed to production, fully monitored

## Rollback Strategy

**Triggers for rollback:**
- Error rate increase >5%
- Critical user flows broken
- Performance degradation >50%
- Health checks failing

**Rollback procedure:**
1. Stop traffic to new version immediately
2. Route all traffic to previous version
3. Document rollback reason and impact
4. Investigate root cause
5. Fix and prepare for re-deployment

## Parallelism Strategy

**Maximum parallelism:**
- All build, test, security, deployment tracks run concurrently where possible
- Infrastructure provisioning happens in parallel with monitoring setup
- Pre-flight checks run concurrently before deployment

**Sequential dependencies:**
- Tests must pass before security scanning
- Security gates must pass before deployment
- Staging deployment must succeed before production
- Health checks must pass before traffic shift

## Success Criteria
- Pipeline builds and tests automatically
- Security scanning with quality gates
- Automated deployment to staging/production
- Rollback procedure tested
- Monitoring and alerting active
- Zero-downtime deployments
- Documentation complete
