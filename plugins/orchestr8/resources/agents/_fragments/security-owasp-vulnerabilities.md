---
id: security-owasp-vulnerabilities
category: agent
tags: [security, owasp, injection, xss, authentication, vulnerabilities, appsec]
capabilities:
  - OWASP Top 10 vulnerability prevention (injection, XSS, broken access)
  - Secure authentication implementation with MFA
  - Input validation and sanitization patterns
  - Rate limiting and account lockout mechanisms
useWhen:
  - Preventing OWASP Top 10 vulnerabilities including SQL injection (parameterized queries), XSS (DOMPurify sanitization), and broken access control (ABAC policies)
  - Implementing secure authentication with bcrypt password hashing (12+ rounds), multi-factor authentication using speakeasy TOTP, and rate limiting with express-rate-limit
  - Building input validation and sanitization pipelines using express-validator with regex patterns, normalizeEmail(), trim(), and field constraints (min/max length, isInt)
  - Protecting APIs against brute force attacks with account lockout after 5 failed attempts, 15-minute lockout periods, and security alert notifications
  - Configuring security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) using Helmet.js with Content-Security-Policy directives and HSTS includeSubDomains
  - Preventing injection attacks (SQL, NoSQL, Command) using ORM safe patterns, explicit MongoDB $eq operators, and path.basename for path traversal protection
estimatedTokens: 800
---

# Security Expert - OWASP Vulnerabilities

Prevention and mitigation strategies for OWASP Top 10 vulnerabilities, authentication security, and input validation.

## A01: Broken Access Control

**Prevention:**
```javascript
// Implement proper authorization checks
function deleteResource(userId, resourceId) {
    const resource = await db.findResource(resourceId);

    // Check ownership
    if (resource.ownerId !== userId) {
        throw new ForbiddenError('Not authorized');
    }

    // Check permissions
    if (!hasPermission(userId, 'delete', resource)) {
        throw new ForbiddenError('Insufficient permissions');
    }

    await db.delete(resourceId);
}

// Use attribute-based access control (ABAC)
const policy = {
    resource: 'document',
    action: 'read',
    conditions: {
        'user.department': 'document.department',
        'document.classification': ['public', 'internal']
    }
};
```

## A02: Security Misconfiguration

**Essential Headers:**
```nginx
# Security headers (nginx)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

```javascript
// Using Helmet in Node.js
const helmet = require('helmet');

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));
```

## A03: Injection Attacks

**SQL Injection Prevention:**
```javascript
// Use parameterized queries
const user = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]  // Parameterized
);

// ORM safe by default
const user = await User.findOne({ where: { email } });
```

**Command Injection Prevention:**
```javascript
const path = require('path');

// Validate input
const filename = path.basename(userInput);  // Strip path traversal
if (!/^[a-zA-Z0-9_-]+$/.test(filename)) {
    throw new ValidationError('Invalid filename');
}
```

**NoSQL Injection Prevention:**
```javascript
// Explicit operators prevent injection
const user = await User.findOne({
    email: { $eq: email }  // Explicit operator
});
```

## A07: Authentication Failures

**Secure Password Hashing:**
```javascript
const bcrypt = require('bcrypt');

async function hashPassword(password) {
    // Minimum 10 rounds, 12+ recommended
    return await bcrypt.hash(password, 12);
}

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}
```

**Multi-Factor Authentication:**
```javascript
const speakeasy = require('speakeasy');

async function verifyMFA(userId, code) {
    const secret = await getMFASecret(userId);
    return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 1  // Allow 30s time drift
    });
}
```

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 attempts
    message: 'Too many login attempts'
});

app.post('/login', loginLimiter, loginHandler);
```

**Account Lockout:**
```javascript
async function handleFailedLogin(userId) {
    const attempts = await incrementFailedAttempts(userId);
    if (attempts >= 5) {
        await lockAccount(userId, '15 minutes');
        await sendSecurityAlert(userId);
    }
}
```

## Input Validation & Sanitization

**Comprehensive Validation:**
```javascript
const { body, param, validationResult } = require('express-validator');

const validateUser = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .trim(),
    body('password')
        .isLength({ min: 12 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .withMessage('Password must contain uppercase, lowercase, number, and special char'),
    body('age')
        .isInt({ min: 18, max: 120 })
        .toInt(),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

**XSS Prevention:**
```javascript
const createDOMPurify = require('isomorphic-dompurify');
const DOMPurify = createDOMPurify();

function sanitizeHTML(dirty) {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
        ALLOWED_ATTR: ['href']
    });
}
```

## Best Practices

✅ Always validate and sanitize user input
✅ Use parameterized queries for database access
✅ Implement MFA for sensitive accounts
✅ Set secure headers (CSP, HSTS, X-Frame-Options)
✅ Rate limit authentication endpoints
✅ Hash passwords with bcrypt (12+ rounds)

❌ Don't trust client-side validation
❌ Don't concatenate user input into queries
❌ Don't store passwords in plain text
❌ Don't ignore failed login attempts
