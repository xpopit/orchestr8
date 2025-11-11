---
id: go-postgres-pgx
category: example
tags: [go, golang, postgres, pgx, database]
capabilities:
  - PostgreSQL with pgx
  - Connection pooling
  - Prepared statements
useWhen:
  - Go applications requiring PostgreSQL connections with pgx v5 connection pooling for high-throughput database operations
  - Building Go services with prepared statements, parameterized queries, and protection against SQL injection vulnerabilities
  - Go APIs needing context-aware database operations with timeout handling and cancellation propagation through context.Context
  - Implementing repository pattern in Go with pgxpool for connection reuse, max/min connection limits, and connection lifecycle
  - Go microservices requiring efficient PostgreSQL scanning with QueryRow for single records and Query for result sets
  - Building CRUD operations in Go that handle pgx.ErrNoRows gracefully and return domain-specific errors for not found cases
estimatedTokens: 400
---

# Go PostgreSQL with pgx

```go
import (
    "context"
    "github.com/jackc/pgx/v5/pgxpool"
    "github.com/google/uuid"
)

// Setup connection pool
func NewPool(ctx context.Context, connString string) (*pgxpool.Pool, error) {
    config, err := pgxpool.ParseConfig(connString)
    if err != nil {
        return nil, err
    }
    
    config.MaxConns = 20
    config.MinConns = 5
    config.MaxConnLifetime = time.Hour
    
    return pgxpool.NewWithConfig(ctx, config)
}

// Repository
type UserRepository struct {
    db *pgxpool.Pool
}

func (r *UserRepository) Create(ctx context.Context, user *User) error {
    query := `
        INSERT INTO users (id, email, name, created_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at`
    
    return r.db.QueryRow(ctx, query,
        uuid.New(), user.Email, user.Name, time.Now(),
    ).Scan(&user.ID, &user.CreatedAt)
}

func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
    user := &User{}
    query := `SELECT id, email, name, created_at FROM users WHERE id = $1`
    
    err := r.db.QueryRow(ctx, query, id).Scan(
        &user.ID, &user.Email, &user.Name, &user.CreatedAt,
    )
    
    if err == pgx.ErrNoRows {
        return nil, fmt.Errorf("user not found")
    }
    return user, err
}

func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]*User, error) {
    query := `SELECT id, email, name, created_at FROM users LIMIT $1 OFFSET $2`
    
    rows, err := r.db.Query(ctx, query, limit, offset)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    users := make([]*User, 0)
    for rows.Next() {
        user := &User{}
        if err := rows.Scan(&user.ID, &user.Email, &user.Name, &user.CreatedAt); err != nil {
            return nil, err
        }
        users = append(users, user)
    }
    
    return users, rows.Err()
}

// Usage with context timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

user, err := repo.GetByID(ctx, userID)
```
