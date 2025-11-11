---
id: data-pipeline-design
category: skill
tags: [data, etl, pipeline, streaming, batch, validation, idempotency]
capabilities:
  - ETL pipeline architecture design
  - Streaming vs batch processing decisions
  - Data validation strategies
  - Idempotent pipeline implementation
useWhen:
  - Designing scalable data pipeline with Apache Kafka for real-time event streaming and processing
  - Building ETL workflow with Airflow orchestrating data extraction, transformation, and loading to warehouse
  - Implementing data pipeline error handling with dead letter queues and automatic retry mechanisms
  - Creating data quality validation layer checking schema compliance, data completeness, and business rules
  - Designing streaming data architecture with at-least-once delivery guarantees and idempotent processing
estimatedTokens: 580
---

# Data Pipeline Design

## Core Patterns

**ETL (Extract-Transform-Load):**
- Extract: Pull from sources (APIs, databases, files)
- Transform: Clean, validate, enrich, aggregate
- Load: Write to destinations (warehouses, lakes, databases)

**ELT (Extract-Load-Transform):**
- Load raw data first, transform in destination
- Better for cloud data warehouses (Snowflake, BigQuery)
- Preserves raw data, enables reprocessing

## Streaming vs Batch

**Choose Streaming When:**
- Need real-time insights (<1 min latency)
- Event-driven architectures
- Continuous data flows
- Tools: Kafka, Flink, Spark Streaming, Kinesis

**Choose Batch When:**
- Large historical datasets
- Non-time-sensitive analytics
- Cost optimization priority
- Tools: Airflow, Luigi, dbt, Spark

**Hybrid (Lambda Architecture):**
- Batch for accuracy, streaming for speed
- Combine results in serving layer

## Data Validation

**Schema Validation:**
```python
# Great Expectations
expect_column_values_to_be_between("age", 0, 120)
expect_column_values_to_not_be_null("user_id")
```

**Validation Layers:**
1. **Source validation** - Check at ingestion
2. **Transform validation** - Verify transformations
3. **Sink validation** - Validate before load
4. **Reconciliation** - Count checks, checksum verification

**Fail-Fast vs Fail-Safe:**
- Fail-fast: Stop on validation errors (critical pipelines)
- Fail-safe: Log errors, continue (best-effort pipelines)

## Idempotency

**Why Critical:**
- Pipelines may retry on failure
- Same input → same output, no duplicates
- Enables safe reprocessing

**Techniques:**

**1. Unique Keys:**
```sql
-- Upsert pattern
INSERT INTO table (id, data, updated_at)
VALUES (?, ?, NOW())
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data, updated_at = NOW();
```

**2. Deterministic Timestamps:**
- Use event time, not processing time
- Preserve source timestamps

**3. Deduplication Windows:**
```python
# Spark structured streaming
df.dropDuplicates(["id", "event_time"])
```

**4. Checkpoint/Offset Tracking:**
- Kafka offsets
- Database high-water marks
- File processing logs

## Best Practices

**Error Handling:**
- Dead letter queues for failed records
- Retry with exponential backoff
- Circuit breakers for downstream failures

**Monitoring:**
- Data volume metrics (records/sec)
- Pipeline lag (processing delay)
- Error rates and types
- Data quality metrics

**Partitioning:**
- Time-based (date/hour) for time-series
- Hash-based for even distribution
- Enables parallel processing, pruning

**Tools:**
- **Orchestration:** Airflow, Prefect, Dagster
- **Streaming:** Kafka, Pulsar, Kinesis
- **Processing:** Spark, Flink, Beam
- **Validation:** Great Expectations, deequ
- **CDC:** Debezium, Airbyte, Fivetran
