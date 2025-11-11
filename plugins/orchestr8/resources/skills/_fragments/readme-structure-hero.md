---
id: readme-structure-hero
category: skill
tags: [readme, documentation, project-structure, hero-section, quick-start, badges]
capabilities:
  - Effective README structure and organization
  - Compelling hero section and first impression
  - Quick start examples that work in <2 minutes
  - Badge selection and placement
useWhen:
  - Writing README hero section with compelling one-liner, clear value proposition, and prominent installation command
  - Designing above-the-fold README content capturing developer attention with badges, demo GIF, and quick start
  - Creating README opening that answers what it is, what problem it solves, and why use it in first paragraph
  - Structuring project README with visual hierarchy using headers, code blocks, and whitespace for scannability
  - Building README introduction section with technology logos, build status badges, and concise feature bullets
estimatedTokens: 750
---

# README Structure & Hero Section

Create READMEs that hook users in the first 3 lines and get them productive in minutes.

## Essential README Structure

```markdown
# Project Name

One-sentence description of what this does and who it's for.

[![Build Status](https://img.shields.io/github/actions/workflow/status/user/repo/ci.yml)](link)
[![npm version](https://img.shields.io/npm/v/package-name.svg)](link)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Quick Start

\`\`\`bash
# Install
npm install package-name

# Use
import { thing } from 'package-name';
thing.doSomething();
\`\`\`

[See full documentation →](https://docs.example.com)

## Features

- ✅ Feature 1 - what problem it solves
- ✅ Feature 2 - what benefit it provides
- ✅ Feature 3 - what it makes easy

## Installation

[Detailed steps...]

## Usage

[Core examples...]

## Documentation

[Links to full docs...]

## Contributing

[How to contribute...]

## License

MIT - see [LICENSE](LICENSE)
```

## Hero Section

**The first 3 lines determine if people keep reading.**

✅ **Good:**
```markdown
# FastAPI-Auth

Production-ready authentication for FastAPI apps. Add signup, login, and JWT tokens in 5 minutes.

[![Downloads](https://img.shields.io/pypi/dm/fastapi-auth)](link)
```

❌ **Bad:**
```markdown
# Project

This is a project I made.

## About

This project is about doing things with stuff.
```

**Formula:** `[Name] - [What it does] for [who]. [Key benefit in numbers/time].`

## Quick Start Examples

**Goal: Working code in <2 minutes**

```markdown
## Quick Start

### Minimal Example

\`\`\`python
from fastapi_auth import Auth

app = FastAPI()
auth = Auth(secret="your-jwt-secret")

@app.post("/signup")
async def signup(email: str, password: str):
    user = await auth.create_user(email, password)
    return {"token": auth.generate_token(user)}

@app.get("/protected")
async def protected(user = Depends(auth.get_current_user)):
    return {"message": f"Hello {user.email}"}
\`\`\`

**Run it:**
\`\`\`bash
uvicorn main:app --reload
curl -X POST http://localhost:8000/signup \\
  -d "email=user@example.com&password=secret123"
\`\`\`

### Full Example

[Link to complete example with error handling, validation, etc.]
```

## Feature Showcase

✅ **Good - Benefits-focused:**
```markdown
## Why FastAPI-Auth?

- **5-minute setup** - Authentication in one decorator
- **Production-ready** - Rate limiting, password hashing, token refresh built-in
- **Type-safe** - Full TypeScript/Pydantic support
- **Flexible** - Works with any database or user model
```

❌ **Bad - Feature list:**
```markdown
## Features

- Has authentication
- Uses JWT
- Works with databases
- Has TypeScript types
```

## Badges That Matter

**Use sparingly - only include meaningful signals:**

```markdown
[![Build](https://img.shields.io/github/actions/workflow/status/user/repo/ci.yml?branch=main)](link)
[![Coverage](https://img.shields.io/codecov/c/github/user/repo)](link)
[![Version](https://img.shields.io/npm/v/package)](link)
[![Downloads](https://img.shields.io/npm/dm/package)](link)
[![License](https://img.shields.io/badge/license-MIT-blue)](link)
```

**Skip these:**
- "made with ❤️"
- "code style: prettier"
- "PRs welcome" (assumed)
- Excessive framework badges

## README Checklist

Before publishing, verify:
- ✅ First sentence explains what and who
- ✅ Quick start takes <2 minutes
- ✅ Installation steps are complete and tested
- ✅ At least 3 working code examples
- ✅ Links to full documentation (if it exists)
- ✅ License is specified
- ✅ All code examples run without errors
- ✅ Badges are current and relevant
- ✅ No broken links
- ✅ Troubleshooting for common issues

## Best Practices

✅ **Hook in 3 lines** - Name, description, key benefit
✅ **Quick start first** - Working code before theory
✅ **Benefits not features** - Explain value, not just capabilities
✅ **Minimal badges** - 3-5 maximum, only meaningful ones
✅ **Working examples** - Test all code blocks
✅ **Clear hierarchy** - H1 → H2 → H3 structure

❌ **Avoid:**
- Wall of badges (10+ at top)
- No quick start (diving into theory)
- Copy-paste README (generic template text)
- Dead links (broken documentation)
- Missing examples (only API reference)
