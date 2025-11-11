---
id: rust-actix-handlers
category: example
tags: [rust, actix-web, async, handlers]
capabilities:
  - Actix-web handlers
  - Async endpoints
  - Error handling
useWhen:
  - Rust REST APIs using Actix-web with async handlers, SQLx database queries, and web::Data for dependency injection
  - Building type-safe HTTP endpoints with path parameters (web::Path), query parameters (web::Query), and JSON bodies (web::Json)
  - Actix-web services requiring custom error handling that converts domain errors into proper HTTP responses with status codes
  - High-performance Rust APIs needing pagination support with query parameter defaults and offset/limit calculation
  - Building CRUD endpoints with proper validation before database operations and structured JSON responses
  - Rust microservices requiring connection pool sharing across handlers via Actix web::Data state management
estimatedTokens: 400
---

# Rust Actix-web Handlers

```rust
use actix_web::{web, HttpResponse, Result};
use sqlx::PgPool;
use uuid::Uuid;

// Handler with path parameter
pub async fn get_user(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<HttpResponse, AppError> {
    let user_id = path.into_inner();
    
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, name FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".into()))?;
    
    Ok(HttpResponse::Ok().json(UserResponse {
        status: "success",
        data: user,
    }))
}

// Handler with query parameters
#[derive(Deserialize)]
pub struct PaginationQuery {
    #[serde(default = "default_page")]
    page: i64,
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_page() -> i64 { 1 }
fn default_limit() -> i64 { 20 }

pub async fn list_users(
    pool: web::Data<PgPool>,
    query: web::Query<PaginationQuery>,
) -> Result<HttpResponse, AppError> {
    let offset = (query.page - 1) * query.limit;
    
    let users = sqlx::query_as::<_, User>(
        "SELECT id, email, name FROM users LIMIT $1 OFFSET $2"
    )
    .bind(query.limit)
    .bind(offset)
    .fetch_all(pool.get_ref())
    .await?;
    
    Ok(HttpResponse::Ok().json(users))
}

// Handler with JSON body
pub async fn create_user(
    pool: web::Data<PgPool>,
    body: web::Json<CreateUserRequest>,
) -> Result<HttpResponse, AppError> {
    body.validate()
        .map_err(|e| AppError::BadRequest(e.to_string()))?;
    
    let user = sqlx::query_as::<_, User>(
        "INSERT INTO users (id, email, name) VALUES ($1, $2, $3) RETURNING *"
    )
    .bind(Uuid::new_v4())
    .bind(&body.email)
    .bind(&body.name)
    .fetch_one(pool.get_ref())
    .await?;
    
    Ok(HttpResponse::Created().json(user))
}

// Configure routes
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .route("", web::get().to(list_users))
            .route("", web::post().to(create_user))
            .route("/{id}", web::get().to(get_user))
    );
}
```
