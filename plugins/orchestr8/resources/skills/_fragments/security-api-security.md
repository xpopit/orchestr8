---
id: security-api-security
category: skill
tags: [security, api, rate-limiting, cors, api-keys, request-signing, ddos]
capabilities:
  - API rate limiting strategies
  - CORS configuration security
  - API key authentication
  - Request signing and verification
  - DDoS protection patterns
estimatedTokens: 600
useWhen:
  - Implementing API security best practices with authentication, authorization, rate limiting, and input validation
  - Building API security layer with CORS configuration, CSRF protection, and security headers (HSTS, CSP)
  - Designing API key management system with rotation, revocation, and usage tracking per client
  - Creating API threat protection with request size limits, timeout configuration, and SQL injection prevention
  - Implementing API audit logging tracking authentication attempts, authorization failures, and sensitive operations
---

# API Security Patterns

## Rate Limiting (Express)

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Basic in-memory rate limiting
const basicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
});

app.use('/api/', basicLimiter);

// Redis-backed rate limiting (distributed)
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

await redisClient.connect();

const distributedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
});

// Tiered rate limits by endpoint sensitivity
const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true, // Only count failed attempts
});

app.post('/auth/login', authLimiter, loginHandler);
app.post('/users', strictLimiter, createUserHandler);
app.get('/users', basicLimiter, getUsersHandler);

// Custom key generator (per user, not IP)
const perUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, IP otherwise
    return req.user?.userId || req.ip;
  },
});

// Cost-based rate limiting (different endpoints cost different amounts)
interface RateLimitCost {
  [key: string]: number;
}

const costs: RateLimitCost = {
  '/api/search': 5,
  '/api/users': 1,
  '/api/export': 10,
};

const costBasedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // 100 "points" per minute
  skip: (req) => !costs[req.path],
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    const cost = costs[req.path] || 1;
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Cost: ${cost}`,
      },
    });
  },
});
```

## CORS Configuration

```typescript
import cors from 'cors';

// ❌ DANGEROUS: Allow all origins
app.use(cors({
  origin: '*', // NEVER in production
  credentials: true, // DANGEROUS with origin: '*'
}));

// ✅ SAFE: Whitelist specific origins
const ALLOWED_ORIGINS = [
  'https://app.example.com',
  'https://admin.example.com',
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
  maxAge: 86400, // 24 hours preflight cache
}));

// Dynamic origin validation (subdomain pattern)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    // Allow *.example.com subdomains
    const regex = /^https:\/\/[\w-]+\.example\.com$/;
    if (regex.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
```

## API Key Authentication

```typescript
import { createHash, randomBytes } from 'crypto';

// Generate API key
function generateApiKey(): { key: string; hash: string } {
  const key = `sk_${randomBytes(24).toString('hex')}`; // sk_abc123...
  const hash = createHash('sha256').update(key).digest('hex');

  return { key, hash };
}

// Store hashed API key
async function createApiKey(userId: string, name: string) {
  const { key, hash } = generateApiKey();

  await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash: hash,
      lastUsedAt: null,
      createdAt: new Date(),
    },
  });

  // Return plain key only once
  return { key, message: 'Save this key - it will not be shown again' };
}

// Validate API key middleware
async function validateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    return res.status(401).json({
      error: { code: 'NO_API_KEY', message: 'API key required' },
    });
  }

  const hash = createHash('sha256').update(apiKey).digest('hex');

  const storedKey = await prisma.apiKey.findFirst({
    where: { keyHash: hash },
    include: { user: true },
  });

  if (!storedKey) {
    logger.warn('Invalid API key attempted', { keyPrefix: apiKey.slice(0, 8) });
    return res.status(401).json({
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
    });
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: storedKey.id },
    data: { lastUsedAt: new Date() },
  });

  req.user = storedKey.user;
  next();
}

// Usage
app.get('/api/data', validateApiKey, async (req, res) => {
  const data = await getData(req.user.id);
  res.json({ data });
});
```

## Request Signing (HMAC)

```typescript
import { createHmac, timingSafeEqual } from 'crypto';

// Client: Sign request
function signRequest(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  secret: string
): string {
  const payload = `${method}:${path}:${body}:${timestamp}`;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

// Server: Verify signature
function verifySignature(req: Request, res: Response, next: NextFunction) {
  const signature = req.headers['x-signature'] as string;
  const timestamp = parseInt(req.headers['x-timestamp'] as string);
  const apiKey = req.headers['x-api-key'] as string;

  if (!signature || !timestamp || !apiKey) {
    return res.status(401).json({ error: 'Missing signature headers' });
  }

  // Prevent replay attacks (5 minute window)
  const now = Date.now();
  if (Math.abs(now - timestamp) > 5 * 60 * 1000) {
    return res.status(401).json({
      error: { code: 'TIMESTAMP_EXPIRED', message: 'Request timestamp too old' },
    });
  }

  // Get secret for this API key
  const secret = getSecretForApiKey(apiKey);
  if (!secret) {
    return res.status(401).json({ error: 'Invalid API key' });
  }

  // Compute expected signature
  const body = JSON.stringify(req.body);
  const expected = signRequest(req.method, req.path, body, timestamp, secret);

  // Timing-safe comparison
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    logger.warn('Invalid signature', { apiKey, path: req.path });
    return res.status(401).json({
      error: { code: 'INVALID_SIGNATURE', message: 'Request signature invalid' },
    });
  }

  next();
}

app.use('/api/webhooks', verifySignature);
```

## DDoS Protection

```typescript
import helmet from 'helmet';
import slowDown from 'express-slow-down';

// Security headers
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // Start delaying after 50 requests
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Max 20 second delay
});

app.use('/api/', speedLimiter);

// Body size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request timeout
import timeout from 'connect-timeout';

app.use(timeout('30s'));
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// IP blacklisting
const BLACKLISTED_IPS = new Set<string>();

app.use((req, res, next) => {
  const ip = req.ip;

  if (BLACKLISTED_IPS.has(ip)) {
    logger.warn('Blocked blacklisted IP', { ip });
    return res.status(403).json({ error: 'Forbidden' });
  }

  next();
});

// Automatic blacklisting on abuse
const abuseTracker = new Map<string, number>();

app.use((req, res, next) => {
  const ip = req.ip;
  const count = abuseTracker.get(ip) || 0;

  if (count > 1000) {
    BLACKLISTED_IPS.add(ip);
    logger.error('IP blacklisted for abuse', { ip, count });
  }

  res.on('finish', () => {
    if (res.statusCode === 429) {
      abuseTracker.set(ip, count + 1);
    }
  });

  next();
});
```

## API Versioning Security

```typescript
// Enforce minimum API version
const MIN_API_VERSION = 'v2';

app.use((req, res, next) => {
  const version = req.path.match(/^\/api\/(v\d+)/)?.[1];

  if (!version) {
    return res.status(400).json({ error: 'API version required' });
  }

  if (version < MIN_API_VERSION) {
    return res.status(426).json({
      error: {
        code: 'UPGRADE_REQUIRED',
        message: `API version ${version} is deprecated. Minimum: ${MIN_API_VERSION}`,
      },
    });
  }

  next();
});
```

## Anti-Patterns

```typescript
// ❌ NEVER: No rate limiting
app.post('/api/send-email', sendEmailHandler); // Can be abused

// ❌ NEVER: CORS misconfiguration
app.use(cors({ origin: '*', credentials: true })); // Security risk

// ❌ NEVER: API keys in URLs
app.get('/api/data?api_key=secret', handler); // Logged in history

// ❌ NEVER: No request timeouts
// Allows slowloris attacks

// ❌ NEVER: Trust X-Forwarded-For without validation
const ip = req.headers['x-forwarded-for']; // Can be spoofed
```

## Best Practices

1. **Rate limit everything**: Different limits per sensitivity
2. **Whitelist CORS origins**: Never use `*` with credentials
3. **Use API keys securely**: Hash before storage, validate on request
4. **Sign sensitive requests**: HMAC with timestamp to prevent replay
5. **Set security headers**: Use helmet.js
6. **Limit request sizes**: Prevent memory exhaustion
7. **Implement timeouts**: Prevent resource holding
8. **Monitor abuse**: Auto-blacklist repeated violators
9. **Version your API**: Deprecate insecure versions
10. **Log security events**: Failed auth, rate limits, suspicious patterns

## Compliance

- **OWASP API Security Top 10**:
  - API1: Broken Object Level Authorization
  - API2: Broken User Authentication
  - API4: Lack of Resources & Rate Limiting
  - API7: Security Misconfiguration
- **PCI DSS**: 6.5.10 Broken authentication
- **SOC 2**: CC6.6 Logical access controls
