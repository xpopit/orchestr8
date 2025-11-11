---
id: data-engineer-orchestration
category: agent
tags: [data-engineering, airflow, prefect, etl, dag, orchestration, workflow]
capabilities:
  - Apache Airflow DAG design and configuration
  - Prefect flow patterns with modern syntax
  - ETL pipeline orchestration and scheduling
  - Data pipeline dependency management and retries
useWhen:
  - Building Apache Airflow DAGs with PythonOperator, S3ToRedshiftOperator, and dependency chains using >> operator for ETL pipeline orchestration
  - Scheduling ETL jobs with cron expressions (schedule_interval='0 2 * * *'), default_args for retries/email alerts, and catchup=False for backfill control
  - Designing Prefect flows with @task decorators, cache_key_fn for task result caching, retries with retry_delay_seconds, and @flow for pipeline composition
  - Implementing retry strategies with exponential backoff (retry_delay=timedelta(minutes=5)), email_on_failure alerts, and data quality check tasks post-load
  - Choosing between ETL (transform before load, traditional warehouses) vs ELT (load raw, transform in warehouse with dbt) architecture patterns
  - Comparing Lambda architecture (batch + speed layers) vs Kappa architecture (stream-first) for real-time and historical data processing workflows
estimatedTokens: 680
---

# Data Engineer - Pipeline Orchestration

Expert in orchestrating data pipelines using Apache Airflow and Prefect for reliable, scheduled data processing.

## Apache Airflow DAG Design

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.amazon.aws.transfers.s3_to_redshift import S3ToRedshiftOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'daily_sales_pipeline',
    default_args=default_args,
    description='Daily sales data ETL',
    schedule_interval='0 2 * * *',  # 2 AM daily
    start_date=datetime(2025, 1, 1),
    catchup=False,
    tags=['sales', 'production'],
) as dag:

    # Extract from API
    extract_task = PythonOperator(
        task_id='extract_sales_data',
        python_callable=extract_from_api,
        op_kwargs={
            'date': '{{ ds }}',
            's3_bucket': 'raw-data',
            's3_key': 'sales/{{ ds }}/data.json'
        }
    )

    # Transform data
    transform_task = PythonOperator(
        task_id='transform_sales_data',
        python_callable=transform_data,
        provide_context=True,
    )

    # Load to warehouse
    load_task = S3ToRedshiftOperator(
        task_id='load_to_redshift',
        s3_bucket='processed-data',
        s3_key='sales/{{ ds }}/data.parquet',
        schema='public',
        table='sales_daily',
        copy_options=['FORMAT AS PARQUET'],
    )

    # Data quality checks
    quality_check = PythonOperator(
        task_id='data_quality_check',
        python_callable=run_quality_checks,
    )

    # Dependencies
    extract_task >> transform_task >> load_task >> quality_check
```

## Prefect Modern Flows

```python
from prefect import flow, task
from prefect.tasks import task_input_hash
from datetime import timedelta

@task(cache_key_fn=task_input_hash, cache_expiration=timedelta(hours=1))
def extract_data(source: str, date: str):
    """Extract data with caching."""
    data = fetch_from_source(source, date)
    return data

@task(retries=3, retry_delay_seconds=60)
def transform_data(data):
    """Transform with automatic retries."""
    return process(data)

@task
def load_data(data, destination: str):
    """Load to destination."""
    write_to_warehouse(data, destination)

@flow(name="sales-etl-pipeline")
def sales_pipeline(date: str):
    """Main ETL flow."""
    raw_data = extract_data("sales-api", date)
    transformed = transform_data(raw_data)
    load_data(transformed, "warehouse.sales")

# Run pipeline
sales_pipeline(date="2025-01-15")
```

## ETL vs ELT Architecture

**ETL (Extract, Transform, Load):**
- Transform before loading
- Traditional data warehouses
- Structured data focus
- Tools: Informatica, Talend, SSIS

**ELT (Extract, Load, Transform):**
- Load raw data, transform in warehouse
- Modern cloud warehouses
- Handles semi-structured data
- Tools: dbt, Fivetran, Airbyte

## Lambda vs Kappa Architecture

**Lambda Architecture:**
```
Batch Layer (Historical)
    ↓
Master Dataset → Batch Views
    ↓
Speed Layer (Real-time)
    ↓
Serving Layer → Combined Views
```

**Kappa Architecture (Stream-first):**
```
Event Stream → Processing → Materialized Views
         ↓
    Reprocessing (when needed)
```

## Best Practices

✅ Use idempotent tasks (safe to retry)
✅ Implement data quality checks
✅ Set appropriate retry policies
✅ Use templating for dynamic parameters
✅ Monitor and alert on failures
✅ Tag DAGs/flows for organization

❌ Don't use catchup=True without consideration
❌ Don't ignore task dependencies
❌ Don't hard-code dates or configuration
