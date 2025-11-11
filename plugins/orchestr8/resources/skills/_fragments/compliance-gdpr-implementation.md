---
id: compliance-gdpr-implementation
category: skill
tags: [compliance, gdpr, privacy, data-protection, europe, user-rights, consent]
capabilities:
  - GDPR right to access implementation (data portability)
  - GDPR right to erasure ("right to be forgotten")
  - Consent management and tracking systems
  - Data breach notification workflows (72-hour requirement)
useWhen:
  - Implementing GDPR right to access with automated personal data export functionality for EU customers in JSON and CSV formats
  - Building right to erasure workflow handling delete requests within 30 days while anonymizing transactional records for analytics
  - Creating consent management system tracking explicit opt-in for marketing emails, analytics cookies, and third-party data sharing
  - Implementing 72-hour data breach notification workflow with automated supervisory authority reporting and affected user communication
  - Designing data minimization strategy for user registration collecting only essential fields with purpose limitation documentation
  - Building privacy-by-design architecture with encryption at rest, pseudonymization, and granular access controls for EU personal data
estimatedTokens: 700
---

# GDPR Compliance Implementation

Implement GDPR (General Data Protection Regulation) requirements for handling EU residents' personal data through code patterns and automated workflows.

## Right to Access (Data Portability)

```javascript
// Implement data export
async function exportUserData(userId) {
    const userData = {
        profile: await db.users.findOne({ id: userId }),
        orders: await db.orders.find({ userId }),
        preferences: await db.preferences.find({ userId }),
        consent: await db.consents.find({ userId })
    };

    // Return in portable format (JSON/CSV)
    return {
        requested_at: new Date(),
        data: userData,
        format: 'JSON'
    };
}
```

## Right to Erasure ("Right to be Forgotten")

```javascript
async function deleteUserData(userId, reason) {
    // Audit trail
    await db.dataErasureLog.insert({
        userId,
        requestedAt: new Date(),
        reason,
        status: 'processing'
    });

    // Delete personal data
    await db.users.delete({ id: userId });
    await db.profiles.delete({ userId });
    await db.preferences.delete({ userId });

    // Anonymize transactional data (keep for analytics)
    await db.orders.update(
        { userId },
        {
            userId: 'anonymized',
            email: 'redacted@example.com',
            name: '[REDACTED]'
        }
    );

    // Update log
    await db.dataErasureLog.update(
        { userId },
        { status: 'completed', completedAt: new Date() }
    );
}
```

## Consent Management

```javascript
const consentTypes = {
    MARKETING: 'marketing_emails',
    ANALYTICS: 'analytics_tracking',
    THIRD_PARTY: 'third_party_sharing'
};

async function recordConsent(userId, consentType, granted) {
    await db.consents.insert({
        userId,
        consentType,
        granted,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        version: '1.0'  // Track consent form version
    });

    // Trigger actions based on consent
    if (!granted && consentType === consentTypes.MARKETING) {
        await unsubscribeFromMarketing(userId);
    }
}

// Require explicit consent
app.use((req, res, next) => {
    if (requiresConsent(req.path)) {
        const consent = await getConsent(req.user.id, req.consentType);
        if (!consent || !consent.granted) {
            return res.status(403).json({
                error: 'Consent required',
                message: 'You must grant consent to access this resource'
            });
        }
    }
    next();
});
```

## Data Breach Notification (72 hours)

```javascript
async function handleDataBreach(breach) {
    // Immediate logging
    await db.breachLog.insert({
        ...breach,
        discovered_at: new Date(),
        notification_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000)
    });

    // Alert security team
    await alertSecurityTeam(breach);

    // Assess impact
    const affectedUsers = await identifyAffectedUsers(breach);

    // Notify supervisory authority if high risk
    if (isHighRisk(breach)) {
        await notifySupervisoryAuthority({
            breach,
            affectedUsers: affectedUsers.length,
            mitigationSteps: breach.mitigation
        });
    }

    // Notify affected users
    if (isHighRiskToIndividuals(breach)) {
        await notifyAffectedUsers(affectedUsers, breach);
    }
}
```

## Best Practices

✅ **Audit everything** - Log all data access and modifications
✅ **Explicit consent** - Require opt-in, not opt-out
✅ **Data minimization** - Collect only what you need
✅ **Portable formats** - JSON/CSV for data exports
✅ **Anonymization** - Don't delete transactional data, anonymize it
✅ **72-hour rule** - Automate breach notification workflows
