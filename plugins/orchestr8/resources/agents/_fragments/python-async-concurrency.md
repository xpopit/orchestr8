---
id: python-async-concurrency
category: agent
tags: [python, async, concurrency, gather, semaphore, parallelism, asyncio]
capabilities:
  - Concurrent execution with asyncio.gather
  - Concurrency limiting with semaphores
  - Task result collection with asyncio.wait
  - Progressive result processing with as_completed
useWhen:
  - Python applications executing multiple async operations concurrently using asyncio.gather() with return_exceptions=True for fault-tolerant batch processing
  - Implementing concurrency rate limiting with asyncio.Semaphore to prevent overwhelming external APIs, databases, or resources with configurable max concurrent operations
  - Processing async results progressively as they complete using asyncio.as_completed() with callback functions for streaming or real-time updates
  - Separating successful results from exceptions using asyncio.wait() with ALL_COMPLETED, FIRST_COMPLETED, or timeout-based task collection patterns
  - Optimizing I/O-bound operations by replacing sequential await patterns with parallel asyncio.gather() for improved throughput on independent coroutines
  - Building bounded concurrency wrappers using Semaphore context managers for scenarios like 100 requests with max 5 concurrent connections
estimatedTokens: 640
---

# Python Async Concurrency Patterns

Advanced patterns for concurrent execution, concurrency limiting, and result collection in async Python.

## Concurrent Execution with Gather

```python
from typing import Sequence, TypeVar
T = TypeVar('T')

# Basic gather
async def fetch_multiple():
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2),
        fetch_data(3)
    )
    return results

# Gather with exception handling
async def gather_with_errors():
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2),
        return_exceptions=True  # Don't fail on first error
    )
    # results may contain exceptions
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Operation failed: {result}")
```

## Concurrency Limiting with Semaphore

```python
async def gather_with_limit(
    coros: Sequence[Coroutine[Any, Any, T]],
    limit: int
) -> list[T]:
    """Execute coroutines with concurrency limit."""
    semaphore = asyncio.Semaphore(limit)

    async def bounded_coro(coro: Coroutine) -> T:
        async with semaphore:
            return await coro

    return await asyncio.gather(*[bounded_coro(c) for c in coros])

# Usage: limit to 5 concurrent requests
results = await gather_with_limit(
    [fetch_data(i) for i in range(100)],
    limit=5
)
```

## Wait with Result Separation

```python
async def wait_with_results(
    coros: Sequence[Coroutine[Any, Any, T]],
    timeout: float | None = None
) -> tuple[list[T], list[Exception]]:
    """Wait for all with separate results and exceptions."""
    tasks = [asyncio.create_task(coro) for coro in coros]
    done, pending = await asyncio.wait(
        tasks,
        timeout=timeout,
        return_when=asyncio.ALL_COMPLETED
    )

    # Cancel pending tasks
    for task in pending:
        task.cancel()

    results = []
    exceptions = []
    for task in done:
        try:
            results.append(task.result())
        except Exception as exc:
            exceptions.append(exc)

    return results, exceptions
```

## Process as Completed

```python
async def process_as_completed(
    coros: Sequence[Coroutine[Any, Any, T]],
    callback: Callable[[T], None]
) -> None:
    """Process results as they complete."""
    for coro in asyncio.as_completed(coros):
        try:
            result = await coro
            callback(result)
        except Exception as exc:
            logger.error(f"Task failed: {exc}")

# Usage
def handle_result(result):
    print(f"Processed: {result}")

await process_as_completed(
    [fetch_data(i) for i in range(10)],
    callback=handle_result
)
```

## Performance Optimization

```python
# BAD: Sequential execution
async def bad_parallel():
    result1 = await fetch_data(1)  # Waits
    result2 = await fetch_data(2)  # Then waits
    return result1, result2

# GOOD: Concurrent execution
async def good_parallel():
    results = await asyncio.gather(
        fetch_data(1),
        fetch_data(2)
    )
    return results
```

## Best Practices

✅ Use `asyncio.gather()` for concurrent execution
✅ Implement concurrency limits with semaphores
✅ Handle exceptions with `return_exceptions=True`
✅ Cancel pending tasks on timeout
✅ Process results as they complete for responsiveness

❌ Don't run async operations sequentially
❌ Don't allow unlimited concurrency
❌ Don't ignore task exceptions
