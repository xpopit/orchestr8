---
id: deployment-zero-downtime
category: skill
tags: [deployment, zero-downtime, blue-green, canary, rolling-deployment, devops]
capabilities:
  - Blue-green deployment strategy
  - Canary releases with gradual rollout
  - Rolling deployment patterns
  - Traffic shifting and load balancing
useWhen:
  - Implementing blue-green deployment strategy for Node.js application achieving zero-downtime releases with instant rollback
  - Building rolling deployment pipeline gradually updating instances with health checks and automatic rollback on failure
  - Designing canary deployment pattern routing small traffic percentage to new version with automated rollback
  - Creating database migration strategy for zero-downtime deployments with backward-compatible schema changes
  - Implementing feature flags for gradual feature rollout decoupling deployment from feature activation
estimatedTokens: 580
---

# Zero-Downtime Deployment Strategies

## Blue-Green Deployment

```yaml
# Two identical environments, switch traffic atomically
stages:
  - name: Deploy to Green
    run: |
      # Deploy new version to green environment
      kubectl apply -f green-deployment.yaml
      kubectl wait --for=condition=ready pod -l app=myapp,env=green

  - name: Run Health Checks
    run: |
      curl -f http://green.internal.example.com/health

  - name: Switch Traffic
    run: |
      # Update service selector to point to green
      kubectl patch service myapp -p '{"spec":{"selector":{"env":"green"}}}'

  - name: Monitor
    run: |
      # Watch metrics for 5 minutes
      if [ $? -eq 0 ]; then
        kubectl delete deployment myapp-blue
      fi
```

**Kubernetes Blue-Green:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # Switch to "green" for cutover
  ports:
    - port: 80

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green
```

**Benefits:** Instant rollback, full testing of new environment
**Drawbacks:** 2x infrastructure cost during deployment

## Canary Deployment

```yaml
# Gradually shift traffic to new version
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp.example.com
  http:
    - match:
        - headers:
            user-type:
              exact: "beta-tester"
      route:
        - destination:
            host: myapp
            subset: v2
    - route:
        - destination:
            host: myapp
            subset: v1
          weight: 90  # 90% to old version
        - destination:
            host: myapp
            subset: v2
          weight: 10  # 10% to new version
```

**Progressive Rollout Strategy:**
1. Deploy v2 alongside v1
2. Route 5% traffic → Monitor metrics
3. Route 25% traffic → Check error rates
4. Route 50% traffic → Validate performance
5. Route 100% traffic → Full rollout
6. Remove v1

**Metrics to Monitor:**
- Error rate (< 1% increase)
- Latency (p95, p99 within SLA)
- Success rate (> 99.9%)
- Resource usage (CPU, memory)

## Rolling Deployment

```yaml
# Kubernetes native rolling update
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1   # Never have more than 1 pod down
      maxSurge: 2         # Can create 2 extra pods during update
  minReadySeconds: 30     # Wait 30s before considering pod ready
  template:
    spec:
      containers:
        - name: app
          image: myapp:v2
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
```

**Docker Swarm Rolling:**
```bash
docker service update \
  --image myapp:v2 \
  --update-parallelism 2 \
  --update-delay 30s \
  --update-failure-action rollback \
  myapp
```

**Benefits:** No extra infrastructure, gradual rollout
**Drawbacks:** Both versions run simultaneously

## Traffic Shifting with Load Balancer

```nginx
# Nginx weighted routing
upstream backend {
    server blue.internal:8080 weight=1;
    server green.internal:8080 weight=0;  # Start at 0
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

**AWS ALB Target Groups:**
```bash
# Shift traffic gradually
aws elbv2 modify-rule \
  --rule-arn arn:aws:elasticloadbalancing:... \
  --actions Type=forward,ForwardConfig='{
    "TargetGroups":[
      {"TargetGroupArn":"arn:aws:.../blue","Weight":70},
      {"TargetGroupArn":"arn:aws:.../green","Weight":30}
    ]
  }'
```

## Key Principles

1. **Health checks required**: Robust readiness/liveness probes
2. **Gradual rollout**: Start small (5-10%), increase slowly
3. **Automated monitoring**: Watch metrics continuously
4. **Instant rollback**: Revert traffic at first sign of issues
5. **Database compatibility**: New code must work with old schema
6. **Stateless services**: Session affinity complicates zero-downtime
