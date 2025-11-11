---
id: infrastructure-kubernetes
category: agent
tags: [kubernetes, k8s, containers, orchestration, deployments, services, ingress, helm, operators, platform-engineering]
capabilities:
  - Kubernetes cluster architecture and design
  - Deployment, Service, Ingress configuration
  - StatefulSets and persistent storage
  - Custom Resource Definitions and Operators
  - RBAC and security policies
  - Resource management and autoscaling
useWhen:
  - Designing Kubernetes cluster architectures with multi-node control planes, worker node pools, and pod autoscaling (HPA, VPA, cluster autoscaler) for production workloads
  - Implementing Kubernetes deployments using ReplicaSets for pod replication, StatefulSets for stateful apps, DaemonSets for node-level services, and Jobs/CronJobs for batch processing
  - Configuring Kubernetes networking with Services (ClusterIP, NodePort, LoadBalancer), Ingress controllers (Nginx, Traefik), Network Policies for pod-to-pod firewall rules
  - Managing storage in Kubernetes using PersistentVolumes, PersistentVolumeClaims, StorageClasses for dynamic provisioning, and CSI drivers for cloud provider integration
  - Securing Kubernetes with RBAC for access control, Pod Security Policies/Standards, Secrets management (sealed-secrets, external-secrets), and service mesh (Istio, Linkerd)
  - Deploying applications with Helm charts for package management, GitOps using ArgoCD or FluxCD, and monitoring with Prometheus/Grafana stack
estimatedTokens: 680
---

# Kubernetes Infrastructure Expert

Expert in Kubernetes architecture, workload management, operators, and platform engineering patterns.

## Deployment Patterns

### Production-Ready Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
  labels:
    app: web
    version: v2.1.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
        version: v2.1.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      serviceAccountName: web-app-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 2000
      containers:
      - name: app
        image: myapp:v2.1.0
        imagePullPolicy: IfNotPresent
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        - name: metrics
          containerPort: 9090
        env:
        - name: NODE_ENV
          value: production
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            cpu: 500m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 1Gi
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        startupProbe:
          httpGet:
            path: /health/startup
            port: http
          periodSeconds: 5
          failureThreshold: 30
        volumeMounts:
        - name: data
          mountPath: /data
        - name: config
          mountPath: /config
          readOnly: true
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: web-app-pvc
      - name: config
        configMap:
          name: app-config
          items:
          - key: config.json
            path: config.json
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: web
              topologyKey: kubernetes.io/hostname
```

### Autoscaling Configuration
```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: web-app-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30

---
# Vertical Pod Autoscaler (for right-sizing)
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: web-app-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: web-app
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: app
      minAllowed:
        cpu: 100m
        memory: 128Mi
      maxAllowed:
        cpu: 2
        memory: 2Gi
```

## Service and Networking

### Service Types
```yaml
# ClusterIP - internal only
apiVersion: v1
kind: Service
metadata:
  name: web-app-internal
spec:
  type: ClusterIP
  selector:
    app: web
  ports:
  - name: http
    port: 80
    targetPort: http

---
# LoadBalancer - cloud provider LB
apiVersion: v1
kind: Service
metadata:
  name: web-app-external
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: nlb
    service.beta.kubernetes.io/aws-load-balancer-scheme: internet-facing
spec:
  type: LoadBalancer
  selector:
    app: web
  ports:
  - name: http
    port: 80
    targetPort: http
  sessionAffinity: ClientIP

---
# Headless service for StatefulSet
apiVersion: v1
kind: Service
metadata:
  name: postgres-headless
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
```

### Ingress with TLS
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: production
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls-cert
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
```

## StatefulSets and Storage

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: data
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      storageClassName: fast-ssd
      resources:
        requests:
          storage: 50Gi
```

## Security and RBAC

```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: web-app-sa
  namespace: production

---
# Role with specific permissions
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: app-role
  namespace: production
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-role-binding
  namespace: production
subjects:
- kind: ServiceAccount
  name: web-app-sa
  namespace: production
roleRef:
  kind: Role
  name: app-role
  apiGroup: rbac.authorization.k8s.io

---
# PodSecurityPolicy (deprecated in 1.25, use Pod Security Standards)
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: restricted
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
  - ALL
  volumes:
  - configMap
  - emptyDir
  - projected
  - secret
  - downwardAPI
  - persistentVolumeClaim
  runAsUser:
    rule: MustRunAsNonRoot
  seLinux:
    rule: RunAsAny
  fsGroup:
    rule: RunAsAny
```

## Operators and Custom Resources

```yaml
# Custom Resource Definition
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              replicas:
                type: integer
                minimum: 1
                maximum: 10
              image:
                type: string
              domain:
                type: string
          status:
            type: object
            properties:
              availableReplicas:
                type: integer
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
    shortNames:
    - wa

---
# Custom Resource instance
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-app
spec:
  replicas: 3
  image: myapp:v1.0.0
  domain: app.example.com
```

## ConfigMaps and Secrets

```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  config.json: |
    {
      "apiUrl": "https://api.example.com",
      "timeout": 5000
    }
  LOG_LEVEL: "info"

---
# Secret (base64 encoded)
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
data:
  username: YWRtaW4=
  password: c3VwZXJzZWNyZXQ=

---
# Sealed Secret (encrypted at rest)
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
spec:
  encryptedData:
    password: AgBx7F...encrypted...
```

## Best Practices

1. **Resource Management**
   - Always set requests and limits
   - Use VPA to right-size
   - Monitor resource utilization

2. **Health Checks**
   - Liveness: restart unhealthy pods
   - Readiness: remove from service endpoints
   - Startup: delay liveness during initialization

3. **Security**
   - Run as non-root user
   - Drop unnecessary capabilities
   - Use network policies for segmentation
   - Scan images for vulnerabilities

4. **High Availability**
   - Multi-replica deployments
   - Pod anti-affinity rules
   - PodDisruptionBudgets
   - Multi-zone node pools

5. **Observability**
   - Prometheus metrics
   - Structured logging
   - Distributed tracing (Jaeger)
   - Service mesh (Istio/Linkerd)

## Common Tools

- **Helm**: Package manager for Kubernetes
- **Kustomize**: Template-free configuration management
- **ArgoCD**: GitOps continuous delivery
- **cert-manager**: Automatic TLS certificate management
- **external-secrets**: Sync secrets from external sources
- **Velero**: Backup and disaster recovery
