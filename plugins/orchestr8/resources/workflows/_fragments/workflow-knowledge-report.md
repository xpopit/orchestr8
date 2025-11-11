---
id: workflow-knowledge-report
category: pattern
tags: [workflow, reporting, documentation, synthesis, communication, stakeholder-management]
capabilities:
  - Generate comprehensive knowledge reports
  - Synthesize information from multiple sources
  - Tailor content to audience needs
useWhen:
  - Knowledge report generation requiring information aggregation, synthesis, formatting, and stakeholder distribution
  - Documentation compilation needing technical content organization, executive summary, and actionable recommendations
estimatedTokens: 480
---

# Knowledge Report Generation Workflow

**Phases:** Planning (0-15%) → Synthesis (15-75%) → Finalization (75-100%)

Systematic workflow for creating clear, actionable knowledge reports.

## Phase 1: Report Planning (0-15%)

**Define report parameters:**
```markdown
□ Audience: Who will read this?
□ Purpose: Why are we creating this report?
□ Scope: What topics to cover?
□ Format: Structure and style requirements?
□ Length: Target word/page count?
□ Deadline: When is this due?
```

**Identify information sources:**
- Existing documentation
- Analysis results
- Research findings
- Expert interviews
- Code/system analysis

**Create outline:**
```markdown
1. Executive Summary
2. Context & Background
3. Findings (organized by theme/priority)
4. Recommendations
5. Next Steps
6. Appendices (optional)
```

## Phase 2: Content Synthesis (15-75%)

**Executive Summary (15-25%)**
- 2-3 paragraphs maximum
- Key findings and primary recommendation
- Written last, after all other sections complete

**Context & Background (25-40%)**
- Problem or question being addressed
- Relevant history
- Scope and constraints
- Methodology used

**Findings (40-65%)**
- Organize by theme or priority
- Use clear headings
- Support with evidence
- Include visualizations if helpful (ASCII tables, diagrams)

**Recommendations (65-75%)**
- Actionable next steps
- Prioritized (must-have, should-have, nice-to-have)
- With rationale for each
- Consider alternatives evaluated

## Phase 3: Finalization (75-100%)

**Quality checks:**
```markdown
□ Executive summary accurate and concise?
□ All claims supported by evidence?
□ Recommendations clear and actionable?
□ Appropriate level of detail for audience?
□ Clear structure with logical flow?
□ Grammar and formatting clean?
□ All sources cited?
```

**Tailor to audience:**
- **Technical:** Include implementation details, code snippets
- **Business:** Focus on impact, costs, timelines
- **Executive:** High-level, decision-focused, brief

**Final polish:**
- Write executive summary (do this last)
- Add table of contents if lengthy
- Include visual aids (tables, diagrams)
- Add references/citations
- Review for clarity and conciseness

## Report Template

```markdown
# [Report Title]

**Date:** [YYYY-MM-DD]
**Author:** [Name/Team]
**Audience:** [Who is this for]

## Executive Summary

[2-3 paragraphs: key findings, primary recommendation, expected impact]

## Context & Background

### Problem Statement
[What question or problem does this address]

### Scope
[What was included/excluded]

### Methodology
[How information was gathered]

## Findings

### Finding 1: [Title]
[Description, evidence, analysis]

### Finding 2: [Title]
[Description, evidence, analysis]

[Continue for each major finding...]

## Recommendations

### Primary Recommendation
[What to do and why]

### Alternative Approaches
[Other options considered and why not chosen]

### Implementation Considerations
[Risks, dependencies, resources needed]

## Next Steps

1. [Immediate action with timeline]
2. [Follow-up action with timeline]
3. [Long-term consideration]

## Appendices

### Appendix A: [Detailed Data]
### Appendix B: [Technical Specifications]
[Include supporting details that would clutter main report]

## References
[Sources cited]
```

## Report Types

**Research Report:**
- Focus: Comprehensive analysis of topic
- Length: Typically longer (10-30 pages)
- Audience: Technical and decision-makers

**Status Report:**
- Focus: Project progress and blockers
- Length: 1-3 pages
- Audience: Project stakeholders

**Analysis Report:**
- Focus: Evaluation of options/approaches
- Length: 5-15 pages
- Audience: Decision-makers

**Incident Report:**
- Focus: What happened, why, how to prevent
- Length: 3-8 pages
- Audience: Technical teams and management

## Best Practices

✅ **Start with outline** - Structure before content
✅ **Use clear headings** - Easy to scan
✅ **Support with evidence** - Data, examples, citations
✅ **Be actionable** - Clear next steps
✅ **Tailor to audience** - Appropriate detail level
✅ **Use visuals** - Tables, diagrams where helpful

❌ **Don't bury the lede** - Key findings upfront
❌ **Don't ramble** - Concise and focused
❌ **Don't omit rationale** - Explain why, not just what
❌ **Don't forget proofreading** - Quality matters

## Success Criteria

✅ Executive summary captures key points
✅ Findings well-organized and supported
✅ Recommendations clear and actionable
✅ Appropriate detail level for audience
✅ Professional formatting and structure
✅ All sources properly cited
