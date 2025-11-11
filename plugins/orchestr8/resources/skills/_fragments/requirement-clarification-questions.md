---
id: requirement-clarification-questions
category: skill
tags: [requirements, questions, clarification, askuserquestion, decision-making, meta]
capabilities:
  - Effective clarifying question design
  - AskUserQuestion tool usage patterns
  - When to ask vs when to decide
  - Question design for architecture, technology, and scope decisions
useWhen:
  - Generating targeted clarification questions for vague feature requests uncovering hidden requirements and edge cases
  - Designing requirement elicitation strategy asking about scale, performance, security, and integration constraints
  - Creating systematic questioning framework covering functional requirements, non-functional requirements, and acceptance criteria
  - Implementing Socratic method for requirement refinement helping stakeholders articulate implicit assumptions
  - Building requirement validation checklist ensuring completeness with who, what, when, where, why, how framework
estimatedTokens: 620
---

# Clarifying Questions & Decision Points

Design and ask effective clarifying questions to resolve ambiguity and gather necessary user input.

## When to Ask Questions

**Use AskUserQuestion when:**
```markdown
✅ Multiple valid architectural approaches exist
✅ Technology stack not specified (multiple good options)
✅ Scope is ambiguous (MVP vs full-featured unclear)
✅ Trade-offs require user input (performance vs simplicity)
✅ Business logic is domain-specific (need domain knowledge)

❌ Don't ask when:
❌ Industry standard approach exists (use best practice)
❌ Technical decision with clear winner (use optimal choice)
❌ Minor implementation detail (make reasonable choice)
```

## Question Design Patterns

### Architecture Decisions

```markdown
AskUserQuestion:
  question: "Which architectural pattern should we use for this API?"
  header: "Architecture"
  options:
    - label: "Monolithic"
      description: "Single service, simpler to deploy, easier to develop initially"
    - label: "Microservices"
      description: "Multiple services, better scalability, more complex infrastructure"
  multiSelect: false
```

### Technology Selection

```markdown
AskUserQuestion:
  question: "Which database should we use for this application?"
  header: "Database"
  options:
    - label: "PostgreSQL"
      description: "Relational, ACID guarantees, complex queries, good for structured data"
    - label: "MongoDB"
      description: "Document store, flexible schema, good for unstructured data"
    - label: "Redis"
      description: "In-memory, very fast, good for caching and real-time features"
  multiSelect: false
```

### Scope Clarification

```markdown
AskUserQuestion:
  question: "What level of completeness do you need for this project?"
  header: "Scope"
  options:
    - label: "MVP"
      description: "Core functionality only, basic tests, minimal docs. Faster delivery."
    - label: "Production-Ready"
      description: "Full features, comprehensive tests, complete docs, security hardened."
  multiSelect: false
```

## Analysis Patterns by Request Type

### Pattern 1: "Build ${something}"

```markdown
Extract:
□ What is ${something}? (web app, CLI tool, API, library)
□ What does it do? (core functionality)
□ Who uses it? (end users, developers, systems)
□ Technology constraints? (language, platform)
□ Integration needs? (existing systems, APIs)
□ Quality bar? (MVP vs production-ready)
```

### Pattern 2: "Add ${feature}"

```markdown
Extract:
□ What system are we adding to? (analyze existing codebase)
□ How does ${feature} integrate? (new module, modify existing)
□ Dependencies? (what else needs to change)
□ Technology match? (use existing stack)
□ Testing requirements? (match existing coverage)
□ Breaking changes? (backward compatibility)
```

### Pattern 3: "Fix ${problem}"

```markdown
Extract:
□ What is current behavior? (describe issue)
□ What is expected behavior? (desired outcome)
□ When does it occur? (conditions, frequency)
□ Impact? (critical, moderate, minor)
□ Root cause known? (need investigation?)
□ Related issues? (systemic or isolated)
```

### Pattern 4: "Optimize ${aspect}"

```markdown
Extract:
□ What ${aspect}? (performance, cost, maintainability)
□ Current state? (baseline metrics)
□ Target state? (desired metrics)
□ Constraints? (can't change X, must keep Y)
□ Measurement? (how to verify improvement)
□ Trade-offs acceptable? (complexity vs gain)
```

## Common Implicit Requirements

**Always consider:**
```markdown
Error Handling:
- User didn't mention, but need graceful error handling
- Logging for debugging
- User-friendly error messages

Testing:
- User didn't mention, but need tests (assume >70% coverage)
- Unit + integration tests minimum
- CI/CD automation

Documentation:
- User didn't mention, but need basic docs
- README with setup instructions
- API documentation if relevant
- Code comments for complex logic

Security:
- User didn't mention, but need security best practices
- Input validation
- Authentication/authorization if user-facing
- No common vulnerabilities (OWASP Top 10)

Performance:
- User didn't mention specific targets, use reasonable defaults
- API responses < 500ms
- Database queries optimized
- No N+1 queries
```

## Best Practices

✅ **Ask when truly ambiguous** - Use AskUserQuestion for major decisions
✅ **Provide context** - Explain trade-offs in option descriptions
✅ **2-4 options** - Not too many choices
✅ **Clear labels** - Concise option names
✅ **Include implicit requirements** - Always add testing, security, etc.

❌ **Don't ask too much** - Make reasonable choices when possible
❌ **Don't ask minor details** - Focus on major decisions
❌ **Don't overwhelm** - Limit questions per interaction
