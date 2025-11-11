---
id: typescript-rest-api-complete
category: example
tags: [typescript, javascript, express, rest, api, nodejs, backend, web, validation, zod]
capabilities:
  - Complete Express + TypeScript REST API setup
  - Controller-Service-Model architecture pattern
  - Input validation with Zod schemas
  - Proper error handling in REST endpoints
  - Dependency injection for testability
  - Layered architecture implementation
useWhen:
  - Building production Express TypeScript APIs with layered architecture separating controllers, services, and models
  - TypeScript backend projects requiring dependency injection pattern with constructor injection for testability and mocking
  - Express REST APIs needing complete request validation with Zod schemas and structured error responses for validation failures
  - Implementing controller-service-repository pattern in TypeScript for separation of concerns and business logic isolation
  - Building REST endpoints with Prisma ORM integration including password hashing, selective field projection, and query filtering
  - TypeScript projects requiring end-to-end type safety from HTTP request through validation, service layer, database, and response
estimatedTokens: 650
---

# TypeScript REST API Complete Example

## Express + TypeScript REST API Pattern

### Project Structure
```
src/
├── controllers/     # Route handlers
├── services/        # Business logic
├── models/          # Data models
├── middleware/      # Auth, validation
├── routes/          # Route definitions
└── types/           # TypeScript types
```

### Example Controller with Validation
```typescript
import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
});

export class UserController {
  constructor(private userService: UserService) {}

  async create(req: Request, res: Response) {
    try {
      const data = CreateUserSchema.parse(req.body);
      const user = await this.userService.createUser(data);
      res.status(201).json({ user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async findById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await this.userService.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  }
}
```

### Example Service Layer
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async createUser(data: { email: string; name: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }
}
```

### Route Setup
```typescript
import express from 'express';
import { UserController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

export function createUserRoutes(userController: UserController) {
  const router = express.Router();

  router.post('/users', userController.create.bind(userController));
  router.get('/users/:id', authMiddleware, userController.findById.bind(userController));

  return router;
}
```

### Best Practices
- Use dependency injection for testability
- Validate all inputs with Zod or similar
- Never expose passwords in responses
- Use async/await for cleaner code
- Implement proper error handling
- Add request logging middleware
- Separate concerns: controllers handle HTTP, services handle business logic
