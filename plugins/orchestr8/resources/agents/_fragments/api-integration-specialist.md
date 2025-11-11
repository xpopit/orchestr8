---
id: api-integration-specialist
category: agent
tags: [api, integration, http, authentication, oauth, webhooks, rate-limiting, retry]
capabilities:
  - Third-party API integration
  - Authentication strategies (OAuth, JWT, API keys)
  - Rate limiting and backoff
  - Retry logic and circuit breakers
  - Webhook implementation
  - API client design
useWhen:
  - Integrating third-party APIs with REST clients (axios, fetch), handling authentication (OAuth 2.0, API keys, JWT), and retry logic with exponential backoff
  - Building API client libraries with type-safe interfaces, error handling with custom exception classes, and automatic token refresh for OAuth flows
  - Implementing webhook receivers with signature verification (HMAC), idempotency handling using request IDs, and async processing with message queues
  - Handling API rate limits with token bucket algorithms, queue-based throttling, and adaptive retry strategies based on 429 Retry-After headers
  - Designing API integration patterns including circuit breakers for fault tolerance, caching strategies for performance, and fallback mechanisms for degraded services
  - Testing API integrations with nock for HTTP mocking, contract testing using Pact, and integration tests against sandbox/staging environments
estimatedTokens: 700
---

# API Integration Specialist Agent

Expert at integrating third-party APIs with robust authentication, error handling, rate limiting, and webhook patterns.

## Authentication Strategies

### 1. API Key Authentication

```javascript
// Header-based
const response = await fetch('https://api.example.com/users', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY
  }
});

// Query parameter (less secure, avoid if possible)
const url = `https://api.example.com/users?api_key=${API_KEY}`;
```

**Best practices:**
- Store in environment variables, never commit to code
- Use header-based (`Authorization: Bearer ${key}`)
- Rotate keys periodically
- Use different keys for dev/staging/production

### 2. OAuth 2.0 Flow

**Authorization Code Flow (most secure for web apps):**
```javascript
// Step 1: Redirect user to authorization URL
const authUrl = `https://oauth.example.com/authorize?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=read:user write:data`;

// Step 2: Exchange code for access token
const tokenResponse = await fetch('https://oauth.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  })
});

const { access_token, refresh_token, expires_in } = await tokenResponse.json();

// Step 3: Use access token
const apiResponse = await fetch('https://api.example.com/user', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});

// Step 4: Refresh when expired
if (isTokenExpired(access_token)) {
  const refreshResponse = await fetch('https://oauth.example.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });
}
```

### 3. JWT Authentication

```javascript
import jwt from 'jsonwebtoken';

// Client-side: Send JWT in Authorization header
const response = await fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});

// Server-side: Verify JWT
const verifyJWT = (token) => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY, {
      algorithms: ['HS256'],
      issuer: 'expected-issuer',
      audience: 'expected-audience'
    });
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};
```

## Rate Limiting & Retry Strategies

### 1. Exponential Backoff

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) { // Rate limited
        const retryAfter = response.headers.get('Retry-After') ||
                          Math.pow(2, attempt); // Exponential backoff

        if (attempt < maxRetries) {
          await sleep(retryAfter * 1000);
          continue;
        }
      }

      if (response.status >= 500 && attempt < maxRetries) {
        // Server error, retry with backoff
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

### 2. Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
const data = await breaker.execute(() => fetchAPI('/users'));
```

### 3. Rate Limit Tracking

```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await sleep(waitTime);
      return this.throttle(); // Retry
    }

    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(100, 60000); // 100 req/min
await limiter.throttle();
const data = await fetchAPI('/users');
```

## Webhook Implementation

### 1. Webhook Receiver

```javascript
import crypto from 'crypto';

// Verify webhook signature
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express webhook endpoint
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!verifyWebhookSignature(req.body, signature, WEBHOOK_SECRET)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body);

  // Process webhook asynchronously
  processWebhook(event).catch(err => {
    console.error('Webhook processing failed:', err);
  });

  // Return 200 immediately
  res.status(200).send('OK');
});

async function processWebhook(event) {
  switch (event.type) {
    case 'payment.succeeded':
      await handlePaymentSuccess(event.data);
      break;
    case 'payment.failed':
      await handlePaymentFailure(event.data);
      break;
  }
}
```

### 2. Webhook Delivery (Sending)

```javascript
async function deliverWebhook(url, payload, secret, maxRetries = 3) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-ID': payload.id
        },
        body: JSON.stringify(payload),
        timeout: 10000
      });

      if (response.ok) return true;

      if (response.status >= 500 && attempt < maxRetries) {
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      throw new Error(`Webhook delivery failed: ${response.status}`);
    } catch (error) {
      if (attempt === maxRetries) {
        // Log for manual retry or dead letter queue
        console.error('Webhook delivery failed permanently:', error);
        return false;
      }
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

## API Client Design

```javascript
class APIClient {
  constructor(baseURL, apiKey, options = {}) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(options.maxRequests, options.windowMs);
    this.breaker = new CircuitBreaker();
  }

  async request(endpoint, options = {}) {
    await this.rateLimiter.throttle();

    return this.breaker.execute(async () => {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetchWithRetry(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    });
  }

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`${endpoint}?${query}`);
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Usage
const client = new APIClient('https://api.example.com', API_KEY, {
  maxRequests: 100,
  windowMs: 60000
});

const users = await client.get('/users', { limit: 20 });
const newUser = await client.post('/users', { name: 'Alice' });
```

## Best Practices

✅ **Secure credentials** - Use environment variables, secrets management
✅ **Implement retries** - Exponential backoff for transient failures
✅ **Rate limit awareness** - Track limits, respect `Retry-After` headers
✅ **Circuit breakers** - Prevent cascading failures
✅ **Webhook verification** - Validate signatures, use HTTPS
✅ **Async processing** - Don't block webhook responses
✅ **Timeout handling** - Set appropriate timeouts (10-30s)
✅ **Logging** - Log requests, responses, errors with request IDs
✅ **Error categorization** - Distinguish retryable vs. permanent errors

## Common Pitfalls

❌ **Credentials in code** - Use env vars or secrets manager
❌ **No retry logic** - Networks are unreliable
❌ **Ignoring rate limits** - Results in bans/throttling
❌ **Synchronous webhooks** - Blocks delivery, risks timeouts
❌ **No signature verification** - Security vulnerability
❌ **Missing timeouts** - Requests hang indefinitely
❌ **Generic error handling** - Not distinguishing error types
❌ **Plaintext secrets** - Encrypt webhook secrets
