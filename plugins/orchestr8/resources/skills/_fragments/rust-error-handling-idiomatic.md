---
id: rust-error-handling-idiomatic
category: skill
tags: [rust, error-handling, result, option, anyhow, thiserror]
capabilities:
  - Idiomatic Result and Option usage
  - Error propagation with ? operator
  - Custom error types with thiserror
  - Application errors with anyhow
useWhen:
  - Implementing custom error types for Rust CLI tool parsing configuration files with thiserror for structured error reporting
  - Refactoring Rust web service to use anyhow::Context for adding file path and line number context to JSON parsing errors
  - Building Rust library crate for database connection pooling with thiserror-based error types for API consumers
  - Converting Result<T, Box<dyn Error>> to idiomatic Result<T, CustomError> with proper error chain propagation using ? operator
  - Designing error handling strategy for async Rust application with nested Result types and cross-cutting error context
  - Implementing validation layer for HTTP request handlers with context-aware error messages for debugging production issues
estimatedTokens: 620
---

# Idiomatic Rust Error Handling

## Result<T, E> Pattern

**Basic Result usage:**
```rust
fn divide(a: i32, b: i32) -> Result<i32, String> {
    if b == 0 {
        Err("division by zero".to_string())
    } else {
        Ok(a / b)
    }
}

// Usage
match divide(10, 2) {
    Ok(result) => println!("Result: {}", result),
    Err(e) => eprintln!("Error: {}", e),
}
```

## Question Mark Operator (?)

**Error propagation:**
```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> io::Result<String> {
    let mut file = File::open(path)?; // propagate error
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}

// Equivalent to:
fn read_file_verbose(path: &str) -> io::Result<String> {
    let mut file = match File::open(path) {
        Ok(f) => f,
        Err(e) => return Err(e),
    };
    let mut contents = String::new();
    match file.read_to_string(&mut contents) {
        Ok(_) => Ok(contents),
        Err(e) => Err(e),
    }
}
```

## Library Errors: thiserror

**Define custom errors:**
```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DataStoreError {
    #[error("data not found: {0}")]
    NotFound(String),

    #[error("invalid data format")]
    InvalidFormat,

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error), // auto From impl

    #[error("parse error: {source}")]
    Parse {
        #[source]
        source: std::num::ParseIntError,
    },
}

fn load_data(id: &str) -> Result<Data, DataStoreError> {
    let file = std::fs::read_to_string(format!("{}.dat", id))?; // auto-converts io::Error
    let num: i32 = file.trim().parse()
        .map_err(|e| DataStoreError::Parse { source: e })?;

    if num < 0 {
        return Err(DataStoreError::InvalidFormat);
    }

    Ok(Data { value: num })
}
```

## Application Errors: anyhow

**Simplified error handling:**
```rust
use anyhow::{Context, Result};

fn process_file(path: &str) -> Result<()> {
    let content = std::fs::read_to_string(path)
        .context("failed to read input file")?;

    let parsed: Vec<i32> = content
        .lines()
        .map(|line| line.parse::<i32>())
        .collect::<Result<_, _>>()
        .context("failed to parse numbers")?;

    // anyhow::Error works with any error type
    let db = connect_db().context("database connection failed")?;

    Ok(())
}

// Use bail! for early return
use anyhow::bail;

fn validate(value: i32) -> Result<()> {
    if value < 0 {
        bail!("value must be non-negative, got {}", value);
    }
    Ok(())
}
```

## Option<T> Patterns

**Convert None to error:**
```rust
fn find_user(id: u64) -> Result<User, String> {
    users.get(&id)
        .cloned()
        .ok_or_else(|| format!("user {} not found", id))
}
```

**Chaining Options:**
```rust
fn get_nested() -> Option<i32> {
    some_map
        .get("key")?
        .nested_field?
        .value
}

// Equivalent to:
match some_map.get("key") {
    Some(v) => match v.nested_field {
        Some(n) => n.value,
        None => None,
    },
    None => None,
}
```

## Error Context Patterns

**Add context to errors:**
```rust
use anyhow::Context;

fn load_config() -> anyhow::Result<Config> {
    let path = "config.toml";

    let content = std::fs::read_to_string(path)
        .with_context(|| format!("failed to read config from {}", path))?;

    toml::from_str(&content)
        .with_context(|| format!("failed to parse config file {}", path))
}
```

## Combinators

**Transform Results:**
```rust
// map: transform Ok value
let result: Result<i32, _> = Ok(5);
let doubled = result.map(|x| x * 2); // Ok(10)

// map_err: transform Err value
let result: Result<i32, &str> = Err("oops");
let mapped = result.map_err(|e| format!("Error: {}", e));

// and_then: chain computations
fn parse_and_double(s: &str) -> Result<i32, std::num::ParseIntError> {
    s.parse::<i32>().and_then(|n| Ok(n * 2))
}

// or_else: provide fallback
let result = risky_operation().or_else(|_| fallback_operation());

// unwrap_or: default value
let value = result.unwrap_or(0);

// unwrap_or_else: computed default
let value = result.unwrap_or_else(|e| {
    eprintln!("Error: {}", e);
    0
})
```

## When to Panic

```rust
// Tests: expect failures
#[test]
#[should_panic(expected = "division by zero")]
fn test_divide_by_zero() {
    divide(10, 0).unwrap();
}

// Truly unrecoverable errors
fn initialize() {
    let config = load_config()
        .expect("FATAL: config.toml must exist");
}

// Contract violations (debug assertions)
fn get_index(slice: &[i32], idx: usize) -> i32 {
    debug_assert!(idx < slice.len(), "index out of bounds");
    slice[idx]
}
```

## Best Practices

✅ **Libraries:** Use `thiserror` for concrete error types
✅ **Applications:** Use `anyhow` for ergonomic error handling
✅ **Propagate with ?:** Avoid explicit match when possible
✅ **Add context:** Use `.context()` for error chains
✅ **Never panic in libraries:** Return Result instead
✅ **Document errors:** Specify errors in doc comments
✅ **Match exhaustively:** Handle all error cases explicitly

❌ **Don't:** Use `unwrap()` in production code
❌ **Don't:** Return `String` as error type
❌ **Don't:** Panic for recoverable errors
❌ **Don't:** Swallow errors silently (`.ok()` without reason)

## Error Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_case() {
        let result = divide(10, 0);
        assert!(result.is_err());

        match result {
            Err(e) => assert!(e.contains("zero")),
            Ok(_) => panic!("expected error"),
        }
    }

    #[test]
    fn test_error_type() -> anyhow::Result<()> {
        let result = risky_operation()?; // propagate
        assert_eq!(result, expected);
        Ok(())
    }
}
```
