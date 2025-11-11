---
id: api-design-rest
category: skill
tags: [api, rest, design, http, standards]
capabilities:
  - RESTful API design principles
  - HTTP methods and status codes
  - Resource naming conventions
useWhen:
  - Designing RESTful APIs requiring proper HTTP method usage (GET, POST, PUT, PATCH, DELETE) and status codes (200, 201, 400, 404, 500)
  - Building REST endpoints with resource naming conventions using plural nouns, hyphens for multi-word resources, and nested relationships
  - Implementing API pagination, filtering, and sorting with query parameters (page, limit, sort) and meta response objects
  - Designing consistent error responses with status, message, and errors structure for validation failures and client errors
  - Building versioned APIs requiring URL versioning (v1, v2) or header-based versioning strategies for backward compatibility
  - Implementing rate limiting with X-RateLimit headers and 429 status codes for API throttling and abuse prevention
estimatedTokens: 450
---

# REST API Design Best Practices

## Resource Naming

```
# Use nouns, not verbs
✅ GET /users
✅ POST /users
❌ GET /getUsers
❌ POST /createUser

# Use plural nouns for collections
✅ GET /users
❌ GET /user

# Nested resources for relationships
✅ GET /users/123/orders
✅ GET /users/123/orders/456

# Use hyphens for multi-word resources
✅ GET /user-profiles
❌ GET /userProfiles
❌ GET /user_profiles
```

## HTTP Methods

```
GET /users          # List all users
GET /users/123      # Get specific user
POST /users         # Create new user
PUT /users/123      # Replace user (full update)
PATCH /users/123    # Partial update
DELETE /users/123   # Delete user
```

## Status Codes

```
200 OK                  # Successful GET, PUT, PATCH, DELETE
201 Created             # Successful POST (include Location header)
204 No Content          # Successful DELETE with no response body
400 Bad Request         # Invalid input/validation error
401 Unauthorized        # Missing or invalid authentication
403 Forbidden           # Valid auth but insufficient permissions
404 Not Found           # Resource doesn't exist
409 Conflict            # Duplicate resource or conflict
422 Unprocessable       # Validation errors
429 Too Many Requests   # Rate limit exceeded
500 Internal Server     # Server error
503 Service Unavailable # Temporary unavailability
```

## Request/Response Format

```json
// Request body
POST /users
{
  "email": "user@example.com",
  "name": "John Doe"
}

// Success response
201 Created
Location: /users/123
{
  "status": "success",
  "data": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-10T12:00:00Z"
  }
}

// Error response
400 Bad Request
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "email": ["Invalid email format"],
    "name": ["Name is required"]
  }
}

// List response with pagination
GET /users?page=2&limit=20
{
  "status": "success",
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

## Versioning

```
# URL versioning (most common)
GET /api/v1/users
GET /api/v2/users

# Header versioning
GET /users
Accept: application/vnd.myapi.v1+json

# Query parameter (not recommended)
GET /users?version=1
```

## Filtering, Sorting, Pagination

```
# Filtering
GET /users?role=admin&status=active

# Sorting
GET /users?sort=created_at:desc
GET /users?sort=-created_at  # - for descending

# Pagination
GET /users?page=2&limit=20
GET /users?offset=20&limit=20

# Search
GET /users?search=john
```

## Rate Limiting Headers

```
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```
