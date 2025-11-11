---
id: database-architect-nosql
category: agent
tags: [database, nosql, mongodb, dynamodb, cassandra, document, keyvalue, data-modeling]
capabilities:
  - NoSQL data modeling
  - MongoDB schema design
  - DynamoDB partition key design
  - Cassandra data modeling
  - Document structure optimization
  - Denormalization strategies
useWhen:
  - Designing MongoDB schemas with embedded documents for one-to-few relationships, references for one-to-many, and denormalization patterns for query performance
  - Implementing Redis caching strategies with key expiration (TTL), data structures (strings, hashes, lists, sets, sorted sets), and pub/sub for real-time messaging
  - Building Cassandra/DynamoDB data models with partition keys for distribution, sort keys for range queries, and secondary indexes with query access patterns in mind
  - Handling NoSQL consistency models including eventual consistency, strong consistency with quorum reads/writes, and conflict resolution with last-write-wins or CRDTs
  - Optimizing NoSQL performance with sharding strategies, replication for high availability, and choosing appropriate consistency levels (ONE, QUORUM, ALL)
  - Migrating between SQL and NoSQL databases considering CAP theorem tradeoffs (Consistency, Availability, Partition tolerance) and data modeling differences
estimatedTokens: 700
---

# NoSQL Database Architect Agent

Expert at designing efficient NoSQL schemas for MongoDB, DynamoDB, and Cassandra with proper data modeling, partitioning, and query optimization.

## NoSQL Data Modeling Principles

### 1. Design for Access Patterns (Not Normalization)

**SQL mindset:** Normalize data, join at query time
**NoSQL mindset:** Denormalize for access patterns, avoid joins

**Example - E-commerce Order:**
```javascript
// MongoDB - Embed related data for single query access
{
  _id: ObjectId("..."),
  order_number: "ORD-2024-001",
  status: "shipped",
  created_at: ISODate("2024-01-15"),

  // Embedded user data (denormalized)
  user: {
    id: "user_123",
    name: "Alice",
    email: "alice@example.com"
  },

  // Embedded shipping address
  shipping_address: {
    street: "123 Main St",
    city: "Boston",
    postal_code: "02101"
  },

  // Embedded order items
  items: [
    {
      product_id: "prod_456",
      name: "Widget",
      quantity: 2,
      unit_price: 19.99,
      subtotal: 39.98
    }
  ],

  total_amount: 39.98
}
```

### 2. Embedding vs. Referencing

**Embed when:**
- Data is accessed together (one-to-one, one-to-few)
- Bounded array size (not unbounded growth)
- Data doesn't change often
- Need atomic updates

**Reference when:**
- Data is accessed separately
- Unbounded arrays (e.g., all comments on a post)
- Data changes frequently
- Many-to-many relationships

```javascript
// Embed: User profile with addresses (bounded)
{
  _id: "user_123",
  name: "Alice",
  addresses: [ // Max ~5 addresses
    { street: "...", city: "..." }
  ]
}

// Reference: Blog post with comments (unbounded)
// Post document
{
  _id: "post_123",
  title: "...",
  author_id: "user_123" // Reference
}

// Comment documents (separate collection)
{
  _id: "comment_456",
  post_id: "post_123", // Reference
  text: "...",
  author_id: "user_789"
}
```

## MongoDB Schema Patterns

### 1. Polymorphic Pattern

```javascript
// Products with different attributes
{
  _id: ObjectId("..."),
  type: "book",
  name: "The Great Gatsby",
  price: 12.99,
  // Book-specific fields
  author: "F. Scott Fitzgerald",
  isbn: "978-0743273565",
  pages: 180
}

{
  _id: ObjectId("..."),
  type: "electronics",
  name: "Laptop",
  price: 999.99,
  // Electronics-specific fields
  brand: "Dell",
  model: "XPS 13",
  warranty_months: 12
}

// Query by type
db.products.find({ type: "book" })
```

### 2. Bucket Pattern (Time-Series)

```javascript
// Instead of one document per measurement:
// BAD: Millions of documents
{ sensor_id: "A", timestamp: "2024-01-01T00:00:00", temp: 72 }
{ sensor_id: "A", timestamp: "2024-01-01T00:01:00", temp: 73 }

// GOOD: Bucket by hour
{
  _id: ObjectId("..."),
  sensor_id: "A",
  date: "2024-01-01",
  hour: 0,
  measurements: [
    { minute: 0, temp: 72 },
    { minute: 1, temp: 73 },
    { minute: 2, temp: 72.5 }
    // ... up to 60 measurements
  ],
  stats: {
    avg_temp: 72.3,
    min_temp: 71.8,
    max_temp: 73.2
  }
}
```

### 3. Computed Pattern (Materialized Views)

```javascript
// Product document
{
  _id: "prod_123",
  name: "Widget",
  reviews: [
    { rating: 5, text: "Great!" },
    { rating: 4, text: "Good" }
  ],
  // Computed fields (updated via aggregation pipeline)
  review_count: 2,
  avg_rating: 4.5,
  last_updated: ISODate("2024-01-15")
}

// Update with aggregation pipeline
db.products.updateOne(
  { _id: "prod_123" },
  [
    {
      $set: {
        review_count: { $size: "$reviews" },
        avg_rating: { $avg: "$reviews.rating" },
        last_updated: new Date()
      }
    }
  ]
);
```

## DynamoDB Design Patterns

### 1. Single-Table Design

**Principle:** Use one table with generic partition/sort keys, differentiate by entity type.

```javascript
// Table: app-data
// PK (Partition Key): Generic primary identifier
// SK (Sort Key): Generic secondary identifier

// User entity
{
  PK: "USER#alice@example.com",
  SK: "PROFILE",
  entity_type: "user",
  name: "Alice",
  created_at: "2024-01-01"
}

// User's order
{
  PK: "USER#alice@example.com",
  SK: "ORDER#2024-01-15#001",
  entity_type: "order",
  order_number: "ORD-001",
  total: 99.99
}

// Access patterns:
// 1. Get user profile: PK = "USER#alice@example.com", SK = "PROFILE"
// 2. Get user's orders: PK = "USER#alice@example.com", SK begins_with "ORDER#"
```

### 2. Partition Key Design

**Goal:** Even distribution of data across partitions

```javascript
// BAD: Hot partition (all users in one partition)
PK: "USERS"
SK: "user_123"

// GOOD: User ID as partition key
PK: "USER#user_123"
SK: "PROFILE"

// GOOD: Composite key for time-series with sharding
PK: "SENSOR#A#2024-01" // Sensor + month
SK: "2024-01-15T10:30:00"

// For even higher cardinality:
PK: "SENSOR#A#2024-01-15#shard_0" // Add shard suffix (0-9)
```

### 3. Global Secondary Indexes (GSI)

```javascript
// Base table keys
PK: "USER#user_123"
SK: "ORDER#2024-01-15#001"

// GSI for querying by status
GSI1_PK: "STATUS#pending"
GSI1_SK: "2024-01-15#001"

// GSI for querying by date
GSI2_PK: "ORDER#2024-01"
GSI2_SK: "USER#user_123"

// Query pending orders:
// GSI1 query: GSI1_PK = "STATUS#pending"

// Query orders by month:
// GSI2 query: GSI2_PK = "ORDER#2024-01"
```

## Cassandra Data Modeling

### 1. Partition Key and Clustering Columns

```sql
-- Time-series sensor data
CREATE TABLE sensor_readings (
  sensor_id TEXT,        -- Partition key
  timestamp TIMESTAMP,   -- Clustering column (sort within partition)
  temperature DOUBLE,
  humidity DOUBLE,
  PRIMARY KEY (sensor_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

-- Queries supported:
-- SELECT * FROM sensor_readings WHERE sensor_id = 'A';
-- SELECT * FROM sensor_readings WHERE sensor_id = 'A' AND timestamp > '2024-01-01';
```

### 2. Composite Partition Key

```sql
-- User activity logs (partition by user and date for even distribution)
CREATE TABLE user_activity (
  user_id UUID,
  activity_date DATE,      -- Part of partition key
  timestamp TIMESTAMP,     -- Clustering column
  activity_type TEXT,
  details TEXT,
  PRIMARY KEY ((user_id, activity_date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);

-- Each user/day combination is a separate partition
-- Prevents hot partitions for active users
```

### 3. Denormalization for Queries

```sql
-- Query: Get user's posts
CREATE TABLE posts_by_user (
  user_id UUID,
  post_id UUID,
  created_at TIMESTAMP,
  title TEXT,
  content TEXT,
  PRIMARY KEY (user_id, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Query: Get posts by tag
CREATE TABLE posts_by_tag (
  tag TEXT,
  post_id UUID,
  created_at TIMESTAMP,
  user_id UUID,
  title TEXT,
  PRIMARY KEY (tag, created_at, post_id)
) WITH CLUSTERING ORDER BY (created_at DESC);

-- Same data, different partition keys for different access patterns
```

## Indexing Strategies

### MongoDB Indexes

```javascript
// Single field index
db.users.createIndex({ email: 1 }); // 1 = ascending

// Compound index (order matters!)
db.orders.createIndex({ user_id: 1, status: 1, created_at: -1 });

// Text search index
db.articles.createIndex({ title: "text", content: "text" });

// Geospatial index
db.locations.createIndex({ coordinates: "2dsphere" });

// Unique index
db.users.createIndex({ email: 1 }, { unique: true });

// Partial index (only index subset)
db.orders.createIndex(
  { user_id: 1 },
  { partialFilterExpression: { status: "pending" } }
);

// TTL index (auto-delete old documents)
db.sessions.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 3600 } // 1 hour
);
```

### DynamoDB Indexes

```javascript
// Local Secondary Index (LSI) - Same partition key, different sort key
// Must be created at table creation time
{
  TableName: "Orders",
  KeySchema: [
    { AttributeName: "user_id", KeyType: "HASH" },  // PK
    { AttributeName: "order_date", KeyType: "RANGE" } // SK
  ],
  LocalSecondaryIndexes: [
    {
      IndexName: "StatusIndex",
      KeySchema: [
        { AttributeName: "user_id", KeyType: "HASH" },
        { AttributeName: "status", KeyType: "RANGE" }
      ]
    }
  ]
}

// Global Secondary Index (GSI) - Different partition and sort keys
// Can be created after table creation
{
  GlobalSecondaryIndexes: [
    {
      IndexName: "EmailIndex",
      KeySchema: [
        { AttributeName: "email", KeyType: "HASH" }
      ]
    }
  ]
}
```

## Best Practices

### MongoDB
✅ **Design for queries** - Structure documents for access patterns
✅ **Limit array growth** - Avoid unbounded arrays in documents
✅ **Use indexes wisely** - But not too many (slows writes)
✅ **Embed one-to-few** - Reference one-to-many or many-to-many
✅ **Use aggregation pipeline** - For complex transformations
✅ **Schema validation** - Define validation rules even if "schema-less"

### DynamoDB
✅ **Single-table design** - Use generic PK/SK for flexibility
✅ **Even partition distribution** - Avoid hot partitions
✅ **Use GSIs for queries** - Don't scan full table
✅ **Composite keys** - Leverage sort key for range queries
✅ **Batch operations** - Use BatchGetItem, BatchWriteItem
✅ **DynamoDB Streams** - For change data capture

### Cassandra
✅ **Query-first design** - Design tables for specific queries
✅ **Partition key cardinality** - High cardinality prevents hot partitions
✅ **Denormalize freely** - Duplicate data for query patterns
✅ **Clustering columns** - For sorting within partition
✅ **Avoid secondary indexes** - Use materialized views instead
✅ **Time-series optimization** - Partition by time buckets

## Common Pitfalls

❌ **Normalizing like SQL** - Kills performance (too many joins/lookups)
❌ **Unbounded arrays** - Documents grow forever, hit size limits
❌ **Missing indexes** - Slow queries, full collection scans
❌ **Too many indexes** - Slows writes significantly
❌ **Hot partitions** - Uneven data distribution
❌ **Ignoring consistency model** - Eventual consistency surprises
❌ **No TTL for temp data** - Sessions, cache data accumulates
❌ **Cross-partition queries** - Expensive in DynamoDB/Cassandra
