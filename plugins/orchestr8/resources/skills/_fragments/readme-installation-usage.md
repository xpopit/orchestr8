---
id: readme-installation-usage
category: skill
tags: [readme, documentation, installation, usage, examples, configuration, troubleshooting]
capabilities:
  - Clear installation instructions with verification
  - Usage examples in cookbook style
  - Configuration documentation with tables
  - Troubleshooting section for common issues
useWhen:
  - Writing clear installation instructions for npm package with prerequisite versions and troubleshooting common errors
  - Creating minimal working example in README demonstrating core functionality in under 10 lines of code
  - Designing quick start section getting developers from zero to running app in 5 minutes with copy-paste commands
  - Building comprehensive usage guide with common scenarios, API examples, and configuration options
  - Structuring README with progressive disclosure from basic usage to advanced features and edge cases
estimatedTokens: 780
---

# README: Installation & Usage

Write clear installation instructions and usage examples that get users productive quickly.

## Installation Instructions

### Pattern 1: Simple Installation

```markdown
## Installation

\`\`\`bash
npm install package-name
\`\`\`

**Requirements:** Node.js 18+
```

### Pattern 2: Multi-Step Installation

```markdown
## Installation

### 1. Install Package

\`\`\`bash
pip install fastapi-auth
\`\`\`

### 2. Set Environment Variables

\`\`\`bash
export JWT_SECRET="your-secret-key"
export DATABASE_URL="postgresql://localhost/mydb"
\`\`\`

### 3. Run Migrations

\`\`\`bash
alembic upgrade head
\`\`\`

### 4. Verify Installation

\`\`\`bash
python -c "import fastapi_auth; print(fastapi_auth.__version__)"
# Should print: 1.2.3
\`\`\`

💡 **Having issues?** See [Troubleshooting](#troubleshooting)
```

### Pattern 3: Multiple Install Methods

```markdown
## Installation

**npm:**
\`\`\`bash
npm install package-name
\`\`\`

**yarn:**
\`\`\`bash
yarn add package-name
\`\`\`

**CDN:**
\`\`\`html
<script src="https://cdn.example.com/package@1.0.0/dist/index.js"></script>
\`\`\`

**From source:**
\`\`\`bash
git clone https://github.com/user/repo.git
cd repo
npm install
npm run build
\`\`\`
```

## Usage Patterns

### Pattern 1: API-style Documentation

```markdown
## Usage

### `createUser(email, password)`

Creates a new user account.

**Parameters:**
- `email` (string, required) - Valid email address
- `password` (string, required) - Minimum 8 characters

**Returns:** `User` object with `id`, `email`, `createdAt`

**Throws:**
- `ValidationError` - Invalid email or weak password
- `DuplicateError` - Email already registered

**Example:**
\`\`\`typescript
const user = await createUser('user@example.com', 'MyP@ssw0rd');
console.log(user.id); // "usr_1234567890"
\`\`\`
```

### Pattern 2: Cookbook-style

```markdown
## Usage

### Create a User

\`\`\`python
user = await auth.create_user("user@example.com", "password123")
\`\`\`

### Login and Get Token

\`\`\`python
token = await auth.login("user@example.com", "password123")
\`\`\`

### Protect Routes

\`\`\`python
@app.get("/protected")
async def protected(user = Depends(auth.current_user)):
    return {"user_id": user.id}
\`\`\`

### Refresh Token

\`\`\`python
new_token = await auth.refresh_token(old_token)
\`\`\`
```

## Configuration Section

```markdown
## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret key for JWT signing |
| `TOKEN_EXPIRY` | No | `3600` | Token lifetime in seconds |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `LOG_LEVEL` | No | `info` | Logging level (debug/info/warn/error) |

### Code Configuration

\`\`\`python
auth = Auth(
    secret="your-jwt-secret",
    algorithm="HS256",          # JWT algorithm
    expiry=3600,                # 1 hour
    refresh_enabled=True,       # Enable token refresh
    password_min_length=8,      # Minimum password length
)
\`\`\`
```

## Troubleshooting Section

```markdown
## Troubleshooting

### "Module not found" error

**Problem:** `ModuleNotFoundError: No module named 'fastapi_auth'`

**Solution:** Install the package:
\`\`\`bash
pip install fastapi-auth
\`\`\`

### Token validation fails

**Problem:** `401 Unauthorized - Invalid token`

**Possible causes:**
1. Token expired → Generate new token
2. Wrong secret key → Check `JWT_SECRET` env variable
3. Token malformed → Ensure bearer token format: `Bearer <token>`

### Database connection error

**Problem:** `Cannot connect to database`

**Solution:** Verify `DATABASE_URL` format:
\`\`\`
postgresql://user:password@host:port/database
\`\`\`
```

## README Anti-Patterns

❌ **Avoid:**
- Installation buried (quick start before installation steps)
- No working examples (only API reference)
- Version lock ("Requires Python 3.7.2" instead of "3.7+")
- Missing troubleshooting (users left to debug alone)
- Dead links (broken documentation)
- Code without context (examples that don't run)

✅ **Best Practices:**
- Installation first, then quick start
- Working code examples for 80% of use cases
- Version ranges, not exact versions
- Troubleshooting for common issues
- Verify all links work
- Test all code examples

## Best Practices

✅ **Step-by-step** - Number installation steps clearly
✅ **Verification** - Show how to verify successful installation
✅ **Working code** - All examples should be runnable
✅ **Common issues** - Troubleshooting section with solutions
✅ **Configuration** - Table format for easy reference
✅ **Context** - Explain what each example does

❌ **Don't skip verification** - Always show how to test installation
❌ **Don't assume knowledge** - Explain environment variables, etc.
❌ **Don't leave users stuck** - Provide troubleshooting
