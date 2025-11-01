---
description: Comprehensive security audit with OWASP Top 10, vulnerability scanning, secrets detection, and automated remediation
argumentHint: "[scope]"
---

# Security Audit Workflow

Autonomous, comprehensive security auditing from reconnaissance to remediation with compliance validation.

## Execution Instructions

### Phase 1: Security Reconnaissance (15%)

**Use `security-auditor` agent to:**

1. **Define Audit Scope**
   ```markdown
   SCOPE DEFINITION:
   - Application components (frontend, backend, API, database)
   - Infrastructure (cloud resources, containers, networks)
   - Dependencies (npm, pip, maven, etc.)
   - Authentication/authorization systems
   - Data handling (PII, sensitive data)
   - Third-party integrations
   - Compliance requirements (SOC2, GDPR, HIPAA, PCI-DSS)
   ```

2. **Inventory Assets**
   ```bash
   # Map all endpoints
   - Public APIs
   - Internal APIs
   - Admin interfaces
   - Authentication endpoints

   # Identify data stores
   - Databases
   - Caches
   - File storage
   - Session stores

   # List external dependencies
   - Third-party APIs
   - Cloud services
   - CDNs
   - Payment processors
   ```

3. **Threat Modeling**
   ```markdown
   THREATS TO ANALYZE:
   - External attackers
   - Malicious insiders
   - Supply chain attacks
   - Data breaches
   - Service disruption (DoS)
   - Privilege escalation
   - Data exfiltration

   ATTACK SURFACES:
   - Web application
   - APIs
   - Authentication
   - File uploads
   - Database queries
   - Infrastructure
   ```

**CHECKPOINT**: Scope defined, assets inventoried, threats modeled ✓

### Phase 2: Automated Security Scanning (30%)

**Run all scans in parallel using `security-auditor`:**

#### 1. Dependency Vulnerability Scanning

```bash
# Node.js
npm audit --json > security-reports/npm-audit.json
npm audit fix --dry-run

# Python
pip-audit --format json > security-reports/pip-audit.json
safety check --json > security-reports/safety.json

# Java
mvn dependency-check:check
./gradlew dependencyCheckAnalyze

# Go
govulncheck ./...

# Ruby
bundle audit check --update

# Rust
cargo audit
```

**Severity Classification:**
- **Critical**: Remote code execution, authentication bypass
- **High**: SQL injection, XSS, sensitive data exposure
- **Medium**: CSRF, insecure dependencies
- **Low**: Information disclosure, weak crypto

#### 2. Static Application Security Testing (SAST)

```bash
# Semgrep (multi-language)
semgrep --config=auto --json > security-reports/semgrep.json

# Bandit (Python)
bandit -r . -f json > security-reports/bandit.json

# ESLint Security (JavaScript/TypeScript)
eslint . --ext .js,.ts --plugin security --format json > security-reports/eslint-security.json

# SpotBugs + FindSecBugs (Java)
./gradlew spotbugsMain

# Gosec (Go)
gosec -fmt json -out security-reports/gosec.json ./...

# Brakeman (Ruby on Rails)
brakeman -f json -o security-reports/brakeman.json
```

#### 3. Secrets Detection

```bash
# Gitleaks - scan repository history
gitleaks detect --report-path security-reports/gitleaks.json

# TruffleHog - deep secrets scanning
trufflehog filesystem . --json > security-reports/trufflehog.json

# Scan for patterns
# - API keys (AWS, Azure, GCP, Stripe, etc.)
# - Private keys (RSA, SSH, PGP)
# - Database credentials
# - JWT secrets
# - OAuth tokens
# - Password literals
```

#### 4. Container Security (if applicable)

```bash
# Trivy - container vulnerability scanning
trivy image --format json --output security-reports/trivy.json <image-name>

# Docker Scout
docker scout cves <image-name> --format json > security-reports/docker-scout.json

# Check for:
# - Vulnerable base images
# - Exposed secrets in layers
# - Insecure configurations
# - Unnecessary packages
# - Root user usage
```

#### 5. Infrastructure as Code Security

```bash
# Checkov (Terraform, CloudFormation, Kubernetes)
checkov -d . --output json > security-reports/checkov.json

# tfsec (Terraform)
tfsec . --format json > security-reports/tfsec.json

# kube-score (Kubernetes)
kube-score score *.yaml --output-format json > security-reports/kube-score.json

# Check for:
# - Overly permissive IAM policies
# - Unencrypted storage
# - Public exposure
# - Missing security groups
# - Insecure network configurations
```

**CHECKPOINT**: All automated scans complete, results collected ✓

### Phase 3: OWASP Top 10 Manual Review (25%)

**Use `security-auditor` with `code-reviewer` for manual inspection:**

#### A01:2021 - Broken Access Control

```
CHECKS:
✓ Authorization checks on all endpoints
✓ Object-level authorization (user can only access own data)
✓ Function-level authorization (role-based access)
✓ Insecure direct object references (IDOR) prevented
✓ CORS policy properly configured
✓ Default deny for access control

CODE REVIEW:
- Check all API endpoints have auth middleware
- Verify user IDs from token, not request body
- Ensure admin endpoints require admin role
- Test with different user roles
```

**Example vulnerability:**
```python
# VULNERABLE
@app.route('/api/user/<user_id>')
def get_user(user_id):
    return User.query.get(user_id)  # Any user can access any user!

# SECURE
@app.route('/api/user/<user_id>')
@require_auth
def get_user(user_id):
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)
    return User.query.get(user_id)
```

#### A02:2021 - Cryptographic Failures

```
CHECKS:
✓ HTTPS enforced (HSTS enabled)
✓ Passwords hashed with bcrypt/argon2/scrypt (not MD5/SHA1)
✓ Sensitive data encrypted at rest
✓ Sensitive data encrypted in transit
✓ Strong encryption algorithms (AES-256, RSA-2048+)
✓ Proper key management (not hardcoded)
✓ TLS 1.2+ only
✓ Certificate validation

CODE REVIEW:
- Check password hashing algorithm
- Verify database encryption
- Check API uses HTTPS only
- Review encryption key storage
```

#### A03:2021 - Injection

```
CHECKS:
✓ Parameterized queries (no string concatenation)
✓ ORM used properly
✓ Input validation on all user input
✓ Command injection prevented
✓ LDAP injection prevented
✓ NoSQL injection prevented
✓ XPath injection prevented

CODE REVIEW:
- All SQL queries use parameterization
- No eval() or exec() on user input
- Shell commands use argument arrays
- Template engines auto-escape
```

**Example vulnerability:**
```python
# VULNERABLE - SQL Injection
query = f"SELECT * FROM users WHERE email = '{email}'"
cursor.execute(query)

# SECURE - Parameterized Query
cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
```

#### A04:2021 - Insecure Design

```
CHECKS:
✓ Threat modeling performed
✓ Security requirements defined
✓ Secure design patterns used
✓ Rate limiting on APIs
✓ Account lockout after failed logins
✓ Resource limits to prevent DoS
✓ Business logic flaws prevented
✓ Security controls in each tier

DESIGN REVIEW:
- Check for business logic bypasses
- Verify rate limiting implementation
- Review state machine vulnerabilities
- Check for race conditions
```

#### A05:2021 - Security Misconfiguration

```
CHECKS:
✓ No default credentials
✓ Error messages don't leak info
✓ Security headers configured
✓ Unnecessary features disabled
✓ Admin interfaces protected
✓ Directory listing disabled
✓ Stack traces hidden in production
✓ Software up to date

SECURITY HEADERS:
- Content-Security-Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Referrer-Policy: no-referrer
- Permissions-Policy
```

#### A06:2021 - Vulnerable and Outdated Components

```
CHECKS:
✓ All dependencies up to date
✓ No known vulnerabilities (from Phase 2)
✓ Unused dependencies removed
✓ Only necessary features enabled
✓ Component inventory maintained
✓ Regular updates scheduled

ACTION:
- Review dependency scan results
- Prioritize critical updates
- Test updates in staging
- Schedule dependency updates
```

#### A07:2021 - Identification and Authentication Failures

```
CHECKS:
✓ Multi-factor authentication available
✓ Strong password policy enforced
✓ Brute force protection
✓ Session management secure
✓ Session timeout configured
✓ Credential stuffing prevented
✓ Password recovery secure
✓ No credentials in URLs

CODE REVIEW:
- Check password requirements
- Verify session token generation
- Review cookie security flags
- Check authentication bypass paths
```

#### A08:2021 - Software and Data Integrity Failures

```
CHECKS:
✓ Code signing for deployments
✓ Dependency integrity checks (SRI)
✓ CI/CD pipeline secured
✓ No untrusted deserialization
✓ Digital signatures verified
✓ Auto-update mechanisms secure

REVIEW:
- Check package-lock.json integrity
- Verify deployment signatures
- Review deserialization code
- Check for insecure updates
```

#### A09:2021 - Security Logging and Monitoring Failures

```
CHECKS:
✓ Authentication events logged
✓ Authorization failures logged
✓ Input validation failures logged
✓ Sensitive operations logged
✓ Logs stored securely
✓ Log tampering prevented
✓ Alerting configured
✓ Incident response plan exists

LOGGING REVIEW:
- Verify all security events logged
- Check log retention policy
- Ensure no sensitive data in logs
- Review alerting thresholds
```

#### A10:2021 - Server-Side Request Forgery (SSRF)

```
CHECKS:
✓ URL validation on user-provided URLs
✓ Whitelist of allowed domains
✓ Internal IPs blocked
✓ Cloud metadata endpoints blocked
✓ Redirect following disabled/limited

CODE REVIEW:
- Check URL fetch functions
- Verify internal IP blocking
- Review webhook implementations
- Check file upload processing
```

**CHECKPOINT**: OWASP Top 10 review complete ✓

### Phase 4: Compliance Validation (15%)

**Use `security-auditor` to verify compliance requirements:**

#### SOC2 Type II
```
CONTROLS:
- Access control policies
- Encryption at rest and in transit
- Logging and monitoring
- Incident response procedures
- Vendor management
- Change management
- Data backup and recovery
```

#### GDPR (if handling EU data)
```
REQUIREMENTS:
- Data minimization
- Right to erasure (delete user data)
- Right to data portability (export user data)
- Data breach notification (72 hours)
- Privacy by design
- Data processing agreements
- Cookie consent
```

#### HIPAA (if handling health data)
```
REQUIREMENTS:
- PHI encryption
- Access controls
- Audit trails
- Data integrity
- Disaster recovery
- Business associate agreements
```

#### PCI-DSS (if handling payment cards)
```
REQUIREMENTS:
- Cardholder data encryption
- No storage of CVV
- Tokenization of card numbers
- Network segmentation
- Regular security testing
- Access control measures
```

**CHECKPOINT**: Compliance requirements validated ✓

### Phase 5: Remediation Planning & Execution (15%)

**Use appropriate development agents for fixes:**

#### 1. Prioritize Findings

```markdown
CRITICAL (Fix immediately):
- Remote code execution
- SQL injection
- Authentication bypass
- Hardcoded secrets
- Known CVE with exploit

HIGH (Fix within 1 week):
- XSS vulnerabilities
- Broken access control
- Sensitive data exposure
- High-severity dependency vulnerabilities

MEDIUM (Fix within 1 month):
- CSRF vulnerabilities
- Security misconfiguration
- Medium-severity dependencies

LOW (Fix when possible):
- Information disclosure
- Missing security headers (non-critical)
- Low-severity dependencies
```

#### 2. Generate Remediation Plan

```markdown
For each finding:

FINDING: [Vulnerability name]
SEVERITY: [Critical/High/Medium/Low]
LOCATION: [File:line or component]
DESCRIPTION: [What's wrong]
IMPACT: [What attacker can do]
REMEDIATION: [Step-by-step fix]
EFFORT: [Time estimate]
ASSIGNED TO: [Agent type]

Example:
FINDING: SQL Injection in user search
SEVERITY: Critical
LOCATION: api/search.py:45
DESCRIPTION: User input directly concatenated into SQL query
IMPACT: Attacker can read/modify database, escalate privileges
REMEDIATION:
1. Replace string concatenation with parameterized query
2. Add input validation
3. Add WAF rule
4. Add regression test
EFFORT: 2 hours
ASSIGNED TO: python-developer + test-engineer
```

#### 3. Auto-Remediation (Safe Fixes)

**Automatically fix these without approval:**

```bash
# Update dependencies
npm update
pip install --upgrade -r requirements.txt

# Add security headers (if using Express)
npm install helmet
# Code will be added automatically

# Remove hardcoded secrets
# - Move to environment variables
# - Add to .gitignore
# - Rotate compromised secrets

# Fix Dockerfile issues
# - Use non-root user
# - Pin versions
# - Multi-stage build
```

#### 4. Manual Remediation (Complex Fixes)

**Require approval before fixing:**

```
REQUIRES HUMAN APPROVAL:
- Architectural changes
- Authentication/authorization refactoring
- Database schema changes
- API contract changes
- Breaking changes
- High-risk code modifications

PROCESS:
1. Agent proposes fix with detailed plan
2. Wait for user approval
3. Implement with test-engineer
4. Review with code-reviewer
5. Verify with security-auditor
6. Deploy to staging
7. Validate fix
8. Deploy to production
```

#### 5. Verification

```
For each remediation:
1. Fix implemented
2. Regression test added
3. Vulnerability scan confirms fix
4. Code review passed
5. No new vulnerabilities introduced
6. Documented in security log
```

**CHECKPOINT**: Critical vulnerabilities remediated ✓

### Phase 6: Reporting & Documentation (10%)

**Generate comprehensive security report:**

```markdown
# Security Audit Report
Date: [timestamp]
Auditor: security-auditor
Scope: [components audited]

## Executive Summary
- Total findings: X
- Critical: X | High: X | Medium: X | Low: X
- Remediated: X | Pending: X
- Compliance status: [Pass/Fail for each standard]
- Overall risk level: [Critical/High/Medium/Low]

## Findings Summary

### Critical Findings
1. [Finding name] - [Status]
   - Location: [file:line]
   - Impact: [description]
   - Remediation: [what was done]

### High Findings
[...]

### Medium Findings
[...]

### Low Findings
[...]

## OWASP Top 10 Compliance
- A01 Broken Access Control: [Pass/Fail] - [notes]
- A02 Cryptographic Failures: [Pass/Fail] - [notes]
- A03 Injection: [Pass/Fail] - [notes]
- A04 Insecure Design: [Pass/Fail] - [notes]
- A05 Security Misconfiguration: [Pass/Fail] - [notes]
- A06 Vulnerable Components: [Pass/Fail] - [notes]
- A07 Authentication Failures: [Pass/Fail] - [notes]
- A08 Software/Data Integrity: [Pass/Fail] - [notes]
- A09 Logging/Monitoring: [Pass/Fail] - [notes]
- A10 SSRF: [Pass/Fail] - [notes]

## Compliance Status
- SOC2: [Pass/Fail]
- GDPR: [Pass/Fail/N/A]
- HIPAA: [Pass/Fail/N/A]
- PCI-DSS: [Pass/Fail/N/A]

## Dependency Vulnerabilities
| Package | Version | Vulnerability | Severity | Fixed Version |
|---------|---------|---------------|----------|---------------|
| [...]   | [...]   | [CVE-xxx]     | High     | [...]         |

## Recommendations

### Immediate Actions (0-7 days)
1. [Action]
2. [Action]

### Short-term Actions (1-3 months)
1. [Action]
2. [Action]

### Long-term Actions (3-12 months)
1. Implement security training
2. Establish bug bounty program
3. Regular penetration testing
4. Security champions program

## Metrics
- Time to detect: [X hours]
- Time to remediate critical: [X hours]
- Test coverage: [X%]
- Dependency freshness: [X% up-to-date]

## Next Audit
Recommended: [date, typically 90 days]
```

**Store report:**
```bash
# Save report
mkdir -p security-reports
cat > security-reports/audit-$(date +%Y%m%d).md

# Generate metrics dashboard
# - Trends over time
# - Remediation velocity
# - Recurring issues
```

**CHECKPOINT**: Report generated and distributed ✓

## Special Security Scenarios

### Production Data Breach Response

```
IMMEDIATE ACTIONS (0-1 hour):
1. Isolate affected systems
2. Preserve evidence
3. Assess scope of breach
4. Activate incident response team

INVESTIGATION (1-24 hours):
1. Identify attack vector
2. Determine data accessed
3. Find patient zero
4. Timeline reconstruction

REMEDIATION (24-72 hours):
1. Patch vulnerability
2. Rotate credentials
3. Review logs for other compromises
4. Deploy fixes

NOTIFICATION (72 hours):
1. Notify affected users
2. Regulatory notification (GDPR: 72 hours)
3. Public disclosure if required
4. Credit monitoring if needed

POST-MORTEM:
1. Root cause analysis
2. What went wrong
3. What went right
4. Preventive measures
5. Update runbooks
```

### Zero-Day Vulnerability

```
1. Assess impact and exploitability
2. Implement WAF rules as temporary mitigation
3. Monitor for exploitation attempts
4. Coordinate with vendor for patch
5. Test patch in staging
6. Deploy patch to production
7. Verify vulnerability closed
8. Document for future
```

### Supply Chain Attack

```
1. Identify compromised dependency
2. Assess blast radius
3. Check if vulnerable version deployed
4. Search logs for indicators of compromise
5. Rollback to safe version
6. Review all dependencies from that source
7. Implement dependency pinning
8. Add checksum verification
```

### API Key Leak

```
IMMEDIATE (within 1 hour):
1. Rotate leaked keys
2. Revoke old keys
3. Search for unauthorized usage
4. Check for data exfiltration

INVESTIGATION:
1. Where was it leaked? (GitHub, logs, etc.)
2. How long was it exposed?
3. Was it used by attackers?
4. What data was accessed?

PREVENTION:
1. Implement secrets scanning
2. Add pre-commit hooks
3. Use secrets manager
4. Regular key rotation
5. Principle of least privilege
```

## Security Testing Checklist

```
AUTHENTICATION:
□ Test password reset flow for account takeover
□ Test MFA bypass techniques
□ Test session fixation
□ Test concurrent sessions
□ Test logout functionality
□ Test remember me functionality

AUTHORIZATION:
□ Test horizontal privilege escalation (user A → user B)
□ Test vertical privilege escalation (user → admin)
□ Test IDOR on all object references
□ Test function-level authorization
□ Test mass assignment vulnerabilities

INPUT VALIDATION:
□ Test SQL injection on all inputs
□ Test XSS on all inputs (stored, reflected, DOM)
□ Test command injection
□ Test path traversal
□ Test XXE (XML External Entity)
□ Test template injection

BUSINESS LOGIC:
□ Test race conditions (parallel requests)
□ Test negative quantities
□ Test price manipulation
□ Test workflow bypasses
□ Test state machine violations

API SECURITY:
□ Test rate limiting
□ Test authentication bypass
□ Test mass assignment
□ Test excessive data exposure
□ Test lack of resources & rate limiting
```

## Success Criteria

Security audit complete when:
- ✅ All automated scans completed
- ✅ OWASP Top 10 manually reviewed
- ✅ Critical vulnerabilities remediated
- ✅ High vulnerabilities remediated or mitigated
- ✅ Compliance requirements validated
- ✅ Security report generated
- ✅ Remediation plan documented
- ✅ Stakeholders notified
- ✅ Security metrics tracked
- ✅ Next audit scheduled

## Example Usage

### Example 1: Full Application Audit

```bash
/security-audit "Complete security audit of the e-commerce application including web frontend, API backend, payment processing, and AWS infrastructure. Must pass SOC2 and PCI-DSS requirements."
```

**Autonomous execution:**
1. Security-auditor scopes audit (frontend, backend, infrastructure)
2. Runs parallel scans (dependencies, SAST, secrets, containers, IaC)
3. Manual OWASP Top 10 review with code-reviewer
4. Validates SOC2 and PCI-DSS compliance
5. Identifies 23 vulnerabilities (3 critical, 7 high, 13 medium)
6. Auto-remediates 15 medium/low issues (dependency updates, headers)
7. Creates remediation plan for 8 critical/high issues
8. Python-developer + typescript-developer fix critical issues
9. Test-engineer adds regression tests
10. Security-auditor verifies fixes
11. Generates comprehensive report
12. Schedules next audit (90 days)

**Time: 3-6 hours**

### Example 2: Pre-Production Security Gate

```bash
/security-audit "Security gate before production deployment. Focus on API security, authentication, and data protection. Quick turnaround needed."
```

**Autonomous execution:**
1. Focused scope (API + auth + data)
2. Fast scans (skip IaC, focus on code)
3. OWASP API Security Top 10 review
4. Critical/high findings only
5. Must-fix issues identified
6. Auto-remediation where safe
7. Quick report with go/no-go decision

**Time: 1-2 hours**

### Example 3: Compliance Audit

```bash
/security-audit "HIPAA compliance audit for patient portal. Must validate all PHI handling, encryption, access controls, and audit logging."
```

**Autonomous execution:**
1. HIPAA-focused scope
2. PHI data flow mapping
3. Encryption validation (at rest, in transit)
4. Access control review
5. Audit log verification
6. BAA (Business Associate Agreement) review
7. HIPAA Security Rule checklist
8. Compliance report with gaps
9. Remediation for non-compliant items

**Time: 4-8 hours**

## Anti-Patterns

### DON'T
❌ Skip automated scans (they catch 80% of issues)
❌ Fix without understanding impact
❌ Deploy security fixes without testing
❌ Ignore medium/low vulnerabilities indefinitely
❌ Have compliance audit only once a year
❌ Store security reports in public repos
❌ Auto-fix authentication/authorization without review
❌ Dismiss false positives without investigation

### DO
✅ Run automated scans first (fast feedback)
✅ Understand root cause before fixing
✅ Test security fixes thoroughly
✅ Have remediation plan for all severities
✅ Regular security audits (quarterly minimum)
✅ Store reports securely with access control
✅ Human review for security-critical changes
✅ Investigate false positives (sometimes real issues)

## Continuous Security

```
DAILY:
- Dependency scanning in CI/CD
- Secrets detection on commits
- SAST on pull requests

WEEKLY:
- Dependency updates
- Security log review
- Incident review

MONTHLY:
- Security training
- Threat modeling updates
- Metrics review

QUARTERLY:
- Full security audit
- Penetration testing
- Compliance validation
- Security roadmap review

ANNUALLY:
- Third-party security assessment
- Disaster recovery drill
- Incident response tabletop
- Security strategy review
```

Autonomous, comprehensive, and production-ready security auditing that catches vulnerabilities before attackers do.
