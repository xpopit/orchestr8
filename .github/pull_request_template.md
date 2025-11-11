# Pull Request

## Title Format

Please follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

Examples:
feat: add OAuth2 authentication support
fix: resolve memory leak in async task executor
docs: update installation instructions
refactor: simplify workflow orchestration logic
test: add e2e tests for security audit workflow
chore: bump dependencies to latest versions
```

**Accepted types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `release`

---

## Linked Issue

Closes #<!-- Issue number -->

<!-- If no issue exists, briefly explain why this PR is needed -->

---

## Description

### What Changed

<!-- Provide a clear, concise description of what this PR changes -->

### Why This Change

<!-- Explain the motivation behind this change. What problem does it solve? -->

---

## Type of Change

<!-- Check all that apply -->

- [ ] `feat`: New feature (backward compatible functionality)
- [ ] `fix`: Bug fix (backward compatible patch)
- [ ] `refactor`: Code restructuring (no functional changes)
- [ ] `docs`: Documentation updates
- [ ] `test`: Test additions or improvements
- [ ] `chore`: Maintenance tasks (dependencies, CI/CD, tooling)
- [ ] `release`: Version bump and release preparation

---

## Breaking Changes

<!-- If this PR introduces breaking changes, describe them here -->

- [ ] This PR introduces breaking changes
- [ ] Migration guide provided (if applicable)

<!-- If no breaking changes, write "None" -->

**Details:**

---

## Testing Performed

<!-- Describe testing approach and results -->

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

### Test Results

<!-- Paste relevant test output or describe manual test scenarios -->

```
# Example:
npm test
✓ All 127 tests passed
✓ Coverage: 94.2%
```

---

## Documentation Updates

<!-- Check all that apply -->

- [ ] README.md updated
- [ ] ARCHITECTURE.md updated
- [ ] CHANGELOG.md updated with version entry
- [ ] Inline code comments added where necessary
- [ ] Agent/workflow documentation updated (if applicable)
- [ ] No documentation changes needed

---

## Screenshots/Examples

<!-- If applicable, add screenshots, logs, or example usage -->

### Before

<!-- Show behavior/output before this change -->

### After

<!-- Show behavior/output after this change -->

<!-- If not applicable, write "N/A" -->

---

## Reviewer Checklist

<!-- Reviewers: Please verify all items before approving -->

### Code Quality

- [ ] Code follows project style and conventions
- [ ] No console errors or warnings introduced
- [ ] Error handling is appropriate and comprehensive
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Functions/methods are single-purpose and well-named

### Testing & Validation

- [ ] Tests added/updated and passing
- [ ] Test coverage maintained or improved
- [ ] Edge cases considered and tested
- [ ] Manual testing performed (if applicable)

### Documentation

- [ ] Documentation updated and accurate
- [ ] CHANGELOG.md entry added (if user-facing change)
- [ ] Complex logic documented with comments
- [ ] API changes documented (if applicable)

### Security & Performance

- [ ] Security considerations addressed
  - No secrets committed
  - Input validation implemented
  - Authentication/authorization handled correctly
- [ ] Performance impact considered
  - No obvious performance regressions
  - Efficient algorithms/data structures used
  - Resource usage (memory, CPU) acceptable

### Architecture & Maintainability

- [ ] Changes align with project architecture
- [ ] No tight coupling introduced
- [ ] Dependencies justified and minimal
- [ ] Future maintainability considered

### orchestr8-Specific Checks

- [ ] Agent files follow markdown format standards
- [ ] Workflow files use proper phase structure
- [ ] Agent names use correct `orchestr8:` prefix
- [ ] Documentation organized in `.orchestr8/docs/` structure (if applicable)
- [ ] Version files synchronized (if VERSION changed)

---

## Additional Context

<!-- Add any other context, considerations, or notes for reviewers -->

---

## Pre-Submission Checklist

<!-- Author: Verify before submitting PR -->

- [ ] PR title follows Conventional Commits format
- [ ] All tests pass locally
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if user-facing change)
- [ ] No merge conflicts
- [ ] Branch is up to date with base branch
- [ ] Self-review completed

---

## Deployment Considerations

<!-- If applicable, describe deployment requirements or rollback procedures -->

- [ ] Requires database migrations
- [ ] Requires environment variable changes
- [ ] Requires manual deployment steps
- [ ] Backward compatible (no special deployment needed)

<!-- If none, write "Standard deployment - no special considerations" -->

**Details:**
