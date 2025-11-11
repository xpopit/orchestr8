---
id: express-validation-zod
category: example
tags: [typescript, express, validation, zod]
capabilities:
  - Request validation with Zod
  - Type-safe schemas
  - Automatic error formatting
useWhen:
  - Express TypeScript APIs requiring runtime validation with compile-time type inference from Zod schemas
  - Building REST endpoints that validate request body, query parameters, and path params with detailed error messages
  - APIs needing automatic type coercion for query strings (converting string "1" to number 1) with default value handling
  - Express applications requiring validation middleware that catches errors before reaching route handlers
  - TypeScript services wanting single source of truth for both runtime validation and TypeScript types via schema inference
  - Building validation for complex objects with nested fields, email formats, string length constraints, and numeric ranges
estimatedTokens: 350
---

# Express Validation with Zod

```typescript
import { z, ZodSchema } from 'zod';

export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: Record<string, string[]> = {};

      if (schema.body) {
        try {
          req.body = await schema.body.parseAsync(req.body);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.body = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          }
        }
      }

      if (schema.query) {
        try {
          req.query = await schema.query.parseAsync(req.query);
        } catch (err) {
          if (err instanceof z.ZodError) {
            errors.query = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Schemas
const createUserSchema = {
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
  }),
};

const paginationSchema = {
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

// Usage
app.post('/users', validate(createUserSchema), handler);
app.get('/users', validate(paginationSchema), handler);
```
