---
id: python-fastapi-validation
category: agent
tags: [python, fastapi, pydantic, validation, schema, api, serialization]
capabilities:
  - Pydantic model validation with custom validators
  - Request/response schema design
  - Field-level and model-level validation
  - Generic response wrappers with TypeVar
useWhen:
  - Defining FastAPI request/response models using Pydantic BaseModel with Field(...) constraints like min_length, max_length, pattern, gt, ge for type-safe validation
  - Implementing complex validation logic with @field_validator for single-field rules and @model_validator(mode='after') for cross-field validation like password confirmation
  - Creating generic response wrappers using Generic[T] and TypeVar for consistent APIResponse[T] schemas across endpoints with success, data, error, and meta fields
  - Serializing SQLAlchemy ORM models to API responses with model_config from_attributes=True for automatic attribute mapping and json_schema_extra for OpenAPI examples
  - Designing request models with Literal types for enum values, field validators for business rules like stock checks, and nested model relationships for complex payloads
  - Building reusable validation patterns for email regex, alphanumeric checks, database existence validation, and constraint enforcement with descriptive ValueError messages
estimatedTokens: 650
---

# Python FastAPI Validation with Pydantic

Request/response model design, validation patterns, and schema management using Pydantic in FastAPI.

## Request Models with Validation

```python
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime

class UserBase(BaseModel):
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    username: str = Field(..., min_length=3, max_length=50)

    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v: str) -> str:
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    password_confirm: str

    @model_validator(mode='after')
    def passwords_match(self) -> 'UserCreate':
        if self.password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self
```

## Response Models

```python
class UserResponse(UserBase):
    id: int
    created_at: datetime
    is_active: bool = True

    model_config = {
        "from_attributes": True,  # For ORM models
        "json_schema_extra": {
            "example": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe",
                "created_at": "2024-01-01T00:00:00Z",
                "is_active": True
            }
        }
    }

# Usage
@app.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: int) -> UserResponse:
    user = await fetch_user(user_id)
    return user  # Automatically serialized
```

## Generic Response Wrapper

```python
from typing import Generic, TypeVar
T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: str | None = None
    meta: dict[str, Any] | None = None

@app.get("/users/{user_id}", response_model=APIResponse[UserResponse])
async def get_user(user_id: int) -> APIResponse[UserResponse]:
    user = await fetch_user(user_id)
    return APIResponse(data=user)

@app.get("/users", response_model=APIResponse[list[UserResponse]])
async def list_users() -> APIResponse[list[UserResponse]]:
    users = await fetch_all_users()
    return APIResponse(
        data=users,
        meta={"total": len(users)}
    )
```

## Advanced Validation

```python
from typing import Literal

class OrderCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=1, le=100)
    priority: Literal["low", "medium", "high"] = "medium"

    @field_validator('product_id')
    @classmethod
    async def product_exists(cls, v: int) -> int:
        # Can't use async in validators directly, but can call sync wrapper
        if not await check_product_exists(v):
            raise ValueError(f'Product {v} does not exist')
        return v

    @model_validator(mode='after')
    def check_stock(self) -> 'OrderCreate':
        # Cross-field validation
        available = get_stock(self.product_id)
        if available < self.quantity:
            raise ValueError(f'Only {available} units available')
        return self
```

## Config and Examples

```python
class ProductResponse(BaseModel):
    id: int
    name: str
    price: float = Field(..., ge=0)

    model_config = {
        "from_attributes": True,
        "str_strip_whitespace": True,  # Auto-strip strings
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "name": "Widget",
                    "price": 29.99
                }
            ]
        }
    }
```

## Best Practices

✅ Use `Field()` for constraints and documentation
✅ Implement field and model validators for complex logic
✅ Use `from_attributes=True` for ORM models
✅ Provide `json_schema_extra` with examples
✅ Create generic response wrappers for consistency
✅ Use `Literal` for enums and fixed choices

❌ Don't put business logic in validators
❌ Don't ignore validation errors
❌ Don't use overly permissive types (e.g., `Any`)
