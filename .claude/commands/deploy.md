---
description: Autonomous production deployment with staging validation, blue-green deployment, monitoring, and automatic rollback
argumentHint: "[environment: staging|production] [strategy: blue-green|rolling|canary]"
---

# Deploy Workflow

Autonomous, safe production deployment from pre-deployment validation to post-deployment monitoring with automatic rollback capabilities.

## Deployment Strategies

**Blue-Green Deployment:**
- Two identical environments (blue = current, green = new)
- Deploy to green, test, then switch traffic
- Instant rollback by switching back to blue
- Zero downtime
- **Use for**: Critical applications, major releases

**Rolling Deployment:**
- Gradually replace instances with new version
- Partial rollback possible
- Minimal additional infrastructure
- **Use for**: Standard updates, microservices

**Canary Deployment:**
- Deploy to small subset of users first
- Monitor metrics, gradually increase traffic
- Rollback before full deployment if issues
- **Use for**: High-risk changes, A/B testing

## Execution Instructions

### Phase 1: Pre-Deployment Validation (20%)

**Use all quality agents in parallel:**

#### 1. Code Quality Gates

**Run `code-reviewer`:**
```markdown
CODE REVIEW CHECKLIST:
✓ All PR comments addressed
✓ No TODO comments in critical paths
✓ No debug logging left in code
✓ No commented-out code
✓ Consistent code style
✓ Proper error handling
✓ No hardcoded values
✓ Security best practices followed

BLOCKER ISSUES:
- Critical bugs
- Security vulnerabilities
- Breaking changes without migration path
- Missing required tests
```

#### 2. Test Coverage Validation

**Run `test-engineer`:**
```bash
# Unit tests
npm test -- --coverage
# Require > 80% coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance

# Load tests
k6 run load-test.js

VALIDATION:
✓ All tests passing (100%)
✓ Coverage > 80%
✓ No flaky tests
✓ Performance within baseline
✓ Load test successful (target RPS)
```

#### 3. Security Scan

**Run `security-auditor`:**
```bash
# Dependency vulnerabilities
npm audit --audit-level=moderate

# SAST
semgrep --config=auto

# Secrets detection
gitleaks detect

# Container scanning (if applicable)
trivy image app:latest

VALIDATION:
✓ No critical/high vulnerabilities
✓ No secrets in code
✓ No security misconfigurations
✓ Container images scanned and clean
```

#### 4. Build Validation

**Run appropriate language agent:**
```bash
# Build the application
npm run build
# or: mvn clean package
# or: cargo build --release
# or: go build

# Verify build artifacts
- Check bundle size within budget
- Verify all assets generated
- Check for build warnings
- Validate source maps

# Docker build (if applicable)
docker build -t app:${VERSION} .

# Push to registry
docker push registry.example.com/app:${VERSION}

VALIDATION:
✓ Build successful
✓ No build errors
✓ Bundle size within budget
✓ Docker image built and pushed
```

#### 5. Database Migration Validation

**Run `database-specialist`:**
```bash
# Test migrations in isolated environment
# Create test database
createdb deployment_test

# Run migrations
npm run migrate:up
# or: alembic upgrade head
# or: flyway migrate

# Verify schema
- Check all tables created
- Check all indexes created
- Check constraints in place
- Verify seed data

# Test rollback
npm run migrate:down
# Verify clean rollback

# Re-apply migrations
npm run migrate:up

VALIDATION:
✓ Migrations run successfully
✓ Rollback works
✓ No data loss during migration
✓ Performance impact acceptable
```

#### 6. Infrastructure Validation

**Run `infrastructure-engineer` or cloud specialist:**
```bash
# Validate infrastructure code
terraform validate
terraform plan -out=tfplan

# Check for destructive changes
terraform show tfplan | grep -i "will be destroyed"

# Validate Kubernetes manifests
kubectl apply --dry-run=client -f k8s/
kubectl apply --dry-run=server -f k8s/

# Validate scaling configuration
- Min/max instances
- Auto-scaling thresholds
- Health check configuration
- Resource limits

VALIDATION:
✓ Infrastructure code valid
✓ No unexpected destructive changes
✓ Kubernetes manifests valid
✓ Scaling properly configured
```

**CHECKPOINT**: All pre-deployment validations passed ✓

### Phase 2: Staging Deployment (15%)

**Deploy to staging environment first:**

#### 1. Deploy to Staging

```bash
# Set environment
export ENV=staging

# Apply database migrations
npm run migrate -- --env=staging

# Deploy application
# Kubernetes
kubectl apply -f k8s/staging/

# Wait for rollout
kubectl rollout status deployment/app -n staging

# AWS ECS
aws ecs update-service \
  --cluster staging \
  --service app \
  --task-definition app:${VERSION}

# Heroku
git push heroku-staging main

# Serverless
serverless deploy --stage staging

VALIDATION:
✓ Deployment successful
✓ All pods/instances healthy
✓ Database migrations applied
✓ Configuration loaded correctly
```

#### 2. Staging Smoke Tests

```bash
# Health check
curl https://staging.example.com/health
# Expected: {"status": "healthy"}

# Basic functionality tests
npm run test:smoke -- --env=staging

# Critical user paths
- User registration
- User login
- Core feature workflows
- Payment processing (test mode)
- Third-party integrations

# Performance smoke test
k6 run smoke-test.js --env staging

VALIDATION:
✓ Health check passing
✓ Smoke tests passing
✓ Core features working
✓ No errors in logs
✓ Performance acceptable
```

#### 3. Staging Validation

```bash
# Monitor for 15 minutes
# Watch for:
- Error rates
- Response times
- Memory usage
- CPU usage
- Database connections
- External API calls

# Check logs
kubectl logs -l app=myapp -n staging --tail=100

# No errors, warnings acceptable
# No memory leaks
# No connection pool exhaustion

VALIDATION:
✓ No errors in 15-minute window
✓ Metrics within normal range
✓ No resource leaks
✓ Logs clean
```

**CHECKPOINT**: Staging deployment validated ✓

### Phase 3: Production Deployment (30%)

**Choose deployment strategy based on requirements:**

#### Strategy A: Blue-Green Deployment

```bash
# Step 1: Prepare Green Environment
# Green is the new version, Blue is current production

# Deploy to green environment
kubectl apply -f k8s/production/green/

# Wait for green to be ready
kubectl wait --for=condition=ready pod \
  -l app=myapp,env=green \
  -n production \
  --timeout=300s

# Step 2: Run smoke tests on green (internal traffic only)
curl https://green.internal.example.com/health

npm run test:smoke -- --env=production-green

# Step 3: Database migration (if needed)
# Run migrations with both blue and green running
# Ensure backward compatibility
npm run migrate -- --env=production

# Step 4: Warm up green environment
# Send small amount of traffic to warm caches
for i in {1..100}; do
  curl https://green.internal.example.com/api/users
  sleep 0.1
done

# Step 5: Switch traffic from blue to green
# Update load balancer / ingress
kubectl patch service myapp-service \
  -n production \
  -p '{"spec":{"selector":{"env":"green"}}}'

# Or AWS ALB target group
aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --actions Type=forward,TargetGroupArn=$GREEN_TG_ARN

# Step 6: Monitor green environment
# Watch for 10 minutes
- Error rates (should be < 0.1%)
- Response times (should be < baseline)
- Resource usage
- User complaints

# Step 7: Decision point
if [ $ERROR_RATE -lt 0.1 ]; then
  echo "Deployment successful"
  # Keep green, decommission blue after 24 hours
else
  echo "Rollback required"
  # Switch back to blue
  kubectl patch service myapp-service \
    -n production \
    -p '{"spec":{"selector":{"env":"blue"}}}'
fi

VALIDATION:
✓ Green environment healthy
✓ Traffic switched successfully
✓ Error rates normal
✓ Response times acceptable
✓ No user complaints
```

#### Strategy B: Rolling Deployment

```bash
# Step 1: Update deployment with new version
kubectl set image deployment/myapp \
  myapp=registry.example.com/myapp:${VERSION} \
  -n production

# Configure rolling update strategy
kubectl patch deployment myapp -n production -p '{
  "spec": {
    "strategy": {
      "type": "RollingUpdate",
      "rollingUpdate": {
        "maxSurge": 1,
        "maxUnavailable": 0
      }
    }
  }
}'

# Step 2: Watch rollout
kubectl rollout status deployment/myapp -n production

# Rollout updates pods one at a time:
# 1. Create new pod with new version
# 2. Wait for pod to be ready
# 3. Terminate old pod
# 4. Repeat

# Step 3: Monitor during rollout
watch kubectl get pods -n production

# Check metrics every 30 seconds
while kubectl rollout status deployment/myapp -n production | grep -q "Waiting"; do
  ERROR_RATE=$(check_error_rate)
  if [ $ERROR_RATE -gt 1 ]; then
    echo "High error rate detected, pausing rollout"
    kubectl rollout pause deployment/myapp -n production
    exit 1
  fi
  sleep 30
done

# Step 4: Validate complete rollout
kubectl rollout status deployment/myapp -n production
# Should output: "deployment successfully rolled out"

VALIDATION:
✓ All pods updated
✓ All pods healthy
✓ Error rates normal during rollout
✓ Zero downtime achieved
```

#### Strategy C: Canary Deployment

```bash
# Step 1: Deploy canary (5% of traffic)
kubectl apply -f k8s/production/canary/

# Configure traffic split (Istio/Nginx)
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
  - myapp.example.com
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: myapp-canary
        port:
          number: 80
  - route:
    - destination:
        host: myapp-stable
        port:
          number: 80
      weight: 95
    - destination:
        host: myapp-canary
        port:
          number: 80
      weight: 5

# Step 2: Monitor canary (30 minutes)
# Compare metrics: canary vs stable
- Error rates: canary ≈ stable
- Response times: canary ≤ stable
- Resource usage
- User feedback

# Step 3: Gradual rollout if metrics good
# 5% → 10% → 25% → 50% → 100%
for WEIGHT in 10 25 50 100; do
  # Update traffic split
  kubectl patch virtualservice myapp -n production -p "{
    \"spec\": {
      \"http\": [{
        \"route\": [
          {\"destination\": {\"host\": \"myapp-stable\"}, \"weight\": $((100-WEIGHT))},
          {\"destination\": {\"host\": \"myapp-canary\"}, \"weight\": $WEIGHT}
        ]
      }]
    }
  }"

  # Monitor for 15 minutes at each stage
  sleep 900

  # Check metrics
  if [ $CANARY_ERROR_RATE -gt $STABLE_ERROR_RATE ]; then
    echo "Canary showing higher errors, rolling back"
    # Set weight back to 0
    exit 1
  fi
done

# Step 4: Make canary the new stable
kubectl patch service myapp-service \
  -n production \
  -p '{"spec":{"selector":{"version":"canary"}}}'

# Decommission old stable
kubectl delete deployment myapp-stable -n production

VALIDATION:
✓ Canary metrics match or exceed stable
✓ Gradual rollout successful
✓ 100% traffic on new version
✓ Old version decommissioned
```

#### Database Migrations (Production)

```bash
# Step 1: Backup database
pg_dump production_db > backup_$(date +%Y%m%d_%H%M%S).sql
# Upload to S3
aws s3 cp backup_*.sql s3://backups/database/

# Step 2: Run migrations
# For zero-downtime, migrations must be backward compatible
# Phase 1: Additive changes only
# - Add new columns (nullable)
# - Add new tables
# - Add new indexes (CONCURRENTLY)

npm run migrate:up -- --env=production

# Step 3: Deploy application (can read old and new schema)

# Step 4: Backfill data (if needed)
npm run backfill -- --env=production

# Step 5: Phase 2 migrations (after deployment)
# - Make columns NOT NULL
# - Drop old columns
# - Drop old tables

# Run this after 24 hours of successful deployment
npm run migrate:cleanup -- --env=production

VALIDATION:
✓ Backup created and stored
✓ Migrations successful
✓ No downtime during migration
✓ Data integrity maintained
```

**CHECKPOINT**: Production deployment complete ✓

### Phase 4: Post-Deployment Validation (20%)

**Monitor and validate deployment:**

#### 1. Automated Health Checks

```bash
# Application health
curl https://api.example.com/health
# Expected: {"status": "healthy", "version": "1.2.3"}

# Database connectivity
curl https://api.example.com/health/database
# Expected: {"status": "connected"}

# External dependencies
curl https://api.example.com/health/dependencies
# Expected: {"redis": "connected", "s3": "accessible"}

# Smoke tests in production
npm run test:smoke -- --env=production

VALIDATION:
✓ All health checks passing
✓ Database connected
✓ External services accessible
✓ Smoke tests passing
```

#### 2. Metrics Monitoring (Critical Window: First Hour)

```bash
# Monitor dashboards
# Track for 1 hour minimum:

ERROR RATES:
- Current: 0.05%
- Baseline: 0.04%
- Threshold: 0.5%
- Status: ✓ GOOD

RESPONSE TIMES:
- p50: 145ms (baseline: 150ms)
- p95: 380ms (baseline: 400ms)
- p99: 720ms (baseline: 800ms)
- Status: ✓ GOOD (improved!)

THROUGHPUT:
- Current: 1,240 req/s
- Baseline: 1,200 req/s
- Status: ✓ GOOD

RESOURCE USAGE:
- CPU: 45% (baseline: 50%)
- Memory: 2.1 GB (baseline: 2.3 GB)
- Status: ✓ GOOD

BUSINESS METRICS:
- Successful checkouts: 98.5% (baseline: 98.2%)
- User signups: 145/hr (baseline: 140/hr)
- Status: ✓ GOOD
```

#### 3. Log Analysis

```bash
# Check for errors in logs
kubectl logs -l app=myapp -n production --since=1h | grep -i error

# Alert on suspicious patterns
- Database connection errors
- External API timeouts
- Unexpected exceptions
- Memory warnings
- Authentication failures

# Use log aggregation (ELK, Splunk, Datadog)
# Search for:
- 5xx errors
- Slow queries (> 1s)
- Failed background jobs
- Security events

VALIDATION:
✓ No critical errors
✓ Error rate within normal range
✓ No new error patterns
✓ Warnings are expected and documented
```

#### 4. User Impact Analysis

```bash
# Real User Monitoring (RUM)
# Check Web Vitals from actual users

# Apdex Score (User Satisfaction)
# Score = (Satisfied + Tolerating/2) / Total
# Target: > 0.95

# User feedback monitoring
- Support tickets: No increase
- Social media mentions: Normal
- Error reporting (Sentry): No spike
- Customer complaints: None

# A/B test results (if canary)
- Conversion rate: Equal or better
- User engagement: Equal or better
- Feature usage: As expected

VALIDATION:
✓ No user complaints
✓ Apdex score > 0.95
✓ No support ticket spike
✓ Business metrics stable or improved
```

**CHECKPOINT**: Post-deployment validation successful ✓

### Phase 5: Monitoring & Alerting (10%)

**Configure ongoing monitoring:**

```yaml
# Prometheus alerts
groups:
  - name: deployment
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 1.0
        for: 10m
        annotations:
          summary: "High response time"
          description: "p95 latency is {{ $value }}s"

      - alert: MemoryUsageHigh
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.9
        for: 5m
        annotations:
          summary: "Memory usage high"
          description: "Memory usage at {{ $value }}%"

      - alert: DeploymentReplicasMismatch
        expr: kube_deployment_status_replicas_available != kube_deployment_spec_replicas
        for: 15m
        annotations:
          summary: "Deployment replicas mismatch"
          description: "Deployment has {{ $value }} available replicas"
```

#### Dashboards

```markdown
## Deployment Dashboard

### Key Metrics
- Error Rate: 0.05% ✓
- p95 Response Time: 380ms ✓
- Throughput: 1,240 req/s ✓
- Apdex Score: 0.97 ✓

### Resource Usage
- CPU: 45% ✓
- Memory: 2.1 GB ✓
- Network: 120 Mbps ✓
- Disk I/O: 5 MB/s ✓

### Business Metrics
- Active Users: 8,234 ✓
- Transactions/min: 450 ✓
- Revenue/hr: $12,450 ✓

### Deployment Info
- Version: v1.2.3
- Deployed: 2024-01-15 14:30 UTC
- Deployed By: CI/CD (commit: abc123)
- Strategy: Blue-Green
- Rollback Plan: Switch to blue (v1.2.2)
```

**CHECKPOINT**: Monitoring and alerting configured ✓

### Phase 6: Rollback Procedures (If Needed) (5%)

**Automatic rollback triggers:**

```bash
# Monitor deployment success
# Rollback if:
- Error rate > 1% for 5 minutes
- p95 response time > 2x baseline for 10 minutes
- Critical health checks failing for 3 minutes
- Memory usage > 95% sustained
- Manual rollback requested

# Blue-Green Rollback (Instant)
kubectl patch service myapp-service \
  -n production \
  -p '{"spec":{"selector":{"env":"blue"}}}'
# Traffic switched back in < 5 seconds

# Rolling Deployment Rollback
kubectl rollout undo deployment/myapp -n production
# Rolls back to previous version

# Canary Rollback
kubectl patch virtualservice myapp -n production -p '{
  "spec": {
    "http": [{
      "route": [{
        "destination": {"host": "myapp-stable"},
        "weight": 100
      }]
    }]
  }
}'
kubectl delete deployment myapp-canary -n production

# Database Rollback (if needed)
# Restore from backup
pg_restore -d production_db backup_20240115_143000.sql

# Run down migrations
npm run migrate:down -- --env=production --steps=1

VALIDATION:
✓ Rolled back to previous version
✓ Application healthy
✓ Metrics normal
✓ Users can access application
```

## Post-Deployment Actions

```markdown
### Within 1 Hour
- ✓ Validate all metrics normal
- ✓ Check error logs
- ✓ Verify user-facing features
- ✓ Update status page (if applicable)
- ✓ Notify stakeholders of successful deployment

### Within 24 Hours
- ✓ Review deployment metrics
- ✓ Analyze any warnings or issues
- ✓ Clean up old blue environment (if blue-green)
- ✓ Update documentation (if needed)
- ✓ Post-mortem if any issues occurred

### Within 1 Week
- ✓ Review business metrics impact
- ✓ Gather user feedback
- ✓ Identify deployment process improvements
- ✓ Update runbooks based on learnings
```

## Success Criteria

Deployment successful when:
- ✅ All pre-deployment validations passed
- ✅ Staging deployment and validation successful
- ✅ Production deployment completed
- ✅ Zero downtime achieved
- ✅ All health checks passing
- ✅ Error rates within acceptable range
- ✅ Response times meet SLA
- ✅ No user-facing issues
- ✅ Business metrics stable or improved
- ✅ Monitoring and alerting configured
- ✅ Rollback plan tested and ready
- ✅ Stakeholders notified

## Example Usage

### Example 1: Standard Production Deployment

```bash
/deploy "Deploy v2.5.0 to production using blue-green strategy. Includes database migrations for new user preferences feature."
```

**Autonomous execution:**
1. Runs all pre-deployment validations (code review, tests, security, build)
2. Validates database migrations in test environment
3. Deploys to staging, runs smoke tests (15 min validation)
4. Deploys green environment to production
5. Applies database migrations (backward compatible)
6. Runs smoke tests on green environment
7. Switches traffic from blue to green
8. Monitors for 1 hour (error rate: 0.04%, p95: 380ms - within threshold)
9. Deployment successful, keeps blue for 24hr then decommissions
10. Sends success notification

**Time: 1.5-2 hours**

### Example 2: Hotfix Deployment

```bash
/deploy "Emergency hotfix for payment processing bug. Deploy immediately to production with rolling strategy."
```

**Autonomous execution:**
1. Fast-track validation (critical tests only)
2. Skip staging (emergency)
3. Rolling deployment to production
4. Monitors closely during rollout
5. Validates payment processing working
6. All instances updated in 10 minutes
7. Zero downtime, bug fixed

**Time: 20-30 minutes**

### Example 3: Canary Deployment for High-Risk Feature

```bash
/deploy "Deploy new recommendation algorithm (v3.0.0) using canary strategy. Monitor conversion rates closely."
```

**Autonomous execution:**
1. Full pre-deployment validation
2. Staging deployment and validation
3. Deploys canary to 5% of users
4. Monitors for 30 minutes (metrics good)
5. Increases to 10%, monitors 15 min
6. Increases to 25%, monitors 15 min
7. Increases to 50%, monitors 15 min
8. Increases to 100%, monitors 30 min
9. Canary metrics show 15% improvement in conversion!
10. Makes canary the new stable, decommissions old version

**Time: 3-4 hours**

## Anti-Patterns

### DON'T
❌ Deploy on Friday afternoon (deploy early week)
❌ Deploy during peak traffic hours
❌ Skip staging validation
❌ Deploy without rollback plan
❌ Deploy multiple changes at once
❌ Ignore monitoring during deployment
❌ Deploy without database backup
❌ Deploy without notifying team
❌ Deploy when on-call person unavailable

### DO
✅ Deploy early in week (Mon-Wed)
✅ Deploy during low traffic periods
✅ Always validate in staging first
✅ Test rollback procedure beforehand
✅ Deploy small, incremental changes
✅ Monitor closely during and after deployment
✅ Always backup database before migrations
✅ Notify team and stakeholders
✅ Ensure on-call coverage during deployment

## Deployment Checklist

```markdown
PRE-DEPLOYMENT:
□ All tests passing (unit, integration, e2e)
□ Code review approved
□ Security scan passed
□ Build successful
□ Database migrations tested
□ Staging deployment successful
□ Rollback plan documented
□ Team notified
□ On-call person available

DURING DEPLOYMENT:
□ Monitoring dashboard open
□ Error logs streaming
□ Smoke tests ready
□ Communication channel open
□ Rollback command ready

POST-DEPLOYMENT:
□ Health checks passing
□ Smoke tests passed
□ Metrics within normal range
□ No error spike
□ User feedback monitored
□ Stakeholders notified
□ Deployment documented
□ Retrospective scheduled (if issues)
```

## Deployment Frequency

```markdown
RECOMMENDED CADENCE:

SMALL TEAMS:
- Weekly deployments
- Hotfixes as needed
- Deploy on Tuesday/Wednesday

MEDIUM TEAMS:
- Daily deployments (main branch)
- Continuous deployment for non-critical
- Scheduled deployment for critical

LARGE TEAMS:
- Multiple deployments per day
- Continuous deployment
- Canary for high-risk changes
- Blue-green for critical services

ENTERPRISE:
- Continuous deployment (automated)
- Canary for all changes
- Blue-green for tier-1 services
- Scheduled maintenance windows for major changes
```

Autonomous, safe, and production-ready deployments with comprehensive validation and instant rollback capabilities.
