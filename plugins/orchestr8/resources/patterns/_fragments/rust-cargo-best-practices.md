---
id: rust-cargo-best-practices
category: pattern
tags: [rust, cargo, dependencies, workspace, features]
capabilities:
  - Cargo workspace organization
  - Dependency management best practices
  - Feature flag patterns
  - Build optimization
useWhen:
  - Multi-crate Rust workspace setup requiring shared dependencies and consistent versioning across 3+ crates
  - Dependency management optimization needing minimal feature sets, version pinning, and security audit tooling
  - Build time optimization requiring profile tuning, incremental compilation, and parallel link configuration
  - Feature flag architecture for optional functionality with conditional compilation and no_std support
  - Production-ready Rust projects needing LTO, code stripping, and optimized release builds under 50MB
estimatedTokens: 580
---

# Rust Cargo Best Practices

## Workspace Organization

**Multi-crate workspace:**
```toml
# Cargo.toml (workspace root)
[workspace]
members = [
    "crates/core",
    "crates/api",
    "crates/cli",
]

resolver = "2" # Use new resolver

[workspace.package]
version = "0.1.0"
edition = "2021"
license = "MIT"

[workspace.dependencies]
# Shared dependencies (DRY)
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
```

**Member crate:**
```toml
# crates/api/Cargo.toml
[package]
name = "myproject-api"
version.workspace = true
edition.workspace = true

[dependencies]
tokio.workspace = true
myproject-core = { path = "../core" }
```

## Dependency Management

**Minimize dependencies:**
```toml
# ❌ BAD: Full feature set
tokio = { version = "1.35", features = ["full"] }

# ✅ GOOD: Only needed features
tokio = { version = "1.35", features = ["rt-multi-thread", "macros", "net"] }
```

**Pin versions for security:**
```toml
[dependencies]
# Specific versions for libraries
serde = "=1.0.193"

# Compatible versions for binaries
clap = "4.4"
```

**Use cargo-deny for audits:**
```bash
cargo install cargo-deny
cargo deny check advisories
cargo deny check licenses
cargo deny check bans
```

## Feature Flags

**Feature design:**
```toml
[features]
default = ["std"]
std = []
async = ["tokio"]
serde = ["dep:serde", "serde/derive"]

[dependencies]
tokio = { version = "1.35", optional = true }
serde = { version = "1.0", optional = true }
```

**Conditional compilation:**
```rust
#[cfg(feature = "async")]
pub mod async_api {
    // Async implementation
}

#[cfg(not(feature = "std"))]
use core::fmt;

#[cfg(feature = "std")]
use std::fmt;
```

## Build Optimization

**Profile configuration:**
```toml
[profile.dev]
opt-level = 0
debug = true

[profile.dev.package."*"]
opt-level = 2 # Optimize dependencies only

[profile.release]
opt-level = 3
lto = true # Link-time optimization
codegen-units = 1
strip = true # Remove debug symbols
```

**Faster incremental builds:**
```toml
# .cargo/config.toml
[build]
incremental = true

[target.x86_64-unknown-linux-gnu]
linker = "clang"
rustflags = ["-C", "link-arg=-fuse-ld=lld"]
```

## Testing Configuration

```toml
[dev-dependencies]
tokio-test = "0.4"
criterion = "0.5"

[[bench]]
name = "my_benchmark"
harness = false # Use criterion
```

## Documentation

```toml
[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]
```

```rust
#![cfg_attr(docsrs, feature(doc_cfg))]

#[cfg_attr(docsrs, doc(cfg(feature = "async")))]
pub mod async_api { }
```

## Best Practices

✅ **Use workspace dependencies:** Share versions across crates
✅ **Minimize features:** Only enable what you need
✅ **Pin security-critical deps:** Avoid unexpected breaking changes
✅ **Use cargo-deny:** Audit dependencies regularly
✅ **Optimize profiles:** Dev fast, release optimized
✅ **Document features:** Clear feature flag documentation
✅ **Version consistently:** Use workspace.package for shared metadata

❌ **Don't:** Use `features = ["full"]` in libraries
❌ **Don't:** Duplicate dependency versions across workspace
❌ **Don't:** Commit Cargo.lock for libraries (do for binaries)
❌ **Don't:** Use `*` or overly broad version ranges
