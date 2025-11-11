---
id: express-error-handling
category: example
tags: [typescript, express, error-handling, middleware]
capabilities:
  - Custom error classes
  - Error middleware
  - Structured error responses
useWhen:
  - Express TypeScript APIs requiring centralized error handling with custom error classes for different HTTP status codes
  - REST APIs needing structured error responses with validation error details exposed to API consumers
  - Express applications requiring distinction between operational errors (4xx) and programmer errors (5xx) for monitoring
  - Building Express middleware-based error handling that sanitizes error messages in production vs development environments
  - TypeScript Express services requiring type-safe error handling with custom error properties like validation field mappings
  - APIs needing consistent error response formats across all endpoints with status, message, and error details structure
estimatedTokens: 350
---

# Express Error Handling

```typescript
// Custom error classes
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public errors: Record<string, string[]>) {
    super(400, message);
  }
}

// Error handler middleware (must be last)
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err instanceof ValidationError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

// Usage in routes
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) throw new NotFoundError('User not found');
    res.json({ data: user });
  } catch (error) {
    next(error);
  }
});

// Register error handler last
app.use(errorHandler);
```
