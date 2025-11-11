---
id: express-jwt-auth
category: example
tags: [typescript, express, jwt, authentication, middleware]
capabilities:
  - JWT token generation
  - Authentication middleware
  - Refresh tokens
useWhen:
  - Express REST APIs requiring stateless JWT authentication with short-lived access tokens (15min) and long-lived refresh tokens (7d)
  - Building secure authentication middleware that validates Bearer tokens and attaches decoded user data to request objects
  - APIs needing role-based access control (RBAC) with authorization middleware for admin, user, and guest permissions
  - Implementing authentication for microservices where session storage is not feasible and JWT claims contain user identity
  - Express applications requiring proper JWT error handling for expired tokens, invalid signatures, and missing tokens
  - Building login endpoints that return both access and refresh tokens with different expiration policies for security
estimatedTokens: 400
---

# Express JWT Authentication

```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Generate tokens
export function createTokens(payload: JWTPayload) {
  const accessToken = jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { ...payload, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
}

// Authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(new UnauthorizedError('Invalid token'));
    }
  }
};

// Authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};

// Usage
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await validateCredentials(email, password);
  const tokens = createTokens({ userId: user.id, email: user.email, role: user.role });
  res.json({ data: tokens });
});

app.get('/protected', authenticate, authorize('admin'), handler);
```
