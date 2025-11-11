---
id: workflow-research-tech
category: pattern
tags: [workflow, research, technology-evaluation, analysis, decision-making, synthesis, comparison, web-search]
capabilities:
  - Comprehensive technology and pattern research
  - Multi-source information gathering with parallel tracks
  - Trade-off analysis and comparison with decision matrix
useWhen:
  - Technology research requiring ecosystem evaluation, community assessment, security analysis, and adoption recommendation
  - Tech stack evaluation needing maturity scoring, integration compatibility, learning curve analysis, and total cost of ownership
estimatedTokens: 560
---

# Technology Research Pattern

**Phases:** Planning (0-15%) → Gathering (15-65%) → Synthesis (65-100%)

**Research Types:** Comparison, Evaluation, How-to, Feasibility

## Phase 1: Research Planning (0-15%)
- Parse topic, identify key questions
- Define objectives (comparison, evaluation, how-to, feasibility)
- Identify sources (docs, articles, benchmarks, case studies)
- Plan structure and deliverables

## Phase 2: Information Gathering (15-65%)
**Parallel tracks:**
- **Documentation (15-45%):** Official docs, API refs, GitHub repos, release notes
- **Best Practices (20-50%):** Industry standards, design patterns, performance benchmarks, security considerations
- **Real-World Usage (25-55%):** Case studies, pitfalls/lessons learned, community feedback, production experiences
- **Alternatives (30-65%):** Compare trade-offs, pros/cons, adoption trends, ecosystem maturity, long-term viability, licensing/cost

**Sources:** Web search for current info (2024-2025), MCP resources for proven patterns

## Phase 3: Synthesis & Recommendations (65-100%)
- Analyze for patterns and insights
- Compare approaches
- Evaluate trade-offs (performance, complexity, cost, maintainability, learning curve)
- Form recommendations based on context
- Create decision matrix if multiple options
- Document assumptions and caveats

**Decision Matrix:**
| Criterion | Weight | Option A | Option B | Option C |
|-----------|--------|----------|----------|----------|
| Performance | 30% | 9/10 | 7/10 | 8/10 |
| Developer Experience | 25% | 7/10 | 9/10 | 6/10 |
| Ecosystem | 20% | 8/10 | 9/10 | 5/10 |
| Learning Curve | 15% | 6/10 | 8/10 | 7/10 |
| Cost | 10% | 10/10 | 7/10 | 9/10 |

## Report Structure
1. **Executive Summary:** Key findings, primary recommendation (2-3 sentences)
2. **Context:** Research questions, scope, constraints
3. **Findings:** Analysis by criteria, comparisons, evidence
4. **Recommendations:** Primary + alternatives, implementation guidance, risks
5. **References:** Docs, articles, code examples

## Parallelism
All gathering tracks run concurrently (Phase 2) - maximizes efficiency
