---
id: k8s-deployment-basic
category: example
tags: [kubernetes, k8s, deployment, containers]
capabilities:
  - Kubernetes Deployment
  - Health probes
  - Resource limits
useWhen:
  - Production Kubernetes deployments requiring 3+ replicas with rolling updates, zero-downtime deploys, and maxUnavailable:0 strategy
  - Containerized applications needing liveness probes for auto-restart on failure and readiness probes for traffic management
  - K8s services requiring resource requests (256Mi/250m CPU) and limits (512Mi/500m CPU) for proper pod scheduling and QoS
  - Production workloads needing security hardening with non-root users, read-only root filesystem, and dropped ALL capabilities
  - Applications requiring ConfigMap and Secret injection via envFrom for external configuration without rebuilding images
  - Services needing pod anti-affinity rules to distribute replicas across nodes for high availability and fault tolerance
estimatedTokens: 450
---

# Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
    spec:
      containers:
      - name: myapp
        image: myapp:latest
        ports:
        - containerPort: 3000
          name: http
        
        # Environment from ConfigMap and Secret
        envFrom:
        - configMapRef:
            name: myapp-config
        - secretRef:
            name: myapp-secrets
        
        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        # Liveness probe - restart if unhealthy
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        # Readiness probe - remove from service if not ready
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          failureThreshold: 3
        
        # Security context
        securityContext:
          runAsNonRoot: true
          runAsUser: 1001
          allowPrivilegeEscalation: false
          capabilities:
            drop: [ALL]
          readOnlyRootFilesystem: true
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: tmp
        emptyDir: {}
      
      # High availability
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: myapp
              topologyKey: kubernetes.io/hostname
```
