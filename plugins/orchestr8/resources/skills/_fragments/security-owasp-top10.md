---
id: security-owasp-top10
category: skill
tags: [security, owasp, vulnerabilities, best-practices]
capabilities:
  - OWASP Top 10 vulnerabilities
  - Security mitigation strategies
  - Common attack prevention
useWhen:
  - Implementing security controls to prevent OWASP Top 10 vulnerabilities including broken access control, injection, and auth failures
  - Building secure applications requiring parameterized SQL queries, bcrypt password hashing, and HTTPS-only with secure cookies
  - Reviewing code for security vulnerabilities like SQL injection, XSS, CSRF, and SSRF with proper input validation and sanitization
  - Implementing authentication requiring strong password policies (12+ chars, complexity), account lockout, and multi-factor authentication
  - Deploying production applications requiring security headers (Helmet.js), CORS configuration, rate limiting, and dependency auditing
  - Building APIs with proper access control checking user ownership, role-based permissions, and preventing insecure direct object references
estimatedTokens: 480
---

# OWASP Top 10 2025 - Prevention Guide

## 1. Broken Access Control

**Prevention:**
```typescript
// ❌ BAD: Direct object reference
app.get('/users/:id', (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);  // Any user can access any user's data
});

// ✅ GOOD: Check ownership
app.get('/users/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    throw new ForbiddenError();
  }
  const user = await User.findById(req.params.id);
  res.json(user);
});
```

## 2. Cryptographic Failures

**Prevention:**
```typescript
// ✅ Hash passwords with bcrypt
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash(password, 12);

// ✅ Use HTTPS only
app.use((req, res, next) => {
  if (!req.secure && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// ✅ Encrypt sensitive data at rest
import crypto from 'crypto';
const algorithm = 'aes-256-gcm';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
```

## 3. Injection (SQL, NoSQL, Command)

**Prevention:**
```typescript
// ❌ BAD: SQL injection vulnerability
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);

// ✅ GOOD: ORM with proper escaping
const user = await User.findOne({ where: { email } });

// ❌ BAD: Command injection
exec(`rm -rf ${userInput}`);

// ✅ GOOD: Avoid shell commands, use libraries
fs.unlinkSync(path.join(SAFE_DIR, sanitize(userInput)));
```

## 4. Insecure Design

**Prevention:**
- Implement rate limiting
- Use multi-factor authentication
- Design with principle of least privilege
- Threat modeling during design phase

```typescript
// Rate limiting
import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests'
});
app.use('/api/', limiter);
```

## 5. Security Misconfiguration

**Prevention:**
```typescript
// ✅ Secure headers with Helmet
import helmet from 'helmet';
app.use(helmet());

// ✅ Disable unnecessary features
app.disable('x-powered-by');

// ✅ Secure cookies
res.cookie('token', value, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000
});

// ✅ CORS configuration
app.use(cors({
  origin: ['https://example.com'],
  credentials: true
}));
```

## 6. Vulnerable and Outdated Components

**Prevention:**
```bash
# Regular dependency audits
npm audit
npm audit fix

# Use Snyk or Dependabot
# Check package.json for outdated versions
npm outdated

# Pin versions in package-lock.json
# Review security advisories
```

## 7. Authentication Failures

**Prevention:**
```typescript
// ✅ Multi-factor authentication
// ✅ Strong password policy
const passwordSchema = z.string()
  .min(12)
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[^A-Za-z0-9]/, 'Must contain special char');

// ✅ Account lockout after failed attempts
let failedAttempts = await getFailedAttempts(email);
if (failedAttempts >= 5) {
  throw new Error('Account locked. Try again in 15 minutes');
}

// ✅ Secure session management
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 3600000
  }
};
```

## 8. Software and Data Integrity Failures

**Prevention:**
```typescript
// ✅ Verify dependencies with SRI
<script src="https://cdn.example.com/lib.js" 
  integrity="sha384-hash" 
  crossorigin="anonymous"></script>

// ✅ Sign and verify data
import jwt from 'jsonwebtoken';
const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });

// ✅ Use package lock files
// ✅ Implement CI/CD security checks
```

## 9. Security Logging and Monitoring

**Prevention:**
```typescript
// ✅ Log security events
logger.warn('Failed login attempt', {
  email,
  ip: req.ip,
  timestamp: new Date()
});

// ✅ Monitor for suspicious activity
// ✅ Set up alerts for anomalies
// ✅ Implement audit trails for sensitive operations
```

## 10. Server-Side Request Forgery (SSRF)

**Prevention:**
```typescript
// ❌ BAD: Unvalidated URL from user
const response = await fetch(userProvidedUrl);

// ✅ GOOD: Whitelist allowed domains
const ALLOWED_HOSTS = ['api.example.com', 'cdn.example.com'];
const url = new URL(userProvidedUrl);
if (!ALLOWED_HOSTS.includes(url.hostname)) {
  throw new Error('Invalid URL');
}

// ✅ GOOD: Use private network restrictions
// Block access to internal IPs (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
```
