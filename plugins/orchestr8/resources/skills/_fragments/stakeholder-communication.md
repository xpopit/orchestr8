---
id: stakeholder-communication
category: skill
tags: [stakeholder, communication, status-updates, reporting, risk-management, expectation-management, transparency, executive-summary, escalation, alignment]
capabilities:
  - Clear status reporting
  - Risk identification and communication
  - Expectation setting and management
  - Executive summary creation
  - Stakeholder alignment strategies
  - Escalation path management
useWhen:
  - Communicating technical decisions to non-technical stakeholders with business impact focus and clear trade-offs
  - Building stakeholder update cadence with progress reports, risk identification, and timeline adjustments
  - Designing technical presentation strategy using analogies, visuals, and concrete examples for clarity
  - Creating status report format highlighting accomplishments, blockers, and next steps with action items
  - Implementing stakeholder expectation management with realistic timelines and proactive communication of delays
estimatedTokens: 680
---

# Stakeholder Communication

## Status Update Template

```markdown
## [Project Name] - Week [Date]

**Summary:** Sprint 3 done (95%). Payment delayed 3d (API changes). Q1 launch on track.

**Progress:** Authentication complete, staging deployed, security approved
**Next:** Payment integration, checkout flow, performance testing
**Blockers:** API docs incomplete (3d delay, vendor contact), test env unstable

**Metrics:** Velocity 22/20, 60% burndown, 0 critical bugs, timeline green
**Budget:** $45K/$80K (56%, on track)
```

## RAG Status Framework

🔴 **Red:** Timeline >2wk slip, budget >15% overrun, critical blocker → Escalate
🟡 **Amber:** Timeline 1-2wk slip, budget 10-15% variance, mitigated blocker → Monitor
🟢 **Green:** Within buffer, budget <10% variance, no unmitigated risks → Continue

## Risk Communication

```markdown
**Risk:** Payment gateway integration complexity
**Probability:** 70% | **Impact:** 2wk delay, $15K | **Score:** 7/10

**Indicators:** Incomplete docs, no staging, team lacks PCI expertise

**Mitigation:**
1. Vendor solutions architect (today)
2. PCI consultant ($5K, 1wk)
3. Test harness (3d)
4. Add 1wk buffer

**Contingency:** Alt gateway (Stripe) - 5d effort, $10K
**Owner:** Tech Lead | **Review:** Daily standup
```

## Expectation Management

✅ **Do:** "Based on 20pts/sprint velocity and 80pt scope: 4 sprints (8wks). Recommend 10wks for integration buffer."
❌ **Don't:** "We'll be done in a month, maybe two. Depends how it goes."

## Scope Change Template

```markdown
**Change:** Add social login | **Requested:** PM | **Value:** +5-10% conversion

**Impact:** 13pts (1 sprint), +2wks, +$8K, legal dependency

**Options:**
1. Add to scope → Delay launch
2. Defer to v1.1 → Launch on time
3. Swap for feature X → Same timeline

**Recommend:** Option 3 | **Decision by:** [Date] | **Owner:** PO
```

## Executive Communication

**Principles:** Bottom line first, visual over text, exception-based, action-oriented

❌ **Bad:** "Good sprint. Team worked hard. Some challenges. We'll keep going."
✅ **Good:** "Launch delayed 1wk (API complexity). Mitigation: vendor escalation. Timeline: Feb 15→22. Approve $5K consultant? (Y/N)"

## Escalation Protocol

**When:** Timeline >1wk risk, budget >10% overrun, blocker >2d, scope >20% change, team conflict, dependency failure

```markdown
**ESCALATION:** Payment integration blocked
**Issue:** Vendor API breaking changes undocumented
**Impact:** 2wk delay, $12K cost | **Discovered:** Mon, escalated Wed (2d old)

**Attempted:** Vendor support (no response 48h), alt gateways reviewed (5d switch), workaround (uncertain)

**Request:**
1. Executive vendor contact
2. Alt gateway approval
3. Budget variance approval

**Urgency:** High - decide by Fri to avoid 2wk slip
**Owner:** PM → Dir Engineering | **Updates:** Daily
```

## Delivering Bad News

**Structure:** Problem → Cause (no blame) → Impact (data) → Options → Decision request

**Example:** "Auth doesn't meet SOC2 (missed in review). Impact: 3wk delay, $20K. Options: (1) Delay launch, (2) Skip enterprise tier, (3) External firm (+$15K, minimal delay). Recommend 3. Approve by EOD?"

## Managing Pushback

✅ **Do:** Listen fully, acknowledge concerns, use data, offer alternatives, clarify constraints
❌ **Don't:** Get defensive, overpromise, hide bad news, blame team, agree without analysis

## Communication Cadence

| Stakeholder | Method | Frequency | Content |
|-------------|--------|-----------|---------|
| Executive | Email | Weekly | RAG, risks, decisions |
| Product Owner | Standup/Slack | Daily | Progress, blockers |
| Dev Team | Standup | Daily | Technical details |
| Vendors | Email/calls | As needed | Integration status |
| End Users | Release notes | Per release | Features, changes |
