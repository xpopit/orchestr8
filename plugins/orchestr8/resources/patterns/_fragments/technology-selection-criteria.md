---
id: technology-selection-criteria
category: pattern
tags: [technology-selection, evaluation, criteria, assessment, tech-stack, due-diligence, maturity, ecosystem]
capabilities:
  - Evaluate technology maturity and viability
  - Assess ecosystem health and support
  - Match technology to team capabilities
  - Identify adoption risks and mitigation
useWhen:
  - Language, framework, or platform selection requiring systematic evaluation of maturity, ecosystem health, team fit, and integration compatibility
  - New technology adoption assessment needing scorecard evaluation across technical maturity, developer experience, and total cost of ownership
  - Technology migration planning requiring due diligence on community activity, corporate backing, security track record, and exit strategy
  - Greenfield project stack decisions balancing proven stability versus cutting-edge features with risk-adjusted adoption strategies
  - Due diligence scenarios requiring shallow (30min), medium (4hr), or deep (2wk) research with prototype validation of finalists
estimatedTokens: 700
---

# Technology Selection Criteria

Systematic framework for evaluating and selecting technologies across languages, frameworks, libraries, and platforms.

## Evaluation Scorecard (0-10 Scale)

```markdown
## Technology: {Name}
**Category:** Language | Framework | Library | Platform | Tool
**Version:** {Current stable version}
**Evaluation Date:** YYYY-MM-DD

### Technical Maturity (Score: __/10)
- [ ] Stable API (breaking changes rare)
- [ ] Performance benchmarks published and favorable
- [ ] Production-grade error handling and debugging
- [ ] Security track record and vulnerability response
- [ ] Backward compatibility guarantees

### Ecosystem Health (Score: __/10)
- [ ] Active development (commits in last 3 months)
- [ ] Regular releases (not abandoned, not thrashing)
- [ ] GitHub stars: >5K (popular) | 1-5K (niche) | <1K (emerging)
- [ ] Community size: StackOverflow questions, forum activity
- [ ] Corporate backing or sustainable funding model

### Developer Experience (Score: __/10)
- [ ] Documentation quality: comprehensive, up-to-date, examples
- [ ] Learning curve: matches team expertise
- [ ] IDE/tooling support: IntelliSense, debuggers, extensions
- [ ] Error messages: helpful, actionable
- [ ] Local development: fast feedback loops

### Integration & Compatibility (Score: __/10)
- [ ] Works with existing tech stack
- [ ] Standard protocols/formats (REST, JSON, SQL, etc.)
- [ ] Cloud provider support (AWS, GCP, Azure)
- [ ] CI/CD tooling available
- [ ] Monitoring/observability integrations

### Team Fit (Score: __/10)
- [ ] Existing expertise on team (0 = none, 10 = experts)
- [ ] Availability of training resources
- [ ] Hiring market depth (can we recruit?)
- [ ] Team excitement/motivation to use
- [ ] Aligns with career development goals

### Total Cost (Score: __/10, inverted)
- [ ] Licensing costs (open source = 10, expensive = 0)
- [ ] Infrastructure costs (hosting, compute, storage)
- [ ] Training and onboarding costs
- [ ] Maintenance and operational overhead
- [ ] Migration/exit costs if change later

**TOTAL SCORE:** ___/60
**WEIGHTED SCORE:** ___ (apply org-specific weights)

**Recommendation:** Adopt | Explore | Monitor | Avoid
```

## Red Flags (Disqualifiers)

🚩 **Immediate rejection criteria:**
- No commits in 12+ months (abandoned)
- Frequent breaking changes (unstable API)
- No semantic versioning or release process
- Single maintainer with no succession plan (bus factor = 1)
- Known unpatched critical security vulnerabilities
- No license or incompatible license (GPL in proprietary product)
- Violates compliance requirements (GDPR, SOC2, etc.)

## Decision Heuristics

### Language Selection

**Choose compiled/typed (Go, Rust, TypeScript, Java) when:**
- Large codebase (>100K lines)
- Long-lived project (5+ years)
- Large team (>10 developers)
- Performance critical
- Safety critical (financial, healthcare)

**Choose interpreted/dynamic (Python, Ruby, JavaScript) when:**
- Rapid prototyping or MVP
- Small team (<5 developers)
- Data science/scripting workflows
- Rich ecosystem critical (ML, data tools)
- Developer velocity paramount

### Framework Selection

**Choose opinionated (Rails, Django, Next.js) when:**
- Standard requirements (CRUD, auth, forms)
- Small to medium team
- Want "golden path" productivity
- Consistency > flexibility

**Choose minimal (Express, Flask, Fastify) when:**
- Unique requirements
- Need full control
- Performance optimization critical
- Existing patterns to follow

### Library vs Build

**Use library when:**
- Commodity functionality (auth, logging, HTTP)
- Well-established solutions exist (>5 years old)
- Non-differentiating capability
- Team lacks domain expertise

**Build custom when:**
- Core business differentiator
- Unique requirements no library satisfies
- Unacceptable dependencies or bloat
- Learning investment worthwhile

## Risk Assessment Questions

**Technical Risk:**
- What's the blast radius if this fails in production?
- Can we rollback easily?
- Do we have monitoring/observability?

**Team Risk:**
- How long to productive competence?
- What if key expert leaves?
- Can we hire for this?

**Business Risk:**
- What's the vendor lock-in?
- What if it's deprecated?
- What's the total cost over 3 years?

**Ecosystem Risk:**
- Is community growing or shrinking?
- Are major companies adopting or abandoning?
- Any superior alternatives emerging?

## Adoption Strategy Matrix

```markdown
| Risk Level | Strategy | Timeline | Review Frequency |
|------------|----------|----------|------------------|
| **Low** (proven, reversible) | Adopt immediately | Weeks | Annually |
| **Medium** (newer, moderate lock-in) | Prototype first (2-week spike) | Months | Quarterly |
| **High** (bleeding edge, one-way door) | Extended evaluation + pilot | 6+ months | Monthly |
```

## Due Diligence Checklist

### Shallow Research (30 minutes)
- [ ] Read official docs homepage and "Getting Started"
- [ ] Check GitHub: stars, issues, commit frequency
- [ ] Scan HackerNews/Reddit for complaints
- [ ] Review alternative comparison articles

### Medium Research (4 hours)
- [ ] Build "Hello World" example
- [ ] Read architecture/design docs
- [ ] Review issue tracker for showstoppers
- [ ] Check migration guides and breaking change history
- [ ] Interview 2-3 users (Twitter, forums, contacts)

### Deep Research (2 weeks)
- [ ] Build realistic prototype of critical path
- [ ] Load test to 2x expected scale
- [ ] Security review and vulnerability scanning
- [ ] Operational dry-run (deploy, monitor, rollback)
- [ ] Team training session and feedback

## Best Practices

✅ **Match maturity to risk** - Proven tech for critical systems, newer tech for peripherals
✅ **Prototype top 2** - Build with finalists, don't just research
✅ **Set decision deadline** - Time-box research, avoid analysis paralysis
✅ **Document criteria weights** - Make priority trade-offs explicit
✅ **Plan exit strategy** - How to migrate off if needed?
✅ **Involve team** - Buy-in matters for adoption success

❌ **Don't cargo cult** - Netflix uses it ≠ you should use it
❌ **Don't ignore team** - Best tech team won't use fails
❌ **Don't over-engineer** - Choose simplest thing that works
❌ **Don't ignore Total Cost of Ownership** - Free license ≠ free operations
❌ **Don't fear boring** - Boring technology is often the right choice

## Example Evaluation: React vs Vue vs Svelte

```markdown
**Context:** Frontend for internal admin tool, team of 3, 2-year timeline

**Scores:**
- React: 48/60 (mature 10, ecosystem 10, DX 7, integration 9, team 8, cost 4)
- Vue: 47/60 (mature 8, ecosystem 8, DX 9, integration 8, team 6, cost 8)
- Svelte: 38/60 (mature 6, ecosystem 6, DX 9, integration 7, team 3, cost 7)

**Decision:** React
**Rationale:** Team has 2/3 with React experience, massive hiring pool, best integration with existing tooling. Accept larger bundle size (cost -6) for productivity (+2 team, +2 ecosystem).

**Risk Mitigation:**
- Bundle size: Use code splitting, lazy loading
- Complexity: Adopt simpler patterns (hooks), avoid overuse of state management

**Review Date:** 6 months (check Svelte maturity, team satisfaction)
```
