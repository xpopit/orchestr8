---
id: workflow-deploy
category: pattern
tags: [workflow, deployment, production, release, validation, rollback, staging, devops]
capabilities:
  - Safe production deployment with validation
  - Multi-stage deployment with quality gates
  - Automated health checks and rollback
  - Deployment strategy execution (blue-green, canary, rolling)
useWhen:
  - Production deployment workflows requiring build validation, environment configuration, zero-downtime deployment, and rollback procedures
  - Release automation needing pre-deployment checks, staged rollouts, health monitoring, and post-deployment validation
estimatedTokens: 480
---

# Deployment Workflow Pattern

**Strategy:** Pre-flight → Deploy → Validate → Monitor

## Phase 1: Pre-Deployment (0-20%)
- Verify CI/CD passed (tests, coverage, security scans)
- Check target environment health
- Take database/state backup
- Review deployment checklist
- **Checkpoint:** All quality gates passed

## Phase 2: Staging Deployment (20-50%)
- Deploy to staging environment
- Run smoke tests
- Execute integration tests
- Validate key user flows
- Monitor for 15+ minutes
- **Checkpoint:** Staging stable and validated

## Phase 3: Production Deployment (50-80%)
**Execute strategy:**
- **Blue-Green:** Deploy new, switch traffic atomically
- **Canary:** 10% → 25% → 50% → 100% traffic with monitoring
- **Rolling:** Update instances incrementally with health checks

**Activities:**
- Deploy new version
- Run health checks
- Gradually shift traffic
- Monitor error rates (must stay <5% increase)
- **Checkpoint:** Deployment complete

## Phase 4: Post-Deployment (80-100%)
- Run production smoke tests
- Verify all endpoints responding
- Check error rates, response times, resource usage
- Validate monitoring/alerts active
- Document deployment results
- **Checkpoint:** Production validated and monitored

## Rollback Triggers
- Error rate increase >5%
- Critical flows broken
- Performance degradation >50%
- Health checks failing

**Rollback:** Stop traffic → Route to previous version → Document → Investigate

## Success Criteria
- Zero-downtime deployment
- All health checks passing
- Error rates within baseline
- Monitoring active
- Rollback plan tested
