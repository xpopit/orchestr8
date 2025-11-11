---
id: compliance-audit-specialist
category: agent
tags: [compliance, audit, gdpr, hipaa, soc2, pci-dss, evidence-collection, gap-analysis, documentation]
capabilities:
  - Compliance audit planning and execution
  - Evidence collection and documentation
  - Gap analysis and remediation planning
  - Audit report generation and findings management
  - Control implementation and testing
useWhen:
  - Conducting compliance audits for GDPR, HIPAA, SOC 2, PCI-DSS, or ISO 27001 with gap analysis, control testing, and evidence collection for audit trails
  - Implementing data privacy controls including data encryption (at rest, in transit), access logging, data retention policies, and right to erasure (GDPR Article 17)
  - Managing audit documentation with policy documents, procedure manuals, evidence artifacts (logs, screenshots, change records), and remediation tracking
  - Performing risk assessments using frameworks like NIST Cybersecurity Framework, identifying threats, vulnerabilities, likelihood/impact scoring, and risk mitigation strategies
  - Ensuring compliance monitoring with continuous control testing, automated compliance checks in CI/CD, and quarterly/annual audit preparation
  - Coordinating with external auditors providing requested documentation, facilitating interviews, demonstrating controls, and addressing findings with corrective action plans
estimatedTokens: 680
---

# Compliance Audit Specialist

Expert in compliance auditing, evidence collection, gap analysis, and audit preparation for GDPR, HIPAA, SOC 2, PCI-DSS.

## Audit Preparation

### SOC 2 Type II Preparation
```markdown
## Pre-Audit Checklist

### Security (Required)
- [ ] Access control policies documented
- [ ] MFA enabled for all systems
- [ ] Password policy enforced (complexity, rotation)
- [ ] Vendor risk assessments completed
- [ ] Incident response plan documented and tested
- [ ] Encryption at rest and in transit
- [ ] Security awareness training completed
- [ ] Vulnerability scanning reports (quarterly)
- [ ] Penetration testing results (annual)

### Availability (If applicable)
- [ ] System uptime SLA defined (>99.9%)
- [ ] Disaster recovery plan documented
- [ ] Business continuity testing completed
- [ ] Backup and restore procedures tested
- [ ] Monitoring and alerting configured
- [ ] Incident response times tracked

### Confidentiality (If applicable)
- [ ] Data classification policy
- [ ] Confidentiality agreements signed
- [ ] Encryption key management
- [ ] Data access logging

### Processing Integrity (If applicable)
- [ ] Data validation controls
- [ ] Error handling procedures
- [ ] Transaction monitoring

### Privacy (If applicable)
- [ ] Privacy policy published
- [ ] Data retention policy
- [ ] Data subject access request process
- [ ] Cookie consent mechanism
```

## Evidence Collection

### Automated Evidence Gathering
```python
# Automated compliance evidence collector
import json
import subprocess
from datetime import datetime
from pathlib import Path

class ComplianceEvidenceCollector:
    def __init__(self, output_dir='./evidence'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.evidence = []

    def collect_access_logs(self):
        """Collect user access logs for audit trail"""
        evidence = {
            'control': 'CC6.1 - Logical Access',
            'date': datetime.now().isoformat(),
            'description': 'User access logs',
            'evidence_type': 'automated',
            'data': self._query_access_logs()
        }
        self._save_evidence('access_logs', evidence)

    def collect_mfa_status(self):
        """Verify MFA enabled for all users"""
        evidence = {
            'control': 'CC6.1 - Logical Access',
            'date': datetime.now().isoformat(),
            'description': 'MFA status for all users',
            'evidence_type': 'automated',
            'data': self._check_mfa_status()
        }
        self._save_evidence('mfa_status', evidence)

    def collect_backup_logs(self):
        """Collect backup completion logs"""
        evidence = {
            'control': 'A1.2 - Availability',
            'date': datetime.now().isoformat(),
            'description': 'Backup completion logs',
            'evidence_type': 'automated',
            'data': self._get_backup_logs()
        }
        self._save_evidence('backup_logs', evidence)

    def collect_vulnerability_scans(self):
        """Collect vulnerability scanning reports"""
        evidence = {
            'control': 'CC7.1 - System Operations',
            'date': datetime.now().isoformat(),
            'description': 'Quarterly vulnerability scans',
            'evidence_type': 'automated',
            'data': self._get_vuln_scan_results()
        }
        self._save_evidence('vuln_scans', evidence)

    def collect_change_logs(self):
        """Collect change management logs"""
        # Git commits for code changes
        result = subprocess.run(
            ['git', 'log', '--since=3.months', '--format=%h|%an|%ae|%ad|%s'],
            capture_output=True, text=True
        )

        evidence = {
            'control': 'CC8.1 - Change Management',
            'date': datetime.now().isoformat(),
            'description': 'Code change logs (3 months)',
            'evidence_type': 'automated',
            'data': result.stdout.split('\n')
        }
        self._save_evidence('change_logs', evidence)

    def _save_evidence(self, name, evidence):
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{name}_{timestamp}.json"

        with open(self.output_dir / filename, 'w') as f:
            json.dump(evidence, f, indent=2)

        self.evidence.append(evidence)
        print(f"✅ Collected: {name}")

# Usage
collector = ComplianceEvidenceCollector()
collector.collect_access_logs()
collector.collect_mfa_status()
collector.collect_backup_logs()
collector.collect_vulnerability_scans()
collector.collect_change_logs()
```

## Gap Analysis

### Gap Analysis Template
```markdown
# Compliance Gap Analysis Report
Date: {date}
Framework: SOC 2 Type II
Auditor: {name}

## Executive Summary
- Total Controls Assessed: {total}
- Controls Passed: {passed}
- Controls Failed: {failed}
- Gaps Identified: {gaps}
- Remediation Timeline: {timeline}

## Control Assessment

### CC6.1 - Logical and Physical Access Controls

**Requirement:**
- MFA enabled for all user accounts
- Password complexity enforced
- Access reviews conducted quarterly

**Current State:**
- ✅ MFA enabled for 95% of users
- ❌ 5% legacy accounts without MFA
- ✅ Password policy enforced
- ❌ Access reviews last conducted 6 months ago

**Gap:**
- 5% of user accounts do not have MFA enabled
- Access reviews overdue by 3 months

**Risk:** Medium
**Remediation:**
1. Enable MFA for remaining 5% of accounts (2 weeks)
2. Conduct quarterly access review immediately (1 week)
3. Automate access review reminders (1 week)

**Owner:** Security Team
**Due Date:** 2025-12-15

---

### CC7.2 - System Monitoring

**Requirement:**
- Security events logged and monitored
- Alerts configured for suspicious activity
- Log retention for 1 year minimum

**Current State:**
- ✅ Logging enabled for all systems
- ❌ Alerting only configured for critical events
- ✅ Log retention: 13 months

**Gap:**
- Missing alerts for medium-severity security events

**Risk:** Medium
**Remediation:**
1. Define alerting rules for medium-severity events (1 week)
2. Implement alerting in SIEM (2 weeks)
3. Test alerting and document procedures (1 week)

**Owner:** DevOps Team
**Due Date:** 2025-12-22

---

## Remediation Roadmap

| Priority | Control | Gap | Owner | Due Date |
|----------|---------|-----|-------|----------|
| High     | CC6.1   | MFA for legacy accounts | Security | 2025-12-15 |
| High     | CC6.1   | Quarterly access review | Security | 2025-12-15 |
| Medium   | CC7.2   | Medium-severity alerting | DevOps | 2025-12-22 |
| Low      | CC8.1   | Change approval documentation | Engineering | 2025-12-31 |
```

## Control Testing

### Testing Procedures
```python
# Automated control testing
class ControlTester:
    def test_cc6_1_mfa_enforcement(self):
        """Test: All users have MFA enabled"""
        users = self.get_all_users()
        users_without_mfa = [u for u in users if not u.mfa_enabled]

        result = {
            'control': 'CC6.1',
            'test': 'MFA Enforcement',
            'passed': len(users_without_mfa) == 0,
            'total_users': len(users),
            'compliant': len(users) - len(users_without_mfa),
            'exceptions': [u.email for u in users_without_mfa]
        }
        return result

    def test_cc6_2_password_policy(self):
        """Test: Password policy enforced"""
        policy = self.get_password_policy()

        checks = {
            'min_length': policy.min_length >= 12,
            'complexity': policy.requires_uppercase and policy.requires_number,
            'expiration': policy.max_age_days <= 90,
            'reuse': policy.history_count >= 5
        }

        result = {
            'control': 'CC6.2',
            'test': 'Password Policy',
            'passed': all(checks.values()),
            'checks': checks
        }
        return result

    def test_cc7_3_backup_completion(self):
        """Test: Backups completed daily"""
        last_30_days = self.get_backup_logs(days=30)

        result = {
            'control': 'CC7.3',
            'test': 'Backup Completion',
            'passed': len(last_30_days) >= 30,
            'backups_completed': len(last_30_days),
            'expected': 30,
            'success_rate': len([b for b in last_30_days if b.status == 'success']) / len(last_30_days)
        }
        return result

    def generate_test_report(self):
        """Generate control testing report"""
        tests = [
            self.test_cc6_1_mfa_enforcement(),
            self.test_cc6_2_password_policy(),
            self.test_cc7_3_backup_completion()
        ]

        report = {
            'date': datetime.now().isoformat(),
            'tests': tests,
            'passed': sum(1 for t in tests if t['passed']),
            'failed': sum(1 for t in tests if not t['passed']),
            'pass_rate': sum(1 for t in tests if t['passed']) / len(tests)
        }

        return report
```

## GDPR Compliance

### Data Subject Access Request (DSAR) Process
```python
class DSARHandler:
    """Handle GDPR data subject access requests"""

    async def process_dsar(self, email: str):
        """Collect all data for a user"""
        user_data = {
            'profile': await self.get_user_profile(email),
            'orders': await self.get_user_orders(email),
            'activity': await self.get_user_activity(email),
            'preferences': await self.get_user_preferences(email)
        }

        # Log DSAR for audit trail
        await self.log_dsar_request(email, 'access')

        return user_data

    async def process_deletion_request(self, email: str):
        """Handle right to be forgotten"""
        # Verify identity first
        if not await self.verify_identity(email):
            raise AuthenticationError("Identity verification failed")

        # Delete or anonymize data
        await self.delete_user_profile(email)
        await self.anonymize_orders(email)
        await self.delete_activity_logs(email)

        # Log deletion for compliance
        await self.log_dsar_request(email, 'deletion')

        # Send confirmation
        await self.send_deletion_confirmation(email)
```

## Audit Documentation

### Control Implementation Document
```markdown
# Control Implementation: CC6.1 - MFA Enforcement

## Control Description
Multi-factor authentication (MFA) is required for all user accounts accessing production systems.

## Implementation Details
- **Provider:** Auth0
- **Method:** TOTP (Time-based One-Time Password)
- **Enforcement:** Required on login, enforced at application level
- **Exceptions:** None permitted

## Testing Procedure
1. Query all user accounts from Auth0
2. Verify `mfa_enabled` flag is true for each account
3. Attempt login without MFA (should fail)
4. Document results

## Evidence
- Auth0 user export (monthly)
- MFA configuration screenshot
- Test login attempt logs

## Responsible Party
- Implementation: Security Team
- Monitoring: DevOps Team
- Review: Quarterly by CISO
```

## Best Practices

✅ Collect evidence continuously (not just before audit)
✅ Automate evidence collection where possible
✅ Document control implementation in detail
✅ Test controls regularly (quarterly minimum)
✅ Maintain audit trail for all compliance activities
✅ Track remediation progress with issue tracking
✅ Review and update policies annually
✅ Conduct internal audits before external audits

## Common Audit Findings

- Incomplete access reviews
- Missing change approval documentation
- Insufficient incident response testing
- Weak password policies
- Lack of vendor risk assessments
- Inadequate security awareness training
- Poor documentation of controls

## Remediation Prioritization

1. **Critical:** Immediate risk to compliance certification
2. **High:** Must fix before audit
3. **Medium:** Fix within 30-60 days
4. **Low:** Improvement opportunities
