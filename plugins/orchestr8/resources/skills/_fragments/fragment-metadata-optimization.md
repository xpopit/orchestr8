---
id: fragment-metadata-optimization
category: skill
tags: [fragments, metadata, tags, capabilities, fuzzy-matching, discovery, meta]
capabilities:
  - Fragment metadata structure and optimization
  - Effective tag selection strategies
  - Specific capability definitions
  - Concrete useWhen scenario creation
useWhen:
  - Optimizing fragment metadata with specific tags and capabilities for improved fuzzy matching and discovery
  - Writing effective useWhen scenarios that capture concrete technical contexts for accurate skill fragment selection
  - Designing fragment taxonomy with hierarchical tags enabling multi-dimensional search and filtering
  - Implementing metadata quality standards for fragments ensuring consistency in capability descriptions and use cases
  - Creating fragment metadata schema balancing searchability with maintainability and avoiding tag proliferation
estimatedTokens: 750
---

# Fragment Metadata Optimization

Optimize fragment metadata (tags, capabilities, useWhen) for effective fuzzy matching and discovery.

## YAML Frontmatter Template

```yaml
---
id: ${category}-${technology}-${specialization}
category: agent | skill | pattern | example
tags: [primary-tech, secondary-tech, domain, pattern, use-case]
capabilities:
  - Specific measurable capability 1
  - Specific measurable capability 2
  - Specific measurable capability 3
useWhen:
  - Optimizing fragment metadata with specific tags and capabilities for improved fuzzy matching and discovery
  - Writing effective useWhen scenarios that capture concrete technical contexts for accurate skill fragment selection
  - Designing fragment taxonomy with hierarchical tags enabling multi-dimensional search and filtering
  - Implementing metadata quality standards for fragments ensuring consistency in capability descriptions and use cases
  - Creating fragment metadata schema balancing searchability with maintainability and avoiding tag proliferation
estimatedTokens: ${calculated-token-count}
---
```

## ID Naming Conventions

**Pattern:**
```markdown
${category}-${main-topic}-${specialization}

Examples:
typescript-async-patterns
python-api-fastapi
security-auth-jwt
testing-integration-api
pattern-architecture-microservices
```

## Tag Selection Strategy

**Tag categories to include:**
```markdown
1. Primary technology (typescript, python, rust)
2. Secondary technologies (express, fastapi, react)
3. Domain/area (api, web, cli, mobile)
4. Patterns/techniques (async, rest, graphql)
5. Use case descriptors (authentication, caching, testing)

Target: 5-8 tags total
```

**Tag examples by category:**

**Agent fragments:**
```yaml
# Core agent
tags: [typescript, javascript, types, node, programming]

# API specialization
tags: [typescript, api, rest, express, backend, node]

# Testing specialization
tags: [typescript, testing, jest, unit-test, integration]
```

**Skill fragments:**
```yaml
# Error handling skill
tags: [error-handling, async, try-catch, logging, resilience]

# Testing skill
tags: [testing, integration, api, mocking, assertions]

# Deployment skill
tags: [deployment, cicd, docker, kubernetes, automation]
```

**Pattern fragments:**
```yaml
# Architecture pattern
tags: [architecture, microservices, distributed, scalability]

# Security pattern
tags: [security, authentication, jwt, oauth, authorization]
```

## Capabilities - Make Them Specific

**Bad capabilities (too vague):**
```yaml
capabilities:
  - TypeScript expertise
  - Good at APIs
  - Testing knowledge
```

**Good capabilities (specific & measurable):**
```yaml
capabilities:
  - TypeScript advanced type system (generics, conditional types, mapped types)
  - REST API design with Express.js middleware patterns and error handling
  - Integration testing with Jest including mocking and test data management
```

**Formula:** `${What} + ${How/Details} + ${Context/Technology}`

## UseWhen - Concrete Scenarios

**Bad useWhen (too generic):**
```yaml
useWhen:
  - Optimizing fragment metadata with specific tags and capabilities for improved fuzzy matching and discovery
  - Writing effective useWhen scenarios that capture concrete technical contexts for accurate skill fragment selection
  - Designing fragment taxonomy with hierarchical tags enabling multi-dimensional search and filtering
  - Implementing metadata quality standards for fragments ensuring consistency in capability descriptions and use cases
  - Creating fragment metadata schema balancing searchability with maintainability and avoiding tag proliferation
```

**Good useWhen (specific situations):**
```yaml
useWhen:
  - Optimizing fragment metadata with specific tags and capabilities for improved fuzzy matching and discovery
  - Writing effective useWhen scenarios that capture concrete technical contexts for accurate skill fragment selection
  - Designing fragment taxonomy with hierarchical tags enabling multi-dimensional search and filtering
  - Implementing metadata quality standards for fragments ensuring consistency in capability descriptions and use cases
  - Creating fragment metadata schema balancing searchability with maintainability and avoiding tag proliferation
```

**Formula:** `${Action} + ${Technology/Context} + ${Specific-Requirement}`

## Match Score Analysis

**If fragment isn't being selected:**
```markdown
Debug checklist:
□ Are tags too generic? Add more specific tags
□ Are capabilities vague? Make them concrete
□ Is useWhen too broad? Add specific scenarios
□ Does content match metadata? Ensure alignment
□ Is estimatedTokens accurate? Recalculate
□ Are there competing better-matched fragments? Differentiate
```

## Best Practices

✅ **Rich metadata** - 5-8 specific tags, concrete capabilities/useWhen
✅ **Specific capabilities** - Include technology + details + context
✅ **Concrete useWhen** - Specific scenarios, not generic statements
✅ **Accurate tokens** - Calculate don't guess
✅ **Content-metadata alignment** - Ensure metadata reflects actual content

❌ **Avoid generic metadata** - Hurts fuzzy matching
❌ **Vague capabilities** - Be specific and measurable
❌ **Generic useWhen** - Need concrete scenarios
