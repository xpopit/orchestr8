---
id: python-fastapi-error-handling
category: agent
tags: [python, fastapi, error-handling, exception, background-tasks, websocket]
capabilities:
  - Global exception handlers in FastAPI
  - Custom error responses with request context
  - Background task execution patterns
  - WebSocket connection management
useWhen:
  - Implementing global exception handlers using @app.exception_handler for RequestValidationError, IntegrityError, NoResultFound with consistent JSONResponse structure
  - Creating custom DomainException classes with message and status_code attributes for business logic errors with request_id context in error responses
  - Executing non-blocking operations with BackgroundTasks.add_task() for email sending, webhook processing, or analytics logging after response returns
  - Building WebSocket endpoints with ConnectionManager for managing active_connections Set, broadcasting messages, and handling WebSocketDisconnect exceptions gracefully
  - Designing consistent error response schemas with success, error, details, and request_id fields for 4xx/5xx HTTP status codes across all endpoints
  - Testing error handling paths with pytest and httpx.AsyncClient to verify 422 validation errors, 404 not found, and 409 conflict responses
estimatedTokens: 700
---

# Python FastAPI Error Handling & Background Tasks

Global exception handling, background task patterns, and WebSocket management in FastAPI.

## Global Exception Handlers

```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, NoResultFound

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "details": exc.errors(),
            "request_id": getattr(request.state, "request_id", None),
        },
    )

@app.exception_handler(NoResultFound)
async def not_found_handler(request: Request, exc: NoResultFound) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "success": False,
            "error": "Resource not found",
            "request_id": getattr(request.state, "request_id", None),
        },
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(
    request: Request,
    exc: IntegrityError
) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "error": "Database integrity error",
            "detail": "Resource already exists or constraint violation",
            "request_id": getattr(request.state, "request_id", None),
        },
    )
```

## Custom Exception Types

```python
class DomainException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

@app.exception_handler(DomainException)
async def domain_exception_handler(
    request: Request,
    exc: DomainException
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.message,
            "request_id": getattr(request.state, "request_id", None),
        },
    )

# Usage in endpoints
@app.post("/orders")
async def create_order(order: OrderCreate):
    if not has_sufficient_stock(order.product_id, order.quantity):
        raise DomainException("Insufficient stock", status_code=409)
    return await create_order_in_db(order)
```

## Background Tasks

```python
from fastapi import BackgroundTasks

async def send_email(email: str, message: str) -> None:
    """Async email sending."""
    await email_service.send(email, message)

async def process_webhook(webhook_data: dict) -> None:
    """Process webhook asynchronously."""
    await webhook_service.process(webhook_data)

@app.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> UserResponse:
    db_user = await create_user_in_db(db, user)

    # Send welcome email in background
    background_tasks.add_task(
        send_email,
        db_user.email,
        "Welcome to our service!"
    )

    # Log analytics event
    background_tasks.add_task(
        log_analytics,
        event="user_created",
        user_id=db_user.id
    )

    return db_user
```

## WebSocket Endpoints

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set

class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast(self, message: str) -> None:
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.broadcast(f"Client says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
```

## Testing API Error Handling

```python
from httpx import AsyncClient
import pytest

@pytest.mark.asyncio
async def test_validation_error():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/users",
            json={"email": "invalid-email"}  # Missing username
        )
        assert response.status_code == 422
        assert "Validation error" in response.json()["error"]

@pytest.mark.asyncio
async def test_not_found():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/users/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["error"].lower()
```

## Best Practices

✅ Implement global exception handlers for consistency
✅ Include request IDs in error responses
✅ Use background tasks for non-critical operations
✅ Handle WebSocket disconnections gracefully
✅ Return structured error responses
✅ Test error handling paths

❌ Don't expose internal errors to clients
❌ Don't block requests with slow background tasks
❌ Don't forget to close WebSocket connections
