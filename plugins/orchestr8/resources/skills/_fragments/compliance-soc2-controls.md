---
id: compliance-soc2-controls
category: skill
tags: [compliance, soc2, security, access-control, change-management, incident-response, audit]
capabilities:
  - SOC 2 access control policies and reviews
  - Change management tracking and approval workflows
  - Incident detection, response, and post-mortem processes
  - Trust Service Criteria implementation (Security, Availability, Processing Integrity)
useWhen:
  - Preparing for SOC 2 Type II audit implementing Trust Service Criteria controls for Security, Availability, and Processing Integrity
  - Implementing least privilege access control system with quarterly access reviews and approval workflows for role changes
  - Building formal change management process tracking production deployments with git commit history, approver records, and rollback procedures
  - Creating incident response workflow with automated detection, on-call paging, timeline logging, and blameless post-mortem documentation
  - Designing continuous monitoring infrastructure for security alerts, availability metrics, and access anomalies with audit trail retention
  - Implementing evidence collection automation for SOC 2 audit including access logs, change records, and incident response documentation
estimatedTokens: 680
---

# SOC 2 Controls Implementation

Implement SOC 2 (Service Organization Control) compliance focused on Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.

## Access Control Policy

```javascript
// Principle of least privilege
const roles = {
    developer: ['read:code', 'write:code', 'read:logs'],
    admin: ['*'],  // Full access
    viewer: ['read:*']  // Read-only
};

function hasPermission(user, permission) {
    const userPermissions = roles[user.role] || [];
    return userPermissions.some(p => {
        if (p === '*') return true;
        if (p === permission) return true;
        // Wildcard matching
        const regex = new RegExp('^' + p.replace('*', '.*') + '$');
        return regex.test(permission);
    });
}

// Access review (quarterly)
async function conductAccessReview() {
    const users = await db.users.find({ active: true });

    for (const user of users) {
        const lastReview = await db.accessReviews.findOne({
            userId: user.id,
            reviewedAt: { $gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        });

        if (!lastReview) {
            await requestAccessReview(user);
        }
    }
}
```

## Change Management

```javascript
// Track all infrastructure changes
async function requestInfrastructureChange(change) {
    const changeRequest = await db.changeRequests.insert({
        requestedBy: change.userId,
        description: change.description,
        environment: change.environment,
        riskLevel: assessRisk(change),
        status: 'pending_approval',
        requestedAt: new Date()
    });

    // Require approval for production changes
    if (change.environment === 'production') {
        await requestApproval(changeRequest.id, ['tech_lead', 'security']);
    }

    return changeRequest.id;
}

// Automated change tracking via CI/CD
// .github/workflows/deploy.yml includes:
// - What changed (git diff)
// - Who approved (PR reviewers)
// - When deployed (timestamp)
// - Rollback procedure
```

## Incident Response

```javascript
// Incident detection and response
async function detectIncident(event) {
    // Automated detection
    if (isSecurityIncident(event)) {
        const incident = await db.incidents.insert({
            type: event.type,
            severity: event.severity,
            detectedAt: new Date(),
            status: 'investigating',
            affectedSystems: event.systems
        });

        // Alert on-call team
        await pageOnCall(incident);

        // Start incident timeline
        await logIncidentEvent(incident.id, 'detected', event.details);

        return incident.id;
    }
}

// Incident post-mortem (required for SOC 2)
async function conductPostMortem(incidentId) {
    const incident = await db.incidents.findOne({ id: incidentId });

    const postMortem = {
        incidentId,
        summary: '',
        timeline: await getIncidentTimeline(incidentId),
        rootCause: '',
        impact: {
            duration: calculateDowntime(incident),
            affectedUsers: countAffectedUsers(incident),
            dataLoss: assessDataLoss(incident)
        },
        actionItems: [],
        preventionSteps: []
    };

    return postMortem;
}
```

## Best Practices

✅ **Least privilege** - Only grant necessary access
✅ **Quarterly reviews** - Regular access audits
✅ **Change approval** - Production changes require approval
✅ **Incident response** - Automated detection and escalation
✅ **Post-mortems** - Blameless incident analysis
✅ **Documentation** - Evidence collection for audits
