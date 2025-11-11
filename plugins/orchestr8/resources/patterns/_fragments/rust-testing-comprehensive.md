---
id: rust-testing-comprehensive
category: pattern
tags: [rust, testing, unit-tests, integration-tests, property-testing]
capabilities:
  - Unit testing patterns
  - Integration testing strategies
  - Property-based testing
  - Test organization
useWhen:
  - Comprehensive Rust test suite development requiring unit tests, integration tests, and property-based testing with 80%+ coverage
  - Async Rust testing with tokio requiring multi-threaded test runtime and concurrent operation validation
  - Complex algorithmic logic testing needing proptest for property-based validation across input ranges
  - Mock-heavy scenarios requiring trait-based mocking with mockall for database and HTTP dependencies
  - CI/CD pipeline setup requiring cargo-tarpaulin or llvm-cov for automated coverage reporting and benchmarking
estimatedTokens: 620
---

# Rust Testing Comprehensive Patterns

## Unit Tests

**Basic unit test structure:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(add(2, 2), 4);
    }

    #[test]
    #[should_panic(expected = "division by zero")]
    fn test_divide_by_zero() {
        divide(10, 0);
    }

    #[test]
    fn test_with_result() -> Result<(), String> {
        let result = risky_operation()?;
        assert_eq!(result, expected);
        Ok(())
    }
}
```

**Test helpers:**
```rust
#[cfg(test)]
mod tests {
    fn setup() -> TestContext {
        TestContext::new()
    }

    #[test]
    fn test_with_context() {
        let ctx = setup();
        assert!(ctx.is_valid());
    }
}
```

## Integration Tests

**Directory structure:**
```
tests/
├── integration_test.rs
├── common/
│   └── mod.rs  # Shared test utilities
└── fixtures/
    └── test_data.json
```

**Integration test:**
```rust
// tests/integration_test.rs
use myproject;

mod common;

#[test]
fn test_end_to_end() {
    let config = common::load_test_config();
    let result = myproject::run(config);
    assert!(result.is_ok());
}
```

**Common utilities:**
```rust
// tests/common/mod.rs
use std::path::PathBuf;

pub fn fixture_path(name: &str) -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join(name)
}
```

## Async Testing

**With Tokio:**
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_async_operation() {
        let result = async_function().await;
        assert!(result.is_ok());
    }

    #[tokio::test(flavor = "multi_thread", worker_threads = 2)]
    async fn test_concurrent() {
        // Test concurrent operations
    }
}
```

## Property-Based Testing

**Using proptest:**
```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_reverse_twice(s in "\\PC*") {
        let reversed: String = s.chars().rev().collect();
        let double_reversed: String = reversed.chars().rev().collect();
        assert_eq!(s, double_reversed);
    }

    #[test]
    fn test_addition_commutative(a: i32, b: i32) {
        assert_eq!(a + b, b + a);
    }
}
```

## Benchmarking

**Using criterion:**
```rust
// benches/my_benchmark.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn fibonacci(n: u64) -> u64 {
    // Implementation
}

fn criterion_benchmark(c: &mut Criterion) {
    c.bench_function("fib 20", |b| b.iter(|| fibonacci(black_box(20))));
}

criterion_group!(benches, criterion_benchmark);
criterion_main!(benches);
```

## Mocking and Fakes

**Manual mocking:**
```rust
#[cfg(test)]
pub struct MockDatabase {
    data: HashMap<String, String>,
}

#[cfg(not(test))]
pub struct RealDatabase {
    conn: Connection,
}

trait Database {
    fn get(&self, key: &str) -> Option<String>;
}

#[cfg(test)]
impl Database for MockDatabase {
    fn get(&self, key: &str) -> Option<String> {
        self.data.get(key).cloned()
    }
}
```

**Using mockall:**
```rust
use mockall::*;

#[automock]
trait DataStore {
    fn fetch(&self, id: u64) -> Result<Data, Error>;
}

#[test]
fn test_with_mock() {
    let mut mock = MockDataStore::new();
    mock.expect_fetch()
        .with(eq(42))
        .returning(|_| Ok(Data::default()));

    assert!(process(&mock, 42).is_ok());
}
```

## Test Organization

**Feature-gated tests:**
```rust
#[cfg(all(test, feature = "expensive-tests"))]
mod expensive_tests {
    #[test]
    fn long_running_test() {
        // Only runs with --features expensive-tests
    }
}
```

**Ignored tests:**
```rust
#[test]
#[ignore]
fn expensive_test() {
    // Run with: cargo test -- --ignored
}
```

## Coverage

```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Run coverage
cargo tarpaulin --out Html --output-dir coverage

# Or with llvm-cov
cargo install cargo-llvm-cov
cargo llvm-cov --html
```

## Best Practices

✅ **Test one thing:** Each test should verify one behavior
✅ **Use descriptive names:** `test_parse_rejects_invalid_input`
✅ **Arrange-Act-Assert:** Clear test structure
✅ **Test edge cases:** Empty, zero, max, negative values
✅ **Use property testing:** For algorithms and data structures
✅ **Mock external dependencies:** Database, HTTP, filesystem
✅ **Run tests in CI:** Automated testing on every commit

❌ **Don't:** Test implementation details
❌ **Don't:** Write flaky tests (timing-dependent)
❌ **Don't:** Share mutable state between tests
❌ **Don't:** Skip error path testing
