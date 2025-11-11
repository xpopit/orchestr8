---
id: data-engineer-warehouse-design
category: agent
tags: [data-engineering, data-warehouse, star-schema, dimensional-model, scd, sql]
capabilities:
  - Star schema and dimensional modeling design
  - Slowly Changing Dimensions (SCD Type 2) implementation
  - Fact and dimension table optimization
  - Data warehouse indexing and partitioning strategies
useWhen:
  - Designing star schema data warehouses with central fact tables (fact_sales) and dimension tables (dim_date, dim_product, dim_customer) using surrogate keys
  - Implementing SCD Type 2 for tracking historical dimension changes with valid_from, valid_to, is_current, and version columns for temporal querying
  - Building fact table patterns including transaction (one row per event), periodic snapshot (daily balances), and accumulating snapshot (order fulfillment lifecycle)
  - Optimizing warehouse query performance with indexes on foreign keys, PARTITION BY RANGE on date columns, and materialized views for common aggregations
  - Creating dimension tables with surrogate keys (customer_key), natural keys (customer_id), and descriptive attributes for OLAP query performance
  - Designing date dimensions with date hierarchies (year, quarter, month, week), is_weekend, is_holiday flags for time-based analytics and drill-down queries
estimatedTokens: 640
---

# Data Engineer - Warehouse Design

Expert in dimensional modeling, star schema design, and slowly changing dimensions for analytics data warehouses.

## Star Schema Design

```sql
-- Fact table (center)
CREATE TABLE fact_sales (
    sale_id BIGINT PRIMARY KEY,
    date_key INT REFERENCES dim_date(date_key),
    product_key INT REFERENCES dim_product(product_key),
    customer_key INT REFERENCES dim_customer(customer_key),
    store_key INT REFERENCES dim_store(store_key),
    quantity INT,
    amount DECIMAL(10,2),
    cost DECIMAL(10,2),
    profit DECIMAL(10,2)
);

-- Dimension tables (spokes)
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY,
    date DATE,
    year INT,
    quarter INT,
    month INT,
    week INT,
    day_of_week INT,
    is_weekend BOOLEAN,
    is_holiday BOOLEAN
);

CREATE TABLE dim_product (
    product_key INT PRIMARY KEY,
    product_id VARCHAR(50),
    product_name VARCHAR(255),
    category VARCHAR(100),
    subcategory VARCHAR(100),
    brand VARCHAR(100),
    unit_price DECIMAL(10,2)
);

CREATE TABLE dim_customer (
    customer_key INT PRIMARY KEY,
    customer_id VARCHAR(50),
    name VARCHAR(255),
    segment VARCHAR(50),
    region VARCHAR(100),
    lifetime_value DECIMAL(12,2)
);

-- Indexes for performance
CREATE INDEX idx_sales_date ON fact_sales(date_key);
CREATE INDEX idx_sales_product ON fact_sales(product_key);
CREATE INDEX idx_sales_customer ON fact_sales(customer_key);
```

## Slowly Changing Dimensions (SCD Type 2)

```sql
CREATE TABLE dim_customer_scd2 (
    customer_key SERIAL PRIMARY KEY,
    customer_id VARCHAR(50),
    name VARCHAR(255),
    email VARCHAR(255),
    segment VARCHAR(50),
    valid_from DATE,
    valid_to DATE,
    is_current BOOLEAN,
    version INT
);

-- Track historical changes
INSERT INTO dim_customer_scd2 VALUES
(1, 'C001', 'John Doe', 'john@email.com', 'premium', '2024-01-01', '2024-12-31', false, 1),
(2, 'C001', 'John Doe', 'john@newemail.com', 'premium', '2025-01-01', '9999-12-31', true, 2);

-- Query current records
SELECT * FROM dim_customer_scd2 WHERE is_current = true;

-- Query historical snapshot
SELECT * FROM dim_customer_scd2
WHERE customer_id = 'C001'
  AND '2024-06-01' BETWEEN valid_from AND valid_to;
```

## Fact Table Patterns

### Transaction Fact Table
```sql
-- One row per transaction
CREATE TABLE fact_orders (
    order_id BIGINT PRIMARY KEY,
    order_date_key INT,
    customer_key INT,
    order_amount DECIMAL(10,2),
    order_status VARCHAR(50)
);
```

### Periodic Snapshot Fact Table
```sql
-- One row per period (e.g., daily account balance)
CREATE TABLE fact_account_snapshot (
    account_key INT,
    date_key INT,
    balance DECIMAL(12,2),
    transactions_count INT,
    PRIMARY KEY (account_key, date_key)
);
```

### Accumulating Snapshot Fact Table
```sql
-- One row per process lifecycle (e.g., order fulfillment)
CREATE TABLE fact_order_fulfillment (
    order_id BIGINT PRIMARY KEY,
    order_date_key INT,
    payment_date_key INT,
    shipped_date_key INT,
    delivered_date_key INT,
    days_to_ship INT,
    days_to_deliver INT
);
```

## Performance Optimization

### Partitioning
```sql
-- Partition fact table by date
CREATE TABLE fact_sales (
    sale_id BIGINT,
    sale_date DATE,
    amount DECIMAL(10,2)
) PARTITION BY RANGE (sale_date);

CREATE TABLE fact_sales_2024 PARTITION OF fact_sales
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Materialized Views
```sql
CREATE MATERIALIZED VIEW mv_monthly_sales AS
SELECT
    DATE_TRUNC('month', d.date) AS month,
    p.category,
    SUM(f.amount) AS total_sales,
    COUNT(*) AS order_count
FROM fact_sales f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_product p ON f.product_key = p.product_key
GROUP BY 1, 2;

-- Refresh periodically
REFRESH MATERIALIZED VIEW mv_monthly_sales;
```

## Best Practices

✅ Use surrogate keys for dimension tables
✅ Implement SCD Type 2 for historical tracking
✅ Index foreign keys in fact tables
✅ Partition large fact tables by date
✅ Use materialized views for common aggregations
✅ Separate current and historical dimensions

❌ Don't use natural keys as primary keys
❌ Don't store calculated fields in fact tables
❌ Don't forget to update SCD is_current flags
