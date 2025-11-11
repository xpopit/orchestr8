---
id: python-async-iterators
category: agent
tags: [python, async, iterator, generator, streaming, pagination, asyncio]
capabilities:
  - Async iterator and generator implementation
  - Streaming data with async iterators
  - Pagination patterns with async iteration
  - Buffered async iterators for performance
useWhen:
  - Streaming large datasets from async APIs, databases, or file systems using async generators with yield to avoid loading entire collections into memory
  - Implementing cursor-based or offset pagination over async data sources with __aiter__/__anext__ protocol for progressive data fetching
  - Building async data processing pipelines combining async_map, async_filter, and async generators for ETL workflows or data transformation chains
  - Creating buffered async iterators with asyncio.Queue and background tasks to prefetch items for improved throughput in I/O-bound operations
  - Designing memory-efficient iteration over API endpoints, database cursors, or S3 objects using AsyncIterator[T] and AsyncIterable type annotations
  - Implementing async pagination classes that yield items one-at-a-time from paginated APIs while handling page_size, offsets, and total_pages logic internally
estimatedTokens: 620
---

# Python Async Iterators & Generators

Patterns for streaming, pagination, and memory-efficient iteration over async data sources.

## Async Iterator Class

```python
from typing import AsyncIterator
from collections.abc import AsyncIterable

class AsyncPaginator:
    def __init__(self, fetcher: Callable, page_size: int = 100):
        self.fetcher = fetcher
        self.page_size = page_size

    async def __aiter__(self) -> AsyncIterator[Any]:
        offset = 0
        while True:
            items = await self.fetcher(offset, self.page_size)
            if not items:
                break
            for item in items:
                yield item
            offset += self.page_size

# Usage
async for item in AsyncPaginator(fetch_users, page_size=50):
    await process(item)
```

## Async Map and Filter

```python
from typing import TypeVar
T = TypeVar('T')
U = TypeVar('U')

async def async_map(
    iterable: AsyncIterable[T],
    func: Callable[[T], Coroutine[Any, Any, U]]
) -> AsyncIterator[U]:
    """Async map over async iterable."""
    async for item in iterable:
        yield await func(item)

async def async_filter(
    iterable: AsyncIterable[T],
    predicate: Callable[[T], Coroutine[Any, Any, bool]]
) -> AsyncIterator[T]:
    """Async filter over async iterable."""
    async for item in iterable:
        if await predicate(item):
            yield item

# Usage
users = AsyncPaginator(fetch_users)
active_users = async_filter(users, lambda u: is_active(u))
enriched = async_map(active_users, lambda u: enrich_user(u))

async for user in enriched:
    print(user)
```

## Buffered Async Iterator

```python
class BufferedAsyncIterator:
    def __init__(self, iterator: AsyncIterator[T], buffer_size: int = 10):
        self.iterator = iterator
        self.buffer: asyncio.Queue = asyncio.Queue(maxsize=buffer_size)
        self.task = None

    async def _fill_buffer(self) -> None:
        try:
            async for item in self.iterator:
                await self.buffer.put(item)
        finally:
            await self.buffer.put(None)  # Sentinel

    async def __aiter__(self) -> AsyncIterator[T]:
        self.task = asyncio.create_task(self._fill_buffer())
        return self

    async def __anext__(self) -> T:
        item = await self.buffer.get()
        if item is None:
            raise StopAsyncIteration
        return item

# Usage - pre-fetch items for better performance
async for item in BufferedAsyncIterator(data_source, buffer_size=20):
    await process(item)
```

## Async Generator Function

```python
async def fetch_events(start_date: str) -> AsyncIterator[dict]:
    """Generator that yields events progressively."""
    page = 0
    while True:
        response = await api.get_events(start_date, page=page)
        if not response['events']:
            break

        for event in response['events']:
            yield event

        page += 1
        if page >= response['total_pages']:
            break

# Usage
async for event in fetch_events("2025-01-01"):
    await handle_event(event)
```

## Best Practices

✅ Use async iterators for large datasets
✅ Implement pagination with async iteration
✅ Buffer iterators for performance optimization
✅ Use async generators for simple streaming
✅ Combine map/filter for data pipelines

❌ Don't load entire dataset into memory
❌ Don't mix sync and async iteration
❌ Don't forget to handle StopAsyncIteration
