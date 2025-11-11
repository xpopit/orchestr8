---
id: python-fastapi-middleware
category: agent
tags: [python, fastapi, middleware, timing, logging, rate-limit, cors, starlette]
capabilities:
  - Custom middleware implementation for FastAPI
  - Request timing and logging middleware
  - Rate limiting middleware patterns
  - Request ID tracking across requests
useWhen:
  - Implementing FastAPI middleware using BaseHTTPMiddleware for cross-cutting concerns like timing, logging, rate limiting, or CORS configuration
  - Adding request/response logging with structured logging including request_id, client IP, HTTP method, URL path, and response status codes
  - Implementing rate limiting middleware using defaultdict to track per-client request timestamps with configurable calls-per-period and 429 Retry-After responses
  - Tracking requests with correlation IDs using request.state.request_id and X-Request-ID headers for distributed tracing across microservices
  - Configuring CORS middleware with CORSMiddleware for allow_origins, allow_credentials, allow_methods, and expose_headers for browser security policies
  - Understanding middleware execution order (LIFO: last added, first executed) for proper request/response processing flow and header propagation
estimatedTokens: 720
---

# Python FastAPI Middleware

Custom middleware patterns for timing, logging, rate limiting, and request tracking in FastAPI applications.

## Timing Middleware

```python
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import time

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        # Add request ID
        request.state.request_id = generate_request_id()

        response = await call_next(request)

        # Add timing header
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request.state.request_id

        return response

# Register
app.add_middleware(TimingMiddleware)
```

## Logging Middleware

```python
import logging

logger = logging.getLogger(__name__)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "request_id": getattr(request.state, "request_id", None),
                "client": request.client.host if request.client else None,
            }
        )

        try:
            response = await call_next(request)
            logger.info(
                f"Response: {response.status_code}",
                extra={"request_id": request.state.request_id}
            )
            return response
        except Exception as exc:
            logger.error(
                f"Request failed: {exc}",
                extra={"request_id": request.state.request_id},
                exc_info=True
            )
            raise

app.add_middleware(LoggingMiddleware)
```

## Rate Limiting Middleware

```python
from collections import defaultdict
from datetime import datetime, timedelta
from starlette.types import ASGIApp

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = timedelta(seconds=period)
        self.clients: dict[str, list[datetime]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        if request.client is None:
            return await call_next(request)

        client_ip = request.client.host
        now = datetime.utcnow()

        # Clean old requests
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if now - req_time < self.period
        ]

        if len(self.clients[client_ip]) >= self.calls:
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={"Retry-After": str(self.period.seconds)}
            )

        self.clients[client_ip].append(now)
        return await call_next(request)

# Register with config
app.add_middleware(RateLimitMiddleware, calls=100, period=60)
```

## CORS Middleware

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],  # Or ["*"] for all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)
```

## Middleware Ordering

```python
# Middleware executes in LIFO order (last added, first executed)
app.add_middleware(RateLimitMiddleware)  # 3rd - executes first
app.add_middleware(LoggingMiddleware)    # 2nd
app.add_middleware(TimingMiddleware)     # 1st - executes last

# Request flow: RateLimit → Logging → Timing → Endpoint
# Response flow: Endpoint → Timing → Logging → RateLimit
```

## Best Practices

✅ Add request IDs for request tracking
✅ Log both request and response
✅ Clean up rate limit data periodically
✅ Order middleware appropriately
✅ Handle exceptions in middleware

❌ Don't perform heavy operations in middleware
❌ Don't forget middleware execution order matters
❌ Don't store unlimited data in memory (rate limits)
