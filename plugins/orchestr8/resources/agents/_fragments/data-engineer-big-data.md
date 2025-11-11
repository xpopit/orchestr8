---
id: data-engineer-big-data
category: agent
tags: [data-engineering, spark, pyspark, big-data, streaming, hadoop, distributed]
capabilities:
  - Apache Spark (PySpark) for distributed processing
  - Spark DataFrame transformations and optimizations
  - Spark Structured Streaming for real-time data
  - Partitioning and performance optimization strategies
useWhen:
  - Processing large datasets with PySpark DataFrame API using transformations like filter, withColumn, join, groupBy, and agg for distributed batch processing on S3/HDFS
  - Building Spark Structured Streaming pipelines reading from Kafka with readStream, processing with windowed aggregations, and writing to parquet with checkpointing
  - Optimizing Spark performance using broadcast joins for small lookup tables, caching with StorageLevel.MEMORY_AND_DISK, and partitionBy for time-based queries
  - Implementing distributed data processing with lazy evaluation, adaptive query execution (AQE), coalescePartitions, and skewJoin handling for large-scale workloads
  - Designing real-time streaming pipelines with window functions (5-minute tumbling windows), from_json for Kafka value parsing, and trigger(processingTime) for micro-batching
  - Tuning Spark jobs avoiding collect() on large DataFrames, preferring built-in functions over UDFs, and using parquet columnar format with appropriate partition counts
estimatedTokens: 700
---

# Data Engineer - Big Data Processing

Expert in Apache Spark (PySpark) for distributed batch and streaming data processing at scale.

## PySpark Batch Processing

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, avg, window, count

# Initialize Spark
spark = SparkSession.builder \
    .appName("SalesAnalytics") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Read from S3/HDFS
df = spark.read \
    .format("parquet") \
    .load("s3://data-lake/sales/year=2025/")

# Transformations (lazy evaluation)
enriched_df = df \
    .filter(col("amount") > 0) \
    .withColumn("revenue_tier",
        when(col("amount") < 100, "low")
        .when(col("amount") < 1000, "medium")
        .otherwise("high")
    ) \
    .join(customer_df, "customer_id") \
    .groupBy("region", "revenue_tier") \
    .agg(
        avg("amount").alias("avg_order_value"),
        count("*").alias("order_count")
    )

# Write results
enriched_df.write \
    .mode("overwrite") \
    .partitionBy("region") \
    .format("parquet") \
    .save("s3://data-warehouse/sales_analytics/")
```

## Spark Structured Streaming

```python
from pyspark.sql.functions import from_json, sum, window

# Read from Kafka
stream_df = spark.readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "orders") \
    .load()

# Define schema for JSON
from pyspark.sql.types import StructType, StructField, StringType, DoubleType, TimestampType

schema = StructType([
    StructField("order_id", StringType()),
    StructField("product_id", StringType()),
    StructField("amount", DoubleType()),
    StructField("timestamp", TimestampType())
])

# Process stream
processed = stream_df \
    .select(
        from_json(col("value").cast("string"), schema).alias("data")
    ) \
    .select("data.*") \
    .groupBy(
        window(col("timestamp"), "5 minutes"),
        col("product_id")
    ) \
    .agg(sum("amount").alias("total_sales"))

# Output stream
query = processed.writeStream \
    .format("parquet") \
    .option("path", "s3://streaming-results/") \
    .option("checkpointLocation", "s3://checkpoints/") \
    .trigger(processingTime="1 minute") \
    .start()

query.awaitTermination()
```

## Performance Optimization

### Partitioning Strategy

```python
# Partition by date for time-based queries
df.write \
    .partitionBy("year", "month", "day") \
    .parquet("s3://bucket/data/")

# Read specific partitions
df = spark.read.parquet("s3://bucket/data/year=2025/month=01/")
```

### Caching and Persistence

```python
# Cache frequently accessed data
df.cache()
df.count()  # Trigger caching

# Persist with storage level
from pyspark import StorageLevel
df.persist(StorageLevel.MEMORY_AND_DISK)

# Unpersist when done
df.unpersist()
```

### Broadcast Joins

```python
from pyspark.sql.functions import broadcast

# Broadcast small lookup table
result = large_df.join(
    broadcast(small_df),
    "key"
)
```

## Adaptive Query Execution

```python
# Enable AQE for automatic optimization
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
```

## Best Practices

✅ Use lazy evaluation to optimize query plans
✅ Partition data by frequently queried columns
✅ Broadcast small DataFrames in joins
✅ Cache intermediate results if reused
✅ Enable adaptive query execution
✅ Use parquet format for columnar storage

❌ Don't collect() large DataFrames to driver
❌ Don't use UDFs when built-in functions exist
❌ Don't over-partition (too many small files)
