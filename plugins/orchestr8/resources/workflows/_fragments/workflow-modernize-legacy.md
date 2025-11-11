---
id: workflow-modernize-legacy
category: pattern
tags: [workflow, legacy, modernization, refactoring, migration, incremental, strangler-fig, technical-debt]
capabilities:
  - Legacy system modernization strategy
  - Incremental migration with minimal disruption
  - Risk-managed refactoring approach
useWhen:
  - Legacy codebase modernization requiring incremental migration with strangler fig pattern and minimal production disruption
  - Framework or language migration needing gradual transformation with parallel system operation and progressive traffic routing
  - Technical debt reduction requiring risk-controlled refactoring with comprehensive test coverage and rollback capability
  - Monolith decomposition scenarios needing service extraction with API facade pattern and database migration strategies
estimatedTokens: 520
---

# Legacy System Modernization Pattern

**Phases:** Audit (0-20%) → Stabilize (20-35%) → Migrate (35-80%) → Optimize (80-95%) → Retire (95-100%)

## Phase 1: Audit & Assessment (0-20%)
- Map system: dependencies, data flows, critical paths
- Identify pain points: bugs, performance, maintainability
- Document unknowns, risks, business rules
- Define modernization scope and strategy (strangler fig vs big bang)
- **Checkpoint:** Audit complete, strategy approved

## Phase 2: Stabilize & Prepare (20-35%)
**Parallel tracks:**
- **Testing:** Add characterization tests for existing behavior (regression safety)
- **Documentation:** API contracts, data schemas, business rules
- **Infrastructure:** Version control, CI/CD, deployment automation
- **Checkpoint:** Legacy system stable, testable, documented

## Phase 3: Incremental Migration (35-80%)
**Strategy:** Strangler fig pattern - new code wraps/replaces old incrementally

**Parallel tracks:**
- **New System:** Modern framework, clean architecture, best practices
- **API Layer:** Facade/proxy routes traffic between old and new
- **Data Migration:** Dual writes, sync strategies, eventual consistency
- **Feature Parity:** Migrate features one by one, validate equivalence

**Per-Feature Loop:**
1. Pick isolated feature/module
2. Build new version with tests
3. Route subset of traffic via feature flags
4. Monitor metrics (errors, performance)
5. Gradually increase traffic → 100%
6. Deprecate old code

- **Checkpoint:** 50%+ features migrated, both systems running

## Phase 4: Optimize & Harden (80-95%)
**Parallel tracks:**
- **Performance:** Remove legacy compatibility layers, optimize queries
- **Security:** Modern auth, input validation, dependency updates
- **Observability:** Logging, metrics, alerting, dashboards
- **Testing:** E2E tests, load tests, chaos engineering
- **Checkpoint:** New system performant, secure, observable

## Phase 5: Retire Legacy (95-100%)
**Parallel tracks:**
- **Traffic Migration:** Route 100% to new system
- **Data Cleanup:** Archive/migrate remaining legacy data
- **Decommission:** Remove old code, infrastructure, dependencies
- **Docs:** Migration runbook, lessons learned, new system docs
- **Checkpoint:** Legacy system fully retired

## Parallelism
- **Independent:** Testing + Docs + Infra (Phase 2), New System + API + Data (Phase 3), Performance + Security + Observability (Phase 4)
- **Dependencies:** Migration needs stable legacy, optimization needs migration complete

## Risk Management
- **Rollback Plan:** Feature flags for instant rollback
- **Monitoring:** Compare metrics old vs new continuously
- **Incremental:** Never migrate everything at once
- **Validation:** Test equivalence rigorously per feature
