---
name: security-audit
description: Comprehensive security vulnerability assessment and remediation
arguments:
  - name: task
    description: Security audit scope (API, auth system, full app)
    required: true
---

# Security Audit: {{task}}

**Request:** {{task}}

## Your Role

You are performing a security audit to identify vulnerabilities and recommend remediation strategies.

## Phase 1: Authentication & Authorization (0-25%)

**→ Load:** @orchestr8://skills/match?query=authentication+authorization+security&maxTokens=1200

**Activities:**
- Review authentication implementation (JWT, sessions, OAuth)
- Check token handling and storage
- Validate password hashing (bcrypt, argon2)
- Assess RBAC/ABAC implementation
- Test session management (timeout, invalidation)
- Check for broken authentication (OWASP A07)
- Verify multi-factor authentication if applicable

**→ Checkpoint:** Auth vulnerabilities identified

## Phase 2: Input & Output (25-50%)

**→ Load:** @orchestr8://skills/match?query=injection+xss+validation+security&maxTokens=1500

**Activities:**
- SQL/NoSQL injection vulnerability scan
- XSS (cross-site scripting) checks
- CSRF protection review
- Input validation and sanitization assessment
- Output encoding verification
- Command injection checks
- Path traversal vulnerability testing
- Check for injection flaws (OWASP A03)

**→ Checkpoint:** Injection vulnerabilities documented

## Phase 3: Infrastructure & Configuration (50-75%)

**→ Load:** @orchestr8://skills/match?query=infrastructure+secrets+configuration+security&maxTokens=1500

**Activities:**
- Secrets management review (no hardcoded secrets)
- HTTPS/TLS configuration (strong ciphers, valid certs)
- CORS policy review (not overly permissive)
- Rate limiting and throttling assessment
- Security headers check (CSP, HSTS, X-Frame-Options)
- Dependency vulnerability scan
- Server configuration review
- Check for security misconfiguration (OWASP A05)

**→ Checkpoint:** Infrastructure issues found

## Phase 4: Report & Remediation (75-100%)

**→ Load:** @orchestr8://skills/match?query=security+remediation+reporting&maxTokens=800

**Activities:**
- Generate vulnerability report (severity, impact, CVSS)
- Risk assessment and prioritization
- Provide remediation steps with code examples
- Document prevention strategies
- Create security checklist for future
- Recommend security tooling (SAST, DAST)
- Plan security testing automation

**→ Checkpoint:** Report complete, remediation plan ready

## Success Criteria

✅ OWASP Top 10 vulnerabilities assessed
✅ Authentication and authorization validated
✅ Injection flaws identified
✅ Infrastructure security reviewed
✅ Vulnerabilities prioritized by severity
✅ Remediation steps documented
✅ Prevention strategies provided
