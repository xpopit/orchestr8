---
id: security-testing-compliance
category: agent
tags: [security, sast, dast, testing, compliance, gdpr, hipaa, soc2, vulnerability]
capabilities:
  - Static Application Security Testing (SAST) integration
  - Dynamic Application Security Testing (DAST) with OWASP ZAP
  - Dependency vulnerability scanning and management
  - Compliance requirements (GDPR, HIPAA, SOC2)
useWhen:
  - Integrating SAST/DAST security testing in CI/CD using Semgrep, Snyk, CodeQL for static analysis, and OWASP ZAP for dynamic scanning with severity thresholds
  - Scanning dependencies for vulnerabilities using npm audit, Snyk test/monitor, Trivy filesystem/image scanning, and automated Dependabot pull requests for security updates
  - Meeting GDPR compliance requirements implementing right to access (data export), right to deletion (data erasure), consent management, and 72-hour breach notification
  - Implementing HIPAA compliance with PHI encryption at rest/in transit, audit logging for all PHI access, automatic session timeout (15 minutes), and unique user identification
  - Achieving SOC 2 compliance across five trust criteria (Security, Availability, Processing Integrity, Confidentiality, Privacy) with change management logging and evidence collection
  - Conducting security audits with automated tools including Trivy for IaC scanning, TruffleHog for secret detection, license-checker for compliance, and continuous monitoring pipelines
estimatedTokens: 700
---

# Security Expert - Testing & Compliance

Security testing automation, vulnerability scanning, and compliance frameworks (GDPR, HIPAA, SOC2).

## Static Application Security Testing (SAST)

**CI/CD Integration:**
```yaml
# GitHub Actions / GitLab CI
- name: SAST Scan
  run: |
    # Semgrep - lightweight, fast
    semgrep --config=auto --json > sast-results.json

    # Fail on high-severity findings
    semgrep --config=auto --severity ERROR --strict

    # Snyk - comprehensive
    snyk test --severity-threshold=high

    # CodeQL - deep analysis
    codeql database analyze --format=sarif-latest
```

**Semgrep Custom Rules:**
```yaml
rules:
  - id: hardcoded-secret
    pattern: |
      const $VAR = "$SECRET"
    message: Potential hardcoded secret
    severity: ERROR
    languages: [javascript, typescript]
    metadata:
      category: security
      cwe: CWE-798
```

## Dynamic Application Security Testing (DAST)

**OWASP ZAP Integration:**
```yaml
- name: DAST Scan
  run: |
    # Baseline scan
    docker run owasp/zap2docker-stable \
      zap-baseline.py -t https://staging.example.com \
      -r zap-report.html

    # Full scan
    docker run owasp/zap2docker-stable \
      zap-full-scan.py -t https://staging.example.com \
      -r zap-full-report.html
```

**API Security Testing:**
```bash
# Scan OpenAPI spec
docker run owasp/zap2docker-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r api-scan-report.html
```

## Dependency Scanning

**NPM Audit:**
```bash
# Check for vulnerabilities
npm audit --audit-level=high

# Fix automatically when possible
npm audit fix

# Check outdated packages
npm outdated
```

**Snyk Integration:**
```yaml
- name: Dependency Scan
  run: |
    # Install Snyk
    npm install -g snyk

    # Authenticate
    snyk auth $SNYK_TOKEN

    # Test dependencies
    snyk test --severity-threshold=high

    # Monitor for ongoing tracking
    snyk monitor
```

**Trivy Scanning:**
```bash
# Scan filesystem for vulnerabilities
trivy fs --severity HIGH,CRITICAL .

# Scan Docker images
trivy image my-app:latest

# Scan IaC files
trivy config ./terraform/
```

**Dependabot Configuration:**
```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
```

## Compliance Frameworks

### GDPR (General Data Protection Regulation)

**Key Requirements:**
```markdown
- Right to access (data export)
- Right to deletion (data erasure)
- Right to rectification
- Data minimization
- Consent management
- Breach notification (72 hours)
```

**Implementation:**
```javascript
// Data export
async function exportUserData(userId) {
    const userData = await db.getUserData(userId);
    const exports = {
        profile: userData.profile,
        orders: userData.orders,
        preferences: userData.preferences
    };
    return JSON.stringify(exports);
}

// Data deletion
async function deleteUserData(userId) {
    await db.transaction(async (tx) => {
        await tx.deleteUserProfile(userId);
        await tx.anonymizeOrders(userId);  // Keep for accounting
        await tx.deleteUserPreferences(userId);
    });
}
```

### HIPAA (Health Insurance Portability and Accountability Act)

**Key Requirements:**
```markdown
- Encrypt PHI at rest and in transit
- Access controls and audit logs
- Automatic logoff
- Unique user identification
- Emergency access procedures
- Business Associate Agreements (BAAs)
```

**Implementation:**
```javascript
// PHI access logging
async function logPHIAccess(userId, patientId, action) {
    await auditLog.create({
        timestamp: new Date(),
        userId,
        patientId,
        action,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
    });
}

// Automatic session timeout
app.use(session({
    cookie: {
        maxAge: 15 * 60 * 1000  // 15 minutes
    },
    rolling: true
}));
```

### SOC 2 (Service Organization Control 2)

**Five Trust Service Criteria:**
```markdown
1. Security: Access controls, encryption, monitoring
2. Availability: Uptime, disaster recovery
3. Processing Integrity: Data accuracy, validation
4. Confidentiality: Data protection, NDAs
5. Privacy: Data collection, use, disclosure
```

**Evidence Collection:**
```javascript
// Change management logging
async function logChange(type, description, userId) {
    await changeLog.create({
        timestamp: new Date(),
        type,  // code, config, infrastructure
        description,
        userId,
        approved: true,
        reviewedBy: getApprover(userId)
    });
}
```

## Security Monitoring

**Continuous Monitoring:**
```yaml
- name: Security Monitoring
  run: |
    # Scan for secrets
    trufflehog filesystem . --json

    # License compliance
    license-checker --onlyunknown

    # Docker image scanning
    trivy image --severity HIGH,CRITICAL app:latest
```

## Best Practices

✅ Integrate SAST/DAST in CI/CD pipelines
✅ Scan dependencies continuously
✅ Automate security testing
✅ Document compliance controls
✅ Implement audit logging
✅ Encrypt sensitive data (PHI, PII)

❌ Don't skip security scans in pre-production
❌ Don't ignore medium-severity vulnerabilities
❌ Don't store compliance evidence manually
❌ Don't disable security checks for convenience
