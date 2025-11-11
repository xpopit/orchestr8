---
id: performance-optimization
category: skill
tags: [performance, optimization, caching, database, scalability]
capabilities:
  - Performance optimization strategies
  - Caching techniques
  - Database query optimization
useWhen:
  - Optimizing application performance
  - Addressing performance bottlenecks
estimatedTokens: 480
---

# Performance Optimization Best Practices

## Database Query Optimization

```typescript
// ❌ BAD: N+1 query problem
const users = await User.findAll();
for (const user of users) {
  user.orders = await Order.findAll({ where: { userId: user.id } });
}

// ✅ GOOD: Eager loading
const users = await User.findAll({
  include: [{ model: Order }]
});

// ❌ BAD: SELECT *
const users = await db.query('SELECT * FROM users');

// ✅ GOOD: Select only needed columns
const users = await db.query('SELECT id, email, name FROM users');

// ✅ Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

// ✅ Use EXPLAIN to analyze queries
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;
```

## Caching Strategies

```typescript
// Redis caching
import Redis from 'ioredis';
const redis = new Redis();

async function getUserById(id: string): Promise<User> {
  // Try cache first
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const user = await db.users.findById(id);
  
  // Cache for 1 hour
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user));
  
  return user;
}

// Cache invalidation
async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  const user = await db.users.update(id, data);
  
  // Invalidate cache
  await redis.del(`user:${id}`);
  
  return user;
}

// Cache-aside pattern with fallback
async function getProductList(): Promise<Product[]> {
  try {
    const cached = await redis.get('products:list');
    if (cached) return JSON.parse(cached);
  } catch (error) {
    // Redis down, continue to database
    logger.warn('Redis unavailable', error);
  }
  
  const products = await db.products.findAll();
  
  try {
    await redis.setex('products:list', 300, JSON.stringify(products));
  } catch (error) {
    // Don't fail if cache write fails
    logger.warn('Cache write failed', error);
  }
  
  return products;
}
```

## Pagination

```typescript
// ❌ BAD: Offset pagination for large datasets
SELECT * FROM orders OFFSET 100000 LIMIT 20; // Slow!

// ✅ GOOD: Cursor-based pagination
interface PaginationInput {
  cursor?: string;
  limit: number;
}

async function getOrders({ cursor, limit }: PaginationInput) {
  const query = db.orders.orderBy('created_at', 'desc');
  
  if (cursor) {
    const lastOrder = await db.orders.findById(cursor);
    query.where('created_at', '<', lastOrder.createdAt);
  }
  
  const orders = await query.limit(limit + 1).execute();
  
  const hasMore = orders.length > limit;
  const items = hasMore ? orders.slice(0, -1) : orders;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  
  return { items, nextCursor, hasMore };
}
```

## API Response Optimization

```typescript
// ✅ Use compression
import compression from 'compression';
app.use(compression());

// ✅ Implement ETag caching
app.get('/api/users/:id', async (req, res) => {
  const user = await getUserById(req.params.id);
  const etag = generateETag(user);
  
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }
  
  res.set('ETag', etag);
  res.set('Cache-Control', 'private, max-age=300');
  res.json(user);
});

// ✅ Use HTTP/2 server push
// ✅ Implement GraphQL DataLoader for batching
const userLoader = new DataLoader(async (ids) => {
  const users = await db.users.findByIds(ids);
  return ids.map(id => users.find(u => u.id === id));
});
```

## Background Jobs

```typescript
// ✅ Move slow operations to background
import Bull from 'bull';

const emailQueue = new Bull('email', process.env.REDIS_URL);

// Add job to queue (fast)
app.post('/users', async (req, res) => {
  const user = await createUser(req.body);
  
  // Don't wait for email
  await emailQueue.add('welcome', { userId: user.id });
  
  res.status(201).json({ data: user });
});

// Process job in background worker
emailQueue.process('welcome', async (job) => {
  const { userId } = job.data;
  await sendWelcomeEmail(userId);
});
```

## Memory Management

```typescript
// ❌ BAD: Memory leak - event listener not cleaned up
class UserService {
  constructor() {
    eventEmitter.on('user-created', this.handleUserCreated);
  }
}

// ✅ GOOD: Clean up resources
class UserService {
  constructor() {
    this.handleUserCreated = this.handleUserCreated.bind(this);
    eventEmitter.on('user-created', this.handleUserCreated);
  }
  
  destroy() {
    eventEmitter.off('user-created', this.handleUserCreated);
  }
}

// ✅ Use streams for large files
import { pipeline } from 'stream/promises';

app.get('/export', async (req, res) => {
  const dataStream = getDataStream();
  const csvStream = new CsvTransform();
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=export.csv');
  
  await pipeline(dataStream, csvStream, res);
});
```

## Connection Pooling

```typescript
// PostgreSQL connection pool
import { Pool } from 'pg';

const pool = new Pool({
  max: 20,           // Maximum connections
  min: 5,            // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Reuse connections
async function getUser(id: string) {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } finally {
    client.release(); // Return to pool
  }
}
```

## Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis();

// Global rate limit
const globalLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

// Endpoint-specific limit
const strictLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});

app.use('/api/', globalLimiter);
app.post('/api/auth/login', strictLimiter, loginHandler);
```

## Performance Monitoring

```typescript
// Measure database query time
async function getUserWithTiming(id: string) {
  const start = Date.now();
  const user = await db.users.findById(id);
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    logger.warn('Slow query detected', { query: 'getUserById', duration, id });
  }
  
  // Send to monitoring
  metrics.histogram('db.query.duration', duration, { query: 'getUserById' });
  
  return user;
}

// APM with OpenTelemetry
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('user-service');

async function processOrder(orderId: string) {
  return tracer.startActiveSpan('processOrder', async (span) => {
    span.setAttribute('order.id', orderId);
    
    try {
      const order = await getOrder(orderId);
      span.addEvent('order-fetched');
      
      await processPayment(order);
      span.addEvent('payment-processed');
      
      span.setStatus({ code: SpanStatusCode.OK });
      return order;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Key Metrics to Monitor

- **Response Time**: P50, P95, P99 latencies
- **Throughput**: Requests per second
- **Error Rate**: 4xx and 5xx responses
- **Database**: Query time, connection pool usage
- **Cache**: Hit rate, miss rate
- **Memory**: Heap usage, garbage collection
- **CPU**: Usage percentage
