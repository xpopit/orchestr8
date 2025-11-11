---
id: python-async-synchronization
category: agent
tags: [python, async, queue, worker-pool, lock, synchronization, concurrency]
capabilities:
  - Async queue-based worker pools
  - Producer-consumer patterns with asyncio.Queue
  - Async locking and synchronization primitives
  - Async caching with per-key locking
useWhen:
  - Building async worker pool systems with asyncio.Queue, configurable worker count, and graceful shutdown using asyncio.Event for task processing coordination
  - Implementing producer-consumer patterns with queue.task_done(), queue.join() for backpressure management, and timeout-based queue.get() for responsive workers
  - Creating async-safe caching with per-key asyncio.Lock to prevent cache stampede while maintaining double-checked locking for concurrent compute operations
  - Coordinating multiple async tasks using AsyncBarrier for synchronization points where all parties must reach a checkpoint before continuing execution
  - Designing fault-tolerant worker pools that handle exceptions per task without crashing workers, log errors, and support dynamic task submission with shutdown() method
  - Implementing master lock patterns with nested key-specific locks for fine-grained concurrency control in async cache implementations preventing global contention
estimatedTokens: 620
---

# Python Async Synchronization

Queue-based worker pools, synchronization primitives, and async-safe caching patterns.

## Async Worker Pool

```python
from asyncio import Queue, Event
from typing import Callable

class AsyncWorkerPool:
    def __init__(self, num_workers: int, handler: Callable):
        self.queue: Queue = Queue()
        self.handler = handler
        self.num_workers = num_workers
        self.shutdown_event = Event()
        self.workers: list[asyncio.Task] = []

    async def worker(self, worker_id: int) -> None:
        """Worker coroutine."""
        while not self.shutdown_event.is_set():
            try:
                # Wait for work with timeout to check shutdown
                task = await asyncio.wait_for(
                    self.queue.get(),
                    timeout=1.0
                )
                await self.handler(task)
                self.queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as exc:
                logger.error(f"Worker {worker_id} error: {exc}")

    async def start(self) -> None:
        """Start worker pool."""
        self.workers = [
            asyncio.create_task(self.worker(i))
            for i in range(self.num_workers)
        ]

    async def submit(self, task: Any) -> None:
        """Submit task to queue."""
        await self.queue.put(task)

    async def shutdown(self, wait: bool = True) -> None:
        """Shutdown worker pool."""
        if wait:
            await self.queue.join()  # Wait for all tasks

        self.shutdown_event.set()
        await asyncio.gather(*self.workers, return_exceptions=True)

# Usage
async def process_item(item: dict) -> None:
    await asyncio.sleep(0.1)  # Simulate work
    print(f"Processed: {item}")

pool = AsyncWorkerPool(num_workers=5, handler=process_item)
await pool.start()

for i in range(100):
    await pool.submit({"id": i})

await pool.shutdown()
```

## Async Cache with Per-Key Locking

```python
class AsyncCache:
    def __init__(self):
        self.cache: dict[str, Any] = {}
        self.locks: dict[str, asyncio.Lock] = {}
        self.master_lock = asyncio.Lock()

    async def get_or_compute(
        self,
        key: str,
        compute_func: Callable[[], Coroutine[Any, Any, T]]
    ) -> T:
        """Get from cache or compute with per-key locking."""
        # Fast path: check cache without lock
        if key in self.cache:
            return self.cache[key]

        # Get or create lock for this key
        async with self.master_lock:
            if key not in self.locks:
                self.locks[key] = asyncio.Lock()
            lock = self.locks[key]

        # Compute with key-specific lock
        async with lock:
            # Double-check cache (another coroutine might have computed it)
            if key in self.cache:
                return self.cache[key]

            value = await compute_func()
            self.cache[key] = value
            return value

# Usage
cache = AsyncCache()
result = await cache.get_or_compute(
    "user:123",
    lambda: fetch_user("123")
)
```

## Async Barrier

```python
class AsyncBarrier:
    def __init__(self, parties: int):
        self.parties = parties
        self.count = 0
        self.condition = asyncio.Condition()

    async def wait(self) -> None:
        """Wait for all parties to arrive."""
        async with self.condition:
            self.count += 1
            if self.count == self.parties:
                self.count = 0
                self.condition.notify_all()
            else:
                await self.condition.wait()

# Usage - coordinate multiple async tasks
barrier = AsyncBarrier(parties=3)

async def worker(worker_id: int):
    print(f"Worker {worker_id} starting")
    await do_work()
    await barrier.wait()  # Wait for all workers
    print(f"Worker {worker_id} continuing")

await asyncio.gather(
    worker(1),
    worker(2),
    worker(3)
)
```

## Best Practices

✅ Use queues for producer-consumer patterns
✅ Implement graceful shutdown with events
✅ Use per-key locking for cache to avoid contention
✅ Double-check cache after acquiring lock
✅ Set timeouts on queue operations for responsiveness

❌ Don't use global locks for fine-grained operations
❌ Don't forget to call `task_done()` on queues
❌ Don't ignore exceptions in worker tasks
