---
id: workflow-setup-cicd
category: pattern
tags: [workflow, cicd, pipeline, automation, github-actions, gitlab-ci, jenkins, testing, security]
capabilities:
  - Complete CI/CD pipeline configuration
  - Multi-stage pipeline with quality gates
  - Automated testing and security scanning
  - Build optimization and caching
useWhen:
  - CI/CD pipeline setup requiring build automation, test execution, deployment configuration, and monitoring integration
  - Continuous delivery implementation needing GitHub Actions, test coverage, staging environments, and production deployment automation
estimatedTokens: 520
---

# CI/CD Pipeline Setup Pattern

**Phases:** Design (0-20%) → Build (20-40%) → Test/Security (40-70%) → Deploy (70-100%)

## Phase 1: Pipeline Design (0-20%)
- Identify platform (GitHub Actions, GitLab CI, Jenkins, CircleCI)
- Design stages: Build → Test → Scan → Deploy
- Choose deployment strategy (blue-green, canary, rolling)
- Define environments (dev, staging, production)
- Plan quality gates and approvals
- **Checkpoint:** Architecture documented

## Phase 2: Build Configuration (20-40%)
**Parallel:**
- Configure triggers (push, PR, tag, schedule)
- Build job (compile, bundle, package)
- Dependency caching for speed
- Artifact storage and versioning
- Docker multi-stage build
- **Checkpoint:** Build produces artifacts

## Phase 3: Testing & Security (40-70%)
**Parallel tracks:**

**Track A: Testing (40-60%)**
- Unit, integration, E2E test execution
- Code coverage reporting (80%+ threshold)
- Parallel test execution
- Test result publishing

**Track B: Quality (45-65%)**
- Linting and formatting checks
- Code quality analysis (SonarQube)
- Documentation validation

**Track C: Security (50-70%)**
- Dependency scanning (npm audit, Snyk)
- SAST (static analysis)
- Container image scanning (Trivy)
- Secrets scanning
- Quality gates (block on critical/high)

**Checkpoint:** All tests pass, no critical vulnerabilities

## Phase 4: Deployment Jobs (70-100%)
**Parallel:**
- Environment-specific deployment configs
- Credentials and secrets setup (least privilege)
- Health check validation post-deploy
- Rollback procedures (automated/manual)
- Deployment notifications (Slack, email)
- **Checkpoint:** Pipeline deploys successfully

## Pipeline Optimization
- Cache dependencies (npm, pip, cargo)
- Run jobs in parallel where possible
- Use matrix builds for multi-platform
- Optimize Docker layer caching
- Skip redundant jobs (e.g., docs-only changes)

## Success Criteria
- Pipeline runs automatically on commits
- All quality gates enforced
- Tests pass consistently
- Security scanning integrated
- Deployment automated to staging
- Rollback tested
- Pipeline documentation complete
