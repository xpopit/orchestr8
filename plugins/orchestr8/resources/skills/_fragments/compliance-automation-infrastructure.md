---
id: compliance-automation-infrastructure
category: skill
tags: [compliance, automation, aws-config, opa, policy-as-code, infrastructure, monitoring]
capabilities:
  - Infrastructure compliance automation with AWS Config
  - Policy as code implementation with OPA (Open Policy Agent)
  - Automated evidence collection for audits
  - Continuous compliance monitoring and alerting
useWhen:
  - Implementing automated compliance checks with OPA policy engine for Terraform validating encryption and tagging requirements
  - Building infrastructure-as-code policy enforcement preventing non-compliant AWS resources with automated remediation
  - Creating continuous compliance monitoring scanning cloud infrastructure for CIS benchmark violations with Slack alerts
  - Designing GitOps workflow for compliance policies with version control and peer review for security rule changes
  - Implementing audit evidence collection automation extracting infrastructure compliance reports for SOC 2 and ISO 27001
estimatedTokens: 620
---

# Compliance Automation & Infrastructure

Automate compliance monitoring and policy enforcement using infrastructure-as-code, policy engines, and continuous monitoring.

## Infrastructure Compliance (AWS Config)

```yaml
# AWS Config Rules
Rules:
  - Name: encrypted-volumes
    Description: Ensure all EBS volumes are encrypted
    Source:
      Owner: AWS
      Identifier: ENCRYPTED_VOLUMES

  - Name: s3-bucket-public-read-prohibited
    Description: Ensure S3 buckets don't allow public read
    Source:
      Owner: AWS
      Identifier: S3_BUCKET_PUBLIC_READ_PROHIBITED

  - Name: required-tags
    Description: Ensure resources have required tags
    Source:
      Owner: AWS
      Identifier: REQUIRED_TAGS
    InputParameters:
      tag1Key: "CostCenter"
      tag2Key: "Owner"
```

## Policy as Code (OPA)

```rego
package compliance

# Require encryption for databases
deny[msg] {
    resource := input.resource_changes[_]
    resource.type == "aws_db_instance"
    not resource.change.after.storage_encrypted
    msg := sprintf("Database %s must have encryption enabled", [resource.address])
}

# Require MFA for users with admin access
deny[msg] {
    user := input.users[_]
    has_admin_access(user)
    not user.mfa_enabled
    msg := sprintf("User %s has admin access but MFA is not enabled", [user.name])
}
```

## Automated Evidence Collection

```javascript
// Collect evidence for audits
async function collectComplianceEvidence() {
    const evidence = {
        access_logs: await exportAccessLogs(30), // Last 30 days
        change_logs: await exportChangeLogs(30),
        security_scans: await getSecurityScanResults(),
        vulnerability_reports: await getVulnerabilityReports(),
        backup_status: await getBackupStatus(),
        encryption_status: await getEncryptionStatus(),
        user_access_reviews: await getAccessReviews(90), // Quarterly
        incident_reports: await getIncidentReports(365) // Yearly
    };

    // Store in audit-safe location
    await storeEvidence(evidence);

    return evidence;
}
```

## Continuous Compliance Monitoring

```javascript
// Real-time compliance monitoring
async function monitorCompliance() {
    const checks = [
        checkEncryption(),
        checkAccessControls(),
        checkAuditLogs(),
        checkBackups(),
        checkPatchingStatus(),
        checkVulnerabilities()
    ];

    const results = await Promise.all(checks);

    // Alert on non-compliance
    const failures = results.filter(r => !r.compliant);
    if (failures.length > 0) {
        await alertComplianceTeam(failures);
    }

    // Dashboard metrics
    await updateComplianceDashboard({
        overall_score: calculateComplianceScore(results),
        failing_controls: failures,
        last_check: new Date()
    });
}

// Schedule daily compliance checks
cron.schedule('0 2 * * *', monitorCompliance);
```

## Best Practices

✅ **Automate everything** - Manual compliance is error-prone
✅ **Continuous monitoring** - Don't wait for audits to check compliance
✅ **Policy as code** - Enforce policies in infrastructure provisioning
✅ **Evidence collection** - Automate gathering of audit evidence
✅ **Real-time alerts** - Immediate notification of non-compliance
✅ **Regular scanning** - Daily or continuous compliance checks
