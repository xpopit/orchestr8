---
id: workflow-add-feature
category: pattern
tags: [workflow, feature-development, implementation, testing, integration, parallel, incremental, production-ready]
capabilities:
  - Complete feature implementation with design and testing
  - Seamless integration into existing codebase
  - Concurrent backend/frontend/test development
useWhen:
  - Feature addition workflows requiring codebase analysis, design alignment verification, implementation with tests, and integration validation
  - Existing codebase enhancement needing non-breaking changes with backward compatibility and incremental rollout strategies
estimatedTokens: 520
---

# Add Feature Pattern

**Phases:** Design (0-20%) → Implementation (20-70%) → Quality (70-90%) → Deploy (90-100%)

## Phase 1: Analysis & Design (0-20%)
- Parse requirements, define acceptance criteria
- Analyze affected components, integration points
- Design API contracts, data models, UI components
- Choose approach (new module vs extension)
- **Checkpoint:** Design approved

## Phase 2: Implementation (20-70%)
**Parallel tracks:**
- **Backend:** Schema/migrations, models, business logic, API endpoints + auth
- **Frontend:** Components, forms, state, API integration, error handling, UX
- **Tests:** Unit (80%+), integration tests (TDD - test alongside code)
- **Checkpoint:** Feature works manually, tests pass

## Phase 3: Quality Assurance (70-90%)
**Parallel tracks:**
- **Testing:** E2E for critical paths, edge cases, 80%+ coverage verified
- **Quality:** Code review, security scan (validation, auth), performance check
- **Checkpoint:** All tests pass, no critical issues

## Phase 4: Integration & Deploy (90-100%)
**Parallel tracks:**
- **Docs:** API docs, comments, changelog, migration notes
- **Deploy:** Feature flags, staging → validate → production, monitor
- **Checkpoint:** Production healthy, metrics good

## Parallelism
- **Independent:** Backend + Frontend + Tests (Phase 2), Testing + Quality (Phase 3), Docs + Deploy (Phase 4)
- **Dependencies:** Frontend integration needs backend API, E2E needs both, production needs staging validation
