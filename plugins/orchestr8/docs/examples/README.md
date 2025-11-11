# Orchestr8 Usage Examples

> **Practical examples of using Orchestr8 MCP for development workflows**

This section provides real-world examples of using Orchestr8 workflows and resources to solve common development tasks.

## Overview

Examples are organized into two categories:

- **[Basic Usage](./basic-usage.md)** - Common scenarios and simple patterns
- **[Advanced Usage](./advanced-usage.md)** - Complex queries, optimization, and integration

## Quick Examples

### Example 1: Start a New TypeScript API Project

```bash
/orchestr8:new-project Build a TypeScript REST API with JWT authentication and PostgreSQL

# The workflow will:
# 1. Load TypeScript agent + API patterns
# 2. Set up project structure
# 3. Implement auth endpoints
# 4. Add database integration
# 5. Write tests
# 6. Provide deployment guidance
```

### Example 2: Add Authentication to Existing App

```bash
/orchestr8:add-feature Add JWT authentication with refresh tokens

# The workflow will:
# 1. Analyze your existing codebase
# 2. Design auth to fit your architecture
# 3. Implement auth endpoints + middleware
# 4. Add tests for auth flows
# 5. Integrate with existing routes
```

### Example 3: Find Testing Patterns

```
# Discover available resources
orchestr8://match?query=testing+unit+integration&mode=catalog&maxResults=10

# Review results, then load specific
orchestr8://skills/_fragments/testing-integration
```

### Example 4: Load Specific Expertise

```
# TypeScript type system expertise
orchestr8://agents/_fragments/typescript-core

# Error handling patterns
orchestr8://skills/_fragments/error-handling-resilience

# JWT authentication example
orchestr8://examples/_fragments/express-jwt-auth
```

### Example 5: Fast Pattern Lookup

```
# Use index for speed
orchestr8://match?query=retry+exponential+backoff&mode=index&maxResults=5

# Result in <10ms, 50-120 tokens
```

## Example Categories

### Basic Examples

**[Basic Usage Guide](./basic-usage.md)** covers:

- Loading specific agents and skills
- Using fuzzy matching for discovery
- Loading code examples
- Combining multiple resources
- Using catalog mode
- Running simple workflows

**Best for:**
- Getting started with Orchestr8
- Learning core concepts
- Common daily tasks
- Simple queries

### Advanced Examples

**[Advanced Usage Guide](./advanced-usage.md)** covers:

- Complex query patterns
- Token budget optimization
- Cross-category matching
- Index-based lookup strategies
- Custom integration scenarios
- Performance optimization
- Production usage patterns

**Best for:**
- Power users
- Complex projects
- Performance optimization
- Production deployments
- Custom integrations

## Common Scenarios

### Scenario: Starting a New Project

**Goal:** Build a new TypeScript REST API with authentication

**Approach:**
```bash
# Use new-project workflow
/orchestr8:new-project Build a TypeScript REST API with JWT auth, PostgreSQL, and Docker

# Workflow loads:
# - TypeScript developer agent
# - REST API patterns
# - JWT authentication examples
# - PostgreSQL integration guides
# - Docker configuration examples

# Result: Complete project setup with guidance
```

See [Basic Usage - New Project](./basic-usage.md#new-project-workflow) for details.

---

### Scenario: Adding a Feature

**Goal:** Add user profile management to existing app

**Approach:**
```bash
# Use add-feature workflow
/orchestr8:add-feature Add user profile management with avatar upload

# Workflow:
# 1. Analyzes codebase
# 2. Designs feature integration
# 3. Implements backend + frontend + tests
# 4. Provides deployment steps

# Result: Feature implemented with tests
```

See [Basic Usage - Add Feature](./basic-usage.md#add-feature-workflow) for details.

---

### Scenario: Debugging Production Issue

**Goal:** Fix API timeouts under high load

**Approach:**
```bash
# Use fix-bug workflow
/orchestr8:fix-bug API timeouts under high load

# Workflow:
# 1. Investigates timeout causes
# 2. Loads performance optimization patterns
# 3. Implements fixes (caching, connection pooling)
# 4. Adds monitoring
# 5. Validates solution

# Result: Performance improvements with monitoring
```

See [Basic Usage - Fix Bug](./basic-usage.md#fix-bug-workflow) for details.

---

### Scenario: Finding Specific Pattern

**Goal:** Find circuit breaker pattern for microservices

**Approach:**
```
# Step 1: Fast lookup with index
orchestr8://match?query=circuit+breaker+resilience&mode=index&maxResults=5

# Step 2: Review results
# - error-handling-resilience (Score: 95)
# - microservices-patterns (Score: 82)

# Step 3: Load specific resource
orchestr8://skills/_fragments/error-handling-resilience
```

See [Advanced Usage - Index Lookup](./advanced-usage.md#index-based-lookup) for details.

---

### Scenario: Token Budget Optimization

**Goal:** Load expertise within 2000 token budget

**Approach:**
```
# Strategy 1: Catalog first (most efficient)
orchestr8://match?query=typescript+api+testing&mode=catalog

# Review (~100 tokens), then load selectively
orchestr8://agents/_fragments/typescript-core       # 650 tokens
orchestr8://skills/_fragments/api-design-rest       # 720 tokens
orchestr8://examples/_fragments/express-minimal-api # 500 tokens

# Total: 1970 tokens (within budget)
```

See [Advanced Usage - Token Optimization](./advanced-usage.md#token-budget-optimization) for details.

---

### Scenario: Cross-Category Discovery

**Goal:** Find all resources related to authentication

**Approach:**
```
# Multi-category search
orchestr8://match?query=authentication+jwt+security&categories=skills,patterns,examples&mode=catalog&maxResults=15

# Results from:
# - Skills: error-handling, api-design
# - Patterns: security-auth-jwt, microservices
# - Examples: express-jwt-auth, fastapi-oauth
```

See [Advanced Usage - Cross-Category](./advanced-usage.md#cross-category-matching) for details.

---

## Example Workflows

### Development Workflows

| Workflow | Command | Example Scenario |
|----------|---------|------------------|
| New Project | `/new-project` | Start TypeScript REST API from scratch |
| Add Feature | `/add-feature` | Add user authentication to app |
| Fix Bug | `/fix-bug` | Debug and fix login issue |
| Refactor | `/refactor` | Improve error handling in service |

See [Basic Usage - Workflows](./basic-usage.md#workflow-examples) for examples.

### Quality Workflows

| Workflow | Command | Example Scenario |
|----------|---------|------------------|
| Review Code | `/review-code` | Review authentication module |
| Security Audit | `/security-audit` | Audit API endpoints |
| Optimize Performance | `/optimize-performance` | Optimize slow database queries |

See [Basic Usage - Quality Workflows](./basic-usage.md#quality-workflows) for examples.

### Deployment Workflows

| Workflow | Command | Example Scenario |
|----------|---------|------------------|
| Deploy | `/deploy` | Deploy to production with zero downtime |
| Setup CI/CD | `/setup-cicd` | Configure GitHub Actions pipeline |

See [Basic Usage - Deployment](./basic-usage.md#deployment-workflows) for examples.

---

## Resource Loading Examples

### Static Loading

**Load known resources directly:**

```
# TypeScript core expertise
orchestr8://agents/_fragments/typescript-core

# Error handling skill
orchestr8://skills/_fragments/error-handling-resilience

# JWT authentication pattern
orchestr8://patterns/_fragments/security-auth-jwt

# Express API example
orchestr8://examples/_fragments/express-jwt-auth
```

See [Basic Usage - Static Loading](./basic-usage.md#static-resource-loading) for examples.

### Dynamic Matching

**Discover resources with queries:**

```
# Catalog mode (discovery)
orchestr8://match?query=typescript+testing&mode=catalog&maxResults=10

# Index mode (fast lookup)
orchestr8://match?query=retry+backoff&mode=index&maxResults=5

# Full mode (complete content)
orchestr8://match?query=python+async&mode=full&maxTokens=2500
```

See [Basic Usage - Dynamic Matching](./basic-usage.md#dynamic-matching) for examples.

---

## Token Budget Examples

### Quick Reference (500-1000 tokens)

```
orchestr8://agents/_fragments/typescript-core
```

**Use case:** Need quick expertise reference

### Task Context (1500-2500 tokens)

```
orchestr8://match?query=typescript+api+testing&mode=full&maxTokens=2500
```

**Use case:** Feature implementation, bug fix

### Deep Expertise (3000-5000 tokens)

```
orchestr8://match?query=microservices+kubernetes+deployment&mode=full&maxTokens=5000
```

**Use case:** Architecture design, complex system

See [Advanced Usage - Token Budgets](./advanced-usage.md#token-budget-strategies) for more.

---

## Performance Examples

### Fast Queries (<10ms)

```
# Index mode for specific keywords
orchestr8://match?query=circuit+breaker+timeout&mode=index
```

### Efficient Discovery (~100 tokens)

```
# Catalog mode for browsing
orchestr8://match?query=testing+patterns&mode=catalog&maxResults=10
```

### Progressive Loading

```
# Step 1: Core (1000 tokens)
orchestr8://agents/_fragments/typescript-core

# Step 2: Skills as needed (500 tokens)
orchestr8://skills/_fragments/api-design-rest

# Step 3: Examples if needed (800 tokens)
orchestr8://examples/_fragments/express-jwt-auth
```

See [Advanced Usage - Performance](./advanced-usage.md#performance-optimization) for more.

---

## Web UI Examples

The Web UI provides interactive testing and exploration.

**Launch:**
```bash
npm run ui
# Open http://localhost:3000
```

**Features:**
- Browse all resources by category
- Test dynamic matching queries
- View resource content
- Monitor MCP server activity

See [Web UI Documentation](../web-ui.md) for full guide.

---

## Next Steps

**New users:** Start with [Basic Usage Examples](./basic-usage.md)

**Experienced users:** Explore [Advanced Usage Examples](./advanced-usage.md)

**Interactive learning:** Try the [Web UI](../web-ui.md)

**Deep dive:** Read the [Usage Guide](../usage/README.md)

---

## Related Documentation

- [Getting Started](../getting-started.md) - Installation and setup
- [Usage Guide](../usage/README.md) - Comprehensive usage documentation
- [Workflows Guide](../usage/workflows.md) - Workflow details
- [Resources Guide](../usage/resources.md) - Resource system
- [Web UI](../web-ui.md) - Interactive dashboard

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-11
