---
id: api-documentation-patterns
category: skill
tags: [api, documentation, rest, openapi, swagger, endpoints, authentication, http, api-design, reference]
capabilities:
  - Document REST API endpoints comprehensively
  - Create OpenAPI/Swagger specifications
  - Write authentication and authorization docs
  - Provide practical API usage examples
  - Document request/response formats
  - Create API quick start guides
useWhen:
  - Documenting REST API endpoints for payment processing service with comprehensive request/response examples and error codes
  - Creating OpenAPI 3.0 specification for GraphQL federation gateway with authentication schemas and rate limiting documentation
  - Writing OAuth 2.0 authentication flow guide for third-party integrations with authorization code exchange and token refresh examples
  - Building API quick start guide for developer onboarding with curl examples achieving first successful call in under 5 minutes
  - Documenting webhook event payload schemas for real-time notification system with signature verification and retry logic
  - Generating SDK documentation from OpenAPI spec for TypeScript client library with type-safe request builders and error handling
estimatedTokens: 700
---

# API Documentation Patterns

Patterns and templates for clear, complete API documentation that developers can integrate quickly.

## Endpoint Documentation Template

```markdown
### POST /api/v1/users

Creates a new user account.

**Authentication:** Required (Bearer token)

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "name": "Alice Smith",
  "role": "developer"  // Optional: "admin" | "developer" | "viewer"
}
\`\`\`

**Response: 201 Created**
\`\`\`json
{
  "id": "usr_1234567890",
  "email": "user@example.com",
  "name": "Alice Smith",
  "role": "developer",
  "createdAt": "2025-01-15T10:30:00Z"
}
\`\`\`

**Errors:**
- `400` - Invalid email format or missing required fields
- `401` - Missing or invalid authentication token
- `409` - Email already registered

**Example:**
\`\`\`bash
curl -X POST https://api.example.com/api/v1/users \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","name":"Alice Smith"}'
\`\`\`
```

## OpenAPI/Swagger Pattern

```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
  description: Create and manage user accounts

servers:
  - url: https://api.example.com
    description: Production

paths:
  /api/v1/users:
    post:
      summary: Create user
      operationId: createUser
      tags: [Users]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            examples:
              basic:
                value:
                  email: user@example.com
                  name: Alice Smith
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Invalid input
        '409':
          description: Email already exists

components:
  schemas:
    CreateUserRequest:
      type: object
      required: [email, name]
      properties:
        email:
          type: string
          format: email
        name:
          type: string
          minLength: 1
        role:
          type: string
          enum: [admin, developer, viewer]
          default: viewer

    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        name:
          type: string
        role:
          type: string
        createdAt:
          type: string
          format: date-time

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Authentication Documentation

### Pattern 1: API Key

```markdown
## Authentication

Include your API key in the `X-API-Key` header:

\`\`\`bash
curl https://api.example.com/data \\
  -H "X-API-Key: your_api_key_here"
\`\`\`

**Get your API key:** Dashboard → Settings → API Keys

⚠️ **Keep it secret:** Never commit API keys to version control.
```

### Pattern 2: OAuth 2.0

```markdown
## OAuth 2.0 Authentication

### 1. Get Authorization Code

Redirect user to:
\`\`\`
https://auth.example.com/oauth/authorize?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=read_user write_data
\`\`\`

### 2. Exchange Code for Token

\`\`\`bash
curl -X POST https://auth.example.com/oauth/token \\
  -d "grant_type=authorization_code" \\
  -d "code=AUTHORIZATION_CODE" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "redirect_uri=YOUR_REDIRECT_URI"
\`\`\`

**Response:**
\`\`\`json
{
  "access_token": "eyJhbGc...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "def50200..."
}
\`\`\`

### 3. Use Access Token

\`\`\`bash
curl https://api.example.com/data \\
  -H "Authorization: Bearer eyJhbGc..."
\`\`\`
```

### Pattern 3: JWT Bearer Token

```markdown
## JWT Authentication

\`\`\`bash
# 1. Login to get token
curl -X POST https://api.example.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"secret"}'

# Response:
# {"token": "eyJhbGciOiJIUzI1NiIs..."}

# 2. Use token in requests
curl https://api.example.com/protected \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
\`\`\`

**Token expires:** 24 hours. Re-authenticate to get new token.
```

## Quick Start Guide Structure

```markdown
# API Quick Start

Get your first API call working in 5 minutes.

## 1. Get API Key (30 seconds)

Sign up at [dashboard.example.com](https://dashboard.example.com)
→ Copy your API key from Settings → API Keys

## 2. Make Your First Request (1 minute)

\`\`\`bash
curl https://api.example.com/v1/hello \\
  -H "X-API-Key: your_key_here"
\`\`\`

**Expected response:**
\`\`\`json
{"message": "Hello, World!", "status": "success"}
\`\`\`

## 3. Create a Resource (2 minutes)

\`\`\`bash
curl -X POST https://api.example.com/v1/items \\
  -H "X-API-Key: your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My First Item"}'
\`\`\`

## Next Steps

- [Full API Reference](#api-reference)
- [Authentication Guide](#authentication)
- [Code Examples](#examples)
```

## Error Response Format

```markdown
## Error Responses

All errors return JSON with consistent structure:

\`\`\`json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "field": "email",
    "details": {
      "provided": "not-an-email",
      "expected": "valid email address"
    }
  },
  "requestId": "req_1234567890"
}
\`\`\`

**Common Error Codes:**
- `VALIDATION_ERROR` - Invalid input data
- `AUTHENTICATION_REQUIRED` - Missing or invalid auth token
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RESOURCE_NOT_FOUND` - Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED` - Too many requests
```

## Rate Limiting Documentation

```markdown
## Rate Limits

**Free tier:** 100 requests/hour
**Pro tier:** 1000 requests/hour

**Headers in every response:**
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1642254000
\`\`\`

**Exceeded limit response: 429**
\`\`\`json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 15 minutes.",
    "retryAfter": 900
  }
}
\`\`\`

💡 **TIP:** Implement exponential backoff for retries.
```

## API Checklist

**Complete API docs include:**
- ✅ Base URL and versioning strategy
- ✅ Authentication method with examples
- ✅ All endpoints with request/response examples
- ✅ Error codes and meanings
- ✅ Rate limiting details
- ✅ Quick start guide (<5 minutes to first call)
- ✅ Pagination pattern (if applicable)
- ✅ Webhook documentation (if applicable)
- ✅ SDKs or client libraries (if available)
- ✅ Changelog for API versions
