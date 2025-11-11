---
id: rust-project-structure
category: pattern
tags: [rust, architecture, project-structure, modules, organization]
capabilities:
  - Project organization patterns
  - Module structure best practices
  - Binary and library layout
  - Workspace organization
useWhen:
  - Greenfield Rust project initialization requiring library/binary layout decisions and module organization patterns
  - Large Rust application architecture needing layered structure with domain, service, storage, and API separation
  - Multi-crate workspace organization requiring core library, API server, CLI tool, and shared utilities coordination
  - Public Rust library design requiring clear public API boundaries, re-exports, prelude modules, and documentation standards
  - Feature-based or layered architecture decisions for 10K+ line Rust codebases with multiple team contributors
estimatedTokens: 560
---

# Rust Project Structure Patterns

## Library Project Layout

```
my-lib/
├── Cargo.toml
├── src/
│   ├── lib.rs              # Library root
│   ├── error.rs            # Error types
│   ├── config.rs           # Configuration
│   ├── models/             # Domain models
│   │   ├── mod.rs
│   │   ├── user.rs
│   │   └── account.rs
│   ├── services/           # Business logic
│   │   ├── mod.rs
│   │   └── auth.rs
│   └── utils/              # Utilities
│       ├── mod.rs
│       └── validation.rs
├── tests/
│   ├── integration_test.rs
│   └── common/
│       └── mod.rs
├── benches/
│   └── benchmarks.rs
└── examples/
    └── basic_usage.rs
```

## Binary Project Layout

```
my-app/
├── Cargo.toml
├── src/
│   ├── main.rs             # Entry point
│   ├── lib.rs              # Shared library (optional)
│   ├── cli/                # CLI handling
│   │   ├── mod.rs
│   │   └── commands.rs
│   ├── api/                # API layer
│   │   ├── mod.rs
│   │   ├── routes.rs
│   │   └── handlers.rs
│   ├── db/                 # Database
│   │   ├── mod.rs
│   │   └── schema.rs
│   └── config.rs
├── tests/
└── examples/
```

## Workspace Layout

```
my-workspace/
├── Cargo.toml              # Workspace root
├── crates/
│   ├── core/               # Core library
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── api/                # API server
│   │   ├── Cargo.toml
│   │   └── src/
│   ├── cli/                # CLI tool
│   │   ├── Cargo.toml
│   │   └── src/
│   └── common/             # Shared utilities
│       ├── Cargo.toml
│       └── src/
├── tests/                  # Workspace-level tests
└── docs/
```

## Module Organization

**lib.rs pattern:**
```rust
// src/lib.rs
#![warn(missing_docs)]

pub mod config;
pub mod error;
pub mod models;
pub mod services;

mod utils; // Private module

// Re-exports for convenience
pub use error::{Error, Result};
pub use config::Config;

/// Prelude module for common imports
pub mod prelude {
    pub use crate::error::{Error, Result};
    pub use crate::config::Config;
}
```

**Module file organization:**
```rust
// src/models/mod.rs
mod user;
mod account;

pub use user::User;
pub use account::Account;

// src/models/user.rs
use crate::error::Result;

pub struct User {
    // fields
}

impl User {
    pub fn new() -> Result<Self> {
        // implementation
    }
}
```

## Layered Architecture

```rust
// src/lib.rs - Layers from bottom to top
pub mod domain;     // Domain models, business rules
pub mod storage;    // Data persistence
pub mod service;    // Business logic
pub mod api;        // HTTP/API layer
pub mod cli;        // CLI interface

// Dependencies flow: cli/api → service → storage → domain
```

**Domain layer:**
```rust
// src/domain/user.rs
pub struct User {
    id: UserId,
    email: Email,
}

// No dependencies on other layers
```

**Service layer:**
```rust
// src/service/user.rs
use crate::domain::User;
use crate::storage::UserRepository;

pub struct UserService<R: UserRepository> {
    repo: R,
}

impl<R: UserRepository> UserService<R> {
    pub async fn create_user(&self, email: String) -> Result<User> {
        // Business logic
        self.repo.save(user).await
    }
}
```

## Feature Organization

**Feature-based structure:**
```
src/
├── lib.rs
├── users/
│   ├── mod.rs
│   ├── model.rs
│   ├── service.rs
│   ├── repository.rs
│   └── handlers.rs
├── posts/
│   ├── mod.rs
│   ├── model.rs
│   └── ...
└── auth/
    └── ...
```

## Configuration Files

```
my-project/
├── .cargo/
│   └── config.toml         # Build configuration
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── Cargo.toml
├── Cargo.lock              # Commit for binaries
├── README.md
├── LICENSE
├── rustfmt.toml            # Code formatting
├── clippy.toml             # Linter config
└── deny.toml               # cargo-deny config
```

## Best Practices

✅ **Separate concerns:** Domain, service, storage layers
✅ **Small modules:** < 500 lines per file
✅ **Clear boundaries:** Public vs private APIs
✅ **Re-export strategically:** Flatten deeply nested modules
✅ **Use prelude:** Common imports in one place
✅ **Document public API:** All pub items should have docs
✅ **Feature-based or layered:** Choose one, be consistent

❌ **Don't:** Put everything in lib.rs or main.rs
❌ **Don't:** Create circular dependencies between modules
❌ **Don't:** Mix layers (domain shouldn't depend on API)
❌ **Don't:** Make everything public
