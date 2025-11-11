---
id: security-authentication-jwt
category: skill
tags: [security, authentication, jwt, tokens, refresh-tokens, authorization, oauth, bearer]
capabilities:
  - JWT token generation and validation
  - Refresh token implementation and rotation
  - Token expiration and rotation strategies
  - Secure token storage (httpOnly cookies)
  - Token-based authentication flow
  - Claims and payload design
  - Token revocation and blacklisting
  - JWT security best practices
estimatedTokens: 1400
useWhen:
  - Implementing JWT authentication for REST API with access tokens, refresh tokens, and secure cookie storage
  - Building JWT token validation middleware verifying signature, expiration, and issuer claims
  - Designing JWT refresh token rotation strategy preventing token theft with automatic refresh on API calls
  - Creating secure JWT implementation with RS256 asymmetric signing and short token expiration (15 minutes)
  - Implementing JWT logout mechanism with token blacklist using Redis for immediate session invalidation
  - Stateless API authentication requiring horizontally scalable token validation without centralized session storage
  - REST API or microservices authentication needing cryptographically signed claims with role-based access control
  - OAuth 2.0 or OpenID Connect implementations requiring access token and refresh token pair with rotation strategy
  - Mobile app or SPA authentication requiring secure token storage in httpOnly cookies with CSRF protection
  - Cross-domain authentication scenarios needing bearer token propagation across multiple services with audience validation
  - Token revocation requirements needing blacklist management with Redis and refresh token family tracking
---

# JWT Authentication Security

## Token Generation (Secure)

```typescript
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

interface TokenPayload {
  userId: string;
  role: string;
  email: string;
}

// Access token: short-lived (15min)
function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn: '15m',
      issuer: 'api.example.com',
      audience: 'api.example.com',
      algorithm: 'HS256', // Use RS256 for production
    }
  );
}

// Refresh token: long-lived (7 days)
function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

// Store refresh token in database with expiry
async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await db.refreshToken.create({
    data: {
      userId,
      token: await hashToken(token), // Hash before storing
      expiresAt,
      createdAt: new Date(),
    },
  });
}
```

## Token Validation

```typescript
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  userId: string;
  role: string;
  email: string;
  iat: number;
  exp: number;
}

// Middleware: Validate access token
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: { code: 'NO_TOKEN', message: 'Access token required' }
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JwtPayload;

    req.user = payload; // Attach user to request
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' }
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      });
    }
    throw error;
  }
}
```

## Refresh Token Flow

```typescript
// Login: Return both tokens
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await authenticateUser(email, password);
  if (!user) {
    return res.status(401).json({
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' }
    });
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    email: user.email,
  });

  const refreshToken = generateRefreshToken();
  await saveRefreshToken(
    user.id,
    refreshToken,
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  );

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900, // 15 minutes in seconds
  });
});

// Refresh: Issue new access token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token required' }
    });
  }

  const hashedToken = await hashToken(refreshToken);
  const storedToken = await db.refreshToken.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!storedToken) {
    return res.status(401).json({
      error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' }
    });
  }

  const newAccessToken = generateAccessToken({
    userId: storedToken.user.id,
    role: storedToken.user.role,
    email: storedToken.user.email,
  });

  res.json({ accessToken: newAccessToken, expiresIn: 900 });
});
```

## Token Rotation (Security Best Practice)

```typescript
// Issue new refresh token on each refresh
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  const storedToken = await validateAndConsumeRefreshToken(refreshToken);
  if (!storedToken) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(storedToken.user);
  const newRefreshToken = generateRefreshToken();

  // Delete old refresh token
  await db.refreshToken.delete({ where: { id: storedToken.id } });

  // Save new refresh token
  await saveRefreshToken(storedToken.userId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 900,
  });
});
```

## Logout (Invalidate Refresh Token)

```typescript
app.post('/auth/logout', authenticateToken, async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const hashedToken = await hashToken(refreshToken);
    await db.refreshToken.deleteMany({
      where: { token: hashedToken },
    });
  }

  res.status(204).send();
});

// Logout all sessions
app.post('/auth/logout-all', authenticateToken, async (req, res) => {
  await db.refreshToken.deleteMany({
    where: { userId: req.user.userId },
  });

  res.status(204).send();
});
```

## Security Anti-Patterns

```typescript
// ❌ NEVER: Store sensitive data in JWT
const token = jwt.sign({
  userId: user.id,
  password: user.password, // NEVER
  creditCard: user.creditCard, // NEVER
}, secret);

// ❌ NEVER: Use weak secrets
const secret = 'secret123'; // Use cryptographically random secret

// ❌ NEVER: No expiration
jwt.sign(payload, secret); // Always set expiresIn

// ❌ NEVER: Store JWT in localStorage (XSS vulnerability)
localStorage.setItem('token', token);

// ✅ BETTER: Use httpOnly cookies for refresh tokens
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

## Best Practices

1. **Short-lived access tokens**: 15 minutes or less
2. **Rotate refresh tokens**: Issue new one on each refresh
3. **Hash refresh tokens**: Before storing in database
4. **Use RS256 in production**: Asymmetric signing for microservices
5. **Include claims**: `iss`, `aud`, `exp`, `iat`, `nbf`
6. **Validate claims**: Check issuer, audience, expiration
7. **HttpOnly cookies**: For refresh tokens (prevents XSS)
8. **Revocation list**: For critical operations (logout, password change)
9. **Token cleanup**: Delete expired tokens from database
10. **Rate limiting**: On refresh endpoint

## JWT Structure and Claims

```typescript
// JWT consists of three parts: header.payload.signature
interface JWTPayload {
  sub: string;        // Subject (user ID)
  iat: number;        // Issued at timestamp
  exp: number;        // Expiration timestamp
  iss: string;        // Issuer (e.g., 'api.example.com')
  aud: string;        // Audience (intended recipient)
  jti?: string;       // JWT ID (for token revocation)
  roles?: string[];   // User roles/permissions
  email?: string;     // User email
  type?: string;      // Token type (access/refresh)
}

// Example token generation with all claims
function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      type: 'access'
    },
    process.env.JWT_ACCESS_SECRET!,
    {
      expiresIn: '15m',
      issuer: 'api.example.com',
      audience: 'api.example.com',
      algorithm: 'HS256', // Use RS256 for microservices
      jwtid: uuidv4()     // Unique ID for revocation tracking
    }
  );
}
```

## Token Revocation Service

```typescript
class TokenRevocationService {
  // Revoke all tokens for a user (logout all devices)
  async revokeAllUserTokens(userId: string) {
    await this.tokenRepository.revokeAllTokensForUser(userId);
    await this.cache.del(`user:${userId}:tokens`);
  }

  // Revoke specific token
  async revokeToken(tokenId: string) {
    await this.tokenRepository.revokeToken(tokenId);
    // Add to Redis blacklist with expiry matching token TTL
    await this.redis.setex(`revoked:${tokenId}`, 900, '1'); // 15 min
  }

  // Check token blacklist (use Redis for performance)
  async isTokenRevoked(tokenId: string): Promise<boolean> {
    return this.redis.exists(`revoked:${tokenId}`);
  }

  // Middleware to check revocation
  async verifyNotRevoked(req: Request, res: Response, next: NextFunction) {
    const token = jwt.decode(req.headers.authorization?.split(' ')[1]);
    if (token?.jti && await this.isTokenRevoked(token.jti)) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    next();
  }
}
```

## Secure Token Storage Patterns

```typescript
// Server-side: Store in httpOnly cookies (preferred for web)
app.post('/login', async (req, res) => {
  const tokens = await authService.login(req.body);

  res.cookie('accessToken', tokens.accessToken, {
    httpOnly: true,      // Not accessible via JavaScript (XSS protection)
    secure: true,        // HTTPS only
    sameSite: 'strict',  // CSRF protection
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ success: true });
});

// For mobile/native apps: Return tokens in response body
// Client stores in secure storage (iOS Keychain, Android Keystore)
app.post('/login', async (req, res) => {
  const tokens = await authService.login(req.body);
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: 900 // seconds
  });
});
```

## Common Pitfalls to Avoid

1. **Don't store sensitive data in JWT payload** - Tokens are base64 encoded, not encrypted
2. **Don't use weak secrets** - Minimum 256 bits of entropy
3. **Don't skip signature verification** - Always verify tokens server-side
4. **Don't use localStorage for sensitive tokens** - Vulnerable to XSS attacks
5. **Don't forget token expiration** - Always set and validate `exp` claim
6. **Don't ignore algorithm verification** - Prevent algorithm confusion attacks

## Compliance and Standards

- **OWASP**: A02:2021 Cryptographic Failures
- **PCI DSS**: 8.2.3 Multi-factor authentication
- **GDPR**: Right to erasure (token invalidation)
- **OAuth 2.0**: RFC 6749 (Authorization Framework)
- **OpenID Connect**: Identity layer on top of OAuth 2.0
