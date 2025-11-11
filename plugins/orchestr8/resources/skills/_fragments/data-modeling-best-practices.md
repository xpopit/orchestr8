---
id: data-modeling-best-practices
category: skill
tags: [data, modeling, schema, normalization, denormalization, versioning, database]
capabilities:
  - Schema design principles
  - Normalization and denormalization strategies
  - Data versioning techniques
  - Dimensional modeling
useWhen:
  - Designing normalized database schema following third normal form reducing data redundancy and anomalies
  - Building domain-driven data model with aggregate roots, entities, and value objects for complex business logic
  - Implementing database migration strategy with versioned schema changes and rollback procedures
  - Creating data modeling patterns for temporal data handling historical records and slowly changing dimensions
  - Designing multi-tenant database architecture with row-level security and tenant isolation strategies
estimatedTokens: 600
---

# Data Modeling Best Practices

## Schema Design Principles

**Start With Questions:**
- What queries will be run?
- Read-heavy or write-heavy?
- OLTP (transactions) or OLAP (analytics)?

**OLTP Design:**
- Normalized (3NF) for data integrity
- Small transactions, many writes
- Row-oriented storage
- Examples: PostgreSQL, MySQL

**OLAP Design:**
- Denormalized for query speed
- Large scans, aggregations
- Columnar storage
- Examples: Snowflake, BigQuery, Redshift

## Normalization

**1NF (First Normal Form):**
- Atomic values (no arrays/nested objects)
- Each column has single value type

**2NF (Second Normal Form):**
- 1NF + no partial dependencies
- Non-key columns depend on entire primary key

**3NF (Third Normal Form):**
- 2NF + no transitive dependencies
- Non-key columns don't depend on other non-key columns

**When to Normalize:**
- Data integrity critical
- Frequent updates
- Storage optimization
- Transactional systems

## Denormalization

**Star Schema (Data Warehouse):**
```
Fact Table (center):
- sale_id, date_id, product_id, store_id
- quantity, revenue

Dimension Tables (points):
- date_dim: date_id, date, month, quarter, year
- product_dim: product_id, name, category, brand
- store_dim: store_id, name, city, region
```

**Snowflake Schema:**
- Normalized dimensions
- Reduces redundancy vs star schema
- More joins (slower queries)

**When to Denormalize:**
- Query performance priority
- Read-heavy workloads
- Aggregation-heavy analytics
- Acceptable data duplication

## Versioning Strategies

**1. Temporal Tables (Slowly Changing Dimensions):**

**Type 1 - Overwrite:**
```sql
-- No history, just update
UPDATE customer SET city = 'New York' WHERE id = 123;
```

**Type 2 - Track History:**
```sql
-- Add versioning columns
CREATE TABLE customer (
  id INT,
  name VARCHAR,
  city VARCHAR,
  valid_from DATE,
  valid_to DATE,
  is_current BOOLEAN
);
```

**Type 3 - Limited History:**
```sql
-- Store previous value
ALTER TABLE customer ADD COLUMN previous_city VARCHAR;
```

**2. Event Sourcing:**
- Store all changes as events
- Rebuild state by replaying events
- Full audit trail

**3. Schema Versioning:**
```sql
-- Add version column
ALTER TABLE orders ADD COLUMN schema_version INT DEFAULT 1;

-- Migration strategy
CREATE TABLE orders_v2 AS SELECT * FROM orders;
```

## Best Practices

**Naming Conventions:**
- Tables: plural nouns (`customers`, `orders`)
- Columns: snake_case (`first_name`, `order_date`)
- Foreign keys: `table_id` (`customer_id`)
- Indexes: `idx_table_column`

**Data Types:**
- Use smallest appropriate type
- DECIMAL for money (not FLOAT)
- TIMESTAMP WITH TIME ZONE for dates
- ENUM for fixed sets (status values)

**Indexing:**
- Primary keys: clustered index
- Foreign keys: always index
- Query columns: selective indexes
- Composite indexes: most selective first

**Constraints:**
```sql
-- Enforce data quality
ALTER TABLE orders
  ADD CONSTRAINT check_quantity CHECK (quantity > 0),
  ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id)
    REFERENCES customers(id);
```

**Partitioning:**
- **Range:** Time-series data (by date)
- **Hash:** Even distribution
- **List:** Categorical grouping

**Avoid:**
- EAV (Entity-Attribute-Value) anti-pattern
- Storing JSON blobs (unless document DB)
- Over-indexing (slows writes)
- Generic column names (`data1`, `value`)

**Tools:**
- **Modeling:** dbdiagram.io, ERDPlus, Lucidchart
- **Migration:** Flyway, Liquibase, Alembic
- **Documentation:** SchemaSpy, tbls
