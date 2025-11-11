---
id: technical-writing-principles
category: skill
tags: [documentation, technical-writing, clarity, audience, structure, style, communication, editing, readability, principles]
capabilities:
  - Write clear and concise technical content
  - Analyze and adapt to target audience
  - Structure information hierarchically
  - Apply consistent style and voice
  - Edit for clarity and precision
  - Use active voice and concrete examples
useWhen:
  - Writing developer onboarding guide for microservices architecture with active voice, concrete examples, and progressive disclosure
  - Improving open-source library documentation readability by reducing sentence length and adding scannable bullet points
  - Creating user-facing API integration tutorial adapting technical complexity to beginner audience with step-by-step instructions
  - Establishing documentation style guide for engineering team defining terminology consistency and code block formatting standards
  - Editing technical design document to remove passive voice and abstract language with concrete implementation examples
  - Refactoring legacy documentation into hierarchical structure with quick start, core concepts, and reference sections
estimatedTokens: 650
---

# Technical Writing Principles

Core principles for clear, effective technical documentation that users actually read and understand.

## Clarity First

**Write for scanability:**
- Lead with the answer, then explain
- One idea per paragraph
- Short sentences (15-20 words)
- Bullet points over dense paragraphs

✅ **Good:**
```markdown
To install: run `npm install package-name`

This downloads the package and adds it to your dependencies.
```

❌ **Bad:**
```markdown
In order to proceed with the installation process, you should utilize the npm package manager to execute the install command with the package name as an argument, which will result in the package being downloaded and added to your project's dependency list.
```

## Know Your Audience

**Adapt complexity to reader:**

**Beginner:** Step-by-step, explain concepts
```markdown
## What is an API?
An API (Application Programming Interface) lets programs talk to each other.
Think of it like a waiter taking your order to the kitchen.
```

**Expert:** Assume knowledge, focus on specifics
```markdown
## API Endpoints
`POST /api/v1/users` - Creates user, returns 201 with user object
```

## Structure Hierarchically

**Information pyramid:**
```markdown
# Main Topic (what it is)
Quick summary in 1-2 sentences.

## Quick Start (how to use it)
Minimal working example.

## Core Concepts (how it works)
Key ideas explained.

## Advanced Topics (edge cases)
Deep dives and optimizations.

## Reference (complete details)
Full API documentation.
```

## Active Voice & Present Tense

✅ **Active:** "The function returns a Promise"
❌ **Passive:** "A Promise is returned by the function"

✅ **Present:** "Click the button to save"
❌ **Future:** "You will need to click the button"

## Concrete Examples

**Show, don't just tell:**

❌ **Abstract:**
```markdown
This function processes data and returns the result.
```

✅ **Concrete:**
```markdown
Converts Celsius to Fahrenheit:
\`\`\`typescript
convertTemp(0)   // Returns 32
convertTemp(100) // Returns 212
\`\`\`
```

## Consistent Terminology

**Create a word list:**
- "endpoint" not "route" or "URL" or "API call"
- "argument" not "parameter" or "input"
- "return" not "output" or "give back"

**Pick one term, use it everywhere.**

## Warning Levels

```markdown
💡 **TIP:** Helpful optimization or shortcut

⚠️ **WARNING:** Common mistake or gotcha

🚨 **DANGER:** Data loss or security risk
```

## Code Block Best Practices

**Always include:**
- Language identifier for syntax highlighting
- Comments explaining non-obvious parts
- Expected output or result

```typescript
// ✅ Good: Language, comments, context
const result = await fetchUser(123);
console.log(result); // { id: 123, name: "Alice" }
```

## Edit Ruthlessly

**Cut these words:**
- "basically", "simply", "just", "actually"
- "In order to" → "To"
- "It is important to note that" → Delete
- "Please" in instructions → Delete

**Before:** "Please simply run the command in order to start the server"
**After:** "Run `npm start` to start the server"

## Test Your Documentation

**Validation checklist:**
- ✅ Can a beginner follow this?
- ✅ Can someone find what they need in <30 seconds?
- ✅ Are all code examples tested and working?
- ✅ Is the structure clear (headings, bullets)?
- ✅ Is it as short as possible while complete?

## Style Guide Template

```markdown
# Documentation Style Guide

**Voice:** Active, present tense, second person ("you")
**Tone:** Friendly but professional
**Code:** Always syntax highlighted, tested examples
**Structure:** Answer first, explanation after
**Length:** Minimum viable - remove everything unnecessary
```
