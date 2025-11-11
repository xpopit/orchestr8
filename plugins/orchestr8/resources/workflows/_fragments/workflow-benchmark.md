---
id: workflow-benchmark
category: pattern
tags: [workflow, performance, benchmarking, load-testing, optimization, profiling, metrics, stress-testing]
capabilities:
  - Comprehensive performance benchmarking
  - Load testing and stress testing
  - Performance profiling and bottleneck identification
  - Baseline establishment and regression detection
useWhen:
  - Performance benchmarking requiring baseline measurement, load testing, bottleneck identification, and optimization validation
  - System performance analysis needing metrics collection, statistical analysis, and performance regression detection
estimatedTokens: 560
---

# Performance Benchmarking Workflow Pattern

**Phases:** Setup (0-20%) → Baseline (20-40%) → Load Test (40-70%) → Analysis (70-90%) → Optimize (90-100%)

## Phase 1: Benchmark Setup (0-20%)
**Parallel tracks:**

**Track A: Environment (0-15%)**
- Provision isolated test environment (production-like)
- Ensure consistent resources (CPU, memory, network)
- Populate database with production-scale data
- Clear caches and restart services
- Disable monitoring overhead during tests

**Track B: Tools (5-20%)**
- Select tools: Load (k6, Gatling, JMeter), Profiling (pprof, py-spy, perf)
- Configure realistic test scenarios (user journeys)
- Set up metrics collection (response time, throughput, errors)
- Prepare test data and authentication
- **Checkpoint:** Environment ready, tools configured

## Phase 2: Baseline Measurement (20-40%)
**Establish performance baseline:**

**Track A: Single-User Tests (20-30%)**
- Measure cold start time
- Execute all endpoints individually
- Record: Response time (p50, p95, p99), CPU/memory usage
- Identify slowest operations

**Track B: Steady-State Tests (25-35%)**
- Run at expected production load (10-minute duration)
- Measure throughput (requests/sec)
- Monitor resource utilization
- Check error rate (should be <0.1%)

**Track C: Profiling (30-40%)**
- CPU profiling (identify hot code paths)
- Memory profiling (check for leaks)
- Database query profiling (slow queries)
- Network I/O analysis
- **Checkpoint:** Baseline metrics documented

## Phase 3: Load Testing (40-70%)
**Test under increasing load:**

**Track A: Ramp-Up Test (40-55%)**
- Start: 10 users
- Increase: +10 users/minute until degradation
- Find: Breaking point (response time >2x baseline or errors >1%)
- Measure: Max sustainable throughput
- Monitor: CPU, memory, database connections

**Track B: Stress Test (50-65%)**
- Load at 2x expected peak
- Duration: 30 minutes
- Check for: Memory leaks, connection exhaustion, disk space
- Validate: Auto-scaling triggers (if configured)
- Monitor: System recovery time

**Track C: Spike Test (60-70%)**
- Sudden traffic spike (0 → max in 1 minute)
- Hold for 5 minutes, return to zero
- Measure: Handling of burst traffic, queue depth
- Validate: Rate limiting, circuit breakers
- **Checkpoint:** Performance limits identified

## Phase 4: Analysis & Bottlenecks (70-90%)
**Identify optimization targets:**

**Track A: Metric Analysis (70-80%)**
- Compare against SLOs (latency, availability, throughput)
- Identify degradation points
- Find bottlenecks: CPU-bound, I/O-bound, database, network
- Calculate cost per request

**Track B: Deep Profiling (75-85%)**
- Profile slowest endpoints
- Identify expensive operations (N+1 queries, unnecessary serialization)
- Check for: Blocking I/O, inefficient algorithms, lock contention
- Trace distributed requests

**Track C: Resource Analysis (80-90%)**
- Review resource saturation (which hits 100% first?)
- Database: Slow queries, missing indexes, connection pool
- Network: Bandwidth, latency, timeouts
- External APIs: Rate limits, response times
- **Checkpoint:** Bottlenecks prioritized

## Phase 5: Optimization & Retest (90-100%)
**Optimize and validate improvements:**

**Quick Wins (90-95%):**
- Add database indexes for slow queries
- Enable response caching (Redis, CDN)
- Increase connection pools
- Add rate limiting to protect resources
- Enable compression

**Retest (95-100%):**
- Run baseline tests again
- Compare metrics (should see 20-50% improvement)
- Verify no regressions in other areas
- Document optimizations and results
- **Checkpoint:** Optimizations validated

## Benchmark Scenarios

**API Benchmarks:**
- GET endpoint (read-heavy)
- POST endpoint (write-heavy)
- Complex queries (joins, aggregations)
- File upload/download
- Authenticated requests

**Frontend Benchmarks:**
- Page load time (Lighthouse)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Bundle size

**Database Benchmarks:**
- Query response time
- Concurrent connections
- Write throughput (inserts/sec)
- Read throughput (selects/sec)

## Key Metrics to Track

**Performance:**
- Response time: p50, p95, p99, max
- Throughput: requests/sec
- Error rate: %
- Apdex score

**Resources:**
- CPU utilization: %
- Memory usage: MB, % heap
- Disk I/O: ops/sec
- Network: MB/sec

**Database:**
- Query time: ms
- Connection pool: active/idle
- Slow queries: count
- Deadlocks: count

## Success Criteria
- Baseline metrics documented
- Load limits identified (max RPS)
- Bottlenecks found and prioritized
- Optimization opportunities documented
- Performance improvements validated (>20%)
- No regressions introduced
- SLOs met under expected load
- Stress test passed without failures
