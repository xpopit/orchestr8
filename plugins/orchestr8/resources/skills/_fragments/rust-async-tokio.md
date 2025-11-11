---
id: rust-async-tokio-patterns
category: skill
tags: [rust, async, tokio, concurrency, futures, await]
capabilities:
  - Tokio async runtime patterns
  - Async/await best practices
  - Blocking operation handling
  - Channel-based communication
useWhen:
  - Building async Rust web API server with Axum handling 10k+ concurrent WebSocket connections using Tokio runtime
  - Implementing concurrent file processing pipeline with tokio::fs and spawn_blocking for CPU-intensive image transformations
  - Designing async Rust microservice with tokio::sync::mpsc channels for inter-task communication and structured concurrency with JoinSet
  - Migrating blocking database queries to async with tokio-postgres and connection pooling for improved throughput
  - Creating async Rust CLI tool with tokio::time::timeout for HTTP requests and graceful shutdown handling on SIGTERM
  - Implementing distributed task queue worker with Tokio handling async message processing from RabbitMQ with error recovery
estimatedTokens: 650
---

# Rust Async with Tokio Patterns

## Basic Async/Await

**Async functions:**
```rust
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let body = response.text().await?;
    Ok(body)
}

// Usage in async context
#[tokio::main]
async fn main() {
    match fetch_data("https://api.example.com").await {
        Ok(data) => println!("Data: {}", data),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

## Tokio Runtime

**Single-threaded runtime:**
```rust
#[tokio::main(flavor = "current_thread")]
async fn main() {
    // Runs on single thread
}
```

**Multi-threaded runtime (default):**
```rust
#[tokio::main] // defaults to multi-threaded
async fn main() {
    // Runs on thread pool
}

// Manual runtime
use tokio::runtime::Runtime;

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        // async code here
    });
}
```

## Spawning Tasks

**Spawn independent tasks:**
```rust
use tokio::task;

#[tokio::main]
async fn main() {
    let handle = task::spawn(async {
        // Runs concurrently
        expensive_operation().await
    });

    // Do other work
    other_work().await;

    // Wait for spawned task
    let result = handle.await.unwrap();
}
```

**Spawn with JoinSet (structured concurrency):**
```rust
use tokio::task::JoinSet;

async fn process_all(items: Vec<Item>) -> Vec<Result<Output>> {
    let mut set = JoinSet::new();

    for item in items {
        set.spawn(async move {
            process(item).await
        });
    }

    let mut results = vec![];
    while let Some(res) = set.join_next().await {
        results.push(res.unwrap());
    }
    results
}
```

## Handling Blocking Operations

**Never block the async runtime:**
```rust
// ❌ BAD: Blocks entire thread pool
async fn bad() {
    std::thread::sleep(Duration::from_secs(1)); // BLOCKS!
}

// ✅ GOOD: Use async sleep
async fn good() {
    tokio::time::sleep(Duration::from_secs(1)).await;
}

// ✅ GOOD: Offload blocking to thread pool
use tokio::task;

async fn read_file_blocking(path: &str) -> std::io::Result<String> {
    let path = path.to_string();

    task::spawn_blocking(move || {
        std::fs::read_to_string(path) // blocking I/O
    }).await.unwrap()
}

// ✅ GOOD: CPU-intensive work
async fn compute() -> u64 {
    task::spawn_blocking(|| {
        // Heavy computation
        (0..1_000_000).sum()
    }).await.unwrap()
}
```

## Channels for Communication

**mpsc (multi-producer, single-consumer):**
```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = mpsc::channel(100); // buffer size

    // Spawn producer
    tokio::spawn(async move {
        for i in 0..10 {
            tx.send(i).await.unwrap();
        }
    });

    // Consumer
    while let Some(msg) = rx.recv().await {
        println!("Got: {}", msg);
    }
}
```

**broadcast (multi-producer, multi-consumer):**
```rust
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel(16);

    let mut rx1 = tx.subscribe();
    let mut rx2 = tx.subscribe();

    tokio::spawn(async move {
        while let Ok(msg) = rx1.recv().await {
            println!("rx1: {}", msg);
        }
    });

    tokio::spawn(async move {
        while let Ok(msg) = rx2.recv().await {
            println!("rx2: {}", msg);
        }
    });

    tx.send("hello").unwrap();
}
```

**oneshot (single value):**
```rust
use tokio::sync::oneshot;

async fn compute_result() -> i32 { 42 }

#[tokio::main]
async fn main() {
    let (tx, rx) = oneshot::channel();

    tokio::spawn(async move {
        let result = compute_result().await;
        tx.send(result).unwrap();
    });

    let result = rx.await.unwrap();
    println!("Result: {}", result);
}
```

## Select and Race

**Select first completed:**
```rust
use tokio::select;

async fn operation_a() -> String { "A".to_string() }
async fn operation_b() -> String { "B".to_string() }

async fn first_complete() {
    select! {
        result = operation_a() => {
            println!("A finished first: {}", result);
        }
        result = operation_b() => {
            println!("B finished first: {}", result);
        }
    }
}
```

**Timeout:**
```rust
use tokio::time::{timeout, Duration};

async fn with_timeout() -> Result<String, tokio::time::error::Elapsed> {
    timeout(Duration::from_secs(5), fetch_data()).await
}
```

## Async Trait Methods

**Using async-trait:**
```rust
use async_trait::async_trait;

#[async_trait]
trait DataStore {
    async fn load(&self, key: &str) -> Result<String, Error>;
    async fn save(&self, key: &str, value: String) -> Result<(), Error>;
}

#[async_trait]
impl DataStore for MyStore {
    async fn load(&self, key: &str) -> Result<String, Error> {
        // Implementation
    }

    async fn save(&self, key: &str, value: String) -> Result<(), Error> {
        // Implementation
    }
}
```

## Error Handling in Async

**Propagate with ?:**
```rust
async fn chain_operations() -> Result<Output, Error> {
    let data = fetch_data().await?;
    let processed = process(data).await?;
    let saved = save(processed).await?;
    Ok(saved)
}
```

**Handle in spawned tasks:**
```rust
tokio::spawn(async move {
    if let Err(e) = risky_operation().await {
        eprintln!("Task failed: {}", e);
        // Handle or log error
    }
});
```

## Shared State

**Arc + Mutex:**
```rust
use std::sync::Arc;
use tokio::sync::Mutex;

#[tokio::main]
async fn main() {
    let state = Arc::new(Mutex::new(0));

    let mut handles = vec![];
    for _ in 0..10 {
        let state = Arc::clone(&state);
        handles.push(tokio::spawn(async move {
            let mut lock = state.lock().await;
            *lock += 1;
        }));
    }

    for handle in handles {
        handle.await.unwrap();
    }

    println!("Final: {}", *state.lock().await);
}
```

**RwLock for read-heavy:**
```rust
use tokio::sync::RwLock;

let data = Arc::new(RwLock::new(HashMap::new()));

// Multiple readers
let read = data.read().await;
let value = read.get(&key);

// Single writer
let mut write = data.write().await;
write.insert(key, value);
```

## Best Practices

✅ **Keep async functions lightweight:** No heavy CPU work
✅ **Use spawn_blocking:** For blocking I/O or CPU-intensive tasks
✅ **Prefer channels:** For task communication over shared state
✅ **Use timeouts:** Prevent indefinite waits
✅ **Handle errors:** Don't silently drop task errors
✅ **Structure concurrency:** Use JoinSet for managing task groups
✅ **Avoid blocking:** Use async alternatives (tokio::fs, tokio::time)

❌ **Don't:** Call `std::thread::sleep` in async code
❌ **Don't:** Use `std::sync::Mutex` (use `tokio::sync::Mutex`)
❌ **Don't:** Spawn unbounded tasks (memory leak risk)
❌ **Don't:** Ignore spawned task results (use join handles)

## When to Use Async

**Good for:**
- Web servers and network services
- I/O-bound workloads (file, network, database)
- High concurrency requirements
- Event-driven systems

**Not ideal for:**
- CPU-bound workloads (use threads)
- Simple scripts (overhead not worth it)
- When blocking is unavoidable throughout
