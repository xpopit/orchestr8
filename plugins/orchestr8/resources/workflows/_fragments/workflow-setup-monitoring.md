---
id: workflow-setup-monitoring
category: pattern
tags: [workflow, monitoring, observability, alerts, metrics, logging, prometheus, grafana, elk, sentry]
capabilities:
  - Complete observability stack setup
  - Application and infrastructure monitoring
  - Centralized logging and error tracking
  - Intelligent alerting with escalation
useWhen:
  - Monitoring infrastructure setup requiring metrics collection, alerting configuration, dashboard creation, and incident response
  - Observability implementation needing logs aggregation, distributed tracing, performance monitoring, and anomaly detection
estimatedTokens: 550
---

# Monitoring & Observability Setup Pattern

**Three Pillars:** Metrics → Logs → Traces

**Phases:** Design (0-15%) → Metrics (15-40%) → Logs (40-65%) → Alerts (65-90%) → Validation (90-100%)

## Phase 1: Monitoring Design (0-15%)
- Identify infrastructure (cloud, on-prem, k8s)
- Select stack (Prometheus/Grafana, Datadog, New Relic, CloudWatch)
- Define SLIs/SLOs (latency, availability, error rate)
- Plan retention policies (metrics: 15d, logs: 30d)
- **Checkpoint:** Monitoring architecture documented

## Phase 2: Metrics Collection (15-40%)
**Parallel tracks:**

**Track A: Application Metrics (15-35%)**
- Instrument code (Prometheus client, StatsD, OpenTelemetry)
- Expose /metrics endpoint
- Track: Request rate, latency (p50/p95/p99), error rate, saturation
- Custom business metrics (signups, transactions)

**Track B: Infrastructure Metrics (20-40%)**
- System metrics (CPU, memory, disk, network)
- Database metrics (connections, query time, deadlocks)
- Container/K8s metrics (pod health, resource usage)
- Load balancer metrics (connections, response codes)

**Checkpoint:** All metrics flowing to monitoring system

## Phase 3: Logging Setup (40-65%)
**Parallel tracks:**

**Track A: Log Collection (40-55%)**
- Centralized logging (ELK, Loki, CloudWatch, Splunk)
- Structured JSON logging (timestamp, level, context)
- Log aggregation from all services
- Add correlation IDs for request tracing

**Track B: Error Tracking (45-60%)**
- Integrate error tracking (Sentry, Rollbar, Bugsnag)
- Automatic exception capture
- Stack traces with source maps
- User context and breadcrumbs

**Track C: Distributed Tracing (50-65%)**
- Install tracing (Jaeger, Zipkin, OpenTelemetry)
- Instrument service calls
- Track request flows across services
- Identify bottlenecks

**Checkpoint:** All logs centralized, errors tracked

## Phase 4: Alerting Configuration (65-90%)
**Alert categories:**

**Critical (65-75%)** - Page immediately
- Service down (uptime <99%)
- Error rate >5% baseline
- Database connection failures
- Disk space >90%

**Warning (75-85%)** - Notify team
- Response time >2x baseline
- Memory usage >80%
- Failed jobs increasing
- Certificate expiring <7 days

**Info (85-90%)** - Log only
- Deployment events
- Scaling events
- Configuration changes

**Alert setup:**
- Configure notification channels (PagerDuty, Slack, email)
- Set escalation policies
- Add runbooks to alerts
- Configure alert grouping/deduplication
- **Checkpoint:** Alerts configured and tested

## Phase 5: Dashboards & Validation (90-100%)
**Parallel:**
- Create service health dashboard (RED metrics: Rate, Errors, Duration)
- Infrastructure dashboard (resource usage trends)
- Business metrics dashboard
- On-call runbook documentation
- Test alerts by triggering scenarios
- **Checkpoint:** All dashboards live, alerts validated

## Key Metrics to Monitor
**Application:**
- Request rate (rpm)
- Error rate (%)
- Response time (p50, p95, p99)
- Apdex score

**Infrastructure:**
- CPU, memory, disk, network
- Database connections, query time
- Queue depth, message lag

**Business:**
- Active users
- Transaction volume
- Feature usage

## Success Criteria
- All services instrumented
- Metrics collected and visualized
- Logs centralized and searchable
- Error tracking active
- Critical alerts configured
- Dashboards accessible
- Runbooks documented
- Test alerts verified
