# Orchestr8 Usage Guide

> **Comprehensive guide to using Orchestr8 MCP in Claude Code**

This guide covers everything you need to know to effectively use Orchestr8 for autonomous software development workflows.

## Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Using Workflows](#using-workflows)
- [Loading Resources](#loading-resources)
- [Dynamic Matching](#dynamic-matching)
- [Token Budget Strategies](#token-budget-strategies)
- [Best Practices](#best-practices)
- [Related Documentation](#related-documentation)

---

## Overview

Orchestr8 provides two primary ways to interact with its knowledge system:

1. **Workflows (Slash Commands)**: Pre-built processes for common development tasks
2. **Resources**: On-demand loading of agents, skills, patterns, and examples

Both approaches use **just-in-time loading** to minimize token usage while providing comprehensive expertise when needed.

## Core Concepts

### Just-In-Time (JIT) Loading

Instead of loading all resources upfront, Orchestr8 loads only what's needed:

**Traditional approach** (inefficient):
```
Load: 200KB of resources upfront
Use: 5KB for current task
Waste: 195KB (97.5% unused)
```

**Orchestr8 approach** (efficient):
```
Load: 18KB of workflows upfront
Request: Specific expertise for task (2-5KB)
Use: Exactly what's needed (91-97% reduction)
```

### Fragment-Based Resources

Resources are broken into small, focused fragments:

```
typescript-developer agent
├── typescript-core (~650 tokens)
├── typescript-async-patterns (~580 tokens)
├── typescript-testing (~720 tokens)
└── typescript-api-development (~900 tokens)
```

**Benefits:**
- Load only relevant fragments
- Fine-grained token control
- Easy to maintain and update
- Composable for complex tasks

### Static vs Dynamic Loading

**Static loading** - Direct URI reference:
```
orchestr8://agents/_fragments/typescript-core
```
- O(1) lookup (instant)
- Predictable token cost
- Use when resource is known

**Dynamic loading** - Query-based discovery:
```
orchestr8://match?query=typescript+api+auth&maxTokens=2500
```
- Finds relevant resources automatically
- Token budget-aware
- Use when needs are inferred from context

## Using Workflows

Workflows are accessible via slash commands in Claude Code. Each workflow orchestrates a specific development process.

### Available Workflows

| Workflow | Command | Purpose |
|----------|---------|---------|
| **New Project** | `/new-project <description>` | Start new projects from scratch |
| **Add Feature** | `/add-feature <feature>` | Add features to existing codebase |
| **Fix Bug** | `/fix-bug <issue>` | Debug and fix issues |
| **Refactor** | `/refactor <goal>` | Improve code structure |
| **Review Code** | `/review-code <scope>` | Comprehensive code review |
| **Security Audit** | `/security-audit <target>` | Security vulnerability assessment |
| **Optimize Performance** | `/optimize-performance <issue>` | Performance optimization |
| **Deploy** | `/deploy <target>` | Deployment automation |
| **Setup CI/CD** | `/setup-cicd <platform>` | CI/CD pipeline configuration |

See [Workflows Guide](./workflows.md) for detailed documentation.

### Workflow Execution Flow

```
1. User runs slash command with description
   ↓
2. Workflow loads (~2KB)
   ↓
3. Workflow analyzes requirements
   ↓
4. Dynamic resource matching loads relevant expertise
   ↓
5. Workflow executes phases (design → implement → test → deploy)
   ↓
6. Result: Complete implementation with guidance
```

### Example: Adding a Feature

```bash
/orchestr8:add-feature Add user authentication with JWT and refresh tokens
```

**What happens:**

1. **Analysis** (0-20%)
   - Parse requirements
   - Analyze existing codebase
   - Design auth flow

2. **Implementation** (20-70%)
   - Parallel tracks:
     - Backend: Auth endpoints, middleware
     - Tests: Unit and integration tests
   - Dynamic loading: JWT patterns, security best practices

3. **Quality** (70-90%)
   - Code review
   - Security scan
   - Test coverage verification

4. **Integration** (90-100%)
   - Documentation
   - Deployment guidance
   - Monitoring setup

## Loading Resources

Resources provide specialized expertise on-demand.

### Resource URI Format

```
orchestr8://category/resource
orchestr8://category/_fragments/fragment-id
```

### Categories

| Category | Content | Example URI |
|----------|---------|-------------|
| **agents** | AI agent definitions | `orchestr8://agents/_fragments/typescript-core` |
| **skills** | Reusable techniques | `orchestr8://skills/_fragments/error-handling-resilience` |
| **patterns** | Design patterns | `orchestr8://patterns/_fragments/microservices-architecture` |
| **examples** | Code examples | `orchestr8://examples/_fragments/express-jwt-auth` |
| **guides** | Setup guides | `orchestr8://guides/_fragments/aws-eks-setup` |
| **workflows** | Process templates | `orchestr8://workflows/_fragments/workflow-new-project` |

### Loading a Specific Resource

```
Load TypeScript core expertise:
orchestr8://agents/_fragments/typescript-core

Load JWT auth pattern:
orchestr8://patterns/_fragments/security-auth-jwt

Load Express example:
orchestr8://examples/_fragments/express-minimal-api
```

See [Resources Guide](./resources.md) for comprehensive resource documentation.

## Dynamic Matching

Dynamic matching finds relevant resources based on semantic queries.

### Matching Modes

Orchestr8 provides three matching modes:

#### 1. Index Mode (Recommended)

**Fastest, most token-efficient:**
```
orchestr8://match?query=retry+exponential+backoff&mode=index&maxResults=5
```

**Characteristics:**
- Latency: 5-10ms (index), <2ms (quick cache)
- Tokens: 50-120 tokens
- Method: Pre-built keyword indexes
- Best for: Specific queries, production use

#### 2. Catalog Mode (Default)

**Lightweight resource discovery:**
```
orchestr8://match?query=typescript+testing&mode=catalog&maxResults=10
```

**Characteristics:**
- Latency: 15-20ms
- Tokens: 50-120 tokens
- Method: Semantic scoring
- Best for: Exploratory queries, browsing

#### 3. Full Mode

**Complete content immediately:**
```
orchestr8://match?query=typescript+api&mode=full&maxTokens=2500&maxResults=3
```

**Characteristics:**
- Latency: 15-20ms
- Tokens: 800-3000 tokens
- Method: Semantic scoring + assembly
- Best for: Ready to use content

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | string | required | Search terms (use `+` for spaces) |
| `mode` | enum | catalog | `index`, `catalog`, or `full` |
| `maxTokens` | number | 3000 | Token budget (full mode only) |
| `maxResults` | number | 15 | Max results (catalog/index mode) |
| `minScore` | number | 10 | Minimum relevance score (0-100) |
| `categories` | string | all | Category filter (comma-separated) |

### Query Examples

**Find TypeScript API expertise:**
```
orchestr8://match?query=typescript+rest+api+authentication&mode=catalog
```

**Fast lookup for specific pattern:**
```
orchestr8://match?query=circuit+breaker+timeout&mode=index&maxResults=5
```

**Load complete content:**
```
orchestr8://match?query=python+fastapi+async&mode=full&maxTokens=2500
```

**Category-specific search:**
```
orchestr8://agents/match?query=build+graphql+api&mode=catalog
```

**Multi-category search:**
```
orchestr8://match?query=testing+strategies&categories=skills,patterns&mode=catalog
```

## Token Budget Strategies

Optimize token usage based on task complexity and requirements.

### Budget Guidelines

| Task Complexity | Budget | Use Case |
|----------------|--------|----------|
| **Quick reference** | 500-1000 | Single concept, pattern, or example |
| **Task context** | 1500-2500 | Feature implementation, bug fix |
| **Deep expertise** | 3000-5000 | Complex architecture, system design |
| **Comprehensive** | 5000+ | New project, major refactoring |

### Strategy 1: Catalog First, Load Selectively

**Most token-efficient:**

1. Query with catalog mode
2. Review results
3. Load only what you need

```
Step 1: Discover
orchestr8://match?query=kubernetes+deployment&mode=catalog&maxResults=10

Step 2: Review catalog (100 tokens)
- kubernetes-deployment-guide
- helm-charts-pattern
- docker-compose-example

Step 3: Load specific resources (2000 tokens)
orchestr8://guides/_fragments/kubernetes-deployment
orchestr8://patterns/_fragments/helm-charts
```

**Token usage:** 100 + 2000 = 2100 tokens (vs 5000+ for loading everything)

### Strategy 2: Use Index Mode for Speed

**Fastest queries:**

```
orchestr8://match?query=retry+exponential+backoff&mode=index&maxResults=5
```

**Token usage:** 50-120 tokens
**Latency:** <10ms

### Strategy 3: Full Mode for Convenience

**When you need content immediately:**

```
orchestr8://match?query=typescript+developer&mode=full&maxTokens=2000&categories=agents
```

**Token usage:** ~2000 tokens (complete agent content)
**Trade-off:** Higher tokens, but saves separate load step

### Strategy 4: Category Filtering

**Narrow search scope:**

```
orchestr8://skills/match?query=error+handling&mode=catalog
```

**Benefits:**
- More relevant results
- Faster matching
- Lower token cost (fewer results)

### Strategy 5: Progressive Loading

**Start small, expand as needed:**

```
Step 1: Core expertise (1000 tokens)
orchestr8://agents/_fragments/typescript-core

Step 2: Add specific skills (500 tokens)
orchestr8://skills/_fragments/api-design-rest

Step 3: Add examples if needed (800 tokens)
orchestr8://examples/_fragments/express-jwt-auth
```

**Total:** 2300 tokens, loaded progressively

## Best Practices

### Writing Effective Queries

**Good queries** (specific keywords):
```
typescript async error handling retry
kubernetes deployment helm charts production
jwt authentication refresh tokens security
```

**Avoid** (too generic):
```
api development
error handling
backend code
```

### Choosing the Right Mode

**Use index mode when:**
- You have specific keywords
- Speed is critical
- Token budget is tight
- Query is well-defined

**Use catalog mode when:**
- Exploring resources
- Unsure what's available
- Want to review options first
- Budget allows 100-200 tokens for discovery

**Use full mode when:**
- You know exactly what you need
- Ready to use content immediately
- Budget allows 2000-5000 tokens
- Convenience over efficiency

### Resource Selection

**Load specific resources when:**
- You know the exact resource needed
- O(1) lookup is preferred
- Predictable token cost required

**Use dynamic matching when:**
- Discovery is needed
- Resource names are unknown
- Context determines requirements
- Flexible composition needed

### Token Budget Allocation

**For feature development:**
```
Workflow: ~2KB
Resources: 2-3KB
Working space: Remaining tokens
```

**For bug fixing:**
```
Workflow: ~2KB
Diagnostics: 1-2KB
Working space: Remaining tokens
```

**For new project:**
```
Workflow: ~2KB
Architecture: 3-5KB
Working space: Remaining tokens
```

## Related Documentation

- [Workflows Guide](./workflows.md) - Detailed workflow documentation
- [Resources Guide](./resources.md) - Comprehensive resource guide
- [Examples](../examples/README.md) - Practical usage examples
- [Matching System](../matching/README.md) - How dynamic matching works
- [Architecture](../architecture/README.md) - System design and implementation

---

**Next Steps:**
- Read [Workflows Guide](./workflows.md) for workflow details
- Explore [Resources Guide](./resources.md) for resource system
- Try [Basic Examples](../examples/basic-usage.md) for hands-on practice

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-11
