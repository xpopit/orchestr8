---
id: compliance-documentation-requirements
category: skill
tags: [compliance, documentation, policies, audit, evidence, soc2, hipaa, gdpr]
capabilities:
  - Compliance documentation structure and requirements
  - Policy and procedure documentation templates
  - Technical documentation for compliance (architecture, data flow, encryption)
  - Evidence record organization and retention
useWhen:
  - Creating compliance documentation from scratch for SOC 2 Type II audit organizing security policies and control evidence
  - Building audit evidence repository collecting access logs, change records, and incident reports with automated timestamping
  - Designing control documentation template for GDPR, HIPAA, and SOC 2 with implementation procedures and test results
  - Implementing automated compliance reporting dashboard aggregating evidence from GitHub, AWS CloudTrail, and application logs
  - Organizing security policy documentation covering access control, encryption, incident response, and business continuity procedures
estimatedTokens: 550
---

# Compliance Documentation Requirements

Structure and maintain documentation required for GDPR, HIPAA, SOC 2, and other compliance frameworks.

## Required Documentation

### 1. Policies and Procedures

**Information Security Policy:**
- Scope and purpose
- Roles and responsibilities
- Security controls overview
- Incident response procedures
- Data classification

**Access Control Policy:**
- Authentication requirements
- Authorization model (RBAC)
- Password policies
- MFA requirements
- Access review process

**Incident Response Plan:**
- Incident classification
- Response team roles
- Escalation procedures
- Communication protocols
- Post-incident review process

**Business Continuity Plan:**
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)
- Backup procedures
- Disaster recovery steps
- Testing schedule

**Data Retention Policy:**
- Data categories and retention periods
- Deletion procedures
- Legal holds
- Backup retention

### 2. Technical Documentation

**System Architecture Diagrams:**
- Application architecture
- Infrastructure topology
- Network boundaries
- Security zones
- Data flows between components

**Data Flow Diagrams:**
- How data enters system
- Where data is stored
- Data transformations
- Data transmission paths
- Third-party integrations

**Network Diagrams:**
- Network topology
- Firewalls and security groups
- Load balancers
- VPN connections
- Internet-facing components

**Encryption Implementation:**
- Encryption algorithms used (AES-256, TLS 1.2+)
- Key management procedures
- Where encryption is applied (at rest, in transit)
- Certificate management

### 3. Evidence Records

**Access Logs:**
- Authentication attempts
- Authorization decisions
- PHI/PII access (for HIPAA/GDPR)
- Administrative actions
- Retention: 30-90 days minimum

**Audit Trails:**
- System changes
- Configuration modifications
- Security event logs
- Database access logs
- Retention: 90-365 days

**Vulnerability Scans:**
- Scan results and remediation
- Frequency: Weekly or monthly
- Tools used (Nessus, Qualys, etc.)
- Risk ratings and prioritization

**Penetration Test Reports:**
- Annual penetration testing
- Findings and remediation
- Retest results
- Third-party assessment reports

**Training Records:**
- Security awareness training
- Compliance training
- Role-specific training
- Completion dates and attestations

## Documentation Template

```markdown
# [Policy/Procedure Name]

**Version:** 1.0
**Last Updated:** [Date]
**Owner:** [Team/Role]
**Approved By:** [Name, Title]

## Purpose
[Why this policy exists]

## Scope
[What this policy covers]

## Definitions
[Key terms used]

## Policy
[The actual policy statements]

## Procedures
[Step-by-step implementation]

## Roles and Responsibilities
[Who does what]

## Compliance and Monitoring
[How compliance is verified]

## Review Schedule
[How often policy is reviewed]

## References
[Related policies, regulations]
```

## Evidence Organization

```
compliance-evidence/
├── policies/
│   ├── information-security-policy.pdf
│   ├── access-control-policy.pdf
│   └── incident-response-plan.pdf
├── technical-docs/
│   ├── architecture-diagrams/
│   ├── data-flow-diagrams/
│   └── network-diagrams/
├── audit-logs/
│   ├── 2025-01/
│   ├── 2025-02/
│   └── 2025-03/
├── security-scans/
│   ├── vulnerability-scans/
│   └── penetration-tests/
└── training/
    ├── completion-records/
    └── training-materials/
```

## Best Practices

✅ **Version control** - Track policy changes over time
✅ **Regular reviews** - Annual policy reviews minimum
✅ **Evidence retention** - Follow retention requirements (90-365 days)
✅ **Centralized storage** - Single source of truth for compliance docs
✅ **Access control** - Restrict access to sensitive compliance documents
✅ **Automation** - Auto-generate evidence where possible (logs, scans)
