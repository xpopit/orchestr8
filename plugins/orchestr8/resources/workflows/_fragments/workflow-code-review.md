---
id: workflow-code-review
category: pattern
tags: [workflow, code-review, quality-assurance, security, best-practices, SOLID, architecture, documentation]
capabilities:
  - Comprehensive code review across multiple dimensions
  - Quality, security, performance, and architecture assessment
  - Parallel evaluation of all review areas
  - Actionable feedback with severity categorization
  - Best practices and standards enforcement
useWhen:
  - Code review workflows requiring automated linting, security scanning, test coverage verification, and human review coordination
  - Pull request validation needing code quality checks, style consistency, and architecture compliance verification
estimatedTokens: 580
---

# Code Review Pattern

**Methodology:** Overview → Multi-Dimensional Review → Report

**Scope Options:** Pull request, specific files/components, or entire codebase

## Phase Structure (0% → 100%)

### Phase 1: Overview (0-15%)
**Goals:** Understand changes and context

**Key Activities:**
- Identify changed files, lines of code, affected components
- Understand purpose and requirements addressed
- Check for breaking changes or migrations needed
- Review commit messages and PR/MR description
- Assess scope and complexity of changes

**Red Flags:**
- Large PR (>500 lines) without justification
- Mixed concerns (feature + refactor + bug fix)
- Missing tests or documentation
- Vague commit messages

**Output:** Summary of changes and areas requiring special attention

### Phase 2: Multi-Dimensional Review (15-85%)
**Goals:** Evaluate across all quality dimensions concurrently

**Parallel Tracks:**

**Track A: Code Quality (15-40%)**
- **SOLID Principles:** Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY Violations:** Code duplication, repeated logic
- **Naming Conventions:** Clear, descriptive names (avoid abbreviations, single letters except for iterators)
- **Function Size:** Functions <50 lines, methods do one thing
- **Complexity:** Cyclomatic complexity <10, nesting depth <4
- **Comments:** Explain "why" not "what", no commented-out code
- **Consistency:** Follows existing codebase patterns

**Track B: Security Review (15-45%)**
- **Input Validation:** All user input validated and sanitized
- **Injection Prevention:** SQL injection, XSS, command injection
- **Authentication:** Proper auth checks on all protected routes
- **Authorization:** RBAC/permissions enforced consistently
- **Secrets Management:** No hardcoded credentials, use env vars/vault
- **Dependencies:** No known vulnerabilities in new dependencies
- **CSRF Protection:** Anti-CSRF tokens on state-changing operations
- **Rate Limiting:** Implemented on API endpoints

**Track C: Performance (20-50%)**
- **Database Queries:** No N+1 queries, proper indexing, efficient JOINs
- **Algorithm Complexity:** O(n log n) or better for large datasets
- **Memory Management:** No memory leaks, proper resource cleanup
- **Caching:** Appropriate use of caching where beneficial
- **Bundle Size Impact:** Frontend changes don't bloat bundle unnecessarily
- **Lazy Loading:** Heavy components/routes loaded on demand

**Track D: Architecture (25-60%)**
- **Separation of Concerns:** Business logic separate from presentation
- **Dependency Management:** No circular dependencies, proper layering
- **Error Handling:** Comprehensive error handling with proper logging
- **Logging:** Structured logging at appropriate levels (debug, info, warn, error)
- **Observability:** Metrics and tracing for critical paths
- **Backwards Compatibility:** No breaking changes without migration path

**Track E: Testing (30-70%)**
- **Test Coverage:** Meets threshold (80%+) for new code
- **Unit Tests:** Business logic and utilities comprehensively tested
- **Integration Tests:** API endpoints and data flow tested
- **Edge Cases:** Boundary conditions, null/empty values, error scenarios
- **Test Quality:** Tests are maintainable, not brittle, test behavior not implementation
- **Test Naming:** Clear test names describing scenario and expected outcome

**Track F: Documentation (35-80%)**
- **API Documentation:** Public APIs documented (params, returns, errors)
- **Complex Logic:** Non-obvious code has explanatory comments
- **README Updates:** Reflects new features, setup changes
- **Migration Guides:** Breaking changes include migration instructions
- **Inline Comments:** Up-to-date, no misleading comments

**Output:** Comprehensive review findings organized by category

### Phase 3: Report & Recommendations (85-100%)
**Goals:** Deliver actionable, prioritized feedback

**Key Activities:**
- Categorize findings by severity:
  - **Critical:** Security vulnerabilities, data loss risks, breaking changes
  - **Major:** SOLID violations, missing tests, performance issues
  - **Minor:** Naming inconsistencies, missing comments
  - **Suggestion:** Optimization opportunities, alternative approaches
- Provide specific recommendations with code examples
- Link to relevant best practices, style guides, patterns
- Estimate effort for each recommendation (hours/days)
- Prioritize changes (must-fix vs nice-to-have)

**Feedback Format:**
```markdown
## Critical Issues (3)

### 1. SQL Injection Vulnerability in User Search
**File:** `src/api/users.ts:42`
**Issue:** User input directly interpolated into SQL query
**Impact:** Attacker can execute arbitrary SQL, steal data
**Fix:**
```typescript
// ❌ Vulnerable
const query = `SELECT * FROM users WHERE name = '${req.query.name}'`;

// ✅ Secure
const query = `SELECT * FROM users WHERE name = ?`;
db.query(query, [req.query.name]);
```
**Effort:** 15 minutes
**Priority:** MUST FIX before merge
```

**Output:** Structured review report with prioritized, actionable items

## Review Efficiency Tips

**Focus on high-impact areas:**
1. Security vulnerabilities (highest priority)
2. Architectural issues (expensive to fix later)
3. Missing test coverage (technical debt)
4. Performance bottlenecks
5. Code quality and maintainability

**Automate what you can:**
- Linting (ESLint, Prettier)
- Security scanning (Snyk, npm audit)
- Test coverage reporting (Jest, Coverage.py)
- Static analysis (SonarQube)

## Parallelism Strategy

**All review dimensions evaluated concurrently:**
- Quality, security, performance, architecture, testing, documentation
- Maximizes review efficiency

## Success Criteria
- All code reviewed across all dimensions
- Findings categorized by severity
- Specific, actionable recommendations provided
- Critical issues clearly identified for blocking merge
- Report delivered in structured format
