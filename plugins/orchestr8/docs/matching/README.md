# Dynamic Resource Matching

> **Intelligent resource discovery using fuzzy matching and index-based lookups**

## Table of Contents

- [Overview](#overview)
- [Two Matching Modes](#two-matching-modes)
- [When to Use Each Mode](#when-to-use-each-mode)
- [URI Syntax](#uri-syntax)
- [Query Parameters](#query-parameters)
- [Token Optimization](#token-optimization)
- [Quick Start Examples](#quick-start-examples)
- [Related Documentation](#related-documentation)

---

## Overview

Orchestr8 provides **dynamic resource matching** to discover relevant agents, skills, patterns, and examples without hard-coding references. The system supports two complementary approaches:

**1. Fuzzy Matching** - Semantic scoring algorithm that ranks resources by relevance
- Scores resources based on keyword matches in tags, capabilities, and useWhen scenarios
- Flexible and works for any query
- Two output modes: full content or lightweight catalog

**2. Index Lookup** - Pre-built indexes for ultra-fast keyword-based lookups
- O(1) keyword lookups using inverted indexes
- 85-95% token reduction compared to fuzzy matching
- Three-tier strategy: quick cache → index → fuzzy fallback

Both systems use the same `orchestr8://` URI protocol with query parameters to specify search criteria.

---

## Two Matching Modes

### Fuzzy Matching (mode=full or mode=catalog)

**How it works:**
1. Extract keywords from query (remove stop words, normalize)
2. Score all resources against extracted keywords
3. Rank by relevance score
4. Select top matches within token budget
5. Return either full content or catalog

**Characteristics:**
- **Latency**: 15-20ms (cold), <5ms (warm cache)
- **Tokens**: 50-120 tokens (catalog mode), 800-3000 tokens (full mode)
- **Coverage**: 100% of resources
- **Best for**: Exploratory queries, complex multi-keyword searches

**Scoring Algorithm:**
- Tag matches: +10 per keyword
- Capability matches: +8 per keyword
- UseWhen matches: +5 per keyword
- Category filter: +15 bonus
- Small resource (<1000 tokens): +5 bonus

### Index Lookup (mode=index)

**How it works:**
1. Check quick lookup cache for common queries (TIER 1)
2. Extract keywords and lookup in inverted keyword index (TIER 2)
3. Score matches by keyword overlap
4. Fallback to fuzzy match if insufficient results (TIER 3)

**Characteristics:**
- **Latency**: 5-10ms (index), <2ms (quick cache)
- **Tokens**: 50-120 tokens (same as fuzzy catalog)
- **Coverage**: 100% via fallback
- **Best for**: Specific keyword queries, production workloads

**Scoring Algorithm:**
- Exact keyword match: +20 per keyword
- Partial keyword match: +10 per keyword

---

## When to Use Each Mode

### Use Fuzzy Matching (catalog mode) when:

- **Exploring**: "Show me all TypeScript-related resources"
- **Multi-keyword**: "async await error handling patterns"
- **Broad queries**: "API development best practices"
- **Development**: Testing new resources or queries
- **Default choice**: When unsure, use `mode=catalog`

**Example:**
```
orchestr8://match?query=typescript+api+patterns&mode=catalog&maxResults=10
```

### Use Index Lookup when:

- **Specific needs**: "retry exponential backoff timeout"
- **Production**: High-frequency queries in production
- **Performance-critical**: Need <10ms latency
- **Known patterns**: Queries with established keywords
- **Token budget**: Strict token limits

**Example:**
```
orchestr8://match?query=retry+exponential+backoff&mode=index&maxResults=5
```

### Use Fuzzy Matching (full mode) when:

- **Ready to use**: You know exactly what you need and want full content immediately
- **Small result set**: Query will match 1-3 resources
- **Token budget**: You have 2000-5000 tokens available
- **Convenience**: Want to avoid separate load step

**Example:**
```
orchestr8://match?query=typescript+developer&mode=full&maxResults=2&maxTokens=2500
```

---

## URI Syntax

### Dynamic Match URI Format

```
orchestr8://[category]/match?query=<search-terms>&[options]
```

**Components:**
- `orchestr8://` - Protocol prefix
- `[category]/` - Optional category filter (agents, skills, patterns, examples, workflows)
- `match` - Dynamic matching endpoint
- `?query=<terms>` - Required search query (use `+` for spaces or URL encoding)
- `&[options]` - Optional query parameters

### Examples

**Basic query (all categories):**
```
orchestr8://match?query=typescript+api
```

**Category-filtered query:**
```
orchestr8://agents/match?query=typescript+developer
```

**Multi-category query:**
```
orchestr8://match?query=error+handling&categories=skills,patterns
```

**Catalog mode with limits:**
```
orchestr8://match?query=testing+patterns&mode=catalog&maxResults=8&minScore=15
```

**Index mode:**
```
orchestr8://match?query=retry+timeout&mode=index&maxResults=5
```

**Full content mode:**
```
orchestr8://match?query=kubernetes+deployment&mode=full&maxTokens=3000
```

---

## Query Parameters

### Required Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `query` | string | Search terms (use `+` for spaces) | `typescript+async+api` |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | enum | `catalog` | Output mode: `catalog`, `full`, or `index` |
| `maxTokens` | number | 3000 | Maximum tokens in response (full mode only) |
| `maxResults` | number | 15 | Maximum number of results (catalog/index mode) |
| `minScore` | number | 10 | Minimum relevance score threshold (0-100) |
| `categories` | string | all | Comma-separated category filter |
| `tags` | string | none | Required tags (comma-separated) |

### Parameter Details

**mode** - Controls output format and matching strategy
- `catalog` (default): Returns lightweight resource list with MCP URIs (~50-120 tokens)
- `full`: Returns complete resource content within token budget (~800-3000 tokens)
- `index`: Uses pre-built indexes for faster lookups (~50-120 tokens)

**maxTokens** - Token budget for full mode
- Only applies to `mode=full`
- Determines how many resources are included
- Always includes top 3 resources even if over budget
- Typical values: 1500-5000

**maxResults** - Number of results for catalog/index modes
- Only applies to `mode=catalog` or `mode=index`
- Limits the number of resources in the catalog
- Does not affect token count significantly
- Typical values: 5-15

**minScore** - Relevance threshold
- Filters out low-relevance matches
- Higher values (20-30) = stricter matching
- Lower values (5-10) = more permissive
- Default (10) works well for most queries

**categories** - Filter by resource type
- Values: `agents`, `skills`, `patterns`, `examples`, `workflows`
- Can specify multiple: `categories=agents,skills`
- Narrows search space for better precision

**tags** - Required tag filter
- All specified tags must be present
- Useful for strict matching
- Example: `tags=typescript,async` requires both tags

---

## Token Optimization

### Catalog Mode vs Full Mode

**Catalog Mode** (85-95% token reduction):
```
Query: "typescript async patterns"
Catalog Response (~80 tokens):
  1. TypeScript Developer Agent - orchestr8://agents/_fragments/typescript-developer
  2. Async Patterns Skill - orchestr8://skills/_fragments/async-patterns
  3. Error Handling Pattern - orchestr8://patterns/_fragments/error-handling

Load on-demand: Only fetch what you need
```

**Full Mode** (full content immediately):
```
Query: "typescript async patterns"
Full Response (~1800 tokens):
  ## Agent: typescript-developer
  **Score:** 45
  **Tags:** typescript, nodejs, async, rest-api
  **Capabilities:** build REST APIs, async programming, type safety

  [Full content included...]

  ---

  ## Skill: async-patterns
  [Full content included...]
```

### Index Mode vs Fuzzy Mode

**Index Mode** (pre-built lookups):
```
Query: "retry exponential backoff"
Latency: ~5ms (index lookup)
Token Cost: ~60 tokens (compact result)

Process:
1. Extract keywords: ["retry", "exponential", "backoff"]
2. Lookup in keyword-index.json: O(1) per keyword
3. Intersect scenario hashes: O(k)
4. Retrieve metadata: O(n) where n << total resources
5. Return top results
```

**Fuzzy Mode** (semantic scoring):
```
Query: "retry exponential backoff"
Latency: ~15ms (score all resources)
Token Cost: ~80 tokens (catalog result)

Process:
1. Extract keywords: ["retry", "exponential", "backoff"]
2. Load all resources: ~221 fragments
3. Score each resource: O(n * m * k)
4. Sort and select: O(n log n)
5. Return top results
```

### Comparison Table

| Metric | Index Mode | Fuzzy Catalog | Fuzzy Full |
|--------|-----------|---------------|-----------|
| Latency | 5-10ms | 15-20ms | 15-20ms |
| Tokens | 50-120 | 50-120 | 800-3000 |
| Coverage | 100% (fallback) | 100% | 100% |
| Precision | High | High | High |
| Use Case | Specific queries | Exploratory | Ready-to-use |

---

## Quick Start Examples

### Example 1: Explore TypeScript Resources

**Goal:** See what TypeScript-related resources are available

**Query:**
```
orchestr8://match?query=typescript+api+development&mode=catalog&maxResults=10
```

**Response:** Catalog with ~10 resources (~100 tokens)

**Next Step:** Review catalog, then load specific resources:
```
orchestr8://agents/_fragments/typescript-developer
```

### Example 2: Fast Lookup for Specific Pattern

**Goal:** Find retry/timeout handling patterns quickly

**Query:**
```
orchestr8://match?query=retry+timeout+exponential&mode=index&maxResults=5
```

**Response:** Top 5 matches from index (~60 tokens, ~5ms)

**Next Step:** Load the most relevant resource

### Example 3: Get Full Content Immediately

**Goal:** Load complete TypeScript agent content in one request

**Query:**
```
orchestr8://match?query=typescript+developer&mode=full&maxTokens=2000&categories=agents
```

**Response:** Full agent content (~1200 tokens)

**Next Step:** Start using the agent immediately

### Example 4: Find Testing Patterns

**Goal:** Discover testing-related patterns with good relevance

**Query:**
```
orchestr8://patterns/match?query=testing+unit+integration&mode=catalog&minScore=20
```

**Response:** High-relevance testing patterns only

**Next Step:** Review and load selected patterns

### Example 5: Multi-Category Search

**Goal:** Find error handling across skills and patterns

**Query:**
```
orchestr8://match?query=error+handling+resilience&categories=skills,patterns&mode=catalog
```

**Response:** Mixed results from skills and patterns

**Next Step:** Load both types as needed

---

## Related Documentation

### Matching System Details
- [Fuzzy Matching Algorithm](./fuzzy-matching.md) - Scoring algorithm, keyword extraction, selection strategy
- [Index Lookup System](./index-lookup.md) - Pre-built indexes, three-tier strategy, maintenance
- [Performance Comparison](./performance.md) - Benchmarks, token usage, optimization tips

### Architecture
- [System Design](../architecture/system-design.md) - Overall architecture and components
- [MCP Resources](../mcp/resources.md) - Resource loading and URI resolution

### Resources
- [Index Documentation](../../resources/.index/README.md) - Technical details of pre-built indexes
- [Resource Fragments](../../resources/) - Browse available agents, skills, patterns

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-11
**Maintained By:** Orchestr8 Documentation Team
