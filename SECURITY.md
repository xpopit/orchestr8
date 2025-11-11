# 🔒 Security Policy

**Protecting orchestr8 and Its Users**

[![Security Scan](https://github.com/seth-schultz/orchestr8/workflows/Security%20Scan/badge.svg)](https://github.com/seth-schultz/orchestr8/actions/workflows/security.yml)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/XXXX/badge)](https://bestpractices.coreinfrastructure.org/projects/XXXX)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/seth-schultz/orchestr8/badge)](https://api.securityscorecards.dev/projects/github.com/seth-schultz/orchestr8)

---

## 📋 Table of Contents

- [Supported Versions](#-supported-versions)
- [Security Architecture](#-security-architecture)
- [Reporting Vulnerabilities](#-reporting-vulnerabilities)
- [Security Best Practices](#-security-best-practices)
- [Automated Security](#-automated-security)
- [Vulnerability Disclosure](#-vulnerability-disclosure)
- [Security Champions](#-security-champions)

---

## 📦 Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Status | Security Updates | End of Life |
|---------|--------|------------------|-------------|
| 8.x.x   | ✅ **Current** | Active | TBD |
| 7.x.x   | ⚠️ **Maintenance** | Critical only | 2026-01-01 |
| < 7.0   | ❌ **Unsupported** | None | 2025-01-10 |

**Recommendation**: Always use the latest version for best security posture.

---

## 🛡️ Security Architecture

orchestr8 implements **defense-in-depth** security with five layers of protection:

### Layer 1: MCP Server Isolation

| Feature | Implementation | Protection |
|---------|---------------|------------|
| **stdio Transport** | All communication via stdin/stdout | No network attack surface |
| **Process Isolation** | Separate Node.js process | Sandboxed execution |
| **No Remote Access** | Local-only operation | Zero external exposure |
| **Read-Only Resources** | Resources loaded with read-only access | Immutable knowledge base |

**Threat Mitigation**: Remote code execution, network-based attacks, unauthorized access

### Layer 2: Input Validation

| Component | Validation | Protection |
|-----------|-----------|------------|
| **Query Sanitization** | All fuzzy match queries validated | Injection attack prevention |
| **URI Validation** | Static/dynamic URIs checked against patterns | Path traversal prevention |
| **Parameter Validation** | Workflow parameters sanitized pre-substitution | Command injection prevention |
| **Token Budget Limits** | Maximum token limits enforced | Resource exhaustion prevention |

**Threat Mitigation**: Code injection, path traversal, denial of service

### Layer 3: Dependency Security

| Practice | Tool | Frequency |
|----------|------|-----------|
| **Vulnerability Scanning** | npm audit | Every PR + Daily |
| **Dependency Updates** | Dependabot | Daily |
| **License Compliance** | license-checker | Every PR |
| **SBOM Generation** | npm sbom | Every release |
| **Pinned Versions** | package-lock.json | Always |

**Threat Mitigation**: Supply chain attacks, vulnerable dependencies, license violations

### Layer 4: Supply Chain Security

| Practice | Implementation | Protection |
|----------|---------------|------------|
| **Pinned GitHub Actions** | All actions at commit SHAs | Immutable CI/CD pipeline |
| **Secret Scanning** | Gitleaks + TruffleHog | Credential leak prevention |
| **Code Review** | Required for all PRs | Malicious code detection |
| **Signed Commits** | Optional GPG signing | Author verification |
| **Immutable Releases** | GitHub releases + checksums | Tamper detection |

**Threat Mitigation**: Supply chain compromise, malicious code injection, unauthorized releases

### Layer 5: Audit & Monitoring

| Feature | Tool | Purpose |
|---------|------|---------|
| **Structured Logging** | Winston | Forensic analysis |
| **Error Tracking** | Stack traces + context | Incident investigation |
| **Cache Statistics** | LRU metrics | Performance monitoring |
| **Performance Metrics** | Timing instrumentation | Anomaly detection |

**Threat Mitigation**: Undetected breaches, performance degradation, resource exhaustion

---

## 🚨 Reporting Vulnerabilities

**We take security seriously.** Responsible disclosure helps us protect all users.

### 🔴 DO NOT

- ❌ Open public GitHub issues for security vulnerabilities
- ❌ Discuss vulnerabilities publicly before a fix is available
- ❌ Exploit vulnerabilities beyond proof-of-concept

### ✅ DO

- ✅ Report privately via approved channels (below)
- ✅ Provide detailed reproduction steps
- ✅ Allow time for coordinated disclosure
- ✅ Follow responsible disclosure principles

---

### 📧 How to Report

Choose **one** of these private reporting methods:

#### Option 1: Email (Preferred)

**Email**: security@orchestr8.builders

**Subject**: `[SECURITY] Brief description`

**PGP Key**: [Download public key](#) (optional but recommended)

#### Option 2: GitHub Security Advisories

Use GitHub's private vulnerability reporting:

**[Create Security Advisory](https://github.com/seth-schultz/orchestr8/security/advisories/new)**

---

### 📝 What to Include

A great security report includes:

```
1. Summary
   - Brief description of the vulnerability
   - Type of vulnerability (e.g., XSS, RCE, path traversal)

2. Impact
   - What an attacker can achieve
   - Affected systems/components
   - Severity assessment (Critical/High/Medium/Low)

3. Reproduction Steps
   - Detailed, numbered steps to reproduce
   - Environment details (OS, Node.js version, etc.)
   - Sample payloads or proof-of-concept code

4. Affected Versions
   - Which versions are vulnerable
   - When the vulnerability was introduced (if known)

5. Suggested Fix (Optional)
   - Your recommendations for remediation
   - Patches or code samples (if available)
```

**Example Template:**

```markdown
## Vulnerability: [Brief Description]

**Type**: Command Injection
**Severity**: High
**Affected Versions**: 8.0.0-rc1

### Impact
An attacker can execute arbitrary commands by crafting a malicious query...

### Steps to Reproduce
1. Install orchestr8 v8.0.0-rc1
2. Execute workflow with payload: `'; rm -rf / #`
3. Observe command execution...

### Suggested Fix
Sanitize all user input with...
```

---

### ⏱️ Response Timeline

We are committed to rapid response:

| Stage | Timeline | Description |
|-------|----------|-------------|
| **Acknowledgment** | **24 hours** | We confirm receipt of your report |
| **Triage** | **48 hours** | We assess severity and impact |
| **Investigation** | **72 hours** | We validate and reproduce the issue |
| **Fix Development** | **Varies** | Based on severity (see below) |
| **Disclosure** | **After fix** | Coordinated public disclosure |

#### Fix Development Timelines

| Severity | Timeline | Examples |
|----------|----------|----------|
| **Critical** (CVSS 9.0-10.0) | **7 days** | RCE, auth bypass, data breach |
| **High** (CVSS 7.0-8.9) | **14 days** | XSS, CSRF, privilege escalation |
| **Medium** (CVSS 4.0-6.9) | **30 days** | Information disclosure, DoS |
| **Low** (CVSS 0.1-3.9) | **60 days** | Minor info leaks, config issues |

**Note**: Timelines may be extended for complex vulnerabilities requiring extensive testing.

---

### 🏆 Recognition

We value security researchers and offer:

- ✅ **Public acknowledgment** (with your permission)
- ✅ **CVE credit** for valid vulnerabilities
- ✅ **Hall of Fame** listing on our security page
- ✅ **Swag** for significant findings (orchestr8 t-shirts, stickers)

---

## 🔧 Security Best Practices

### For Users

#### Installation Security

```bash
# ✅ Verify source
git clone https://github.com/seth-schultz/orchestr8.git
cd orchestr8

# ✅ Check integrity (if downloading release)
sha256sum -c CHECKSUMS.txt

# ✅ Review code before production use
cat plugins/orchestr8/src/index.ts

# ✅ Use latest version
npm install  # Installs latest stable
```

#### Configuration Security

```bash
# ✅ Never commit secrets
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# ✅ Use environment variables
export ORCHESTR8_API_KEY="secret"

# ✅ Set proper file permissions
chmod 600 .env
chmod 700 plugins/orchestr8/config/

# ✅ Use production log level
export LOG_LEVEL="warn"  # Not "debug"
```

#### Runtime Security

```javascript
// ✅ Configure token limits
const config = {
  maxTokens: 3000,  // Prevent resource exhaustion
  cacheSize: 200,   // Limit memory usage
  cacheTTL: 14400   // 4 hours
};

// ✅ Monitor logs
tail -f logs/orchestr8.log | grep ERROR

// ✅ Keep dependencies updated
npm audit
npm update
```

---

### For Contributors

#### Development Security

```bash
# ✅ Run security checks locally
npm run lint
npm run type-check
npm audit

# ✅ Use pre-commit hooks
./scripts/install-git-hooks.sh

# ✅ Never commit sensitive data
git diff --cached  # Review before commit

# ✅ Sign commits (optional)
git config --global commit.gpgsign true
```

#### Code Review Checklist

- [ ] Input validation on all user-provided data
- [ ] Output encoding to prevent XSS
- [ ] Parameterized queries to prevent injection
- [ ] Proper error handling (no stack traces to users)
- [ ] Authentication/authorization checks
- [ ] Rate limiting where applicable
- [ ] Secrets not hard-coded
- [ ] Dependencies up-to-date

---

## 🤖 Automated Security

We run **continuous security scanning** to catch issues early:

### Dependency Scanning

```yaml
Tool: npm audit
Frequency: Every PR + Daily scheduled run
Threshold: Fail on HIGH/CRITICAL vulnerabilities
Action: Auto-create PR with fixes (Dependabot)
```

### Static Analysis

```yaml
Tool: CodeQL
Frequency: Every push to main + Weekly scheduled scan
Languages: TypeScript, JavaScript
Queries: security-extended, security-and-quality
Action: Create GitHub Security Alert
```

### Secret Scanning

```yaml
Tools: Gitleaks, TruffleHog
Frequency: Every commit (pre-commit hook) + Every PR
Patterns: API keys, passwords, tokens, private keys
Action: Fail build, prevent merge
```

### Supply Chain Security

```yaml
Tool: OpenSSF Scorecard
Frequency: Weekly
Checks: 24 security practices
Threshold: Maintain score ≥ 7.0/10
Action: Automated improvement PRs
```

### License Compliance

```yaml
Tool: license-checker
Frequency: Every PR
Allowed: MIT, Apache-2.0, BSD-3-Clause
Prohibited: GPL, AGPL, proprietary
Action: Fail build on non-compliant licenses
```

---

## 📜 Vulnerability Disclosure

We maintain **full transparency** on security issues:

### Public Disclosure Process

1. **Fix Developed** - Vulnerability patched in private repository
2. **Release Prepared** - New version created with fix
3. **Advisory Published** - GitHub Security Advisory created
4. **CVE Assigned** - CVE ID obtained from GitHub/MITRE
5. **Public Release** - Fix published, advisory made public
6. **User Notification** - Email to security mailing list
7. **Blog Post** - Detailed post-mortem published

### Security Advisories

**Active Advisories**: [View on GitHub](https://github.com/seth-schultz/orchestr8/security/advisories)

**CVE Database**: [Search NIST NVD](https://nvd.nist.gov/vuln/search/results?form_type=Advanced&cves=on&cpe_vendor=cpe%3A%2F%3Aorchestr8)

### CHANGELOG Security Entries

All security fixes are documented in [CHANGELOG.md](CHANGELOG.md) with:

- 🔒 **[SECURITY]** tag
- CVE ID (if assigned)
- Severity level
- Affected versions
- Mitigation steps

---

## 👥 Security Champions

### Security Team

| Role | Contact | Responsibilities |
|------|---------|-----------------|
| **Security Lead** | [@seth-schultz](https://github.com/seth-schultz) | Vulnerability triage, disclosure coordination |
| **Security Email** | security@orchestr8.builders | Primary contact for vulnerability reports |

### External Security Audits

We welcome **external security audits**. If you're interested:

1. **Contact**: security@orchestr8.builders with your proposal
2. **Access**: We'll provide test environments and documentation
3. **Disclosure**: Coordinated disclosure of findings
4. **Recognition**: Public acknowledgment (with your permission)

---

## 📚 Additional Resources

- **[Security Scanning Results](https://github.com/seth-schultz/orchestr8/actions/workflows/security.yml)** - View latest scans
- **[OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/seth-schultz/orchestr8)** - Supply chain security score
- **[Dependency Graph](https://github.com/seth-schultz/orchestr8/network/dependencies)** - View all dependencies
- **[Security Policy](SECURITY.md)** - This document
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards

---

**Questions about security?**

📧 Email: **security@orchestr8.builders**
🔒 GitHub Security Advisories: **[Report Privately](https://github.com/seth-schultz/orchestr8/security/advisories/new)**
📖 Documentation: **[plugins/orchestr8/docs/](plugins/orchestr8/docs/)**

---

**Last Updated**: November 11, 2025
**Version**: 1.0.0
