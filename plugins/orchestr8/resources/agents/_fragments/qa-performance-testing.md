---
id: qa-performance-testing
category: agent
tags: [qa, performance, load-testing, stress-testing, k6, jmeter, profiling, optimization, metrics]
capabilities:
  - Load and stress testing strategies
  - Performance profiling and bottleneck identification
  - Metrics collection and analysis
  - Performance optimization recommendations
  - Scalability testing and capacity planning
useWhen:
  - Conducting load testing with JMeter, Gatling, or k6 simulating concurrent users, measuring response times, throughput (requests/sec), and identifying bottlenecks
  - Implementing stress testing to find breaking points by gradually increasing load beyond normal capacity and monitoring system behavior under extreme conditions
  - Performing spike testing with sudden traffic surges to validate autoscaling, rate limiting, and system recovery after load returns to normal
  - Designing performance test scenarios based on production traffic patterns, user journeys, and SLA requirements (p95/p99 latency, error rates)
  - Analyzing performance metrics including response time distribution, resource utilization (CPU, memory, disk I/O), database query performance, and network latency
  - Optimizing application performance using profiling tools (Chrome DevTools, py-spy, pprof), caching strategies, database query optimization, and CDN integration
estimatedTokens: 650
---

# QA Expert - Performance Testing

Expert in load testing, stress testing, performance profiling, and optimization strategies.

## Load Testing with k6

### Basic Load Test
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp-up
    { duration: '5m', target: 100 },  // Steady state
    { duration: '2m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // Error rate < 1%
  },
};

export default function () {
  const res = http.get('https://api.example.com/users');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Advanced Scenarios
```javascript
import { scenario } from 'k6/execution';

export const options = {
  scenarios: {
    // Constant load
    constant_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
    },

    // Spike test
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1000 },  // Spike
        { duration: '3m', target: 1000 },
        { duration: '10s', target: 100 },
        { duration: '3m', target: 100 },
      ],
    },

    // Soak test (stability)
    soak: {
      executor: 'constant-vus',
      vus: 200,
      duration: '4h',
    },
  },
};
```

## Performance Metrics

### Core Web Vitals
```javascript
// Lighthouse CI integration
export const options = {
  thresholds: {
    // Largest Contentful Paint
    'lcp': ['p(95)<2500'],
    // First Input Delay
    'fid': ['p(95)<100'],
    // Cumulative Layout Shift
    'cls': ['p(95)<0.1'],
  },
};
```

### Backend Metrics
```javascript
// Custom metrics in k6
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';

const myCounter = new Counter('custom_operations');
const myTrend = new Trend('response_time_trend');
const myRate = new Rate('error_rate');
const myGauge = new Gauge('active_connections');

export default function () {
  const res = http.get('https://api.example.com/data');

  myCounter.add(1);
  myTrend.add(res.timings.duration);
  myRate.add(res.status !== 200);
  myGauge.add(scenario.vu);
}
```

## Profiling

### Node.js Profiling
```bash
# CPU profiling
node --prof app.js
node --prof-process isolate-*.log > processed.txt

# Heap profiling
node --inspect app.js
# Open chrome://inspect, take heap snapshot

# Clinic.js suite
clinic doctor -- node app.js
clinic flame -- node app.js
clinic bubbleprof -- node app.js
```

### Application Performance Monitoring
```javascript
// New Relic integration
const newrelic = require('newrelic');

app.get('/api/users', async (req, res) => {
  const segment = newrelic.startSegment('database-query', true);

  const users = await db.query('SELECT * FROM users');

  segment.end();
  res.json(users);
});
```

## Database Performance

### Query Optimization
```sql
-- Identify slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Add indexes
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);

-- Query plan analysis
EXPLAIN ANALYZE SELECT * FROM orders
WHERE user_id = 123 AND created_at > NOW() - INTERVAL '30 days';
```

### Connection Pooling
```javascript
// pg-pool configuration
const pool = new Pool({
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle after 30s
  connectionTimeoutMillis: 2000,
});

// Monitor pool stats
setInterval(() => {
  console.log({
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  });
}, 60000);
```

## Caching Strategies

### Redis Caching
```javascript
async function getCachedUser(userId) {
  const cacheKey = `user:${userId}`;

  // Try cache first
  let user = await redis.get(cacheKey);
  if (user) return JSON.parse(user);

  // Cache miss - fetch from DB
  user = await db.users.findById(userId);

  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(user));

  return user;
}
```

### HTTP Caching
```javascript
app.get('/api/products', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300',  // 5 minutes
    'ETag': generateETag(products),
  });
  res.json(products);
});
```

## Load Testing Best Practices

### Realistic Test Data
```javascript
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

const testUsers = new SharedArray('users', function () {
  return papaparse.parse(open('./users.csv'), { header: true }).data;
});

export default function () {
  const user = testUsers[scenario.iterationInTest % testUsers.length];

  http.post('https://api.example.com/login', JSON.stringify({
    email: user.email,
    password: user.password,
  }));
}
```

### Gradual Ramp-Up
```javascript
// Avoid thundering herd
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // Slow ramp
    { duration: '10m', target: 500 },  // Continue ramping
    { duration: '15m', target: 500 },  // Sustain
    { duration: '5m', target: 0 },     // Ramp down
  ],
};
```

## Performance Budgets

```yaml
# lighthouse-ci.yml
ci:
  collect:
    numberOfRuns: 3
  assert:
    preset: lighthouse:recommended
    assertions:
      first-contentful-paint:
        - error
        - maxNumericValue: 2000
      speed-index:
        - error
        - maxNumericValue: 3000
      interactive:
        - error
        - maxNumericValue: 4000
      max-potential-fid:
        - error
        - maxNumericValue: 200
```

## Stress Testing

### Finding Breaking Points
```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 400 },
    { duration: '5m', target: 800 },   // Push limits
    { duration: '5m', target: 1600 },  // Beyond capacity
    { duration: '10m', target: 0 },    // Recovery
  ],
};
```

## CI/CD Integration

```yaml
# GitHub Actions
- name: Performance Tests
  run: |
    k6 run --out json=results.json load-test.js

- name: Check Thresholds
  run: |
    k6 inspect results.json --summary --threshold-failures

- name: Upload Results
  uses: actions/upload-artifact@v3
  with:
    name: k6-results
    path: results.json
```

## Performance Optimization Checklist

✅ Profile before optimizing
✅ Add database indexes for common queries
✅ Implement caching (Redis, CDN)
✅ Use connection pooling
✅ Enable gzip compression
✅ Optimize images and assets
✅ Use CDN for static content
✅ Implement pagination for large datasets
✅ Add rate limiting

## Key Metrics to Monitor

- **Response Time**: p50, p95, p99 percentiles
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Concurrency**: Active concurrent users
- **Resource Usage**: CPU, memory, disk I/O
- **Database**: Query time, connection pool usage
- **Cache**: Hit rate, eviction rate
