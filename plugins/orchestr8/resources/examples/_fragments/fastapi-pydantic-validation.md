---
id: fastapi-pydantic-validation
category: example
tags: [python, fastapi, pydantic, validation]
capabilities:
  - Pydantic models
  - Custom validators
  - Response models
useWhen:
  - FastAPI applications requiring Pydantic v2 models with automatic request validation and serialization to JSON responses
  - Building REST APIs with custom validators for password complexity, email formats, and business rule enforcement
  - Python APIs needing separate schemas for create, update, and response operations with inheritance and optional fields
  - FastAPI endpoints requiring automatic OpenAPI documentation generation from Pydantic model field descriptions and constraints
  - Services needing ORM model to Pydantic response conversion with from_attributes for SQLAlchemy model serialization
  - Building type-safe APIs where Pydantic provides both runtime validation and editor autocomplete via Python type hints
estimatedTokens: 350
---

# FastAPI Pydantic Validation

```python
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @validator("password")
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Must contain uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Must contain digit")
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    data: list[UserResponse]
    meta: dict

# Usage
@app.post("/users", response_model=UserResponse)
async def create_user(user: UserCreate):
    # Validation happens automatically
    return await create_user_in_db(user)

@app.get("/users", response_model=PaginatedResponse)
async def list_users(page: int = 1, limit: int = 20):
    users = await get_users(page, limit)
    return {
        "data": users,
        "meta": {"page": page, "limit": limit}
    }
```
