---
id: workflow-fix-bug
category: pattern
tags: [workflow, debugging, bugfix, root-cause-analysis, regression-testing, systematic, troubleshooting, quality]
capabilities:
  - Systematic bug reproduction and diagnosis
  - Root cause analysis with hypothesis testing
  - Regression test creation to prevent reoccurrence
useWhen:
  - Bug resolution workflows requiring reproduction, root cause analysis, fix implementation with tests, and regression prevention
  - Defect remediation needing error diagnosis, fix validation, and comprehensive test coverage to prevent recurrence
estimatedTokens: 500
---

# Fix Bug Pattern

**Phases:** Reproduce (0-25%) → Diagnose (25-50%) → Fix (50-80%) → Verify (80-100%)

## Phase 1: Reproduce (0-25%)
- Extract symptoms (expected vs actual), environment details
- Create minimal reproduction case with exact steps
- Verify consistent (not intermittent)
- Gather logs, stack traces, monitoring data
- **Checkpoint:** Bug reproduces consistently

## Phase 2: Diagnose (25-50%)
**Parallel tracks:**
- **Root Cause:** Form 3-5 hypotheses, trace execution backward, use debugger/logging, check data flow, review recent changes (git blame)
- **Test Creation:** Write failing regression test capturing bug
- **Techniques:** Binary search code, hypothesis testing, data inspection
- **Checkpoint:** Understand WHY bug occurs

## Phase 3: Fix (50-80%)
- Design fix targeting root cause (not symptoms)
- Consider alternatives and trade-offs
- Implement clean, focused changes
- Add defensive checks, error handling
- Handle edge cases, boundary conditions
- **Avoid:** Patching symptoms, over-engineering, breaking changes
- **Checkpoint:** Regression test now passes

## Phase 4: Verify (80-100%)
**Parallel tracks:**
- **Testing:** Regression test passes, full suite passes, manual verification, staging test
- **Quality:** Code review, security check, performance validation, impact assessment
- **Docs:** Update comments, document root cause, changelog
- **Checkpoint:** Bug gone, all tests pass, no new bugs

## Parallelism
- **Independent:** Root cause + Test creation (Phase 2), Testing + Quality + Docs (Phase 4)
- **Sequential:** Fix needs root cause (Phase 2→3), Verify needs fix (Phase 3→4)

## Critical Rule
Bug is only fixed when: (1) Root cause understood, (2) Regression test prevents reoccurrence, (3) All tests pass, (4) No new bugs
