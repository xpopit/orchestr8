---
id: system-design-principles
category: guide
tags: [architecture, system-design, scalability, patterns, design-decisions, best-practices, resilience, caching]
capabilities:
  - Architecture style selection guidance
  - Database technology selection criteria
  - Scalability pattern implementation
  - Resilience pattern recommendations
  - Caching strategy design
  - Architecture decision framework
useWhen:
  - Architecting new systems requiring decisions between monolithic, microservices, or serverless based on team size and complexity
  - Selecting database technology (PostgreSQL, MongoDB, Redis, Neo4j) based on data structure, query patterns, and consistency requirements
  - Designing scalable systems requiring horizontal scaling with load balancers, stateless services, and database read replicas or sharding
  - Implementing resilience patterns like circuit breakers, exponential backoff retries, and bulkheads for fault-tolerant distributed systems
  - Building caching strategies with multi-layer approach including CDN, Redis, and application caches with TTL and cache-aside patterns
  - Making architecture decisions requiring ADR (Architecture Decision Records) documentation with context, consequences, and trade-off analysis
estimatedTokens: 700
---

# System Design Principles

## Architecture Style Selection

### Monolithic
**When to use:**
- Small to medium projects
- Simple deployment requirements
- Limited team size
- MVP/prototype stage

**Pros:** Simple, fast development, easy debugging
**Cons:** Scaling challenges, tight coupling

### Microservices
**When to use:**
- Large, complex systems
- Multiple teams
- Need independent scaling
- Different tech stacks per service

**Pros:** Scalable, independent deployment, technology flexibility
**Cons:** Complexity, distributed system challenges, higher ops overhead

### Serverless
**When to use:**
- Event-driven workloads
- Variable traffic
- Want to minimize ops
- Stateless operations

**Pros:** Auto-scaling, pay-per-use, no server management
**Cons:** Cold starts, vendor lock-in, debugging challenges

## Database Selection Matrix

| Type | Use Case | Examples |
|------|----------|----------|
| Relational | Structured data, ACID transactions | PostgreSQL, MySQL |
| Document | Flexible schema, nested data | MongoDB, CouchDB |
| Key-Value | Caching, sessions, simple lookups | Redis, DynamoDB |
| Graph | Relationships, social networks | Neo4j, ArangoDB |
| Time-Series | Metrics, logs, IoT | InfluxDB, TimescaleDB |

## Scalability Patterns

### Horizontal Scaling
- Load balancer distributes traffic
- Stateless application servers
- Shared database or database replication

### Vertical Scaling
- Increase server resources
- Simpler but has limits

### Database Scaling
- Read replicas for read-heavy workloads
- Sharding for write-heavy workloads
- Connection pooling

## Caching Strategy

### Cache Layers
1. **Browser Cache** - Static assets (CDN)
2. **Application Cache** - In-memory (Redis)
3. **Database Cache** - Query results
4. **CDN** - Global content delivery

### Cache Invalidation
- Time-based expiration (TTL)
- Event-based invalidation
- Cache-aside pattern

## Resilience Patterns

### Circuit Breaker
```typescript
class CircuitBreaker {
  async call(fn: () => Promise<any>) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Retry with Exponential Backoff
```typescript
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

## Architecture Decision Framework

### Decision Template
```markdown
# ADR-001: Use PostgreSQL for Primary Database

## Status
Accepted

## Context
Need to choose primary database for user data, transactional data.

## Decision
We will use PostgreSQL.

## Consequences
- Pros: ACID compliance, mature ecosystem, strong JSON support
- Cons: More complex than NoSQL for simple use cases
- Migration: Requires learning SQL for team members new to relational DBs
```

### Key Considerations
1. **Functional requirements** - What the system does
2. **Non-functional requirements** - Performance, scalability, security
3. **Constraints** - Budget, timeline, team expertise
4. **Trade-offs** - Every decision has pros and cons
