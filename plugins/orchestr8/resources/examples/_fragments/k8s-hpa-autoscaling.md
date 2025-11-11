---
id: k8s-hpa-autoscaling
category: example
tags: [kubernetes, k8s, autoscaling, hpa]
capabilities:
  - Horizontal Pod Autoscaling
  - CPU and memory-based scaling
  - Scale-up/down policies
useWhen:
  - Kubernetes workloads requiring horizontal autoscaling based on CPU (70%) and memory (80%) utilization metrics
  - Production services needing dynamic scaling between 3-10 replicas to handle traffic spikes while maintaining cost efficiency
  - K8s applications requiring aggressive scale-up policies (double pods in 30s) but conservative scale-down (5min stabilization)
  - Microservices needing HPA v2 with multiple metrics and custom scaling behaviors for different traffic patterns
  - Services requiring PodDisruptionBudget coordination with HPA to ensure minimum availability during voluntary disruptions
  - Applications where automatic scaling based on resource metrics prevents manual intervention during load changes
estimatedTokens: 320
---

# Kubernetes HorizontalPodAutoscaler

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp
  namespace: production
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
        averageUtilization: 70
  
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Wait 5min before scaling down
      policies:
      - type: Percent
        value: 50  # Scale down max 50% of pods
        periodSeconds: 60
    
    scaleUp:
      stabilizationWindowSeconds: 0  # Scale up immediately
      policies:
      - type: Percent
        value: 100  # Can double pods
        periodSeconds: 30
      - type: Pods
        value: 2  # Add max 2 pods at once
        periodSeconds: 30
      selectPolicy: Max  # Use most aggressive policy
```

**Pair with PodDisruptionBudget:**

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: myapp
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: myapp
```
