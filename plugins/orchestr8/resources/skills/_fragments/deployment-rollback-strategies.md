---
id: deployment-rollback-strategies
category: skill
tags: [deployment, rollback, database-migrations, feature-flags, devops, disaster-recovery]
capabilities:
  - Safe rollback procedures
  - Database migration rollback patterns
  - Feature flag-based rollouts
  - Rollback automation and testing
useWhen:
  - Implementing automated rollback mechanism detecting deployment failures and reverting to previous stable version
  - Building deployment versioning strategy with Git tags enabling quick rollback to any previous release
  - Designing rollback testing procedure validating database migration reversibility and data integrity
  - Creating rollback decision criteria with automated health checks and error rate thresholds triggering rollback
  - Implementing progressive rollback strategy gradually reverting traffic to old version while monitoring metrics
estimatedTokens: 600
---

# Safe Rollback Strategies

## Instant Application Rollback

**Kubernetes Deployment:**
```bash
# View revision history
kubectl rollout history deployment/myapp

# Rollback to previous version
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=3

# Check rollback status
kubectl rollout status deployment/myapp
```

**Docker Swarm:**
```bash
docker service rollback myapp

# Or update to previous image
docker service update --image myapp:v1.2.3 myapp
```

**AWS ECS:**
```bash
# Use previous task definition
aws ecs update-service \
  --cluster production \
  --service myapp \
  --task-definition myapp:45  # Previous revision
```

## Database Migration Rollback

**Expandable Schema Pattern (Recommended):**

```sql
-- Migration: Add new column (safe, backward compatible)
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

-- Application v2: Use new column if exists
SELECT id, email,
  COALESCE(email_verified, FALSE) as verified
FROM users;

-- After v2 deployed successfully, make required
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
```

**Three-Phase Migration:**
```sql
-- Phase 1: Add new column (deploy app v1.5 that ignores it)
ALTER TABLE orders ADD COLUMN total_cents INTEGER;
UPDATE orders SET total_cents = (total * 100);

-- Phase 2: Deploy app v2 that uses total_cents
-- Phase 3: Remove old column (deploy app v2.5)
ALTER TABLE orders DROP COLUMN total;
```

**Rollback-Friendly Migrations:**
```python
# migrations/003_add_email_verified.py
def up():
    """Add column - safe to rollback by dropping"""
    db.execute("ALTER TABLE users ADD COLUMN email_verified BOOLEAN")

def down():
    """Rollback migration"""
    db.execute("ALTER TABLE users DROP COLUMN email_verified")

# NEVER in down():
# - DROP TABLE (data loss!)
# - Change that loses data
```

**Migration Safety Checklist:**
- ✅ Can app v(N-1) work with schema v(N)? → Deploy schema first
- ✅ Can app v(N) work with schema v(N-1)? → Deploy app first
- ✅ Is down() function tested? → Test rollback path
- ⚠️ Avoid: Renaming columns, dropping columns, changing types

## Feature Flag Rollback

**Infrastructure-Level Toggle:**
```typescript
// Feature flag service
const featureFlags = {
  'new-checkout-flow': {
    enabled: false,  // Instant rollback: flip to false
    rollout: 0.10,   // Gradual: 10% of users
  }
};

function isEnabled(flag: string, userId: string): boolean {
  const config = featureFlags[flag];
  if (!config.enabled) return false;

  // Consistent hashing for gradual rollout
  const hash = hashUserId(userId);
  return (hash % 100) < (config.rollout * 100);
}

// Application code
if (isEnabled('new-checkout-flow', user.id)) {
  return newCheckoutFlow(user);
} else {
  return legacyCheckoutFlow(user);
}
```

**LaunchDarkly/Split.io Pattern:**
```typescript
import { LDClient } from 'launchdarkly-node-server-sdk';

const ldClient = LDClient.init(SDK_KEY);

// Rollback = change flag value in dashboard (no deploy!)
const showNewUI = await ldClient.variation(
  'new-dashboard-ui',
  { key: userId },
  false  // Default if flag fetch fails
);
```

**Benefits:**
- Instant rollback (no deployment)
- Gradual rollout control
- A/B testing capability
- Decouple deployment from release

## Automated Rollback

**CI/CD Pipeline with Auto-Rollback:**
```yaml
# GitHub Actions
deploy:
  steps:
    - name: Deploy
      run: kubectl apply -f k8s/

    - name: Wait for Rollout
      run: kubectl rollout status deployment/myapp --timeout=5m

    - name: Run Smoke Tests
      run: npm run test:smoke

    - name: Monitor Metrics
      run: |
        # Check error rate for 5 minutes
        python scripts/check-metrics.py --duration=5m --threshold=1%

    - name: Rollback on Failure
      if: failure()
      run: |
        kubectl rollout undo deployment/myapp
        # Notify team
        curl -X POST $SLACK_WEBHOOK -d '{"text":"Auto-rollback triggered"}'
```

**Flagger (Kubernetes Progressive Delivery):**
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  progressDeadlineSeconds: 60
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5  # Number of failed checks before rollback
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        thresholdRange:
          min: 99  # Rollback if success rate < 99%
      - name: request-duration
        thresholdRange:
          max: 500  # Rollback if p99 latency > 500ms
```

## Rollback Testing

**Include in CI/CD:**
```bash
# Test rollback procedure
./scripts/deploy.sh v2.0.0
./scripts/run-tests.sh
./scripts/rollback.sh v1.9.0
./scripts/run-tests.sh  # Verify app still works
```

**Chaos Engineering:**
```yaml
# Regularly test rollback in staging
schedule: "0 2 * * *"  # 2 AM daily
steps:
  - deploy: latest
  - inject: high-error-rate
  - trigger: auto-rollback
  - verify: application-healthy
```

## Key Principles

1. **Always have rollback plan** before deploying
2. **Test rollback path** as part of CI/CD
3. **Database migrations** must be backward compatible
4. **Feature flags** for instant, deployment-free rollback
5. **Automate rollback** based on metrics (error rate, latency)
6. **Document rollback** procedures in runbooks
