---
id: workflow-compare-approaches
category: pattern
tags: [workflow, comparison, approach-evaluation, methodology, trade-off-analysis, decision-framework]
capabilities:
  - Systematic approach comparison methodology
  - Multi-dimensional evaluation framework
  - Context-aware recommendation generation
useWhen:
  - Technical approach comparison requiring criteria definition, weighted scoring, prototype validation, and documented trade-off analysis
  - Solution evaluation scenarios needing side-by-side comparison of 2-4 alternatives with recommendation and rationale
estimatedTokens: 480
---

# Approach Comparison Workflow Pattern

**Phases:** Approach Definition (0-25%) → Multi-Dimensional Analysis (25-75%) → Recommendation (75-100%)

Framework for systematically comparing implementation approaches, architectures, or methodologies.

## Phase 1: Approach Definition (0-25%)

**Clarify the comparison:**
```markdown
□ What approaches are being compared?
□ What problem do they solve?
□ What is the decision context?
□ Who are the stakeholders?
□ What is the decision timeline?
```

**Define approaches clearly:**

**For each approach:**
```markdown
Approach: [Name]

Description:
[What it is in 2-3 sentences]

Core principles:
- Principle 1
- Principle 2

Typical use cases:
- Use case 1
- Use case 2

Key characteristics:
- Characteristic 1
- Characteristic 2
```

**Establish comparison dimensions:**
```markdown
Technical dimensions:
□ Implementation complexity
□ Performance characteristics
□ Scalability potential
□ Maintainability
□ Testability
□ Security posture

Operational dimensions:
□ Learning curve
□ Team skill fit
□ Tooling support
□ Debugging ease
□ Monitoring capabilities

Business dimensions:
□ Time to implement
□ Long-term cost
□ Risk level
□ Flexibility/adaptability
□ Strategic alignment

[Select 6-8 most relevant dimensions]
```

## Phase 2: Multi-Dimensional Analysis (25-75%)

**Analyze each dimension systematically:**

**Dimension: [Name] (Weight: X%)**

**Approach A:**
- Score: X/10
- Analysis: [Why this score]
- Evidence: [Data, examples, benchmarks]
- Context notes: [When score changes]

**Approach B:**
- Score: Y/10
- Analysis: [Why this score]
- Evidence: [Data, examples, benchmarks]
- Context notes: [When score changes]

**Approach C:**
- Score: Z/10
- Analysis: [Why this score]
- Evidence: [Data, examples, benchmarks]
- Context notes: [When score changes]

**Repeat for each dimension...**

**Example dimensions analyzed:**

**Implementation Complexity (Weight: 20%)**
```markdown
Approach A (Monolithic):
- Score: 8/10 (simpler)
- Single codebase, straightforward deployment
- Evidence: Typical implementation in 2-3 weeks

Approach B (Microservices):
- Score: 4/10 (complex)
- Multiple services, orchestration needed
- Evidence: Typical implementation in 6-8 weeks

Approach C (Serverless):
- Score: 6/10 (moderate)
- Event-driven, but many moving parts
- Evidence: Typical implementation in 3-4 weeks
```

**Performance Characteristics (Weight: 25%)**
```markdown
Approach A (Monolithic):
- Score: 7/10
- Low latency, no network overhead between components
- Evidence: Median response time 50ms

Approach B (Microservices):
- Score: 6/10
- Network overhead, but scales independently
- Evidence: Median response time 120ms

Approach C (Serverless):
- Score: 5/10
- Cold start issues, but scales to zero
- Evidence: Median 200ms (500ms on cold start)
```

**[Continue for all dimensions...]**

## Phase 3: Synthesis & Recommendation (75-100%)

**Create comparison summary:**

```markdown
## Comparison Summary

| Dimension | Weight | Approach A | Approach B | Approach C |
|-----------|--------|------------|------------|------------|
| Implementation Complexity | 20% | 8/10 | 4/10 | 6/10 |
| Performance | 25% | 7/10 | 6/10 | 5/10 |
| Scalability | 20% | 6/10 | 9/10 | 9/10 |
| Maintainability | 15% | 7/10 | 5/10 | 7/10 |
| Cost | 10% | 8/10 | 5/10 | 7/10 |
| Team Fit | 10% | 9/10 | 6/10 | 7/10 |
| **Weighted Score** | | **7.2** | **6.1** | **6.8** |

[Note: Scores are context-dependent. See detailed analysis below.]
```

**Context-aware recommendations:**

```markdown
## Recommendations by Context

### If optimizing for: Quick delivery and simplicity
**Recommended:** Approach A (Monolithic)
**Reasoning:**
- Fastest to implement (highest complexity score)
- Team already familiar (high team fit score)
- Good enough performance for current scale
**Trade-offs:**
- Lower scalability ceiling
- May need refactoring later if growth exceeds expectations

### If optimizing for: Long-term scalability
**Recommended:** Approach B (Microservices)
**Reasoning:**
- Best scalability characteristics
- Independent service scaling
- Team growth friendly
**Trade-offs:**
- Higher initial complexity
- Longer time to first version
- Requires operational maturity

### If optimizing for: Cost efficiency with variable load
**Recommended:** Approach C (Serverless)
**Reasoning:**
- Pay-per-use model
- Automatic scaling
- Lower operational overhead
**Trade-offs:**
- Cold start latency
- Vendor lock-in considerations
- Debugging complexity

### Our Context: [Describe actual situation]
**Recommended:** [Chosen Approach]
**Primary Reason:** [Key factor]
**Expected Benefits:**
- Benefit 1
- Benefit 2
**Accepted Trade-offs:**
- Trade-off 1 (why acceptable)
- Trade-off 2 (why acceptable)
```

**Decision confidence assessment:**
```markdown
## Confidence Level: High/Medium/Low

Factors increasing confidence:
✅ Clear requirements
✅ Team has experience with chosen approach
✅ Low reversibility cost (can change later)
✅ Proven success in similar contexts

Factors decreasing confidence:
⚠️ Untested at our scale
⚠️ Team lacks experience
⚠️ High reversibility cost
⚠️ Rapid technology change in area

## Validation Plan
To increase confidence before full commitment:
1. [Validation activity 1]
2. [Validation activity 2]
```

**Create decision record:**
```markdown
# Architecture Decision Record: [Approach Choice]

## Status
Proposed / Accepted / Superseded

## Context
[Problem and constraints that led to this decision]

## Decision
We will use [Chosen Approach]

## Rationale
1. [Primary reason]
2. [Secondary reason]
3. [Additional reason]

## Consequences

Positive:
- Consequence 1
- Consequence 2

Negative:
- Consequence 1 (and how we'll mitigate)
- Consequence 2 (and how we'll mitigate)

## Alternatives Considered
- [Approach B]: Not chosen because [reason]
- [Approach C]: Not chosen because [reason]

## When to Reconsider
This decision should be revisited if:
- Condition 1 changes
- Condition 2 occurs
- Timeframe: Review in [X months]
```

## Comparison Best Practices

✅ **Use consistent framework** - Same dimensions for all approaches
✅ **Weight dimensions** - Not all factors equally important
✅ **Provide evidence** - Back up scores with data/examples
✅ **Consider context** - Same approach different scores in different contexts
✅ **Document trade-offs** - No perfect solution, clarify compromises
✅ **Plan validation** - Test assumptions before full commitment
✅ **Make reversibility explicit** - Can we change later? At what cost?

❌ **Don't ignore soft factors** - Team skill/morale matters
❌ **Don't use false precision** - Rough scores fine (no need for 7.3/10)
❌ **Don't skip the "why"** - Scores without reasoning unhelpful
❌ **Don't make static decisions** - Note when to reconsider

## Comparison Shortcuts

**When time is limited:**
```markdown
Quick comparison (1-2 hours):
1. Define 3-4 most critical dimensions only
2. Score intuitively (don't overthink)
3. Focus on show-stoppers (any dimension <4/10?)
4. Pick approach without show-stoppers
```

**When decision is reversible:**
```markdown
Lean comparison:
1. Pick "most likely" approach
2. Identify key risks/assumptions
3. Build with instrumentation to validate
4. Set criteria for when to reconsider
5. Be willing to pivot if assumptions wrong
```

**When stakeholder alignment critical:**
```markdown
Collaborative comparison:
1. Define dimensions together
2. Weight dimensions by vote/discussion
3. Individual scoring then group discussion
4. Focus on disagreements (why different scores?)
5. Build consensus on trade-offs
```

## Success Criteria

✅ All approaches clearly defined
✅ Consistent evaluation framework applied
✅ Context considered in recommendation
✅ Trade-offs explicitly documented
✅ Decision confidence assessed
✅ Validation plan created
✅ Decision record written
