---
id: security-auth-session
category: pattern
tags: [security, authentication, session, cookies, redis, express-session, server-side, stateful]
capabilities:
  - Session-based authentication implementation
  - Redis session store configuration
  - Cookie security best practices
  - Server-side session management
  - Session revocation and logout
  - Express session middleware setup
useWhen:
  - Traditional server-rendered applications using Express with template engines requiring server-side session state in Redis
  - Easy session revocation scenarios needing instant logout across devices or password change invalidation
  - Monolithic architecture authentication where centralized session management provides better control than distributed token validation
  - Admin dashboards and internal tools requiring simple authentication without complex token refresh flows
  - Stateful authentication needing persistent user context across requests with httpOnly secure cookies and CSRF protection
estimatedTokens: 550
---

# Session-Based Authentication Pattern

## When to Use Session Authentication
- Traditional server-rendered applications
- When you need server-side session state
- Applications requiring easy session revocation
- Monolithic architectures
- Admin panels and internal tools
- When working with less technical users (no token management)

## Express Session with Redis Store

### Basic Setup
```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

// Create Redis client
const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_PASSWORD
});

await redisClient.connect();

// Configure session middleware
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,        // HTTPS only in production
    httpOnly: true,      // Prevent XSS attacks
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict'   // CSRF protection
  },
  name: 'sessionId'      // Custom name (don't use default)
}));
```

### Login Flow
```typescript
interface LoginRequest {
  email: string;
  password: string;
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body as LoginRequest;

  // Validate credentials
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Create session
  req.session.userId = user.id;
  req.session.email = user.email;
  req.session.role = user.role;

  // Regenerate session ID (prevent session fixation)
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ error: 'Session error' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  });
});
```

### Authentication Middleware
```typescript
import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    email: string;
    role: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.session.role !== role) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
```

### Logout and Session Revocation
```typescript
// Logout - destroy session
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }

    res.clearCookie('sessionId');
    res.json({ success: true });
  });
});

// Logout all devices - destroy all user sessions
app.post('/logout-all', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Find all sessions for user (requires storing userId in session data)
  const pattern = `sess:*`;
  const keys = await redisClient.keys(pattern);

  for (const key of keys) {
    const sessionData = await redisClient.get(key);
    if (sessionData && sessionData.includes(userId)) {
      await redisClient.del(key);
    }
  }

  res.json({ success: true });
});
```

### Session Store Configuration

#### Memory Store (Development Only)
```typescript
// WARNING: Only for development - sessions lost on restart
app.use(session({
  secret: 'dev-secret',
  resave: false,
  saveUninitialized: false
}));
```

#### Redis Store (Production)
```typescript
import RedisStore from 'connect-redis';

app.use(session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'sess:',
    ttl: 86400 * 7 // 7 days in seconds
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false
}));
```

## Security Best Practices

### Cookie Security
- **secure: true** - Always use HTTPS in production
- **httpOnly: true** - Prevent JavaScript access (XSS protection)
- **sameSite: 'strict'** - CSRF protection
- **Custom name** - Don't use default 'connect.sid'
- **Short expiration** - 7-30 days maximum

### Session Security
- Regenerate session ID after login (prevent fixation)
- Use strong session secrets (32+ characters)
- Implement session timeout for inactivity
- Store minimal data in session (IDs, not full objects)
- Clear sessions on password change
- Monitor for suspicious session activity

### Redis Security
- Use authentication (requirepass)
- Use TLS for Redis connections in production
- Set appropriate TTL for session data
- Regular backups of session store
- Monitor Redis memory usage

## Comparison with Other Auth Methods

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| Session | Traditional apps | Easy revocation, server control | Requires server state, harder to scale |
| JWT | APIs, SPAs | Stateless, scalable | Can't revoke easily |
| OAuth | Third-party auth | User convenience | Complex setup, provider dependency |
