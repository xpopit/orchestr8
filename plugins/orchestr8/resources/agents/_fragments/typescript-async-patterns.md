---
id: typescript-async-patterns
category: agent
tags: [typescript, async, promises, error-handling, concurrency, nodejs]
capabilities:
  - Advanced async/await patterns
  - Promise composition and control flow
  - Error handling strategies across async boundaries
  - Concurrency management and rate limiting
  - Async error propagation in layered architectures
  - Promise rejection handling and wrapper patterns
  - Timeout and cancellation patterns
useWhen:
  - Handling complex async operations in TypeScript using Promise.all for parallel execution, Promise.race for timeout patterns, and Promise.allSettled for fault-tolerant batch processing
  - Implementing error handling across async boundaries with try-catch in async functions, Promise.catch for rejection handling, and custom error types for typed exceptions
  - Managing concurrent task execution with semaphore patterns for rate limiting, queue-based processing for ordered execution, and retry logic with exponential backoff
  - Optimizing performance-critical async code through async generators for streaming data, async iterators for pagination, and memoization of promise results
  - Composing complex async workflows using async/await with sequential dependencies, Promise chaining for transformation pipelines, and async IIFE patterns
  - Building type-safe async utilities with generic Promise wrappers, timeout helpers (Promise.race with delay), and cancellation patterns using AbortController
  - Implementing try-catch error handling for async/await operations in TypeScript service layer with proper error propagation
  - Handling unhandled promise rejections in Node.js application with process-level handlers and graceful shutdown logic
  - Building async middleware wrapper for Express routes to automatically catch rejected promises and forward to error handler
  - Chaining multiple async operations with Promise.allSettled to handle partial failures in batch user notification system
  - Implementing timeout pattern with Promise.race for external API calls that may hang indefinitely
  - Creating async error propagation strategy across controller, service, and repository layers with context-aware error messages
estimatedTokens: 950
---

# TypeScript Async Patterns

## Promise Combinators

**Parallel execution with typed results:**
```typescript
// All or nothing
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments()
]) // Typed tuple: [User[], Post[], Comment[]]

// Race to completion
const result = await Promise.race([
  fetchFromCache(),
  fetchFromAPI()
]) // Type is union of return types

// All settled - continue regardless of failures
const results = await Promise.allSettled([
  fetchUsers(),
  fetchPosts()
])
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value)
  else console.error(r.reason)
})

// First successful result
const data = await Promise.any([
  fetchFromPrimary(),
  fetchFromBackup(),
  fetchFromCache()
]) // Throws AggregateError if all fail
```

## Custom Promise Utilities

**Timeout wrapper:**
```typescript
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  errorMsg = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms)
    )
  ])
}

// Usage
const data = await withTimeout(fetchData(), 5000)
```

**Retry with exponential backoff:**
```typescript
async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number
    initialDelay?: number
    maxDelay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoff = 2
  } = options

  let lastError: Error
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(initialDelay * Math.pow(backoff, attempt), maxDelay)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError!
}
```

**Batch processing:**
```typescript
async function batch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  batchSize: number
): Promise<R[]> {
  const results: R[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)
  }
  
  return results
}

// Process 100 items, 10 at a time
const processed = await batch(items, processItem, 10)
```

## Error Handling Patterns

**Result type pattern:**
```typescript
type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E }

async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T>> {
  try {
    const value = await fn()
    return { success: true, value }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

// Usage - explicit error handling
const result = await safeAsync(() => fetchUser(id))
if (result.success) {
  console.log(result.value) // value is typed
} else {
  console.error(result.error) // error is typed
}
```

**Error boundary for async functions:**
```typescript
class AsyncErrorBoundary {
  private errors: Error[] = []

  async run<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn()
    } catch (err) {
      this.errors.push(err instanceof Error ? err : new Error(String(err)))
      return null
    }
  }

  getErrors() { return this.errors }
  hasErrors() { return this.errors.length > 0 }
  clear() { this.errors = [] }
}

// Usage
const boundary = new AsyncErrorBoundary()
const [users, posts] = await Promise.all([
  boundary.run(() => fetchUsers()),
  boundary.run(() => fetchPosts())
])
if (boundary.hasErrors()) {
  console.error('Some operations failed:', boundary.getErrors())
}
```

## Concurrency Control

**Semaphore for rate limiting:**
```typescript
class Semaphore {
  private current = 0
  private queue: Array<() => void> = []

  constructor(private max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++
      return
    }
    return new Promise(resolve => this.queue.push(resolve))
  }

  release(): void {
    this.current--
    const next = this.queue.shift()
    if (next) {
      this.current++
      next()
    }
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire()
    try {
      return await fn()
    } finally {
      this.release()
    }
  }
}

// Limit to 5 concurrent operations
const sem = new Semaphore(5)
const results = await Promise.all(
  items.map(item => sem.run(() => processItem(item)))
)
```

**Debounced async function:**
```typescript
function debounceAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number
): (...args: T) => Promise<R> {
  let timeoutId: NodeJS.Timeout | null = null
  let latestResolve: ((value: R) => void) | null = null
  let latestReject: ((reason: any) => void) | null = null

  return (...args: T): Promise<R> => {
    if (timeoutId) clearTimeout(timeoutId)

    return new Promise((resolve, reject) => {
      latestResolve = resolve
      latestReject = reject

      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          latestResolve?.(result)
        } catch (err) {
          latestReject?.(err)
        }
      }, delay)
    })
  }
}
```

## AbortController Integration

**Cancellable operations:**
```typescript
async function fetchWithCancel(
  url: string,
  signal: AbortSignal
): Promise<Response> {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response
}

// Usage
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000) // Cancel after 5s

try {
  const data = await fetchWithCancel('/api/data', controller.signal)
} catch (err) {
  if (err instanceof Error && err.name === 'AbortError') {
    console.log('Request cancelled')
  }
}
```

## Async Handler Wrapper for Express

**Prevent unhandled rejections in route handlers:**
```typescript
// Wrap async route handlers to avoid unhandled rejections
function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);
  res.json({ user });
}));
```

## Error Propagation in Layered Architecture

```typescript
// Service layer: throw specific errors
class UserService {
  async createUser(data: CreateUserInput): Promise<User> {
    try {
      return await this.db.user.create({ data });
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictError('Email already exists');
      }
      throw new DatabaseError('User creation failed');
    }
  }
}

// Controller layer: catch and format
async function createUserHandler(req: Request, res: Response) {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof ConflictError) {
      return res.status(409).json({ error: error.message });
    }
    if (error instanceof DatabaseError) {
      return res.status(500).json({ error: 'Database error' });
    }
    throw error; // Unknown errors go to global handler
  }
}
```

## Unhandled Rejection Handlers

```typescript
// Global handlers (setup in main.ts)
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  // Don't exit in production, log and continue
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1); // Must exit after uncaught exception
});
```

## Performance Tips

- Use `Promise.all` for independent operations
- Avoid `await` in loops - collect promises, then await all
- Leverage `Promise.allSettled` when some failures are acceptable
- Use semaphores/queues for rate-limited APIs
- AbortController for user-cancellable operations
- Consider streaming APIs for large datasets
- Always handle rejections with try-catch or .catch()
- Wrap route handlers to prevent unhandled rejections
- Log errors before re-throwing to capture context
- Set timeouts to prevent indefinite hangs
