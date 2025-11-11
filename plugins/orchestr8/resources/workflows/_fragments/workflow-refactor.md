---
id: workflow-refactor
category: pattern
tags: [workflow, refactoring, code-quality, technical-debt, SOLID, continuous-testing, behavior-preservation, incremental]
capabilities:
  - Safe code refactoring with behavior preservation
  - Test-driven refactoring approach
  - Incremental transformation with continuous validation
useWhen:
  - Code quality improvement requiring behavior-preserving refactoring with comprehensive test coverage and continuous validation
  - Technical debt reduction needing SOLID principle application, design pattern introduction, and incremental transformation
  - Code simplification scenarios addressing complexity, duplication, or poor readability with extract method and extract class patterns
  - Test-driven refactoring requiring red-green-refactor cycle with legacy code characterization and seam creation
estimatedTokens: 550
---

# Refactor Code Pattern

**Core Principle:** Preserve behavior while improving structure. Never change both simultaneously.

**Phases:** Analyze (0-20%) → Test Coverage (20-40%) → Transform (40-85%) → Validate (85-100%)

## Phase 1: Analysis & Planning (0-20%)
- Analyze code smells: duplication, complexity (>10), coupling, long methods (>50 lines), deep nesting (>3 levels)
- Identify SOLID violations
- Map dependencies and usage
- Plan refactoring strategy (extract, rename, move, simplify)
- Assess risk and scope

## Phase 2: Test Coverage (20-40%)
- Check current coverage
- Add tests to achieve 80%+ coverage
- Verify tests pass consistently (green baseline)
- Create characterization tests for legacy code
- **CRITICAL:** NEVER refactor without comprehensive tests
- **Checkpoint:** 80%+ coverage, all passing

## Phase 3: Refactoring (40-85%)
**Continuous testing runs alongside transformation:**
- **Atomic commits:** (1) ONE refactoring change, (2) Run full test suite, (3) Commit if pass, (4) Repeat
- **Techniques:** Extract method/function, Rename, Move method/field, Replace conditional with polymorphism, Introduce parameter object
- **Avoid:** Large multi-pattern changes, changing behavior, refactoring without tests
- **Checkpoint:** Refactored, all tests still pass

## Phase 4: Validation & Cleanup (85-100%)
- Run full test suite (unit, integration, E2E)
- Verify metrics improved: complexity reduced, duplication eliminated, coverage maintained
- Review for missed opportunities
- Update documentation
- Clean up temporary code
- **Checkpoint:** Production-ready, behavior preserved

## Critical Safety Rules
1. **Green → Green → Green** (tests ALWAYS pass during refactoring)
2. **NOT Green → Red → Green** (that's TDD for new features)
3. **One change at a time** (atomic commits)
4. **Tests first** (80%+ coverage before starting)
5. **Behavior preservation** (zero functional changes)
