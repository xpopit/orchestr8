---
id: prometheus-monitoring-setup
category: guide
tags: [prometheus, grafana, monitoring, observability, kubernetes]
capabilities:
  - Prometheus installation
  - Grafana dashboards
  - Alert rules
useWhen:
  - Deploying Prometheus and Grafana on Kubernetes with kube-prometheus-stack requiring 30-day retention and 100GB storage
  - Implementing custom application metrics in Node.js, Go, or Rust using prom-client with HTTP request counters and duration histograms
  - Building observability stack with ServiceMonitor auto-discovery for automatic Prometheus scraping of application /metrics endpoints
  - Setting up PrometheusRule alert definitions for high error rates, latency SLA violations, and resource utilization thresholds
  - Integrating application monitoring requiring custom labels (method, endpoint, status) and histogram buckets for SLO tracking
  - Deploying monitoring infrastructure with Grafana ingress, secure admin passwords, and pre-configured dashboards for application metrics
estimatedTokens: 480
---

# Prometheus + Grafana Monitoring Setup

## Installation with Helm

```bash
# Add repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install kube-prometheus-stack
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.retention=30d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=100Gi \
  --set grafana.adminPassword=YOUR_SECURE_PASSWORD \
  --set grafana.ingress.enabled=true \
  --set grafana.ingress.hosts[0]=grafana.example.com

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Open http://localhost:3000 (admin / YOUR_SECURE_PASSWORD)
```

## Custom Application Metrics

```typescript
// Node.js example with prom-client
import promClient from 'prom-client';

// Create metrics
const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status']
});

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

// Instrument endpoint
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestCounter.inc({ method: req.method, endpoint: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, endpoint: req.path }, duration);
  });
  next();
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

## ServiceMonitor for Auto-Discovery

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## Alert Rules

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: myapp-alerts
  namespace: monitoring
spec:
  groups:
  - name: myapp
    interval: 30s
    rules:
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }}% for {{ $labels.endpoint }}"
```
