---
id: web-research-strategies
category: skill
tags: [research, web-search, information-gathering, source-evaluation, synthesis, citation, fact-checking, documentation, analysis, investigation]
capabilities:
  - Execute targeted web searches with effective query construction
  - Evaluate source credibility and information quality
  - Synthesize findings across multiple sources
  - Properly cite and document research sources
  - Distinguish between marketing claims and technical reality
  - Extract actionable insights from documentation
useWhen:
  - Comparing React Server Components vs Next.js App Router for SEO-optimized e-commerce platform with cited performance benchmarks
  - Verifying TypeScript 5.0 breaking changes impact on existing monorepo with 50+ packages before migration
  - Researching Kubernetes ingress controller options for multi-tenant SaaS with traffic shaping and SSL termination requirements
  - Validating WebAssembly performance claims for CPU-intensive image processing pipeline with real-world benchmarks
  - Investigating recent security vulnerabilities in Express.js middleware stack and recommended mitigation strategies
  - Building authoritative documentation for team on testing strategies for async React hooks with concurrent rendering
estimatedTokens: 650
---

# Web Research Strategies

## Search Query Patterns

**Targeted Technical Searches:**
```
"[technology] official documentation"
"[technology] vs [alternative] 2025"
"[technology] production issues" OR "gotchas" OR "limitations"
"[technology] best practices [use-case]"
site:github.com "[technology] examples"
```

**Recency Filters:**
- Add year to queries: "typescript api design 2025"
- Use site filters: `site:stackoverflow.com` `site:dev.to`
- Check "Past year" or custom date ranges
- Look for version-specific docs: "React 19" not just "React"

## Source Credibility Hierarchy

**Tier 1 - Authoritative (Trust by default):**
- Official documentation and GitHub repos
- RFCs, standards bodies (W3C, IETF, ECMA)
- Published academic papers and research
- Established technical blogs (engineering.company.com)

**Tier 2 - Community (Verify claims):**
- Stack Overflow accepted answers (check date + votes)
- Dev.to, Medium articles (verify author credentials)
- Conference talks and presentations
- Popular YouTube channels (check technical depth)

**Tier 3 - Marketing (Skeptical evaluation):**
- Vendor blogs and whitepapers
- Tutorial sites with affiliate links
- Social media hot takes
- Unverified benchmarks

## Red Flags for Unreliable Information

❌ **Dismiss if present:**
- No dates or last-updated timestamp
- Marketing language: "revolutionary", "game-changing", "10x faster"
- No code examples or technical details
- Single source with no corroboration
- Benchmarks without methodology
- "Works on my machine" anecdotes

✅ **Trust signals:**
- Recent publication (last 6-12 months)
- Code examples with explanation
- Links to official docs/sources
- Discusses trade-offs and limitations
- Author expertise visible (GitHub, credentials)
- Multiple independent sources agree

## Synthesis Framework

**1. Multi-Source Validation (3-source rule):**
- Find 3 independent sources confirming key facts
- Note where sources disagree (often reveals nuance)
- Prioritize official docs as tie-breaker

**2. Pattern Recognition:**
- Common pain points across sources = real concern
- Repeated recommendations = likely best practice
- Evolving consensus = check publication dates

**3. Practical Reality Check:**
- Does this work with our stack/constraints?
- Are there hidden costs (learning curve, maintenance)?
- What's the migration/adoption path?

## Citation Best Practices

**Document Sources Immediately:**
```markdown
**Source:** [Official React Docs - Server Components](https://react.dev/reference/rsc/server-components)
**Date Accessed:** 2025-11-10
**Key Finding:** Server Components reduce client bundle by 30-40% in typical apps
```

**Reference Format:**
- Include direct URLs (not just domain)
- Note date accessed (things change fast)
- Quote key claims verbatim when critical
- Link to specific sections, not just homepage

## Research Workflow

**Phase 1: Broad Survey (15-20 min)**
- Search official docs + "awesome [technology]" lists
- Scan 5-7 sources for landscape overview
- Note major alternatives and trade-offs

**Phase 2: Deep Dive (20-30 min)**
- Read official docs in detail
- Check GitHub issues for real problems
- Find 2-3 production experience articles
- Look for video demos/tutorials

**Phase 3: Validation (10-15 min)**
- Cross-reference claims across sources
- Check recent discussions (Reddit, HN, Twitter)
- Verify version compatibility and support status
- Document findings with citations

## Quick Evaluation Questions

Before concluding research:
1. Can I cite 3+ authoritative sources?
2. Have I checked information recency (< 1 year old)?
3. Do I understand the trade-offs, not just benefits?
4. Have I found any production gotchas or limitations?
5. Is there community consensus or debate?
6. Can I explain WHY this is recommended?

## Example: Framework Research

**Query sequence:**
```
1. "Next.js official documentation server actions"
2. "Next.js server actions production issues 2025"
3. site:github.com "next.js server actions example"
4. "Next.js vs Remix server mutations comparison"
```

**Synthesis:**
- Official docs: Feature details and API
- Production issues: Real-world gotchas
- GitHub examples: Implementation patterns
- Comparison: Trade-offs vs alternatives

**Output:** Informed decision backed by multiple authoritative sources with documented citations.
