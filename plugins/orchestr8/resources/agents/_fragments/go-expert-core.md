---
id: go-expert-core
category: agent
tags: [go, golang, concurrency, goroutines, channels, performance]
capabilities:
  - Go language fundamentals and idiomatic patterns
  - Concurrent programming with goroutines and channels
  - Error handling and panic recovery
  - Interface design and composition
  - Package organization and dependency management
useWhen:
  - Building backend services and microservices in Go leveraging goroutines for concurrent request handling, channels for inter-goroutine communication, and context for cancellation
  - Implementing idiomatic Go patterns including error handling with errors.Is/As, defer for cleanup, interface composition over inheritance, and struct embedding
  - Developing high-performance CLI tools and DevOps utilities using cobra for commands, viper for configuration, and zero-dependency binaries for easy distribution
  - Designing concurrent systems with worker pools using buffered channels, sync.WaitGroup for synchronization, and select statements for channel multiplexing
  - Managing packages and dependencies with go modules, internal packages for encapsulation, and interface-based abstractions for testability and decoupling
  - Writing production-ready Go code with table-driven tests, benchmark tests (go test -bench), profiling with pprof, and race detection (go test -race)
estimatedTokens: 650
---

# Go Expert - Core Competencies

Expert in Go (Golang) with deep knowledge of concurrency patterns, performance optimization, and idiomatic Go development.

## Core Expertise

### Language Fundamentals
- **Simple & Readable**: Go prioritizes simplicity and maintainability over complex abstractions
- **Static Typing**: Strong type system with type inference for clean, safe code
- **Composition over Inheritance**: Interfaces and embedding for flexible designs
- **Fast Compilation**: Rapid build times enable quick iteration cycles

### Concurrency Model
```go
// Goroutines - lightweight concurrent functions
go func() {
    // Concurrent execution
}()

// Channels - typed communication pipes
ch := make(chan int, 10)  // Buffered channel
ch <- value               // Send
result := <-ch            // Receive

// Select - multiplexing channel operations
select {
case msg := <-ch1:
    // Handle ch1
case ch2 <- value:
    // Send to ch2
case <-time.After(time.Second):
    // Timeout
}
```

### Error Handling
```go
// Explicit error handling - no exceptions
func doWork() (Result, error) {
    if err := validate(); err != nil {
        return Result{}, fmt.Errorf("validation failed: %w", err)
    }
    return processData()
}

// Panic/recover for unrecoverable errors
defer func() {
    if r := recover(); r != nil {
        log.Printf("Recovered from panic: %v", r)
    }
}()
```

### Interface Design
```go
// Small, focused interfaces
type Reader interface {
    Read(p []byte) (n int, err error)
}

// Implicit implementation
type FileReader struct{}

func (f *FileReader) Read(p []byte) (int, error) {
    // Implementation
}
```

## Best Practices

### Package Organization
- One package per directory
- Expose minimal public API (capital letters)
- Internal packages for code reuse without export
- Avoid circular dependencies

### Memory Management
- Value vs. pointer semantics matter
- Preallocate slices when size is known
- Use sync.Pool for frequently allocated objects
- Profile with pprof for optimization

### Testing
```go
// Table-driven tests
func TestSum(t *testing.T) {
    tests := []struct{
        name string
        a, b int
        want int
    }{
        {"positive", 1, 2, 3},
        {"negative", -1, -2, -3},
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            if got := Sum(tt.a, tt.b); got != tt.want {
                t.Errorf("got %v, want %v", got, tt.want)
            }
        })
    }
}
```

## Common Patterns

### Worker Pool
```go
func workerPool(jobs <-chan Job, results chan<- Result) {
    for w := 0; w < numWorkers; w++ {
        go func() {
            for job := range jobs {
                results <- process(job)
            }
        }()
    }
}
```

### Context for Cancellation
```go
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

select {
case result := <-doWork(ctx):
    return result
case <-ctx.Done():
    return ctx.Err()
}
```

## Tools & Ecosystem
- **go fmt**: Automatic formatting
- **go vet**: Static analysis
- **go test**: Built-in testing
- **golangci-lint**: Comprehensive linting
- **pprof**: CPU/memory profiling

## When to Choose Go
- High-performance backend services
- Distributed systems and microservices
- CLI tools (Docker, Kubernetes, Terraform)
- Network servers with many concurrent connections
- DevOps and infrastructure tools
