---
description: Comprehensive multi-stage iterative code review with style, logic, security, performance, and architecture analysis
argumentHint: "[path-to-code or PR-number]"
---

# Multi-Stage Code Review Workflow

You are orchestrating a comprehensive multi-stage iterative code review that evaluates code quality across multiple dimensions: style, logic, security, performance, and architecture.

## Workflow Overview

This workflow provides thorough code quality validation through specialized review stages, each focusing on a different aspect of code quality. The review is iterative, allowing developers to fix issues and re-submit for validation.

## Execution Steps

### Phase 1: Scope Detection & Preparation (5%)

**Determine Review Scope:**

1. **Identify what to review:**
   - Full codebase: If no argument provided or explicit request
   - Specific directory/file: If path provided
   - Pull request: If PR number provided
   - Changed files: If reviewing uncommitted changes

2. **Gather context:**
   ```bash
   # For PR reviews
   gh pr view <PR-NUMBER> --json files,title,body,commits

   # For changed files
   git diff --name-only
   git status

   # For directory reviews
   find <directory> -type f -name "*.{ts,js,py,java,go,rs}"
   ```

3. **Create review task list:**
   Use TodoWrite to create tasks for each stage:
   - [ ] Stage 1: Style & Readability Review
   - [ ] Stage 2: Logic & Correctness Review
   - [ ] Stage 3: Security Audit
   - [ ] Stage 4: Performance Analysis
   - [ ] Stage 5: Architecture Review
   - [ ] Stage 6: Synthesis & Report Generation

---

### Phase 2: Multi-Stage Review Execution (80%)

Use the `code-review-orchestrator` agent to coordinate all stages:

```
Use Task tool to invoke code-review-orchestrator with:
- Scope: [files/directories to review]
- Focus: [full|security|performance|architecture]
- Mode: [thorough|fast|security-only]
```

The orchestrator will automatically:

#### Stage 1: Style & Readability (Parallel)
- Launch `code-reviewer` focused on style
- Check formatting, naming, documentation
- ~5 minutes

#### Stage 2: Logic & Correctness (Parallel)
- Launch appropriate language specialist
- Review business logic, error handling
- ~10 minutes

#### Stage 3: Security Audit (Parallel)
- Launch `security-auditor`
- OWASP Top 10, vulnerability scan
- ~10 minutes

#### Stage 4: Performance Analysis (After Stage 1-3)
- Launch language specialist with performance focus
- Identify bottlenecks, optimization opportunities
- ~10 minutes

#### Stage 5: Architecture Review (After Stage 1-3)
- Launch `architect` agent
- Review design patterns, SOLID principles
- ~10 minutes

#### Stage 6: Synthesis
- Aggregate all findings
- Prioritize issues by severity
- Generate master report
- ~5 minutes

**Total Time:** ~50 minutes for comprehensive review

---

### Phase 3: Report Generation & Delivery (10%)

**Generate Master Review Report:**

The orchestrator produces a comprehensive report:

```markdown
# Code Review Report

**Review Date:** [Timestamp]
**Scope:** [Files/PR reviewed]
**Reviewer:** code-review-orchestrator
**Overall Quality Score:** [X/10]

---

## Executive Summary

**Verdict:** [APPROVE | APPROVE WITH CHANGES | REQUEST CHANGES | REJECT]

**Issues Found:**
- 🔴 Critical: X
- 🟠 High: Y
- 🟡 Medium: Z
- 🔵 Low: W
- 💡 Suggestions: V

**Review Stages:**
- ✅ Style & Readability: [PASS/FAIL]
- ✅ Logic & Correctness: [PASS/FAIL]
- ✅ Security: [PASS/FAIL]
- ✅ Performance: [PASS/FAIL]
- ✅ Architecture: [PASS/FAIL]

---

## Critical Issues 🔴 (Must Fix)

[Aggregated from all stages, deduplicated, prioritized]

---

## High Priority Issues 🟠

[Same format]

---

## Medium Priority Issues 🟡

[Same format]

---

## Suggestions & Improvements 💡

[Same format]

---

## Positive Findings ✅

[What was done well in each stage]

---

## Detailed Stage Reports

### Stage 1: Style & Readability
[Link to detailed report]

### Stage 2: Logic & Correctness
[Link to detailed report]

### Stage 3: Security
[Link to detailed report]

### Stage 4: Performance
[Link to detailed report]

### Stage 5: Architecture
[Link to detailed report]

---

## Recommendations

### Immediate Actions (Before Merge)
- [ ] Fix critical security vulnerability in auth.ts:45
- [ ] Fix logic error in calculation

### Short Term (Next Sprint)
- [ ] Refactor complex function
- [ ] Improve error handling

### Long Term (Technical Debt)
- [ ] Migrate to better design pattern
- [ ] Increase test coverage to 80%
```

**Save Report:**
```bash
# Save to file
echo "[report]" > review-report-$(date +%Y%m%d-%H%M%S).md

# Post to PR if applicable
gh pr comment <PR-NUMBER> --body-file review-report.md
```

---

### Phase 4: Iterative Improvement (5%)

**If Issues Found:**

1. **Developer Fixes Issues**
   - Developer addresses critical and high priority issues
   - Commits changes

2. **Targeted Re-review**
   ```
   # Only re-run stages affected by changes
   # If security fix: re-run Stage 3 only
   # If logic fix: re-run Stage 2 only
   # etc.
   ```

3. **Validate Fixes**
   - Ensure issues are resolved
   - Check no new issues introduced
   - Update review report

4. **Iterate or Approve**
   - If all critical/high issues resolved: **APPROVE**
   - If new issues or incomplete fixes: **ITERATE** (max 3 iterations)
   - If >3 iterations needed: **ESCALATE** (suggest pair programming)

---

## Review Modes

### Full Review (Default)
All 5 stages, comprehensive analysis
- **Use for:** New features, major changes, pre-release
- **Time:** ~50 minutes

### Fast Review (Emergency)
Stages 2 & 3 only (Logic + Security)
- **Use for:** Hotfixes, time-critical
- **Time:** ~15 minutes

### Security-Focused
Deep dive on Stage 3, plus compliance checks
- **Use for:** Auth changes, payment handling, sensitive data
- **Time:** ~30 minutes
- **May invoke:** `soc2-specialist`, `gdpr-specialist`, `pci-dss-specialist`

### Performance-Focused
Deep dive on Stage 4, with benchmarks
- **Use for:** Performance optimization, database changes
- **Time:** ~30 minutes
- **May invoke:** `load-testing-specialist`

### Architecture-Focused
Deep dive on Stage 5, system design
- **Use for:** Major refactoring, new modules, design changes
- **Time:** ~30 minutes

---

## Quality Gates

### Mandatory (Cannot Merge Without)
- ✅ No critical security vulnerabilities
- ✅ No logic errors that cause crashes
- ✅ No hardcoded secrets
- ✅ Tests exist and pass

### Recommended (Should Fix)
- ✅ No high priority issues
- ✅ Code style consistent
- ✅ Performance acceptable
- ✅ Architecture sound

### Nice-to-Have (Suggestions)
- 💡 Medium/low priority improvements
- 💡 Optimization opportunities
- 💡 Better patterns

---

## Example Usage

### Review Specific File
```
/review-code src/auth/login.ts
```

### Review Directory
```
/review-code src/features/payments
```

### Review Pull Request
```
/review-code PR-123
```

### Review All Changes
```
/review-code
```
(Reviews all uncommitted changes)

### Security-Only Review
```
/review-code --mode=security-only src/auth
```

### Fast Review (Hotfix)
```
/review-code --mode=fast src/fix/critical-bug.ts
```

---

## Integration with Development Workflow

### Pre-Commit Review
```
# Developer runs before committing
/review-code

# Fix issues
# Commit
git commit -m "feat: add new feature"
```

### Pre-PR Review
```
# Before creating PR, ensure quality
/review-code

# Create PR only after approval
gh pr create
```

### Automated PR Review
```
# GitHub Action triggers on PR creation
# Runs /review-code PR-<number>
# Posts results as PR comment
# Blocks merge if critical issues
```

### Pre-Release Review
```
# Before release, review entire codebase
/review-code --scope=full

# Generate quality report
# Fix any critical/high issues
# Proceed with release
```

---

## Success Criteria

Review is complete when:
- ✅ All 5 stages executed (or relevant subset for mode)
- ✅ Master report generated
- ✅ Critical issues identified and tracked
- ✅ Developer has clear action items
- ✅ Re-review plan established (if needed)

---

## Output Artifacts

1. **Master Review Report** (`review-report-YYYYMMDD-HHMMSS.md`)
2. **Stage Reports** (linked from master report)
3. **Issue Tracker Items** (if integrated)
4. **PR Comments** (if PR review)
5. **Metrics Log** (for trend analysis)

---

## Best Practices

### DO ✅
- Run review before creating PR
- Address critical/high issues immediately
- Use fast mode only for true emergencies
- Iterate based on feedback
- Track review metrics over time
- Automate in CI/CD pipeline

### DON'T ❌
- Skip review for "small" changes
- Ignore low-priority issues indefinitely
- Review while tired or rushed
- Approve without reading report
- Merge with open critical issues
- Disable quality gates

---

## Notes

- **Parallel Execution:** Stages 1-3 run in parallel for speed
- **Iterative:** Re-review only affected stages after fixes
- **Customizable:** Adjust stages/focus based on change type
- **Automated:** Can integrate with CI/CD for automatic reviews
- **Learning:** System improves over time by tracking patterns

Your code deserves thorough review. This workflow ensures nothing slips through while maintaining development velocity.
