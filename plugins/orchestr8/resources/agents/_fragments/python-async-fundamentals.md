---
id: python-async-fundamentals
category: agent
tags: [python, async, asyncio, await, timeout, retry, cancellation]
capabilities:
  - Async/await task management and cancellation
  - Timeout handling for async operations
  - Retry logic with exponential backoff
  - Graceful task cancellation patterns
useWhen:
  - Python asyncio applications requiring timeout protection using asyncio.wait_for() for network requests, database queries, or external API calls
  - Implementing exponential backoff retry logic with configurable max_retries, delay, and backoff multiplier for transient failure scenarios
  - Designing graceful task cancellation patterns using asyncio.Event signals and CancelledError exception handling with cleanup operations
  - Testing async Python code with pytest-asyncio fixtures, @pytest.mark.asyncio decorators, and asyncio.gather() for concurrent test assertions
  - Building resilient async workflows that handle TimeoutError, implement bounded retries, and provide event-based cancellation for long-running background tasks
  - Creating async task management utilities with type-annotated Coroutine, Callable, and TypeVar patterns for reusable async function wrappers
estimatedTokens: 600
---

# Python Async Fundamentals

Core asyncio patterns for task management, timeouts, retries, and cancellation in async Python applications.

## Task Management with Timeout

```python
import asyncio
from typing import Coroutine, Any, Callable

async def with_timeout(coro: Coroutine, timeout: float) -> Any:
    """Execute coroutine with timeout."""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        raise TimeoutError(f"Operation timed out after {timeout}s")

# Usage
result = await with_timeout(fetch_data(), timeout=5.0)
```

## Retry with Exponential Backoff

```python
async def run_with_retries(
    coro_func: Callable[..., Coroutine],
    max_retries: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    *args: Any,
    **kwargs: Any
) -> Any:
    """Execute coroutine with exponential backoff retries."""
    last_exception = None
    current_delay = delay

    for attempt in range(max_retries):
        try:
            return await coro_func(*args, **kwargs)
        except Exception as exc:
            last_exception = exc
            if attempt < max_retries - 1:
                await asyncio.sleep(current_delay)
                current_delay *= backoff

    raise last_exception

# Usage
result = await run_with_retries(
    fetch_user,
    max_retries=3,
    delay=1.0,
    backoff=2.0,
    user_id="123"
)
```

## Graceful Cancellation

```python
async def cancellable_task(should_cancel: asyncio.Event) -> None:
    """Task that can be gracefully cancelled."""
    try:
        while not should_cancel.is_set():
            await asyncio.sleep(1)
            # Do work
            await do_work()
    except asyncio.CancelledError:
        # Cleanup before cancellation
        await cleanup()
        raise

async def main():
    cancel_event = asyncio.Event()
    task = asyncio.create_task(cancellable_task(cancel_event))

    # Later: signal cancellation gracefully
    cancel_event.set()
    await task
```

## Testing Async Code

```python
import pytest
import pytest_asyncio

@pytest_asyncio.fixture
async def async_client():
    client = AsyncClient()
    await client.connect()
    yield client
    await client.disconnect()

@pytest.mark.asyncio
async def test_concurrent_requests(async_client):
    results = await asyncio.gather(
        async_client.get("/endpoint1"),
        async_client.get("/endpoint2"),
    )
    assert all(r.status == 200 for r in results)
```

## Best Practices

✅ Use `asyncio.wait_for()` for timeout protection
✅ Implement exponential backoff for retries
✅ Handle `CancelledError` for cleanup
✅ Use event-based cancellation for graceful shutdown
✅ Test async code with pytest-asyncio

❌ Don't ignore timeout errors
❌ Don't retry indefinitely without backoff
❌ Don't swallow `CancelledError` without cleanup
