---
id: compliance-hipaa-security
category: skill
tags: [compliance, hipaa, healthcare, phi, encryption, security, access-control, audit]
capabilities:
  - HIPAA encryption implementation (at rest and in transit)
  - Healthcare-grade access controls with MFA
  - PHI audit logging and access tracking
  - Emergency "break-glass" access patterns
useWhen:
  - Implementing HIPAA-compliant encryption for Protected Health Information using AES-256-GCM at rest and TLS 1.2+ in transit
  - Building healthcare access controls with mandatory MFA, role-based permissions, and automatic 15-minute session timeout
  - Creating comprehensive PHI audit logging tracking who accessed what patient data, when, why, and from which IP address
  - Implementing break-glass emergency access pattern for clinical emergencies with mandatory compliance team review and justification
  - Designing patient record system with unique user identification, automatic logoff, and encrypted transmission of electronic PHI
  - Building HIPAA audit trail infrastructure collecting access logs, failed authentication attempts, and emergency access events for compliance reporting
estimatedTokens: 750
---

# HIPAA Security Implementation

Implement HIPAA (Health Insurance Portability and Accountability Act) security controls for protecting Protected Health Information (PHI).

## Encryption (At Rest & In Transit)

```javascript
const crypto = require('crypto');

// Encrypt PHI at rest
function encryptPHI(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

// TLS 1.2+ for data in transit
const https = require('https');
const fs = require('fs');

const server = https.createServer({
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem'),
    minVersion: 'TLSv1.2',
    ciphers: [
        'ECDHE-RSA-AES256-GCM-SHA384',
        'ECDHE-RSA-AES128-GCM-SHA256'
    ].join(':')
}, app);
```

## Access Controls

```javascript
// Unique user identification
async function authenticateHealthcareUser(username, password, mfaCode) {
    const user = await db.users.findOne({ username });

    // Verify credentials
    if (!await bcrypt.compare(password, user.passwordHash)) {
        await logFailedLogin(username);
        throw new Error('Invalid credentials');
    }

    // MFA required for PHI access
    if (!await verifyMFA(user.id, mfaCode)) {
        await logFailedMFA(user.id);
        throw new Error('Invalid MFA code');
    }

    // Role-based access
    if (!hasRole(user, 'healthcare_provider')) {
        throw new Error('Unauthorized');
    }

    await logSuccessfulLogin(user.id);
    return generateSession(user);
}

// Automatic logoff
const sessionTimeout = 15 * 60 * 1000; // 15 minutes
app.use(session({
    cookie: {
        maxAge: sessionTimeout,
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
    },
    rolling: true  // Reset timer on activity
}));
```

## Audit Logs

```javascript
// Comprehensive audit trail
async function logPHIAccess(event) {
    await db.auditLog.insert({
        timestamp: new Date(),
        userId: event.userId,
        userName: event.userName,
        action: event.action,  // view, create, update, delete
        resourceType: 'PHI',
        resourceId: event.patientId,
        ipAddress: event.ipAddress,
        success: event.success,
        reason: event.reason  // Why accessed
    });
}

// Middleware for automatic logging
app.use('/api/patients', (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function(data) {
        logPHIAccess({
            userId: req.user.id,
            userName: req.user.name,
            action: req.method,
            patientId: req.params.patientId,
            ipAddress: req.ip,
            success: res.statusCode < 400
        });

        return originalJson(data);
    };

    next();
});
```

## Emergency Access

```javascript
// Break-glass access
async function grantEmergencyAccess(userId, patientId, reason) {
    // Temporarily elevate privileges
    const emergencyAccess = await db.emergencyAccess.insert({
        userId,
        patientId,
        reason,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        reviewRequired: true
    });

    // Alert compliance team
    await alertComplianceTeam({
        type: 'emergency_access',
        user: userId,
        patient: patientId,
        reason
    });

    return emergencyAccess.id;
}

// Review emergency access
async function reviewEmergencyAccess() {
    const unreviewedAccess = await db.emergencyAccess.find({
        reviewRequired: true,
        expiresAt: { $lt: new Date() }
    });

    // Notify administrators
    await notifyAdmins(unreviewedAccess);
}
```

## Best Practices

✅ **Encrypt everything** - AES-256-GCM at rest, TLS 1.2+ in transit
✅ **MFA required** - Multi-factor authentication for PHI access
✅ **Automatic timeout** - 15-minute session timeout
✅ **Audit all access** - Log who, what, when, why for every PHI interaction
✅ **Break-glass procedures** - Emergency access with mandatory review
✅ **Role-based access** - Principle of least privilege
