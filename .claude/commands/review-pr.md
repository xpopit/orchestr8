---
description: Comprehensive pull request review with multi-stage analysis, GitHub integration, and automated PR comments
argumentHint: "<PR-number>"
---

# Pull Request Review Workflow

You are orchestrating a comprehensive pull request review with multi-stage code analysis, GitHub integration, and automated feedback delivery.

## Workflow Overview

This workflow provides thorough PR review by:
1. Fetching PR details from GitHub
2. Analyzing changed files across 5 quality dimensions
3. Posting detailed review comments to the PR
4. Requesting changes or approving based on findings
5. Supporting iterative review cycles

## Execution Steps

### Phase 1: PR Context Gathering (10%)

**Fetch PR Information:**

1. **Get PR details:**
   ```bash
   # Fetch PR metadata
   gh pr view <PR-NUMBER> --json number,title,body,author,headRefName,baseRefName,state,isDraft,commits,files

   # Get PR diff
   gh pr diff <PR-NUMBER>

   # Get PR commits
   gh pr view <PR-NUMBER> --json commits
   ```

2. **Identify changed files:**
   ```bash
   # List all files changed in PR
   gh pr diff <PR-NUMBER> --name-only

   # Categorize files by type
   # Frontend: *.tsx, *.jsx, *.vue, *.svelte
   # Backend: *.ts, *.js, *.py, *.go, *.java, *.rs
   # Tests: *.test.*, *.spec.*
   # Config: *.json, *.yaml, *.yml
   # Docs: *.md
   ```

3. **Analyze PR context:**
   - PR size (lines changed, files modified)
   - Change type (feature, bugfix, refactor, docs)
   - Risk level (high for auth/security, medium for business logic, low for docs)
   - Related issues/tickets

4. **Create review plan:**
   Use TodoWrite to track review stages:
   - [ ] Validate PR metadata (title, description, linked issues)
   - [ ] Stage 1: Style & Readability Review
   - [ ] Stage 2: Logic & Correctness Review
   - [ ] Stage 3: Security Audit
   - [ ] Stage 4: Performance Analysis
   - [ ] Stage 5: Architecture Review
   - [ ] Generate review summary
   - [ ] Post review to GitHub

---

### Phase 2: PR Metadata Validation (5%)

**Check PR Quality:**

1. **Title Validation:**
   - [ ] Follows Conventional Commits format (`feat:`, `fix:`, `docs:`, etc.)
   - [ ] Clear and descriptive
   - [ ] References ticket/issue if applicable

2. **Description Validation:**
   - [ ] Explains what and why (not just what)
   - [ ] Links to related issues/tickets
   - [ ] Includes testing notes
   - [ ] Screenshots for UI changes
   - [ ] Breaking changes documented

3. **Metadata Checks:**
   - [ ] Appropriate labels applied
   - [ ] Reviewers assigned
   - [ ] Milestone set (if applicable)
   - [ ] Not a draft (or marked WIP)

**If Validation Fails:**
Post comment requesting improvements:
```bash
gh pr comment <PR-NUMBER> --body "## PR Metadata Issues

Please address the following before review:
- [ ] Add conventional commit prefix to title (feat:, fix:, etc.)
- [ ] Add description explaining changes
- [ ] Link related issue/ticket
- [ ] Add testing notes

Use \`gh pr edit <PR-NUMBER>\` to update."
```

---

### Phase 3: Multi-Stage Code Review (70%)

**Invoke code-review-orchestrator for comprehensive analysis:**

```
Use Task tool to invoke code-review-orchestrator with:
- Scope: PR changed files only
- Mode: pr-review
- Context: PR number, title, description
- Integration: github
```

The orchestrator executes all stages:

#### Stage 1: Style & Readability (Parallel)
```
Agent: code-reviewer
Focus: Changed files only
Output: Line-level style issues with file:line references
```

#### Stage 2: Logic & Correctness (Parallel)
```
Agent: [language]-developer (auto-detected from file extensions)
Focus: Business logic in changed files
Output: Logic errors, edge cases, correctness issues
```

#### Stage 3: Security Audit (Parallel)
```
Agent: security-auditor
Focus: Security implications of changes
Special attention to:
- Auth/authz changes
- Input validation
- New dependencies
- Secret exposure
Output: Security vulnerabilities by severity
```

#### Stage 4: Performance Analysis
```
Agent: [language]-developer with performance focus
Focus: Performance impact of changes
Check for:
- New database queries (N+1 issues)
- Algorithm complexity changes
- Resource leaks
Output: Performance concerns and recommendations
```

#### Stage 5: Architecture Review
```
Agent: architect
Focus: Integration with existing system
Check for:
- Pattern consistency
- SOLID principles
- Coupling/cohesion
- Scalability impact
Output: Architectural feedback
```

---

### Phase 4: Review Summary Generation (10%)

**Generate PR Review Summary:**

Create comprehensive review formatted for GitHub:

```markdown
# Code Review Summary

**Reviewed by:** code-review-orchestrator (AI)
**Review Date:** [Timestamp]
**PR:** #<NUMBER> - [Title]
**Files Reviewed:** X files, Y lines changed (+additions, -deletions)

---

## Overall Assessment

**Verdict:** [APPROVE ✅ | APPROVE WITH MINOR CHANGES 🟡 | REQUEST CHANGES 🔴]

**Quality Score:** [X/10]

**Issues by Severity:**
- 🔴 Critical: X (must fix)
- 🟠 High: Y (should fix before merge)
- 🟡 Medium: Z (fix soon)
- 🔵 Low: W (nice to fix)
- 💡 Suggestions: V (consider)

**Review Stages:**
- Style & Readability: [✅ PASS | ❌ ISSUES]
- Logic & Correctness: [✅ PASS | ❌ ISSUES]
- Security: [✅ PASS | ❌ ISSUES]
- Performance: [✅ PASS | ❌ ISSUES]
- Architecture: [✅ PASS | ❌ ISSUES]

---

## Critical Issues 🔴 (Must Fix Before Merge)

<details>
<summary>1. SQL Injection Vulnerability - <code>src/api/users.ts:42</code></summary>

**Stage:** Security
**Severity:** Critical 🔴

**Problem:**
User input is directly concatenated into SQL query, allowing SQL injection attacks.

**Code:**
```typescript
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
```

**Impact:**
Attackers could execute arbitrary SQL queries, leading to data theft or deletion.

**Fix:**
Use parameterized queries:
```typescript
const query = `SELECT * FROM users WHERE id = ?`;
const result = await db.execute(query, [req.params.id]);
```

**References:**
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- CWE-89

</details>

---

## High Priority Issues 🟠 (Should Fix Before Merge)

<details>
<summary>2. N+1 Query Problem - <code>src/services/orders.ts:123</code></summary>

**Stage:** Performance
**Severity:** High 🟠

**Problem:**
Loop executes a database query for each order item, causing N+1 queries.

**Code:**
```typescript
for (const order of orders) {
  const items = await getOrderItems(order.id);  // N queries
}
```

**Impact:**
Significant performance degradation with large datasets. For 100 orders, this makes 101 queries instead of 2.

**Fix:**
Use eager loading or batch fetch:
```typescript
const orderIds = orders.map(o => o.id);
const items = await getOrderItemsForOrders(orderIds);  // 1 query
```

</details>

---

## Medium Priority Issues 🟡

<details>
<summary>3. Complex Function - <code>src/utils/calculator.ts:67</code></summary>

**Stage:** Style
**Severity:** Medium 🟡

**Problem:**
Function is 120 lines with cyclomatic complexity of 18 (threshold: 10).

**Suggestion:**
Break into smaller, focused functions:
- `validateInput()`
- `performCalculation()`
- `formatResult()`

**Benefit:**
Improved testability, readability, and maintainability.

</details>

---

## Positive Findings ✅

- ✅ Excellent test coverage (95%) for new code
- ✅ Clear, descriptive variable names
- ✅ Good error handling with user-friendly messages
- ✅ Proper TypeScript types throughout
- ✅ Follows existing code patterns consistently

---

## Recommendations

### Before Merge (Required)
- [ ] Fix SQL injection in users.ts:42
- [ ] Fix N+1 query in orders.ts:123

### Short Term (Recommended)
- [ ] Refactor calculator.ts for better complexity
- [ ] Add JSDoc comments to public API functions

### Long Term (Consider)
- [ ] Consider migrating to ORM to prevent SQL injection by default
- [ ] Implement request caching to further improve performance

---

## Test Coverage Analysis

**Overall Coverage:** 85% (unchanged from base branch)

**New/Modified Code Coverage:**
- `src/api/users.ts`: 90% ✅
- `src/services/orders.ts`: 80% ✅
- `src/utils/calculator.ts`: 95% ✅

**Missing Tests:**
- Edge case: empty order list in orders.ts:145
- Error handling: database connection failure

---

## Security Checklist

- [x] No hardcoded secrets or API keys
- [ ] ⚠️ SQL injection vulnerability found
- [x] Input validation present
- [x] Authentication/authorization checked
- [x] No new dependencies with known vulnerabilities
- [x] Sensitive data encrypted
- [x] HTTPS enforced

---

## Performance Impact

**Database Queries:**
- ⚠️ +N queries added (N+1 problem in orders.ts)

**Bundle Size (Frontend):**
- No changes

**API Response Time:**
- Expected: +50-200ms due to new query (acceptable for non-critical path)

---

## Next Steps

1. **Developer:** Address critical and high priority issues
2. **Re-review:** I'll automatically re-review when you push new commits
3. **Approval:** Once all critical/high issues are resolved, I'll approve

---

<sub>🤖 Automated review by [orchestr8](https://github.com/seth-schultz/orchestr8) | Powered by Claude Code</sub>
```

---

### Phase 5: Post Review to GitHub (5%)

**Deliver Review Feedback:**

1. **Post inline comments for critical issues:**
   ```bash
   # For each critical/high issue, post line comment
   gh pr review <PR-NUMBER> --comment \
     --body "🔴 **SQL Injection Vulnerability**

     User input is concatenated into SQL query. Use parameterized queries instead:
     \`\`\`typescript
     const query = 'SELECT * FROM users WHERE id = ?';
     const result = await db.execute(query, [req.params.id]);
     \`\`\`"
   ```

2. **Post summary comment:**
   ```bash
   gh pr comment <PR-NUMBER> --body-file review-summary.md
   ```

3. **Set review status:**
   ```bash
   # If critical issues:
   gh pr review <PR-NUMBER> --request-changes \
     --body "Found critical security and performance issues. Please address before merge."

   # If only minor issues:
   gh pr review <PR-NUMBER> --approve \
     --body "Looks good! Minor suggestions included in review."

   # If needs changes but not critical:
   gh pr review <PR-NUMBER> --comment \
     --body "Found some issues to address. Please review feedback."
   ```

4. **Apply labels:**
   ```bash
   # Add labels based on findings
   gh pr edit <PR-NUMBER> --add-label "needs-changes"      # If request changes
   gh pr edit <PR-NUMBER> --add-label "security-review"    # If security issues
   gh pr edit <PR-NUMBER> --add-label "performance"        # If performance issues
   gh pr edit <PR-NUMBER> --add-label "approved"           # If approved
   ```

---

## Iterative Re-Review

**When Developer Pushes New Commits:**

1. **Detect new commits:**
   ```bash
   # GitHub webhook or Action triggers on new push to PR branch
   gh pr view <PR-NUMBER> --json commits
   ```

2. **Identify changed files since last review:**
   ```bash
   # Compare with last review commit
   git diff <last-review-commit> <new-commit> --name-only
   ```

3. **Targeted re-review:**
   - Only review files changed since last review
   - Re-run only affected stages
   - Verify previous issues are fixed
   - Check for new issues

4. **Update review status:**
   ```bash
   # If issues fixed and no new issues:
   gh pr review <PR-NUMBER> --approve \
     --body "✅ All issues addressed. Looks good!"

   # If new issues or incomplete fixes:
   gh pr review <PR-NUMBER> --comment \
     --body "Thanks for the fixes! Found a few remaining issues..."
   ```

5. **Iteration limit:**
   - Maximum 3 automated review iterations
   - After 3 iterations, suggest human review or pair programming

---

## Special Review Modes

### Security-Critical PR
If PR touches auth, payments, sensitive data:
```
- Deep security audit (30 minutes)
- Invoke compliance specialists (GDPR, PCI-DSS, SOC2)
- Require human security team review
- Block merge until security sign-off
```

### Hotfix PR
If labeled "hotfix" or "emergency":
```
- Fast review mode (15 minutes)
- Focus on logic + security only
- Skip style, architecture reviews
- Expedited approval process
```

### Documentation-Only PR
If only .md files changed:
```
- Skip code review stages
- Review documentation quality:
  - Accuracy
  - Completeness
  - Clarity
  - Examples included
- Quick approval (5 minutes)
```

### Dependency Update PR
If only package.json, requirements.txt, etc.:
```
- Security audit only
- Check for known vulnerabilities
- Verify license compatibility
- Check for breaking changes
```

---

## Integration with CI/CD

**GitHub Actions Workflow:**

```yaml
name: Automated Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Multi-Stage Code Review
        run: |
          # Trigger /review-pr workflow
          claude run /review-pr ${{ github.event.pull_request.number }}

      - name: Block Merge on Critical Issues
        if: contains(steps.review.outputs.verdict, 'REQUEST_CHANGES')
        run: exit 1
```

**Branch Protection Rules:**
```
- Require code review approval
- Require status checks to pass (including automated review)
- Dismiss stale reviews on new commits
- Require linear history
```

---

## Metrics & Analytics

Track over time:
- **Review Thoroughness:** Issues caught vs. production bugs from PRs
- **Review Speed:** Time from PR open to first review
- **Iteration Count:** Average iterations to approval
- **Issue Distribution:** % by severity and category
- **Developer Satisfaction:** Feedback quality ratings
- **False Positives:** Issues marked as not applicable

---

## Success Criteria

PR review is complete when:
- ✅ All changed files reviewed across 5 stages
- ✅ Issues identified and prioritized
- ✅ Review summary posted to PR
- ✅ Inline comments on critical issues
- ✅ PR status set (approved/request changes)
- ✅ Labels applied
- ✅ Developer has clear action items

---

## Best Practices

### DO ✅
- Review within 24 hours of PR creation
- Provide specific, actionable feedback
- Reference exact file:line locations
- Explain *why* something is an issue
- Acknowledge what was done well
- Be constructive and respectful
- Re-review promptly after fixes

### DON'T ❌
- Nitpick minor style issues (let linters handle)
- Block on low-priority suggestions
- Provide vague feedback
- Forget to check for new issues in fixes
- Review while rushed
- Ignore test coverage
- Skip security review

---

## Example Usage

### Basic PR Review
```
/review-pr 123
```

### Re-review After Changes
```
/review-pr 123 --mode=re-review
```

### Security-Focused Review
```
/review-pr 123 --mode=security-focused
```

### Fast Review (Hotfix)
```
/review-pr 123 --mode=fast
```

---

Your mission is to ensure every PR meets quality standards while maintaining development velocity. Thorough yet efficient, strict yet constructive.
