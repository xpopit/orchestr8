---
id: git-workflow
category: skill
tags: [git, version-control, workflow, collaboration]
capabilities:
  - Git branching strategies
  - Commit message conventions
  - Code review process
useWhen:
  - Establishing Git workflow
  - Team collaboration guidelines
estimatedTokens: 450
---

# Git Workflow Best Practices

## Branching Strategy (GitFlow)

```bash
# Main branches
main          # Production-ready code
develop       # Integration branch for features

# Supporting branches
feature/*     # New features
bugfix/*      # Bug fixes
hotfix/*      # Urgent production fixes
release/*     # Release preparation

# Feature development
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication

# ... make changes ...

git add .
git commit -m "feat: implement JWT authentication"
git push origin feature/user-authentication

# Create pull request to develop

# Hotfix workflow
git checkout main
git checkout -b hotfix/critical-security-fix
# ... fix ...
git commit -m "fix: patch security vulnerability"

# Merge to both main and develop
git checkout main
git merge hotfix/critical-security-fix
git checkout develop
git merge hotfix/critical-security-fix
```

## Commit Message Convention (Conventional Commits)

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style (formatting, semicolons, etc.)
refactor: # Code refactoring
perf:     # Performance improvement
test:     # Adding or updating tests
chore:    # Build process, dependencies, etc.
ci:       # CI/CD changes

# Examples:
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(api): handle null values in user response"
git commit -m "docs: update API documentation for v2 endpoints"
git commit -m "perf(db): add index on users.email column"
git commit -m "refactor: extract email validation logic"
git commit -m "test: add unit tests for UserService"
git commit -m "chore: update dependencies to latest versions"

# Breaking changes:
git commit -m "feat(api)!: change user endpoint from /user to /users

BREAKING CHANGE: User endpoint has been renamed"

# Multi-line commits:
git commit -m "fix(auth): resolve token expiration issue

- Update token refresh logic
- Add expiration validation
- Improve error messages

Closes #123"
```

## Pull Request Guidelines

```markdown
## Pull Request Template

### Description
Brief description of changes

### Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

### Changes Made
- Added JWT authentication
- Updated user model
- Added authentication middleware

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

### Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

## Code Review Best Practices

```bash
# Reviewer guidelines:
✅ Check for logic errors
✅ Verify tests are included
✅ Look for performance issues
✅ Ensure code follows standards
✅ Suggest improvements, don't demand perfection
✅ Be constructive and respectful
✅ Ask questions to understand intent

# Author guidelines:
✅ Keep PRs small (< 400 lines)
✅ Write descriptive PR descriptions
✅ Respond to all comments
✅ Don't take feedback personally
✅ Request review from specific people
✅ Update PR based on feedback
```

## Git Commands Reference

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Amend last commit
git commit --amend -m "Updated commit message"

# Interactive rebase (squash commits)
git rebase -i HEAD~3

# Stash changes
git stash
git stash pop

# Cherry-pick commit from another branch
git cherry-pick <commit-hash>

# View file history
git log --follow -p -- path/to/file

# Find commit that introduced bug
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>
# Test... then mark:
git bisect good  # or git bisect bad

# Clean up local branches
git branch --merged | grep -v "\*" | xargs -n 1 git branch -d

# Update fork from upstream
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git checkout main
git merge upstream/main
```

## .gitignore Best Practices

```gitignore
# Dependencies
node_modules/
vendor/

# Build outputs
dist/
build/
*.log

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/
```

## Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run linter
npm run lint

# Run tests
npm test

# Check commit message format
npx commitlint --edit $1
```

## Git Security

```bash
# Sign commits with GPG
git config --global user.signingkey <gpg-key-id>
git config --global commit.gpgsign true

# Verify commit signatures
git log --show-signature

# Scan for secrets before commit
npm install -g @devcontainers/cli
git-secrets --scan

# Use .gitattributes for sensitive files
# .gitattributes
config/secrets.yml filter=git-crypt diff=git-crypt
```
