---
id: rust-sqlx-queries
category: example
tags: [rust, sqlx, postgres, async, database]
capabilities:
  - SQLx async queries
  - Compile-time query verification
  - Type-safe database access
useWhen:
  - Rust applications requiring compile-time verified SQL queries with SQLx macros that catch SQL errors during compilation
  - Building async Rust services with PostgreSQL connection pooling (max 20, min 5 connections) and query timeout handling
  - Rust APIs needing type-safe database operations where SQLx query_as! macro validates SQL against database schema at build time
  - Implementing CRUD operations with RETURNING clauses to get inserted/updated records in single database round trip
  - Rust services requiring explicit transaction management with begin(), commit(), and rollback() for atomic multi-statement operations
  - Building Rust repository layers with async database access, proper error propagation, and pagination support via LIMIT/OFFSET
estimatedTokens: 380
---

# Rust SQLx Queries

```rust
use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

// Create connection pool
pub async fn create_pool(url: &str) -> Result<PgPool, sqlx::Error> {
    PgPoolOptions::new()
        .max_connections(20)
        .min_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(url)
        .await
}

// Query with compile-time verification
pub async fn get_user(pool: &PgPool, id: Uuid) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, name, created_at
        FROM users
        WHERE id = $1
        "#
    )
    .bind(id)
    .fetch_one(pool)
    .await
}

// Insert with RETURNING
pub async fn create_user(pool: &PgPool, email: &str, name: &str) -> Result<User, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, name)
        VALUES ($1, $2, $3)
        RETURNING id, email, name, created_at
        "#
    )
    .bind(Uuid::new_v4())
    .bind(email)
    .bind(name)
    .fetch_one(pool)
    .await
}

// Paginated query
pub async fn list_users(
    pool: &PgPool,
    limit: i64,
    offset: i64,
) -> Result<Vec<User>, sqlx::Error> {
    sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, name, created_at
        FROM users
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
        "#
    )
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
}

// Transaction
pub async fn update_user_with_audit(
    pool: &PgPool,
    id: Uuid,
    name: &str,
) -> Result<User, sqlx::Error> {
    let mut tx = pool.begin().await?;
    
    let user = sqlx::query_as::<_, User>(
        "UPDATE users SET name = $1 WHERE id = $2 RETURNING *"
    )
    .bind(name)
    .bind(id)
    .fetch_one(&mut *tx)
    .await?;
    
    sqlx::query("INSERT INTO audit_log (user_id, action) VALUES ($1, $2)")
        .bind(id)
        .bind("update")
        .execute(&mut *tx)
        .await?;
    
    tx.commit().await?;
    Ok(user)
}
```
