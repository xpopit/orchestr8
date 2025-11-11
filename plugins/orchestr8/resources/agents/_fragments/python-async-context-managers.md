---
id: python-async-context-managers
category: agent
tags: [python, async, context-manager, resource-management, transaction, cleanup]
capabilities:
  - Async context manager implementation (__aenter__/__aexit__)
  - Transaction management with async context managers
  - Resource cleanup with asynccontextmanager decorator
  - Timeout context managers for async operations
useWhen:
  - Managing async resources like database connections, file handles, or HTTP sessions requiring __aenter__/__aexit__ implementation with guaranteed cleanup
  - Implementing database transaction patterns with automatic commit on success and rollback on exception using @asynccontextmanager decorator
  - Building async timeout context managers using asyncio.get_event_loop().call_later() for operations requiring time-bounded execution with CancelledError handling
  - Creating reusable async context managers for connection pooling, transaction boundaries, or resource lifecycle management with try-finally cleanup guarantees
  - Designing async-safe resource wrappers that prevent resource leaks in FastAPI applications, AsyncDatabase clients, or aiohttp session management
  - Combining async context managers with AsyncGenerator[T, None] type hints for proper resource typing and transaction scope management
estimatedTokens: 500
---

# Python Async Context Managers

Resource management patterns using async context managers for connections, transactions, and automatic cleanup.

## Async Context Manager Class

```python
from contextlib import asynccontextmanager
from typing import AsyncGenerator

class AsyncResource:
    async def __aenter__(self) -> 'AsyncResource':
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        await self.disconnect()

    async def connect(self) -> None:
        self.connection = await establish_connection()

    async def disconnect(self) -> None:
        if self.connection:
            await self.connection.close()

# Usage
async with AsyncResource() as resource:
    await resource.do_work()
```

## Transaction Context Manager

```python
@asynccontextmanager
async def transaction(db: AsyncDatabase) -> AsyncGenerator[AsyncTransaction, None]:
    """Async transaction context manager."""
    tx = await db.begin()
    try:
        yield tx
        await tx.commit()
    except Exception:
        await tx.rollback()
        raise
    finally:
        await tx.close()

# Usage
async with transaction(db) as tx:
    await tx.execute("INSERT INTO users ...")
    await tx.execute("UPDATE accounts ...")
# Auto-commit on success, rollback on error
```

## Timeout Context Manager

```python
@asynccontextmanager
async def timeout_context(seconds: float) -> AsyncGenerator[None, None]:
    """Context manager with timeout."""
    task = asyncio.current_task()
    handle = asyncio.get_event_loop().call_later(
        seconds,
        lambda: task.cancel() if task else None
    )
    try:
        yield
    finally:
        handle.cancel()

# Usage
try:
    async with timeout_context(5.0):
        await long_running_operation()
except asyncio.CancelledError:
    print("Operation timed out")
```

## Best Practices

✅ Always implement both `__aenter__` and `__aexit__`
✅ Use `@asynccontextmanager` for simple cases
✅ Ensure cleanup in `__aexit__` runs even on exceptions
✅ Return self from `__aenter__` when appropriate
✅ Use transactions for atomic multi-step operations

❌ Don't forget to await in `__aenter__`/`__aexit__`
❌ Don't swallow exceptions in `__aexit__`
❌ Don't mix sync and async context managers
