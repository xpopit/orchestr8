---
id: fastapi-async-crud
category: example
tags: [python, fastapi, async, sqlalchemy, crud]
capabilities:
  - Async CRUD operations
  - SQLAlchemy async
  - Dependency injection
useWhen:
  - FastAPI applications requiring async PostgreSQL operations with SQLAlchemy 2.0 async engine and asyncpg driver
  - Building CRUD REST endpoints with FastAPI dependency injection for database session management and automatic commit/rollback
  - Python async APIs needing connection pooling with proper session lifecycle handling (acquire, commit, rollback, close)
  - FastAPI services requiring async database queries with SQLAlchemy select statements and ORM model relationships
  - Building high-concurrency Python APIs where async I/O prevents blocking during database operations
  - REST endpoints needing pagination, filtering, and CRUD operations with proper transaction management and error handling
estimatedTokens: 450
---

# FastAPI Async CRUD

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy import select
from fastapi import Depends, HTTPException

# Database setup
engine = create_async_engine("postgresql+asyncpg://user:pass@localhost/db")
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

# CRUD operations
async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

async def list_users(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()

async def create_user(db: AsyncSession, user_data: UserCreate):
    db_user = User(**user_data.dict())
    db.add(db_user)
    await db.flush()
    await db.refresh(db_user)
    return db_user

# Endpoints
@app.get("/users/{user_id}")
async def get_user_endpoint(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    user = await get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": user}

@app.post("/users", status_code=201)
async def create_user_endpoint(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    return {"data": await create_user(db, user)}
```
