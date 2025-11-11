---
id: python-fastapi-dependencies
category: agent
tags: [python, fastapi, dependency-injection, authentication, authorization, database]
capabilities:
  - FastAPI dependency injection system
  - Reusable authentication dependencies
  - Database session management with dependencies
  - Permission-based authorization patterns
useWhen:
  - Building FastAPI applications requiring dependency injection with Annotated[Type, Depends(func)] for database sessions, authentication, or configuration management
  - Implementing OAuth2PasswordBearer authentication dependencies with token validation, user lookup, and HTTPException raising for 401 Unauthorized responses
  - Managing SQLAlchemy AsyncSession lifecycle in FastAPI endpoints with automatic commit on success, rollback on exception, and AsyncGenerator[AsyncSession, None] pattern
  - Creating permission-based authorization using callable dependency classes with __init__ for required permissions and __call__ for runtime permission checks raising 403 Forbidden
  - Designing nested dependency chains like get_current_user → get_current_active_user → PermissionChecker for layered authentication and authorization flows
  - Building reusable dependencies for database transactions, current user extraction, rate limiting, or pagination parameters with Depends() and type safety via Annotated
estimatedTokens: 620
---

# Python FastAPI Dependency Injection

Advanced dependency injection patterns for authentication, authorization, and database management in FastAPI applications.

## Database Session Dependency

```python
from fastapi import Depends
from typing import Annotated, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

# Database session dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Usage in endpoints
@app.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    return await fetch_user(db, user_id)
```

## Authentication Dependency

```python
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """Reusable authentication dependency."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = await verify_token(token, db)
    if user is None:
        raise credentials_exception
    return user

# Usage
@app.get("/me")
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    return current_user
```

## Permission-Based Authorization

```python
class PermissionChecker:
    def __init__(self, required_permissions: list[str]):
        self.required_permissions = required_permissions

    async def __call__(
        self,
        user: Annotated[User, Depends(get_current_user)]
    ) -> User:
        for permission in self.required_permissions:
            if permission not in user.permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
        return user

# Usage
@app.post("/admin/users")
async def create_admin_user(
    user_data: UserCreate,
    current_user: Annotated[User, Depends(PermissionChecker(["admin:write"]))],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    return await create_user(db, user_data)
```

## Nested Dependencies

```python
# Chain dependencies
async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Multiple dependency layers
@app.get("/protected")
async def protected_endpoint(
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # user is authenticated, active, and has db session
    return {"user": user.email}
```

## Best Practices

✅ Use `Annotated` for type hints with dependencies
✅ Create reusable dependencies for common patterns
✅ Handle database transactions in session dependency
✅ Implement layered authorization (authentication → permissions)
✅ Use dependency injection for testability

❌ Don't create circular dependencies
❌ Don't perform heavy computation in dependencies
❌ Don't forget to handle exceptions in dependencies
