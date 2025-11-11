---
id: typescript-api-development
category: agent
tags: [typescript, api, express, rest, middleware, routing]
capabilities:
  - Type-safe Express APIs
  - Middleware patterns
  - Request/response typing
  - Error handling architecture
useWhen:
  - Building type-safe Express REST APIs using TypedRequest<Params, Query, Body> interfaces, Handler<P, Q, B, R> type aliases, and Response<T> for compile-time safety
  - Implementing middleware chains with factory patterns (validate<T>(schema)), compose() for sequential execution, and type extension (declare global namespace Express)
  - Creating centralized error handling with custom AppError classes (ValidationError, UnauthorizedError), asyncHandler wrappers for automatic Promise.catch(next), and error handler middleware
  - Validating API requests using Zod schemas with z.infer<typeof schema> for automatic type derivation, validateBody<T> middleware, and ZodError to ValidationError conversion
  - Organizing routes with TypedRouter class providing type-safe get<P, Q, R>(), post<P, Q, B, R>() methods, and builder pattern for fluent API composition
  - Standardizing API responses using ResponseBuilder.success<T>(data), ResponseBuilder.error(message, status), and ApiResponse<T> generic interface with success/data/error/meta fields
estimatedTokens: 720
---

# TypeScript API Development

## Type-Safe Express Handlers

**Typed request handlers:**
```typescript
import { Request, Response, NextFunction } from 'express'

// Typed params, query, body
interface TypedRequest<P = {}, Q = {}, B = {}> extends Request {
  params: P
  query: Q
  body: B
}

type Handler<P = {}, Q = {}, B = {}, R = any> = (
  req: TypedRequest<P, Q, B>,
  res: Response<R>,
  next: NextFunction
) => Promise<void> | void

// Usage
const getUser: Handler<{ id: string }, {}, {}, User> = async (req, res) => {
  const user = await db.findUser(req.params.id) // id is string
  res.json(user) // user must match User type
}
```

## Middleware Patterns

**Factory pattern for reusable middleware:**
```typescript
// Validation middleware factory
function validate<T>(schema: Schema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.parse(req.body)
    if (result.success) {
      req.body = result.data as T
      next()
    } else {
      next(new ValidationError(result.errors))
    }
  }
}

// Auth middleware with type extension
declare global {
  namespace Express {
    interface Request { user?: AuthUser }
  }
}

const requireAuth: Handler = async (req, _res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return next(new UnauthorizedError())
  
  req.user = await verifyToken(token)
  next()
}
```

**Middleware composition:**
```typescript
type Middleware = (req: Request, res: Response, next: NextFunction) => any

const compose = (...middleware: Middleware[]): Middleware => 
  (req, res, next) => {
    let index = 0
    const dispatch = (i: number): any => {
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      const fn = middleware[i] || next
      if (!fn) return Promise.resolve()
      try {
        return Promise.resolve(fn(req, res, () => dispatch(i + 1)))
      } catch (err) {
        return Promise.reject(err)
      }
    }
    return dispatch(0)
  }
```

## Router Organization

**Type-safe route builder:**
```typescript
class TypedRouter {
  private router = express.Router()

  get<P = {}, Q = {}, R = any>(
    path: string,
    ...handlers: Handler<P, Q, {}, R>[]
  ) {
    this.router.get(path, ...handlers as any)
    return this
  }

  post<P = {}, Q = {}, B = {}, R = any>(
    path: string,
    ...handlers: Handler<P, Q, B, R>[]
  ) {
    this.router.post(path, ...handlers as any)
    return this
  }

  build() { return this.router }
}

// Usage
const userRouter = new TypedRouter()
  .get<{ id: string }, {}, User>('/users/:id', getUser)
  .post<{}, {}, CreateUserDto, User>('/users', validate(userSchema), createUser)
  .build()
```

## Error Handling Architecture

**Centralized error handling:**
```typescript
// Base error classes
class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

class ValidationError extends AppError {
  constructor(public errors: ValidationIssue[]) {
    super(400, 'Validation failed')
  }
}

// Error handler middleware
const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err instanceof ValidationError && { errors: err.errors })
    })
  }

  // Log unexpected errors
  console.error('Unexpected error:', err)
  res.status(500).json({ error: 'Internal server error' })
}
```

**Async error wrapper:**
```typescript
const asyncHandler = <P, Q, B, R>(
  fn: Handler<P, Q, B, R>
): Handler<P, Q, B, R> => 
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }

// Usage - automatic error forwarding
app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.getUsers() // errors auto-caught
  res.json(users)
}))
```

## Request Validation

**Zod integration pattern:**
```typescript
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().int().positive().optional()
})

type CreateUserDto = z.infer<typeof createUserSchema>

const validateBody = <T extends z.ZodType>(schema: T) => 
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (err) {
      if (err instanceof z.ZodError) {
        next(new ValidationError(err.errors))
      } else {
        next(err)
      }
    }
  }
```

## Response Helpers

**Standardized responses:**
```typescript
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  meta?: { page: number; total: number }
}

class ResponseBuilder {
  static success<T>(res: Response, data: T, status = 200) {
    res.status(status).json({ success: true, data } as ApiResponse<T>)
  }

  static error(res: Response, message: string, status = 400) {
    res.status(status).json({ success: false, error: message } as ApiResponse)
  }

  static paginated<T>(
    res: Response,
    data: T[],
    meta: { page: number; total: number }
  ) {
    res.json({ success: true, data, meta } as ApiResponse<T[]>)
  }
}
```

## Performance Patterns

- Use `express.json({ limit: '10mb' })` with size limits
- Implement rate limiting with typed middleware
- Cache with Redis - type cache keys as branded strings
- Use compression middleware early in chain
- Separate router instances per domain (users, posts, etc.)
