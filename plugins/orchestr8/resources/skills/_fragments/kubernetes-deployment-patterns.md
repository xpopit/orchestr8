---
id: kubernetes-deployment-patterns
category: skill
tags: [kubernetes, k8s, deployment, health-checks, resource-management, devops]
capabilities:
  - Kubernetes deployment strategies and patterns
  - Health check configuration (readiness, liveness)
  - Resource requests and limits optimization
  - Pod lifecycle and rolling updates
useWhen:
  - Implementing Kubernetes deployment patterns with rolling updates, readiness probes, and resource limits
  - Building Kubernetes manifest strategy with Helm charts for reusable, parameterized deployments
  - Designing Kubernetes autoscaling with HPA based on CPU/memory and custom metrics for optimal resource utilization
  - Creating Kubernetes service mesh with Istio for traffic management, observability, and security between services
  - Implementing Kubernetes ingress configuration with TLS termination and path-based routing to services
estimatedTokens: 600
---

# Kubernetes Deployment Patterns

## Robust Deployment Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1      # Max pods down during update
      maxSurge: 1            # Max extra pods during update
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1
    spec:
      # Anti-affinity: spread pods across nodes
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: myapp
                topologyKey: kubernetes.io/hostname

      containers:
        - name: app
          image: myapp:v1.2.3
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080
              protocol: TCP

          # Resource management
          resources:
            requests:
              cpu: 100m       # Guaranteed CPU
              memory: 128Mi   # Guaranteed memory
            limits:
              cpu: 500m       # Max CPU
              memory: 512Mi   # Max memory (OOMKilled if exceeded)

          # Health checks
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 5
            timeoutSeconds: 3
            successThreshold: 1
            failureThreshold: 3

          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          # Graceful shutdown
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]

          # Environment variables
          env:
            - name: NODE_ENV
              value: production
            - name: DB_HOST
              valueFrom:
                configMapKeyRef:
                  name: app-config
                  key: db.host
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db.password

          # Volume mounts
          volumeMounts:
            - name: config
              mountPath: /app/config
              readOnly: true

      # Security context
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001

      volumes:
        - name: config
          configMap:
            name: app-config
```

## Health Check Patterns

**Readiness vs Liveness:**

```typescript
// /health/ready - Is pod ready to receive traffic?
app.get('/health/ready', async (req, res) => {
  try {
    // Check dependencies
    await db.ping();
    await redis.ping();

    // Check critical services
    const apiHealthy = await fetch('https://api.example.com/health');

    if (!apiHealthy.ok) {
      return res.status(503).json({ status: 'not ready', reason: 'API down' });
    }

    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// /health/live - Is pod alive (not deadlocked)?
app.get('/health/live', (req, res) => {
  // Simple check - can app respond?
  // Don't check dependencies (would cause cascading restarts)
  res.json({ status: 'alive' });
});
```

**Startup Probe (slow-starting apps):**
```yaml
startupProbe:
  httpGet:
    path: /health/startup
    port: 8080
  initialDelaySeconds: 0
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 30  # 5 minutes to start (30 * 10s)
```

## Resource Management

**Right-Sizing Resources:**
```yaml
# Too low: frequent OOMKilled, CPU throttling
resources:
  requests:
    cpu: 10m
    memory: 32Mi
  limits:
    cpu: 50m
    memory: 64Mi

# Optimized: based on actual usage
resources:
  requests:
    cpu: 100m        # P50 CPU usage
    memory: 256Mi    # P50 memory usage
  limits:
    cpu: 500m        # P99 CPU usage
    memory: 512Mi    # P99 memory + 20% buffer
```

**Horizontal Pod Autoscaling:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70  # Scale at 70% CPU
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 50         # Increase by 50% at a time
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5min before scale down
      policies:
        - type: Pods
          value: 1          # Remove 1 pod at a time
          periodSeconds: 60
```

## Service Configuration

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
  annotations:
    # AWS Load Balancer annotations
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  selector:
    app: myapp
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
  sessionAffinity: None  # Or ClientIP for sticky sessions
```

## ConfigMaps and Secrets

```yaml
# ConfigMap for non-sensitive data
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  db.host: postgres.default.svc.cluster.local
  log.level: info
  api.timeout: "30s"

---
# Secret for sensitive data
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  db.password: super-secret
  api.token: token-here

# Or use external secrets (AWS Secrets Manager, Vault)
---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: app-secrets
  data:
    - secretKey: db.password
      remoteRef:
        key: prod/myapp/db-password
```

## Graceful Shutdown

```typescript
// Handle SIGTERM for graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, starting graceful shutdown');
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(async () => {
    console.log('Server closed');

    // Close database connections
    await db.close();

    // Close other resources
    await redis.quit();

    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

// Health check responds 503 during shutdown
app.get('/health/ready', (req, res) => {
  if (isShuttingDown) {
    return res.status(503).json({ status: 'shutting down' });
  }
  res.json({ status: 'ready' });
});
```

**Pod Lifecycle:**
```yaml
spec:
  terminationGracePeriodSeconds: 30  # Time to finish shutdown
  containers:
    - name: app
      lifecycle:
        preStop:
          exec:
            # Sleep before SIGTERM to allow deregistration
            command: ["/bin/sh", "-c", "sleep 15"]
```

## Deployment Strategies

**Blue-Green with Services:**
```yaml
# Blue deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue

---
# Service points to blue
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
    version: blue  # Change to "green" for cutover
```

## Best Practices Summary

✅ **Health checks** - Separate readiness, liveness, startup probes
✅ **Resource limits** - Set based on P99 usage + buffer
✅ **Rolling updates** - maxUnavailable=1, maxSurge=1 for safety
✅ **Graceful shutdown** - Handle SIGTERM, preStop hook with sleep
✅ **Anti-affinity** - Spread pods across nodes
✅ **HPA** - Auto-scale based on CPU/memory metrics
✅ **Secrets management** - Use external secrets, not ConfigMaps
✅ **Non-root user** - Security context with specific UID/GID
✅ **Monitoring** - Export metrics to Prometheus
