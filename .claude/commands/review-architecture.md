---
description: Deep architecture review analyzing system design, patterns, scalability, technical debt, and long-term maintainability
argumentHint: "[path-to-code or 'full']"
---

# Architecture Review Workflow

You are orchestrating a comprehensive architecture review that evaluates system design, architectural patterns, scalability, security architecture, and long-term maintainability.

## Workflow Overview

This workflow provides deep architectural analysis focusing on:
1. **System Design** - Overall architecture patterns and structure
2. **Design Patterns** - SOLID principles, DRY, separation of concerns
3. **Scalability** - Horizontal/vertical scaling capabilities
4. **Security Architecture** - Defense in depth, auth/authz design
5. **Technical Debt** - Code quality, maintainability, refactoring needs
6. **Integration** - API design, coupling, cohesion
7. **Future-Proofing** - Extensibility, evolution capability

## Execution Steps

### Phase 1: Architecture Discovery & Mapping (15%)

**Understand System Structure:**

1. **Identify architecture type:**
   ```bash
   # Check project structure
   ls -la

   # Look for architectural indicators
   # Monolith: Single app directory
   # Microservices: Multiple service directories
   # Serverless: Lambda/function directories
   # Layered: Clear layer separation (controllers, services, repositories)
   ```

2. **Map components and dependencies:**
   ```bash
   # Find main entry points
   find . -name "main.*" -o -name "index.*" -o -name "app.*"

   # Identify major modules/services
   ls -d */ | grep -E "(src|lib|services|api|modules)"

   # Check dependencies
   cat package.json requirements.txt pom.xml Cargo.toml go.mod

   # Analyze import/require statements
   grep -r "import\|require\|use" --include="*.{ts,js,py,go,rs,java}"
   ```

3. **Identify key concerns:**
   - [ ] Authentication & Authorization
   - [ ] Data storage & access
   - [ ] Business logic location
   - [ ] External integrations
   - [ ] Caching strategy
   - [ ] Messaging/events
   - [ ] Deployment model

4. **Create analysis task list:**
   Use TodoWrite:
   - [ ] Analyze overall architecture pattern
   - [ ] Review design patterns & SOLID principles
   - [ ] Evaluate scalability & performance architecture
   - [ ] Assess security architecture
   - [ ] Identify technical debt & code smells
   - [ ] Review API design & integration patterns
   - [ ] Assess data architecture
   - [ ] Generate Architecture Decision Records (ADRs)
   - [ ] Create improvement roadmap

---

### Phase 2: Architecture Pattern Analysis (15%)

**Invoke `architect` agent for pattern evaluation:**

```
Use Task tool to invoke architect with:
- Scope: Full codebase or specified path
- Focus: Architecture pattern identification and evaluation
- Output: Architecture pattern analysis
```

**Evaluate:**

1. **Current Architecture Pattern:**
   - Monolithic
   - Microservices
   - Serverless
   - Layered (N-tier)
   - Clean Architecture / Hexagonal
   - Event-Driven
   - CQRS
   - Hybrid

2. **Pattern Appropriateness:**
   - ✅ Fits requirements
   - ⚠️ Suboptimal but workable
   - ❌ Wrong pattern for use case

3. **Architecture Violations:**
   - Layer violations (e.g., UI calling database directly)
   - Circular dependencies
   - Tight coupling
   - Missing abstractions
   - Dependency direction violations

**Output:**
```markdown
## Architecture Pattern Analysis

**Current Pattern:** [Pattern Name]

**Assessment:** [Appropriate ✅ | Needs Improvement ⚠️ | Wrong Pattern ❌]

**Strengths:**
- [What works well]

**Weaknesses:**
- [What doesn't work]

**Violations Found:**
- [Specific violations with file references]

**Recommendation:**
[Keep current / Migrate to X / Refactor to fix violations]
```

---

### Phase 3: Design Patterns & Principles Review (15%)

**Invoke `architect` + `code-reviewer` for SOLID analysis:**

```
Run in parallel:
1. architect: Design pattern identification
2. code-reviewer: SOLID principles validation
```

**Evaluate:**

### SOLID Principles

**Single Responsibility Principle (SRP):**
```
Check for:
- Classes/modules doing too much (God classes)
- Multiple reasons to change
- Mixed concerns

Example violation:
class UserController {
  authenticateUser()    // Auth concern
  saveToDatabase()      // Persistence concern
  sendEmail()           // Notification concern
  logActivity()         // Logging concern
}
```

**Open/Closed Principle (OCP):**
```
Check for:
- Code that requires modification for extension
- Missing abstractions
- Hardcoded logic that should be pluggable

Example violation:
if (paymentType === 'credit_card') {
  // credit card logic
} else if (paymentType === 'paypal') {
  // paypal logic
}
// Adding new payment type requires modifying this function
```

**Liskov Substitution Principle (LSP):**
```
Check for:
- Derived classes breaking contracts
- Overridden methods changing behavior unexpectedly
- Instanceof checks instead of polymorphism
```

**Interface Segregation Principle (ISP):**
```
Check for:
- Fat interfaces (too many methods)
- Clients forced to depend on unused methods
- Missing interface decomposition
```

**Dependency Inversion Principle (DIP):**
```
Check for:
- High-level modules depending on low-level modules
- Concrete dependencies instead of abstractions
- Missing dependency injection
```

### Common Design Patterns

**Check usage and appropriateness:**
- **Creational:** Factory, Builder, Singleton
- **Structural:** Adapter, Decorator, Facade
- **Behavioral:** Strategy, Observer, Command

**Output:**
```markdown
## Design Patterns & Principles

### SOLID Compliance: [Score/5]

**Violations Found:**

#### 1. SRP Violation - UserController (High Priority)
**File:** `src/controllers/UserController.ts`
**Problem:** Class has 8 responsibilities (auth, CRUD, email, logging)
**Impact:** Hard to test, changes ripple, difficult to understand
**Fix:** Split into:
- UserAuthController
- UserCRUDController
- UserNotificationService
- AuditLogger

---

### Design Patterns Used:

✅ **Well Applied:**
- Factory Pattern: `src/factories/PaymentFactory.ts` (Good abstraction)
- Repository Pattern: `src/repositories/*` (Clean data access)

⚠️ **Needs Improvement:**
- Singleton overuse: 12 singletons found (consider DI instead)

❌ **Anti-Patterns:**
- God Class: `UserController.ts` (600 lines, 25 methods)
- Leaky Abstraction: Repository exposing ORM details
```

---

### Phase 4: Scalability & Performance Architecture (15%)

**Evaluate scalability design:**

```
Use Task tool to invoke architect with performance focus
```

**Analyze:**

### Scalability Dimensions

1. **Horizontal Scalability:**
   ```
   Can we add more servers?
   - [ ] Stateless design (no server affinity)
   - [ ] Load balancer friendly
   - [ ] Shared session storage (Redis)
   - [ ] Database connection pooling
   - [ ] No local file storage
   ```

2. **Vertical Scalability:**
   ```
   Can we add more resources to servers?
   - [ ] Efficient resource usage
   - [ ] No memory leaks
   - [ ] Configurable resource limits
   - [ ] Graceful degradation under load
   ```

3. **Database Scalability:**
   ```
   - [ ] Read replicas possible
   - [ ] Sharding strategy defined
   - [ ] Proper indexing
   - [ ] Query optimization
   - [ ] Connection pooling
   ```

4. **Caching Strategy:**
   ```
   Evaluate:
   - [ ] Cache layers defined (browser, CDN, app, DB)
   - [ ] Cache invalidation strategy
   - [ ] Appropriate cache TTLs
   - [ ] Cache hit/miss monitoring
   ```

5. **Async Processing:**
   ```
   - [ ] Background jobs for expensive operations
   - [ ] Message queue for async workflows
   - [ ] Event-driven architecture where appropriate
   - [ ] Job retry and error handling
   ```

**Output:**
```markdown
## Scalability Architecture

### Horizontal Scalability: [Good ✅ | Partial ⚠️ | Poor ❌]

**Assessment:** ⚠️ Partial - Mostly stateless but session issues

**Issues:**
- ❌ Sessions stored in-memory (server affinity required)
- ⚠️ File uploads saved to local disk
- ✅ Database uses connection pooling
- ✅ No global state in application

**Recommendations:**
1. Migrate sessions to Redis (HIGH PRIORITY)
2. Use S3/object storage for file uploads
3. Implement health check endpoint

---

### Caching Strategy: ❌ Poor

**Current State:**
- No application-level caching
- Database query cache only
- No CDN for static assets

**Impact:**
- Unnecessary database load
- Slow response times for repeated queries
- High bandwidth costs

**Recommendations:**
1. Add Redis for application cache (HIGH PRIORITY)
2. Implement CDN for static assets (MEDIUM)
3. Add HTTP caching headers (LOW)
```

---

### Phase 5: Security Architecture Review (15%)

**Invoke `security-auditor` + `architect` for security design:**

```
Run in parallel:
1. security-auditor: Vulnerability and security best practices
2. architect: Security architecture design
```

**Evaluate:**

### Defense in Depth

1. **Network Security:**
   ```
   - [ ] Firewall rules defined
   - [ ] Network segmentation
   - [ ] Private subnets for databases
   - [ ] VPN for internal access
   - [ ] DDoS protection
   ```

2. **Application Security:**
   ```
   - [ ] Input validation at boundaries
   - [ ] Output encoding
   - [ ] Authentication required for protected resources
   - [ ] Authorization checked for actions
   - [ ] CSRF protection
   - [ ] Security headers configured
   ```

3. **Data Security:**
   ```
   - [ ] Encryption at rest (database, files)
   - [ ] Encryption in transit (TLS 1.3)
   - [ ] Secrets management (Vault, AWS Secrets Manager)
   - [ ] PII protection and minimization
   - [ ] Secure key storage
   ```

### Authentication & Authorization Architecture

```
Evaluate:
- [ ] Centralized auth (not scattered)
- [ ] Token-based (JWT) or session-based
- [ ] Refresh token rotation
- [ ] MFA support
- [ ] RBAC or ABAC model
- [ ] Principle of least privilege
```

**Output:**
```markdown
## Security Architecture

### Defense in Depth: ⚠️ Partial

**Layer Analysis:**

**Network:** ✅ Good
- Firewall configured
- Private subnets for DB
- TLS enforced

**Application:** ⚠️ Needs Improvement
- ❌ Input validation inconsistent
- ⚠️ CSRF protection missing on state-changing endpoints
- ✅ Authentication centralized
- ⚠️ Authorization scattered (not in middleware)

**Data:** ❌ Poor
- ❌ No encryption at rest for database
- ❌ Secrets in environment variables (not secrets manager)
- ✅ TLS 1.3 enforced
- ⚠️ PII not encrypted separately

---

### Authentication Architecture: ✅ Good

**Pattern:** JWT with refresh tokens

**Strengths:**
- Centralized auth service
- Proper token expiration (15 min access, 7 day refresh)
- Secure token storage

**Weaknesses:**
- No MFA support
- Weak password policy (min 6 chars)
- No account lockout

**Recommendations:**
1. Add MFA (HIGH PRIORITY)
2. Strengthen password policy: min 12 chars, complexity (HIGH)
3. Implement account lockout after 5 failed attempts (MEDIUM)
```

---

### Phase 6: Technical Debt & Code Quality (10%)

**Assess maintainability and technical debt:**

```
Use Task tool to invoke code-reviewer with tech debt focus
```

**Analyze:**

1. **Code Smells:**
   ```
   - God classes (>500 lines)
   - Long methods (>50 lines)
   - High cyclomatic complexity (>10)
   - Duplicate code
   - Deep nesting (>4 levels)
   - Magic numbers
   - Dead code
   ```

2. **Structural Issues:**
   ```
   - Circular dependencies
   - Tight coupling
   - Missing tests
   - Low cohesion
   - Inappropriate intimacy
   ```

3. **Documentation Debt:**
   ```
   - Missing README
   - No architecture docs
   - Uncommented complex logic
   - No API documentation
   - Missing ADRs
   ```

**Output:**
```markdown
## Technical Debt Assessment

**Overall Debt Level:** [Low | Medium | High | Critical]

**Debt Score:** 6.5/10 (High)

### High-Impact Debt (Fix Soon)

**1. God Class - UserService**
- **File:** `src/services/UserService.ts`
- **Size:** 1,200 lines, 45 methods
- **Impact:** Hard to test, understand, modify
- **Effort:** 3 days
- **Benefit:** Improved maintainability, testability

**2. Missing Tests**
- **Coverage:** 45% (target: 80%)
- **Critical paths:** Payment processing not tested
- **Impact:** High risk of regressions
- **Effort:** 5 days
- **Benefit:** Confidence in changes, fewer bugs

---

### Medium-Impact Debt (Plan to Fix)

**3. Duplicate Code**
- **Instances:** 25 code duplicates found
- **Impact:** Inconsistent behavior, maintenance burden
- **Effort:** 2 days
- **Benefit:** Single source of truth, easier updates

---

### Documentation Debt

- ❌ No architecture documentation
- ❌ No ADRs for key decisions
- ⚠️ API partially documented
- ✅ README exists but minimal

**Recommendation:** Invest 3 days in documentation
```

---

### Phase 7: API Design & Integration Review (10%)

**Evaluate API and integration architecture:**

```
Use Task tool to invoke appropriate specialist:
- graphql-specialist (if GraphQL)
- grpc-specialist (if gRPC)
- openapi-specialist (if REST)
```

**Analyze:**

### REST API Design (if applicable)

1. **RESTful Principles:**
   ```
   - [ ] Resource-based URLs (/users/123, not /getUser?id=123)
   - [ ] HTTP methods used correctly (GET, POST, PUT, DELETE, PATCH)
   - [ ] HTTP status codes appropriate
   - [ ] Stateless interactions
   - [ ] Hypermedia (HATEOAS) if applicable
   ```

2. **API Best Practices:**
   ```
   - [ ] Versioning (/v1/users)
   - [ ] Pagination for collections
   - [ ] Filtering and sorting
   - [ ] Rate limiting
   - [ ] Error responses consistent
   - [ ] API documentation (OpenAPI/Swagger)
   ```

### Integration Patterns

```
Evaluate:
- Synchronous vs Asynchronous communication
- API contracts defined
- Circuit breaker pattern (for resilience)
- Retry logic with exponential backoff
- Timeout configuration
- Graceful degradation
```

**Output:**
```markdown
## API Architecture

### REST API Design: ⚠️ Needs Improvement

**Compliance:**
- ✅ Resource-based URLs
- ✅ HTTP methods correct
- ⚠️ Status codes inconsistent (everything returns 200)
- ❌ No versioning
- ❌ No pagination (returns all results)
- ⚠️ Rate limiting only on auth endpoints

**Critical Issues:**
1. **No API Versioning** (HIGH)
   - Breaking changes will break clients
   - **Fix:** Add /v1/ prefix to all routes

2. **Missing Pagination** (HIGH)
   - `/api/users` returns 10,000 users
   - **Impact:** Timeout, memory issues
   - **Fix:** Implement limit/offset pagination

---

### Integration Resilience: ❌ Poor

**Issues:**
- No circuit breaker for external APIs
- No timeout configuration
- No retry logic
- Single point of failure (no fallback)

**Impact:**
- Cascading failures possible
- Poor user experience when services down

**Recommendations:**
1. Implement circuit breaker pattern (HIGH)
2. Add timeout configuration (HIGH)
3. Add retry with exponential backoff (MEDIUM)
4. Implement graceful degradation (MEDIUM)
```

---

### Phase 8: Data Architecture Review (5%)

**Analyze data storage and access patterns:**

**Evaluate:**

1. **Data Model:**
   ```
   - Appropriate database choice (SQL vs NoSQL)
   - Schema design (normalized vs denormalized)
   - Relationships modeled correctly
   - Constraints enforced
   - Indexes on frequently queried columns
   ```

2. **Data Access Patterns:**
   ```
   - Repository pattern used
   - ORM vs raw queries
   - N+1 query prevention
   - Query optimization
   - Caching strategy
   ```

3. **Data Migration:**
   ```
   - Migration framework used
   - Reversible migrations
   - Seed data for development
   - Version controlled
   ```

**Output:**
```markdown
## Data Architecture

**Database:** PostgreSQL (Appropriate for relational data ✅)

**Schema Design:** ⚠️ Needs Improvement

**Issues:**
- Over-normalized in some areas (too many joins)
- Missing indexes on foreign keys
- No partitioning strategy for large tables

**Recommendations:**
1. Add composite index on (user_id, created_at) for orders table
2. Consider denormalizing user data in orders for query performance
3. Plan partitioning strategy for audit_logs table (growing unbounded)
```

---

### Phase 9: Architecture Report & ADRs (10%)

**Generate comprehensive architecture review report:**

```markdown
# Architecture Review Report

**Review Date:** [Timestamp]
**Scope:** [Full System | Module Name]
**Reviewer:** architect + code-review-orchestrator

---

## Executive Summary

**Overall Architecture Health:** [Score/10]

**Pattern:** [Current architecture pattern]
**Maturity Level:** [Initial | Developing | Defined | Managed | Optimizing]

**Key Findings:**
- 🔴 Critical: X issues requiring immediate attention
- 🟠 High: Y issues to address soon
- 🟡 Medium: Z improvements recommended
- 💡 Suggestions: W optimization opportunities

---

## Architecture Scorecard

| Dimension | Score | Status |
|-----------|-------|--------|
| Architecture Pattern | 7/10 | ⚠️ Good but violations exist |
| SOLID Principles | 5/10 | ⚠️ Needs improvement |
| Scalability | 6/10 | ⚠️ Partial horizontal scaling |
| Security Architecture | 5/10 | ❌ Significant gaps |
| Technical Debt | 4/10 | ❌ High debt level |
| API Design | 6/10 | ⚠️ Needs improvement |
| Data Architecture | 7/10 | ✅ Good |
| **Overall** | **5.7/10** | **⚠️ Needs Significant Improvement** |

---

## Critical Issues (Must Address)

[Consolidated critical issues from all phases]

---

## Architecture Decision Records (Recommended)

### ADR-001: Migrate Sessions to Redis

**Status:** Proposed

**Context:**
Current in-memory session storage prevents horizontal scaling and causes user logouts during deployments.

**Decision:**
Migrate session storage to Redis cluster.

**Consequences:**
**Positive:**
- Enables horizontal scaling (no server affinity)
- Sessions persist across deployments
- Better performance with Redis

**Negative:**
- Added infrastructure dependency
- Network latency for session access (minimal)
- Migration effort: 2-3 days

**Alternatives Considered:**
- Database sessions: Too slow
- Sticky sessions: Doesn't solve deployment issue
- JWT only: Requires major auth refactor

---

### ADR-002: Implement API Versioning

**Status:** Proposed

**Context:**
Current API has no versioning. Breaking changes will break all clients.

**Decision:**
Implement URL-based versioning (/v1/, /v2/, etc.)

**Consequences:**
**Positive:**
- Can evolve API without breaking clients
- Clear deprecation path
- Industry standard practice

**Negative:**
- Maintain multiple versions temporarily
- Migration effort for existing clients

**Implementation:**
1. Add /v1/ prefix to all current routes
2. Update client libraries
3. Deprecate non-versioned routes after 6 months

---

## Improvement Roadmap

### Immediate (Next Sprint)
**Priority: CRITICAL**
- [ ] Migrate sessions to Redis (enables scaling)
- [ ] Add API versioning (prevents future breaking changes)
- [ ] Fix database encryption at rest
- [ ] Implement input validation middleware

**Effort:** 2 weeks
**Impact:** Enables scaling, security compliance

---

### Short Term (Next Quarter)
**Priority: HIGH**
- [ ] Refactor God classes (UserService, OrderController)
- [ ] Add missing tests (target 80% coverage)
- [ ] Implement circuit breaker for external APIs
- [ ] Add MFA support

**Effort:** 6 weeks
**Impact:** Reduced technical debt, improved reliability

---

### Medium Term (6 Months)
**Priority: MEDIUM**
- [ ] Implement caching strategy (Redis)
- [ ] Add CDN for static assets
- [ ] Migrate to microservices (if team grows)
- [ ] Implement CQRS for reporting

**Effort:** 3 months
**Impact:** Performance, scalability

---

### Long Term (12+ Months)
**Priority: LOW**
- [ ] Consider event-driven architecture
- [ ] Implement GraphQL federation
- [ ] Migrate to serverless for compute-intensive tasks

**Effort:** 6+ months
**Impact:** Modern architecture, cost optimization

---

## Recommended Next Steps

1. **Create ADRs** for critical decisions (sessions, API versioning)
2. **Prioritize roadmap** with stakeholders
3. **Allocate resources** (20% time for technical debt)
4. **Track progress** with quarterly architecture reviews
5. **Update documentation** (architecture diagrams, decisions)

---

<sub>🤖 Generated by [orchestr8](https://github.com/seth-schultz/orchestr8) architecture review</sub>
```

---

## Success Criteria

Architecture review is complete when:
- ✅ All 8 dimensions analyzed
- ✅ SOLID principles evaluated
- ✅ Scalability assessed
- ✅ Security architecture reviewed
- ✅ Technical debt quantified
- ✅ ADRs recommended
- ✅ Improvement roadmap created
- ✅ Report generated and delivered

---

## Best Practices

### DO ✅
- Consider long-term maintainability
- Evaluate fitness for purpose
- Recommend pragmatic improvements
- Prioritize by business impact
- Document key decisions (ADRs)
- Provide clear roadmap
- Balance ideal vs practical

### DON'T ❌
- Recommend rewrite lightly
- Ignore business constraints
- Focus only on latest trends
- Forget about team capabilities
- Overwhelm with too many changes
- Skip documentation
- Pursue perfection over progress

---

## Example Usage

### Full System Review
```
/review-architecture full
```

### Module Review
```
/review-architecture src/services/payments
```

### Pre-Release Architecture Audit
```
/review-architecture --mode=pre-release
```

### Technical Debt Assessment
```
/review-architecture --focus=technical-debt
```

---

Your mission is to ensure the system architecture supports current and future business needs while maintaining quality, security, and scalability.
