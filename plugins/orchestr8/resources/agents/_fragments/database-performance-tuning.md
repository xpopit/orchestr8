---
id: database-performance-tuning
category: agent
tags: [database, performance, optimization, indexing, query, caching, connection-pool]
capabilities:
  - Query performance optimization
  - Index design and tuning
  - Connection pool configuration
  - Caching strategies
  - Query plan analysis
  - Database monitoring
useWhen:
  - Tuning database performance by analyzing slow query logs, using EXPLAIN ANALYZE for execution plans, and identifying missing indexes or index bloat
  - Optimizing SQL queries with index selection strategies, avoiding SELECT *, using JOINs efficiently, and rewriting subqueries as JOINs for better performance
  - Implementing database indexing strategies including B-tree for general queries, partial indexes for filtered queries, and expression indexes for computed columns
  - Configuring database parameters for performance: shared_buffers, work_mem, effective_cache_size in PostgreSQL, or innodb_buffer_pool_size in MySQL
  - Scaling databases with connection pooling (PgBouncer, HikariCP), read replicas for query offloading, and caching layers (Redis, Memcached) for hot data
  - Monitoring database health with metrics like query latency, connection count, cache hit ratio, replication lag, and disk I/O using tools like pgAdmin, Datadog, or Prometheus
estimatedTokens: 680
---

# Database Performance Tuning Agent

Expert at diagnosing and optimizing database performance through query optimization, indexing, caching, and connection management.

## Query Optimization

### 1. Analyze Query Execution Plans

**PostgreSQL:**
```sql
-- Get execution plan
EXPLAIN SELECT * FROM orders WHERE user_id = 123;

-- Get actual execution stats
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Look for:
-- ❌ Seq Scan (sequential scan - table scan)
-- ✅ Index Scan (using index)
-- ❌ High cost numbers
-- ❌ Large row estimates vs actuals
```

**MySQL:**
```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 123;

-- Use FORMAT=JSON for detailed analysis
EXPLAIN FORMAT=JSON SELECT * FROM orders WHERE user_id = 123;
```

**MongoDB:**
```javascript
// Get query execution stats
db.orders.find({ user_id: 123 }).explain("executionStats");

// Look for:
// totalDocsExamined vs nReturned (should be close)
// stage: "IXSCAN" (index scan) vs "COLLSCAN" (collection scan)
```

### 2. Index Selection and Design

**Missing index indicators:**
```sql
-- PostgreSQL: Sequential scans in logs
SELECT schemaname, tablename, seq_scan, seq_tup_read,
       idx_scan, idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > 1000
ORDER BY seq_tup_read DESC;

-- MySQL: Check slow queries
SELECT * FROM mysql.slow_log
ORDER BY query_time DESC
LIMIT 10;
```

**Index design rules:**
```sql
-- Rule 1: Index columns in WHERE, JOIN, ORDER BY
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Rule 2: Order matters in composite indexes
-- Good for: WHERE user_id = ? AND status = ?
-- Good for: WHERE user_id = ?
-- Bad for:  WHERE status = ? (won't use index efficiently)

-- Rule 3: Include frequently accessed columns (covering index)
CREATE INDEX idx_orders_user_covering
ON orders(user_id)
INCLUDE (total_amount, created_at);
-- Query doesn't need to access table, only index

-- Rule 4: Partial indexes for filtered queries
CREATE INDEX idx_active_orders ON orders(user_id)
WHERE status IN ('pending', 'processing');
-- Smaller index, faster queries for active orders
```

### 3. Query Anti-Patterns

**SELECT * (avoid):**
```sql
-- ❌ Bad: Fetches all columns
SELECT * FROM users WHERE id = 123;

-- ✅ Good: Fetch only needed columns
SELECT id, email, name FROM users WHERE id = 123;
```

**N+1 Query Problem:**
```sql
-- ❌ Bad: N+1 queries
SELECT * FROM posts; -- 1 query
-- Then for each post:
SELECT * FROM users WHERE id = post.author_id; -- N queries

-- ✅ Good: Single query with JOIN
SELECT posts.*, users.name, users.email
FROM posts
JOIN users ON posts.author_id = users.id;
```

**OR in WHERE (often slow):**
```sql
-- ❌ Slow: OR conditions may not use indexes efficiently
SELECT * FROM orders
WHERE status = 'pending' OR status = 'processing';

-- ✅ Faster: Use IN
SELECT * FROM orders
WHERE status IN ('pending', 'processing');
```

**Functions on indexed columns:**
```sql
-- ❌ Bad: Index on created_at can't be used
SELECT * FROM orders
WHERE DATE(created_at) = '2024-01-15';

-- ✅ Good: Range query uses index
SELECT * FROM orders
WHERE created_at >= '2024-01-15'
  AND created_at < '2024-01-16';
```

## Connection Pool Configuration

### PostgreSQL (pg/pgPool)

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'pass',

  // Connection pool settings
  max: 20,                    // Max connections (default: 10)
  min: 2,                     // Min idle connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Wait 2s for connection
  maxUses: 7500,              // Retire connection after 7500 uses
});

// Always release connections
async function getUser(id) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release(); // CRITICAL: Always release
  }
}

// Or use pool.query (auto-release)
async function getUserSimple(id) {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}
```

**Pool sizing formula:**
```
connections = ((core_count * 2) + effective_spindle_count)

For web app on 4-core server with SSD:
connections = (4 * 2) + 1 = 9

For CPU-intensive app:
connections = core_count = 4

Golden rule: Start with 10-20, monitor and adjust
```

### MongoDB (Connection Pool)

```javascript
import { MongoClient } from 'mongodb';

const client = new MongoClient(uri, {
  maxPoolSize: 50,          // Max connections (default: 100)
  minPoolSize: 10,          // Min connections kept alive
  maxIdleTimeMS: 30000,     // Close idle after 30s
  waitQueueTimeoutMS: 5000, // Wait 5s for connection
  serverSelectionTimeoutMS: 5000
});

await client.connect();
const db = client.db('mydb');
```

### MySQL Connection Pool

```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'user',
  password: 'pass',
  database: 'mydb',

  connectionLimit: 10,      // Max connections
  queueLimit: 0,            // Unlimited queue (0)
  waitForConnections: true, // Wait if all busy
  idleTimeout: 60000,       // 60s idle timeout
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Use pool.execute for prepared statements (faster)
const [rows] = await pool.execute(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);
```

## Caching Strategies

### 1. Application-Level Caching

```javascript
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache-aside pattern
async function getUser(id) {
  const cacheKey = `user:${id}`;

  // 1. Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // 2. Cache miss - query database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);

  // 3. Store in cache (5 min TTL)
  await redis.setex(cacheKey, 300, JSON.stringify(user));

  return user;
}

// Invalidate cache on update
async function updateUser(id, data) {
  await db.query('UPDATE users SET name = $1 WHERE id = $2', [data.name, id]);
  await redis.del(`user:${id}`); // Invalidate cache
}
```

### 2. Query Result Caching

**PostgreSQL - Materialized Views:**
```sql
-- Create materialized view (cached query result)
CREATE MATERIALIZED VIEW user_stats AS
SELECT
  user_id,
  COUNT(*) as order_count,
  SUM(total_amount) as total_spent,
  MAX(created_at) as last_order
FROM orders
GROUP BY user_id;

-- Create index on materialized view
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);

-- Refresh periodically (manual or scheduled)
REFRESH MATERIALIZED VIEW user_stats;

-- Refresh concurrently (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats;
```

### 3. Cache Warming

```javascript
// Warm cache on application startup
async function warmCache() {
  const popularProducts = await db.query(
    'SELECT * FROM products WHERE featured = true'
  );

  for (const product of popularProducts) {
    await redis.setex(
      `product:${product.id}`,
      3600,
      JSON.stringify(product)
    );
  }
}

// Warm cache periodically
setInterval(warmCache, 300000); // Every 5 minutes
```

## Database Configuration Tuning

### PostgreSQL Configuration

```ini
# postgresql.conf

# Memory settings (adjust based on available RAM)
shared_buffers = 4GB              # 25% of RAM
effective_cache_size = 12GB       # 50-75% of RAM
work_mem = 64MB                   # Per-operation memory
maintenance_work_mem = 512MB      # For VACUUM, CREATE INDEX

# Connection settings
max_connections = 100
shared_preload_libraries = 'pg_stat_statements'

# Query planner
random_page_cost = 1.1            # For SSDs (default 4.0 for HDD)
effective_io_concurrency = 200    # For SSDs

# Write performance
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB
```

### MySQL Configuration

```ini
# my.cnf

[mysqld]
# Memory settings
innodb_buffer_pool_size = 4G      # 70-80% of RAM
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2

# Connection settings
max_connections = 200
thread_cache_size = 16

# Query cache (deprecated in MySQL 8.0+)
# Use application-level caching instead

# InnoDB settings
innodb_file_per_table = 1
innodb_flush_method = O_DIRECT
```

## Monitoring and Diagnostics

### Slow Query Logging

**PostgreSQL:**
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

**MongoDB:**
```javascript
// Enable profiling
db.setProfilingLevel(1, { slowms: 100 }); // Log queries > 100ms

// View slow queries
db.system.profile.find().limit(10).sort({ ts: -1 }).pretty();
```

### Connection Monitoring

```javascript
// PostgreSQL - Monitor active connections
const activeConnections = await pool.query(`
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE state = 'active'
`);

// MongoDB - Connection pool stats
const stats = db.admin().serverStatus();
console.log(stats.connections);
```

## Performance Checklist

**Before deploying:**
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] EXPLAIN ANALYZE on critical queries
- [ ] Connection pool properly sized (10-20 for most apps)
- [ ] Caching for read-heavy data (Redis/Memcached)
- [ ] Slow query logging enabled
- [ ] N+1 queries eliminated (use JOINs or DataLoader)
- [ ] SELECT only needed columns (not SELECT *)
- [ ] Batch operations where possible
- [ ] Database configuration tuned for workload
- [ ] Monitoring and alerting in place

**Common performance wins:**
1. **Add missing indexes** - 10-100x speedup
2. **Connection pooling** - 5-10x concurrency improvement
3. **Caching hot data** - 50-100x for read-heavy workloads
4. **Eliminate N+1 queries** - 10-50x reduction in query count
5. **Partial indexes** - 2-5x faster queries, smaller indexes
6. **Covering indexes** - 2-3x speedup (avoid table lookups)
