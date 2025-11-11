---
id: technology-evaluation
category: skill
tags: [technology-evaluation, framework-comparison, tool-selection, decision-making, proof-of-concept, trade-offs, architecture, assessment, criteria, validation]
capabilities:
  - Compare frameworks and tools systematically
  - Define weighted evaluation criteria
  - Assess technology maturity and ecosystem health
  - Validate choices through proof-of-concept
  - Identify hidden costs and risks
  - Make data-driven technology decisions
useWhen:
  - Evaluating Prisma vs Drizzle vs TypeORM for greenfield Next.js application with complex relational data and migration requirements
  - Assessing risk of adopting Bun runtime for production Node.js microservices with existing npm ecosystem dependencies
  - Comparing tRPC vs GraphQL vs REST for type-safe API layer in full-stack TypeScript monorepo with code generation needs
  - Justifying migration from Vue 2 to Vue 3 Composition API vs React 18 with weighted criteria for team expertise and ecosystem maturity
  - Selecting observability platform between Datadog, New Relic, and Grafana Cloud for distributed tracing across 20+ microservices
  - Creating technology decision record for choosing message queue (RabbitMQ vs Kafka vs SQS) for event-driven order processing system
estimatedTokens: 700
---

# Technology Evaluation

## Systematic Comparison Framework

**Step 1: Define Weighted Criteria (total = 100%)**

```markdown
## Evaluation Criteria

| Criterion | Weight | Rationale |
|-----------|--------|-----------|
| Developer Experience | 25% | Team productivity impact |
| Performance | 20% | User experience requirements |
| Ecosystem & Libraries | 15% | Integration needs |
| Community & Support | 15% | Long-term maintenance |
| Learning Curve | 10% | Team expertise & timeline |
| Production Track Record | 10% | Risk mitigation |
| Cost (TCO) | 5% | Budget constraints |
```

**Customize weights** based on project constraints:
- Startup MVP: DX 35%, Speed 25%, Cost 15%
- Enterprise: Support 30%, Maturity 25%, Security 20%
- High-scale: Performance 40%, Scalability 30%, Cost 15%

**Step 2: Score Each Option (1-10 scale)**

Research-backed scores for each criterion:
- Document evidence for scores
- Use benchmark data where available
- Note subjective vs objective metrics

## Technology Health Assessment

**Ecosystem Maturity Checklist:**

✅ **Healthy Signs:**
- Active GitHub: Commits in last month, issues addressed < 2 weeks
- Growing adoption: npm downloads trending up
- Corporate backing or foundation governance
- LTS or stable release policy
- Migration guides between versions
- Active Discord/Slack with responsive maintainers

❌ **Warning Signs:**
- Last commit > 3 months ago
- Major issues unanswered > 1 month
- Maintainer burnout signals ("seeking maintainers")
- Breaking changes every minor version
- Declining download trends
- Lack of production usage examples

**Quick Health Check:**
```bash
# GitHub metrics
Stars, forks, recent activity, issue response time

# npm metrics
npm info [package] | grep "downloads|version|updated"

# Search metrics
"[framework] production" - look for case studies
```

## Trade-offs Matrix

**Create for top 2-3 candidates:**

```markdown
| Aspect | Option A | Option B | Winner |
|--------|----------|----------|--------|
| Build Speed | 2s (Vite) | 8s (Webpack) | A |
| Type Safety | Partial | Full | B |
| Bundle Size | 45KB | 120KB | A |
| DX: Hot Reload | Instant | 2-3s | A |
| Ecosystem | Mature | Growing | A |
| Learning Curve | Moderate | Steep | A |
| **Score** | **5/6** | **1/6** | **A** |
```

**Decision Matrix:**
```
IF (score difference < 20%) THEN run POC
IF (clear winner > 30% ahead) THEN document choice
IF (tied) THEN default to team familiarity
```

## Proof-of-Concept Protocol

**When to POC:**
- New technology with limited production track record
- Performance requirements are critical
- Integration complexity unknown
- Team unfamiliarity with options

**30-Minute Mini-POC:**

```markdown
## POC Goals
1. Verify core use case works
2. Test integration with existing stack
3. Measure performance baseline
4. Assess developer experience

## Success Criteria
- [ ] Hello World running < 15 min
- [ ] Key integration tested (DB, auth, etc.)
- [ ] Build/deploy pipeline works
- [ ] Dev tooling functional (debug, hot reload)

## Timebox: 30 minutes
If not working in 30 min = likely problematic
```

**POC Template:**
```bash
mkdir poc-[technology]
cd poc-[technology]

# Initialize
[init-command]

# Test key integration
[add critical dependency]

# Measure
time npm run build
ls -lh dist/

# Document
echo "## Findings" > RESULTS.md
```

## Hidden Costs Assessment

**Total Cost of Ownership (TCO) Factors:**

✅ **Consider beyond licensing:**
- Learning curve: Training time × hourly rate × team size
- Migration effort: If replacing existing tech
- Hosting requirements: Specialized infrastructure?
- Monitoring/observability: Built-in vs third-party tools
- Support contracts: Enterprise support needed?
- Lock-in risk: Vendor dependency, export options

❌ **Common oversights:**
- "Free tier" that expires at scale
- Required paid plugins for production features
- Expensive CI/CD minutes for builds
- Specialized hosting (edge functions, serverless limits)
- Team ramp-up time extending timeline

**TCO Calculation:**
```
Initial: Development + Setup + Migration
Annual: Hosting + Licenses + Support + Maintenance
3-Year Total: Initial + (Annual × 3) + Risk Buffer (20%)
```

## Decision Documentation

**Technology Decision Record (TDR):**

```markdown
# TDR-001: Choose [Technology] for [Use Case]

## Context
What problem are we solving?
What constraints do we have?

## Options Considered
1. [Option A] - Brief description
2. [Option B] - Brief description
3. [Option C] - Brief description

## Evaluation Results
| Criterion (Weight) | Option A | Option B | Option C |
|--------------------|----------|----------|----------|
| DX (25%) | 8 (2.0) | 6 (1.5) | 7 (1.75) |
| Performance (20%) | 9 (1.8) | 7 (1.4) | 8 (1.6) |
| **Total** | **8.5** | **6.8** | **7.2** |

## Decision
**Selected:** Option A

**Rationale:**
- Highest weighted score (8.5/10)
- Best developer experience confirmed in POC
- Active community and corporate backing
- Clear migration path from current stack

## Trade-offs Accepted
- Smaller ecosystem than Option B
- Newer technology (1.5 years vs 5 years)
- Mitigation: POC validated core use cases

## Sources
- [Official Docs](url)
- [Benchmark Study](url)
- [Production Case Study](url)
```

## Quick Decision Flowchart

```
1. Is there an obvious industry standard? → Use it (unless clear reason not to)
2. Do we have in-house expertise? → Weight familiarity higher
3. Is performance critical? → Run benchmarks/POC
4. Is this a risky/new choice? → POC + fallback plan
5. Still tied? → Choose simpler option (fewer moving parts)
```

## Red Flags for Technology Choices

❌ **Abort if:**
- "Rewrite from scratch" claims (rarely true)
- No production case studies findable
- Requires forking/patching to work
- Solves problem you don't have
- "Will be stable soon" (wait until it is)
- Only one person advocates (check their incentives)

✅ **Green lights:**
- Multiple team members comfortable
- Clear adoption path (migration guide exists)
- Reversible decision (can switch if wrong)
- Solves current pain point measurably
- 3+ companies using in production

## Validation Checklist

Before finalizing choice:
- [ ] Scored against weighted criteria
- [ ] Checked ecosystem health metrics
- [ ] Ran POC or reviewed existing examples
- [ ] Calculated TCO (3-year projection)
- [ ] Documented trade-offs and risks
- [ ] Cited 3+ authoritative sources
- [ ] Identified fallback option if this fails
- [ ] Team consensus or clear decision maker

**Output:** Data-driven technology choice with documented rationale and measurable success criteria.
