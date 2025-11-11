---
id: workflow-knowledge-capture
category: pattern
tags: [workflow, knowledge-management, documentation, learning, extraction, synthesis]
capabilities:
  - Extract actionable insights from implementations
  - Document learnings systematically
  - Create reusable knowledge artifacts
useWhen:
  - Knowledge extraction workflows requiring documentation generation, code example creation, and best practice capture
  - Post-implementation learning capture needing fragment creation, metadata optimization, and knowledge base integration
estimatedTokens: 520
---

# Knowledge Capture Workflow Pattern

**Phases:** Reflection (0-25%) → Extraction (25-70%) → Validation (70-100%)

Systematic workflow for extracting and documenting learnings from completed work.

## Phase 1: Reflection & Analysis (0-25%)

**Identify knowledge sources:**
- Technical decisions and rationale
- Problems encountered and solutions
- Patterns that worked well
- Mistakes and lessons learned
- Domain expertise gained

**Questions to guide reflection:**
```markdown
□ What was harder than expected? Why?
□ What decisions would I reconsider?
□ What techniques proved especially effective?
□ What would I do differently next time?
□ What domain knowledge did I gain?
```

**Output:** List of 5-10 key learnings worth documenting

## Phase 2: Knowledge Extraction (25-70%)

**Parallel tracks:**

**Track A: Technical Knowledge (25-55%)**
- Document architectural decisions
- Capture design patterns used
- Record technology trade-offs
- Note performance considerations

**Track B: Process Knowledge (30-60%)**
- Workflow patterns that worked
- Effective debugging approaches
- Collaboration strategies
- Time/effort estimates vs actuals

**Track C: Domain Knowledge (35-70%)**
- Business rules discovered
- User needs identified
- Integration challenges
- Compliance/security requirements

**Format:** Create structured documents with:
- Context (what problem was being solved)
- Approach (what was tried)
- Outcome (what worked/didn't work)
- Recommendations (what to do in future)

## Phase 3: Validation & Integration (70-100%)

**Validate knowledge:**
```markdown
□ Is information accurate?
□ Is context sufficient for others to understand?
□ Are recommendations actionable?
□ Are examples provided where helpful?
□ Is it discoverable (good tags/titles)?
```

**Integration:**
- Add to team wiki/documentation
- Tag and categorize appropriately
- Link to related knowledge
- Share with relevant stakeholders

## Knowledge Artifact Types

**Decision Records:**
```markdown
# Decision: [Title]
Date: [YYYY-MM-DD]
Status: Accepted/Superseded

## Context
[Problem and constraints]

## Decision
[What was decided]

## Rationale
[Why this was chosen]

## Consequences
[Trade-offs and implications]
```

**Pattern Documentation:**
```markdown
# Pattern: [Name]

## Problem
[What problem does this solve]

## Solution
[How to implement]

## When to Use
[Applicable scenarios]

## Trade-offs
[Advantages and disadvantages]
```

**Lessons Learned:**
```markdown
# Lesson: [Title]

## Situation
[What happened]

## Challenge
[What went wrong or was difficult]

## Resolution
[How it was addressed]

## Takeaway
[What to remember for next time]
```

## Best Practices

✅ **Capture while fresh** - Document within 1-2 days of completion
✅ **Be specific** - "Use connection pooling for DB performance" not "Make it fast"
✅ **Include context** - Why decisions were made, not just what
✅ **Make searchable** - Good titles, tags, keywords
✅ **Link examples** - Reference code, PRs, tickets

❌ **Don't wait** - Knowledge fades quickly
❌ **Don't sanitize failures** - Mistakes are valuable learning
❌ **Don't document obvious** - Focus on non-trivial insights
❌ **Don't bury insights** - Make key learnings prominent

## Success Criteria

✅ 5-10 key learnings documented
✅ Context and rationale clear
✅ Actionable recommendations provided
✅ Properly tagged and discoverable
✅ Integrated into knowledge base
