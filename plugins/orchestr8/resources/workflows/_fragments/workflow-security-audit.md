---
id: workflow-security-audit
category: pattern
tags: [workflow, security, audit, OWASP, vulnerability-assessment, compliance, penetration-testing, remediation]
capabilities:
  - Comprehensive security vulnerability assessment
  - OWASP Top 10 systematic evaluation
  - Dependency and infrastructure security audit
  - Authentication and authorization review
  - Security remediation roadmap with priorities
useWhen:
  - Performing security audits or assessments
  - Preparing for compliance certifications (SOC2, HIPAA, GDPR)
  - Evaluating application security posture
  - Pre-production security validation
estimatedTokens: 600
---

# Security Audit Pattern

**Methodology:** Reconnaissance → Assessment → Remediation Planning

**Scope Options:** Application layer, API, infrastructure, or full stack

## Phase Structure (0% → 100%)

### Phase 1: Reconnaissance (0-20%)
**Goals:** Map attack surface and security context

**Key Activities:**
- Identify all entry points (APIs, forms, file uploads, webhooks)
- Map authentication and authorization flows
- List third-party dependencies and integrations
- Document data flows and sensitive data storage (PII, credentials, tokens)
- Review existing security controls (WAF, rate limiting, encryption)
- Enumerate trust boundaries and privilege levels

**Output:** Attack surface map and security inventory

### Phase 2: Vulnerability Assessment (20-80%)
**Goals:** Identify security vulnerabilities across all dimensions

**Parallel Tracks:**

**Track A: OWASP Top 10 (20-60%)**
Systematically evaluate each category:

1. **Broken Access Control:** Horizontal/vertical privilege escalation, IDOR, missing auth checks
2. **Cryptographic Failures:** Weak encryption, plaintext sensitive data, insecure protocols
3. **Injection:** SQL, NoSQL, command, LDAP, XPath injection vulnerabilities
4. **Insecure Design:** Missing security controls, threat modeling gaps
5. **Security Misconfiguration:** Default credentials, verbose errors, unnecessary features enabled
6. **Vulnerable Components:** Outdated dependencies with known CVEs
7. **Authentication Failures:** Weak passwords, missing MFA, broken session management
8. **Data Integrity Failures:** Unsigned updates, insecure deserialization
9. **Logging/Monitoring Failures:** Missing audit logs, no alerting on suspicious activity
10. **SSRF:** Server-side request forgery, unvalidated URLs

**Track B: Dependency Audit (25-50%)**
- Run security scanners: `npm audit`, `pip-audit`, `cargo audit`, Snyk
- Check for known vulnerabilities (CVEs) with severity ratings
- Verify dependency versions are current and patched
- Assess transitive dependencies
- Review license compliance (GPL, MIT, Apache)

**Track C: Infrastructure Security (30-65%)**
- Network configuration review (firewalls, security groups, network policies)
- TLS/SSL configuration and certificate validation
- Secrets management (no hardcoded secrets, proper vault usage)
- Container security (Dockerfile best practices, image scanning)
- CI/CD pipeline security (credential handling, approval gates)
- Cloud resource configuration (S3 buckets public, IAM overpermissive)

**Track D: Authentication & Authorization (35-70%)**
- Password policies (length, complexity, hashing algorithm: bcrypt/Argon2)
- Session management (secure tokens, expiration, invalidation)
- OAuth/OIDC implementation review (proper state, PKCE)
- RBAC/permissions enforcement (consistently applied)
- Multi-factor authentication (TOTP, U2F support)
- API key management and rotation

**Track E: Data Protection (40-75%)**
- Encryption at rest (AES-256, database encryption)
- Encryption in transit (TLS 1.2+, certificate validation)
- PII/sensitive data handling (minimization, pseudonymization)
- Data retention and secure deletion policies
- Backup security (encrypted, access controlled)
- Compliance gaps (GDPR, HIPAA, SOC2, PCI-DSS)

**Output:** Comprehensive vulnerability findings with severity ratings (Critical, High, Medium, Low)

### Phase 3: Reporting & Remediation Planning (80-100%)
**Goals:** Deliver actionable security recommendations

**Key Activities:**
- Categorize findings by severity using CVSS scoring
- Provide specific remediation steps with code examples
- Estimate remediation effort (hours/days) and priority
- Create security improvement roadmap (quick wins, strategic fixes)
- Document compliance gaps with requirements
- Recommend security tools and processes

**Report Structure:**

**Executive Summary:**
- Overall security posture assessment
- Critical findings requiring immediate attention
- Risk summary and business impact

**Detailed Findings:**
- Organized by OWASP category or component
- Each finding includes:
  - Description and impact
  - Proof of concept (if applicable)
  - Severity rating with justification
  - Remediation steps with code examples
  - References to standards/best practices

**Remediation Roadmap:**
- **Immediate (Week 1):** Critical vulnerabilities (RCE, SQLi, auth bypass)
- **Short-term (Month 1):** High severity issues (XSS, CSRF, sensitive data exposure)
- **Medium-term (Quarter 1):** Medium severity and compliance gaps
- **Long-term (Year 1):** Low severity and security hardening

**Output:** Security audit report with prioritized remediation plan

## Parallelism Strategy

**All assessment tracks run concurrently:**
- OWASP, dependencies, infrastructure, auth, data protection assessed simultaneously
- Maximizes audit efficiency

## Critical Security Principles

**Defense in Depth:** Multiple security layers (network, application, data)
**Least Privilege:** Minimal permissions required for functionality
**Fail Secure:** Errors should deny access, not grant it
**Security by Design:** Not an afterthought

## Success Criteria
- All OWASP Top 10 vulnerabilities assessed
- Dependencies scanned for CVEs
- Infrastructure security reviewed
- Findings categorized by severity
- Remediation plan with specific steps
- Compliance gaps documented
