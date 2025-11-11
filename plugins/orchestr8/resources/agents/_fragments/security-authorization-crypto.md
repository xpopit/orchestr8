---
id: security-authorization-crypto
category: agent
tags: [security, jwt, rbac, authorization, cryptography, token, encryption]
capabilities:
  - JWT token generation and validation best practices
  - Role-Based Access Control (RBAC) implementation
  - AES encryption and secure cryptography patterns
  - Secure random token generation
useWhen:
  - Implementing JWT authentication with short-lived access tokens (15m), long-lived refresh tokens (7d), separate signing secrets, and TokenExpiredError handling
  - Building RBAC authorization systems with wildcard permission matching (post:*), attribute-based access control (ABAC) for resource ownership checks, and 403 Forbidden middleware
  - Encrypting sensitive data using AES-256-GCM with crypto.createCipheriv, random IV generation, authentication tags (getAuthTag/setAuthTag), and secure key derivation with PBKDF2
  - Generating secure tokens using crypto.randomBytes(32) for API keys, session tokens, or CSRF tokens with base64url encoding for URL-safe representations
  - Storing refresh tokens securely by hashing with bcrypt before database storage, validating with bcrypt.compare, and checking expiration timestamps
  - Configuring secure session cookies with httpOnly, secure, sameSite='strict' flags for XSS/CSRF protection and maxAge for automatic expiration
estimatedTokens: 750
---

# Security Expert - Authorization & Cryptography

JWT authentication, role-based access control, and cryptographic best practices for secure applications.

## JWT Best Practices

**Token Generation:**
```javascript
const jwt = require('jsonwebtoken');

function generateTokens(userId) {
    const accessToken = jwt.sign(
        { userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }  // Short-lived
    );

    const refreshToken = jwt.sign(
        { userId, type: 'refresh' },
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }  // Longer-lived
    );

    return { accessToken, refreshToken };
}
```

**Token Verification:**
```javascript
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Token expired');
        }
        throw new UnauthorizedError('Invalid token');
    }
}
```

**Secure Refresh Token Storage:**
```javascript
async function storeRefreshToken(userId, token) {
    // Hash token before storing
    const hashedToken = await bcrypt.hash(token, 10);
    await db.insert({
        userId,
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
}

async function verifyRefreshToken(userId, token) {
    const stored = await db.findRefreshToken(userId);
    if (!stored || stored.expiresAt < new Date()) {
        return false;
    }
    return await bcrypt.compare(token, stored.tokenHash);
}
```

## Role-Based Access Control (RBAC)

**Define Roles and Permissions:**
```javascript
const roles = {
    admin: ['user:read', 'user:write', 'user:delete', 'post:*'],
    editor: ['post:read', 'post:write', 'comment:moderate'],
    user: ['post:read', 'comment:write']
};

function hasPermission(user, permission) {
    const userPermissions = roles[user.role] || [];
    return userPermissions.some(p => {
        if (p === permission) return true;
        // Wildcard matching
        const regex = new RegExp('^' + p.replace('*', '.*') + '$');
        return regex.test(permission);
    });
}
```

**Authorization Middleware:**
```javascript
function requirePermission(permission) {
    return async (req, res, next) => {
        const user = req.user;
        if (!hasPermission(user, permission)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

// Usage
app.delete('/users/:id',
    authenticate,
    requirePermission('user:delete'),
    deleteUser
);
```

**Attribute-Based Access Control (ABAC):**
```javascript
function checkPolicy(user, resource, action) {
    const policies = {
        'document:read': (u, r) =>
            u.department === r.department ||
            r.classification === 'public',
        'document:write': (u, r) =>
            u.id === r.ownerId ||
            u.role === 'admin',
        'document:delete': (u, r) =>
            u.id === r.ownerId && u.role === 'admin'
    };

    const policy = policies[`${resource.type}:${action}`];
    return policy ? policy(user, resource) : false;
}
```

## Cryptography

**AES-256-GCM Encryption:**
```javascript
const crypto = require('crypto');

function encrypt(text, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

function decrypt(encrypted, key, iv, authTag) {
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}
```

**Secure Random Tokens:**
```javascript
function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

function generateApiKey() {
    return crypto.randomBytes(32).toString('base64url');
}
```

**Key Derivation (PBKDF2):**
```javascript
function deriveKey(password, salt, iterations = 100000) {
    return crypto.pbkdf2Sync(
        password,
        salt,
        iterations,
        32,
        'sha256'
    );
}
```

## Session Management

**Secure Session Cookies:**
```javascript
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,      // Prevent XSS
        secure: true,        // HTTPS only
        sameSite: 'strict',  // CSRF protection
        maxAge: 3600000      // 1 hour
    }
}));
```

## Best Practices

✅ Use short-lived access tokens (15 minutes)
✅ Hash refresh tokens before storing
✅ Implement RBAC with wildcard permissions
✅ Use AES-256-GCM for encryption
✅ Generate secure random tokens with crypto.randomBytes
✅ Set httpOnly, secure, sameSite flags on cookies

❌ Don't store JWT secret in code
❌ Don't use weak encryption (DES, MD5)
❌ Don't reuse IVs or salts
❌ Don't implement custom crypto algorithms
