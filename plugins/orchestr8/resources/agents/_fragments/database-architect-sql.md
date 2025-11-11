---
id: database-architect-sql
category: agent
tags: [database, sql, postgresql, mysql, schema, relational, normalization]
capabilities:
  - SQL database schema design
  - Normalization and denormalization
  - Index strategy
  - Constraint design
  - Migration planning
  - PostgreSQL and MySQL expertise
useWhen:
  - Designing SQL database schemas with normalization (1NF, 2NF, 3NF, BCNF), denormalization for performance, and entity-relationship modeling for complex domains
  - Implementing PostgreSQL/MySQL schemas with primary keys, foreign keys with ON DELETE CASCADE/SET NULL, unique constraints, check constraints, and multi-column indexes
  - Optimizing SQL query performance using EXPLAIN ANALYZE, index selection (B-tree, Hash, GIN, GIST), covering indexes, and query rewriting for better execution plans
  - Managing database transactions with ACID properties, isolation levels (Read Committed, Repeatable Read, Serializable), and handling deadlocks with retry logic
  - Implementing database migrations with tools like Flyway, Liquibase, or Alembic with version control, rollback support, and zero-downtime deployments
  - Scaling SQL databases with read replicas for query distribution, connection pooling (PgBouncer, ProxySQL), and partitioning strategies (range, hash, list)
estimatedTokens: 680
---

# SQL Database Architect Agent

Expert at designing robust, normalized SQL schemas for PostgreSQL and MySQL with proper indexing, constraints, and migration strategies.

## Schema Design Principles

### 1. Normalization Levels

**1NF (First Normal Form):**
- Atomic values (no arrays/lists in columns)
- Each column has single value
- Each row is unique (primary key exists)

**2NF (Second Normal Form):**
- Meets 1NF
- No partial dependencies (all non-key columns depend on entire primary key)

**3NF (Third Normal Form):**
- Meets 2NF
- No transitive dependencies (non-key columns depend only on primary key)

**Example - User Order System:**
```sql
-- 3NF normalized design
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  country VARCHAR(2) NOT NULL,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  address_id INTEGER REFERENCES addresses(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
```

### 2. Denormalization for Performance

**When to denormalize:**
- Read-heavy workloads (10:1 read:write ratio)
- Frequent joins are expensive
- Data rarely changes
- Aggregations are slow

**Example - Denormalized for performance:**
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  -- Denormalized: store user email for quick access
  user_email VARCHAR(255) NOT NULL,
  -- Denormalized: precomputed aggregate
  item_count INTEGER DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Keep denormalized data in sync with triggers
CREATE OR REPLACE FUNCTION update_order_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET
    item_count = (SELECT COUNT(*) FROM order_items WHERE order_id = NEW.order_id),
    total_amount = (SELECT SUM(subtotal) FROM order_items WHERE order_id = NEW.order_id)
  WHERE id = NEW.order_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_item_aggregates
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION update_order_aggregates();
```

## Indexing Strategies

### 1. Primary Key and Unique Indexes

```sql
-- Auto-indexed primary key
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL, -- Unique constraint creates index
  username VARCHAR(50) UNIQUE NOT NULL
);

-- Composite primary key
CREATE TABLE user_roles (
  user_id INTEGER REFERENCES users(id),
  role_id INTEGER REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id) -- Composite index
);
```

### 2. Foreign Key Indexes

```sql
-- PostgreSQL: Foreign keys are NOT auto-indexed (unlike MySQL)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id)
);

-- MUST create index manually for FK lookups
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

### 3. Query-Specific Indexes

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- Good for: WHERE user_id = ? AND status = ?
-- Good for: WHERE user_id = ?
-- Bad for:  WHERE status = ? (doesn't use index)

-- Covering index (includes extra columns)
CREATE INDEX idx_orders_user_status_with_total
ON orders(user_id, status)
INCLUDE (total_amount, created_at);
-- PostgreSQL: INCLUDE columns available in index without being part of key

-- Partial index (filtered)
CREATE INDEX idx_orders_active ON orders(user_id)
WHERE status IN ('pending', 'processing');
-- Only indexes active orders, smaller and faster
```

### 4. Full-Text Search Indexes

```sql
-- PostgreSQL full-text search
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || content)
  ) STORED
);

CREATE INDEX idx_articles_search ON articles USING GIN(search_vector);

-- Query
SELECT * FROM articles
WHERE search_vector @@ to_tsquery('english', 'postgresql & performance');
```

## Constraint Design

### 1. Check Constraints

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL CHECK (stock >= 0),
  discount_percent DECIMAL(5,2) CHECK (discount_percent BETWEEN 0 AND 100),
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'discontinued'))
);
```

### 2. Foreign Key Cascades

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  -- Deleting post deletes all comments

  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  -- Deleting user sets comment.user_id to NULL

  parent_id INTEGER REFERENCES comments(id) ON DELETE RESTRICT
  -- Cannot delete comment if it has replies
);
```

### 3. Unique Constraints

```sql
-- Single column unique
CREATE TABLE users (
  email VARCHAR(255) UNIQUE NOT NULL
);

-- Composite unique constraint
CREATE TABLE memberships (
  user_id INTEGER,
  team_id INTEGER,
  UNIQUE (user_id, team_id) -- User can join team only once
);

-- Partial unique constraint (PostgreSQL)
CREATE UNIQUE INDEX idx_active_sessions
ON sessions(user_id)
WHERE active = true;
-- Only one active session per user
```

## Data Types Best Practices

### PostgreSQL-Specific Types

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL, -- Binary JSON, faster than JSON
  tags TEXT[] NOT NULL DEFAULT '{}', -- Native array support
  metadata HSTORE, -- Key-value pairs
  ip_address INET, -- IP address type
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- Timezone-aware
  duration INTERVAL -- Time interval
);

-- JSONB indexing
CREATE INDEX idx_events_data ON events USING GIN(data);

-- Query JSONB
SELECT * FROM events WHERE data->>'status' = 'active';
SELECT * FROM events WHERE data @> '{"user_id": 123}';
```

### MySQL-Specific Considerations

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- JSON support (slower than PostgreSQL JSONB)
CREATE TABLE events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  data JSON NOT NULL
);

-- Virtual generated column for JSON indexing
ALTER TABLE events
ADD COLUMN status VARCHAR(20) AS (data->>'$.status') VIRTUAL,
ADD INDEX idx_status (status);
```

## Migration Strategies

### 1. Safe Schema Changes

```sql
-- Safe: Adding nullable column
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- Safe: Adding column with default (PostgreSQL 11+)
ALTER TABLE users ADD COLUMN verified BOOLEAN DEFAULT false;

-- Unsafe: Adding NOT NULL column without default (locks table)
-- Better approach:
ALTER TABLE users ADD COLUMN email_verified BOOLEAN;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
```

### 2. Zero-Downtime Migrations

```sql
-- Step 1: Add new column
ALTER TABLE users ADD COLUMN new_email VARCHAR(255);

-- Step 2: Backfill data (in batches)
UPDATE users SET new_email = email WHERE new_email IS NULL LIMIT 1000;

-- Step 3: Add constraint after backfill
ALTER TABLE users ADD CONSTRAINT users_new_email_unique UNIQUE (new_email);
ALTER TABLE users ALTER COLUMN new_email SET NOT NULL;

-- Step 4: Deploy code using new_email
-- Step 5: Drop old column
ALTER TABLE users DROP COLUMN email;
ALTER TABLE users RENAME COLUMN new_email TO email;
```

## Best Practices

✅ **Normalize to 3NF first** - Then denormalize only when needed
✅ **Index foreign keys** - Especially in PostgreSQL (not auto-indexed)
✅ **Use appropriate data types** - Don't use VARCHAR for everything
✅ **Add constraints** - Enforce data integrity at DB level
✅ **Use transactions** - ACID guarantees for multi-step operations
✅ **Plan migrations** - Test on production-sized data
✅ **Use UUIDs for distributed systems** - Avoid ID conflicts
✅ **Cascade deletes carefully** - Understand data lifecycle

## Common Pitfalls

❌ **Over-normalization** - Too many joins hurt performance
❌ **Missing indexes on FKs** - Slow join queries
❌ **Text for enums** - Use CHECK constraints or ENUM types
❌ **No constraints** - Relies on app logic (fragile)
❌ **Large transactions** - Lock contention, long rollback
❌ **Nullable without reason** - Makes queries complex
❌ **Generic VARCHAR(255)** - Use appropriate lengths
❌ **Timestamp without timezone** - Loses context (use TIMESTAMPTZ)
