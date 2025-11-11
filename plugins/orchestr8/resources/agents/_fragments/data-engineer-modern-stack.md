---
id: data-engineer-modern-stack
category: agent
tags: [data-engineering, dbt, delta-lake, data-quality, great-expectations, modern-data-stack]
capabilities:
  - dbt (Data Build Tool) for transformation pipelines
  - Delta Lake for ACID transactions and time travel
  - Data quality validation with Great Expectations
  - Modern data stack architecture and best practices
useWhen:
  - Building dbt transformation pipelines with staging models (materialized='view'), mart models with incremental loading, and schema.yml tests for data validation
  - Implementing Delta Lake lakehouses with ACID transactions, merge operations for upserts, time travel queries using versionAsOf or timestampAsOf options
  - Setting up Great Expectations data quality frameworks with expectation suites for column validation, value ranges, uniqueness, and table row counts
  - Designing modern data stack architectures with Fivetran/Airbyte ingestion, Snowflake/BigQuery warehousing, dbt transformations, and BI tool integration
  - Creating dbt incremental models with is_incremental() macros, unique_key config, and WHERE clauses for efficient large table processing
  - Validating data quality at every pipeline stage using dbt tests (unique, not_null, relationships, accepted_range) integrated with Great Expectations
estimatedTokens: 600
---

# Data Engineer - Modern Data Stack

Expert in modern data tools: dbt for transformations, Delta Lake for lakehouse architecture, and Great Expectations for data quality.

## dbt (Data Build Tool)

### Staging Models
```yaml
# models/staging/stg_orders.sql
{{ config(materialized='view') }}

SELECT
    order_id,
    customer_id,
    order_date,
    CAST(amount AS DECIMAL(10,2)) AS amount,
    status
FROM {{ source('raw', 'orders') }}
WHERE order_date >= '2024-01-01'
```

### Mart Models with Incremental Loading
```yaml
# models/marts/fct_orders.sql
{{ config(
    materialized='incremental',
    unique_key='order_id'
) }}

SELECT
    o.order_id,
    o.customer_id,
    c.customer_name,
    o.order_date,
    o.amount,
    o.status
FROM {{ ref('stg_orders') }} o
LEFT JOIN {{ ref('dim_customers') }} c USING (customer_id)

{% if is_incremental() %}
WHERE o.order_date > (SELECT MAX(order_date) FROM {{ this }})
{% endif %}
```

### dbt Tests
```yaml
# models/schema.yml
version: 2

models:
  - name: fct_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: amount
        tests:
          - dbt_utils.accepted_range:
              min_value: 0
              max_value: 1000000
      - name: customer_id
        tests:
          - relationships:
              to: ref('dim_customers')
              field: customer_id
```

## Delta Lake

### ACID Transactions
```python
from delta.tables import DeltaTable

# Write data with ACID transactions
df.write \
    .format("delta") \
    .mode("overwrite") \
    .partitionBy("date") \
    .save("/data/events")

# Upsert (merge)
deltaTable = DeltaTable.forPath(spark, "/data/events")

deltaTable.alias("target").merge(
    updates.alias("source"),
    "target.event_id = source.event_id"
).whenMatchedUpdate(set={
    "status": "source.status",
    "updated_at": "source.updated_at"
}).whenNotMatchedInsert(values={
    "event_id": "source.event_id",
    "status": "source.status",
    "created_at": "source.created_at"
}).execute()
```

### Time Travel
```python
# Read historical version
df = spark.read \
    .format("delta") \
    .option("versionAsOf", 5) \
    .load("/data/events")

# Read at specific timestamp
df = spark.read \
    .format("delta") \
    .option("timestampAsOf", "2025-01-01") \
    .load("/data/events")

# View history
deltaTable.history().show()
```

## Data Quality (Great Expectations)

```python
import great_expectations as gx

# Create expectation suite
suite = gx.ExpectationSuite(name="sales_quality")

# Define expectations
suite.expect_column_values_to_not_be_null("order_id")
suite.expect_column_values_to_be_unique("order_id")
suite.expect_column_values_to_be_between(
    "amount",
    min_value=0,
    max_value=1000000
)
suite.expect_column_values_to_be_in_set(
    "status",
    ["pending", "completed", "cancelled"]
)
suite.expect_table_row_count_to_be_between(
    min_value=1000,
    max_value=1000000
)

# Validate data
results = context.run_validation_operator(
    "action_list_operator",
    assets_to_validate=[batch],
    run_id="validation_run_001"
)

# Check results
if not results["success"]:
    raise ValueError("Data quality checks failed")
```

## Modern Data Stack Architecture

```
Data Sources → Ingestion (Fivetran/Airbyte)
    ↓
Data Lake/Warehouse (S3 + Snowflake/BigQuery)
    ↓
Transformation (dbt)
    ↓
Data Quality (Great Expectations)
    ↓
BI Tools (Tableau/Looker/Metabase)
```

## Best Practices

✅ Use dbt for all transformations (version control)
✅ Implement incremental models for large tables
✅ Test data quality at every stage
✅ Use Delta Lake for ACID guarantees
✅ Leverage time travel for debugging
✅ Document models and expectations

❌ Don't transform data in BI tools
❌ Don't skip data quality checks
❌ Don't ignore dbt test failures
