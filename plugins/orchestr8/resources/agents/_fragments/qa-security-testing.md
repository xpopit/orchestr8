---
id: qa-security-testing
category: agent
tags: [qa, security, penetration-testing, owasp, vulnerability-scanning, zap, burp, security-automation]
capabilities:
  - OWASP Top 10 vulnerability testing
  - Penetration testing methodologies
  - Security scanning automation
  - API security testing
  - Authentication and authorization testing
useWhen:
  - Performing security penetration testing for OWASP Top 10 vulnerabilities including SQL injection, XSS, CSRF, broken authentication, and security misconfiguration
  - Implementing automated security scanning with Burp Suite, OWASP ZAP, or Nessus for vulnerability detection in web applications and APIs
  - Conducting authentication and authorization testing verifying JWT validation, session management, RBAC/ABAC policies, and privilege escalation prevention
  - Testing API security including input validation, rate limiting enforcement, API key management, OAuth flows, and protection against replay attacks
  - Performing security code review identifying hardcoded secrets, insecure dependencies, improper error handling exposing stack traces, and missing security headers
  - Validating security compliance with frameworks like OWASP ASVS (Application Security Verification Standard), PCI-DSS for payment systems, or HIPAA for healthcare
estimatedTokens: 670
---

# QA Expert - Security Testing

Expert in penetration testing, vulnerability scanning, and security automation following OWASP standards.

## OWASP Top 10 Testing

### 1. Injection (SQL, NoSQL, Command)
```javascript
// Test cases for SQL injection
const injectionPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users--",
  "1' UNION SELECT null, username, password FROM users--",
  "admin'--",
  "' OR 1=1--"
];

test('SQL Injection Prevention', async () => {
  for (const payload of injectionPayloads) {
    const res = await request.post('/api/login')
      .send({ username: payload, password: 'test' });

    expect(res.status).not.toBe(200);
    expect(res.body.error).toBeDefined();
  }
});

// Command injection
const commandPayloads = [
  "; ls -la",
  "| cat /etc/passwd",
  "& whoami",
  "`id`"
];
```

### 2. Broken Authentication
```javascript
// Test weak passwords
test('Password Policy Enforcement', async () => {
  const weakPasswords = ['12345', 'password', 'qwerty'];

  for (const weak of weakPasswords) {
    const res = await request.post('/api/register')
      .send({ email: 'test@test.com', password: weak });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('password');
  }
});

// Test session timeout
test('Session Expiration', async () => {
  const token = await login('user@test.com', 'password');

  // Wait past timeout (or manipulate time)
  await sleep(31 * 60 * 1000);  // 31 minutes

  const res = await request.get('/api/protected')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).toBe(401);
});

// Test concurrent session limits
test('Concurrent Session Prevention', async () => {
  const token1 = await login('user@test.com', 'password');
  const token2 = await login('user@test.com', 'password');

  // First token should be invalidated
  const res = await request.get('/api/protected')
    .set('Authorization', `Bearer ${token1}`);

  expect(res.status).toBe(401);
});
```

### 3. Sensitive Data Exposure
```javascript
// Check for sensitive data in responses
test('No Sensitive Data Leakage', async () => {
  const res = await request.get('/api/users/me');

  expect(res.body).not.toHaveProperty('password');
  expect(res.body).not.toHaveProperty('passwordHash');
  expect(res.body).not.toHaveProperty('ssn');

  // Check headers
  expect(res.headers).not.toHaveProperty('x-internal-ip');
});

// Test HTTPS enforcement
test('HTTPS Redirect', async () => {
  const res = await request.get('http://api.example.com/');

  expect(res.status).toBe(301);
  expect(res.headers.location).toMatch(/^https:/);
});
```

### 4. XML External Entities (XXE)
```javascript
// XXE attack payloads
const xxePayload = `<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<user><name>&xxe;</name></user>`;

test('XXE Prevention', async () => {
  const res = await request.post('/api/upload-xml')
    .set('Content-Type', 'application/xml')
    .send(xxePayload);

  expect(res.body).not.toContain('root:x:0:0');
});
```

### 5. Broken Access Control
```javascript
// Test IDOR (Insecure Direct Object Reference)
test('IDOR Prevention', async () => {
  const userToken = await login('user@test.com', 'password');

  // Try to access another user's data
  const res = await request.get('/api/users/999/orders')
    .set('Authorization', `Bearer ${userToken}`);

  expect(res.status).toBe(403);
});

// Test vertical privilege escalation
test('Admin Endpoint Protection', async () => {
  const userToken = await login('user@test.com', 'password');

  const res = await request.post('/api/admin/users/delete')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ userId: 123 });

  expect(res.status).toBe(403);
});
```

### 6. Security Misconfiguration
```javascript
// Test security headers
test('Security Headers Present', async () => {
  const res = await request.get('/');

  expect(res.headers['x-frame-options']).toBe('DENY');
  expect(res.headers['x-content-type-options']).toBe('nosniff');
  expect(res.headers['strict-transport-security']).toBeDefined();
  expect(res.headers['content-security-policy']).toBeDefined();
});

// Test error handling
test('No Stack Traces in Production', async () => {
  const res = await request.get('/api/error-endpoint');

  expect(res.body).not.toContain('at ');
  expect(res.body).not.toContain('node_modules');
  expect(res.body.message).toBe('Internal Server Error');
});
```

### 7. XSS (Cross-Site Scripting)
```javascript
// XSS payloads
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror="alert(1)">',
  'javascript:alert(1)',
  '<svg onload=alert(1)>',
  '"><script>alert(String.fromCharCode(88,83,83))</script>'
];

test('XSS Prevention', async () => {
  for (const payload of xssPayloads) {
    const res = await request.post('/api/comments')
      .send({ text: payload });

    const comment = await request.get(`/api/comments/${res.body.id}`);

    // Should be escaped
    expect(comment.body.text).not.toContain('<script');
    expect(comment.body.text).toContain('&lt;script');
  }
});
```

### 8. Insecure Deserialization
```javascript
// Test deserialization attacks
test('Safe Deserialization', async () => {
  const maliciousPayload = {
    __proto__: { isAdmin: true }
  };

  const res = await request.post('/api/settings')
    .send(maliciousPayload);

  // Should not pollute prototype
  expect({}.isAdmin).toBeUndefined();
});
```

## OWASP ZAP Automation

### Baseline Scan
```bash
#!/bin/bash
# Quick passive scan for common issues

docker run -v $(pwd):/zap/wrk/:rw \
  owasp/zap2docker-stable \
  zap-baseline.py \
  -t https://staging.example.com \
  -r baseline-report.html \
  -J baseline-report.json
```

### Full Active Scan
```bash
#!/bin/bash
# Comprehensive active scan (slow)

docker run -v $(pwd):/zap/wrk/:rw \
  owasp/zap2docker-stable \
  zap-full-scan.py \
  -t https://staging.example.com \
  -r full-report.html \
  -J full-report.json
```

### API Scan
```bash
# Scan OpenAPI/Swagger spec
docker run -v $(pwd):/zap/wrk/:rw \
  owasp/zap2docker-stable \
  zap-api-scan.py \
  -t https://api.example.com/openapi.json \
  -f openapi \
  -r api-report.html \
  -z "-config api.disablekey=true"
```

## Burp Suite Automation

```python
# Burp Suite API
import requests

burp_api = "http://localhost:1337"

# Start scan
scan_config = {
    "urls": ["https://staging.example.com"],
    "scan_configurations": [
        {"name": "audit-checks", "type": "BuiltIn"}
    ]
}

response = requests.post(f"{burp_api}/v0.1/scan", json=scan_config)
scan_id = response.json()["scan_id"]

# Poll for completion
while True:
    status = requests.get(f"{burp_api}/v0.1/scan/{scan_id}").json()
    if status["scan_status"] == "succeeded":
        break
    time.sleep(10)

# Get results
issues = requests.get(f"{burp_api}/v0.1/scan/{scan_id}/issues").json()
```

## JWT Security Testing

```javascript
// Test JWT vulnerabilities
test('JWT Algorithm Confusion', async () => {
  const token = jwt.sign({ userId: 123 }, 'secret', { algorithm: 'HS256' });

  // Try to change to 'none' algorithm
  const parts = token.split('.');
  const header = JSON.parse(base64Decode(parts[0]));
  header.alg = 'none';

  const maliciousToken = base64Encode(JSON.stringify(header)) + '.' + parts[1] + '.';

  const res = await request.get('/api/protected')
    .set('Authorization', `Bearer ${maliciousToken}`);

  expect(res.status).toBe(401);
});

// Test JWT expiration
test('Expired JWT Rejected', async () => {
  const expiredToken = jwt.sign(
    { userId: 123 },
    'secret',
    { expiresIn: '-1h' }
  );

  const res = await request.get('/api/protected')
    .set('Authorization', `Bearer ${expiredToken}`);

  expect(res.status).toBe(401);
});
```

## Rate Limiting Tests

```javascript
test('Rate Limiting Enforced', async () => {
  const requests = [];

  // Send 100 requests rapidly
  for (let i = 0; i < 100; i++) {
    requests.push(request.get('/api/data'));
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status === 429);

  expect(rateLimited.length).toBeGreaterThan(0);
});
```

## CI/CD Security Pipeline

```yaml
name: Security Testing

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      # SAST
      - name: Static Analysis
        run: |
          npm install -g semgrep
          semgrep --config=auto --json > sast.json

      # Dependency Scan
      - name: Dependency Scan
        run: |
          npm audit --audit-level=high
          npm install -g snyk
          snyk test --severity-threshold=high

      # DAST
      - name: Dynamic Scan
        run: |
          docker-compose up -d app
          docker run owasp/zap2docker-stable \
            zap-baseline.py -t http://localhost:3000 \
            -r zap-report.html

      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: security-reports
          path: |
            sast.json
            zap-report.html
```

## Security Testing Checklist

✅ Test all OWASP Top 10 vulnerabilities
✅ Validate input sanitization
✅ Check authentication mechanisms
✅ Test authorization boundaries
✅ Verify HTTPS enforcement
✅ Test security headers
✅ Scan for known vulnerabilities
✅ Test rate limiting
✅ Check for sensitive data exposure
✅ Validate error handling

## Tools Ecosystem

- **OWASP ZAP**: Free DAST scanner
- **Burp Suite**: Professional pentesting
- **Snyk**: Dependency vulnerability scanning
- **Semgrep**: SAST with custom rules
- **Trivy**: Container scanning
- **Nuclei**: Template-based scanning
