---
id: testing-strategies
category: skill
tags: [testing, unit-tests, integration-tests, tdd, quality]
capabilities:
  - Testing pyramid strategy
  - Unit testing best practices
  - Integration and E2E testing
useWhen:
  - Implementing testing pyramid strategy with 70% unit tests, 20% integration tests, and 10% E2E tests for cost-effective coverage
  - Building test suites requiring Jest, Playwright, or similar frameworks with mocking, spies, stubs, and test doubles for isolation
  - Practicing Test-Driven Development (TDD) with Red-Green-Refactor cycle requiring tests written before implementation code
  - Implementing integration tests with real database connections, API testing with supertest, and proper setup/teardown lifecycle
  - Building E2E tests for critical user flows with Playwright requiring browser automation and full application stack validation
  - Establishing test coverage thresholds (80%+ lines, branches, functions) with CI/CD integration and coverage reports
estimatedTokens: 480
---

# Testing Strategies and Best Practices

## Testing Pyramid

```
        /\
       /E2E\        10% - End-to-end tests (slow, expensive)
      /------\
     /  INT   \     20% - Integration tests (medium)
    /----------\
   /    UNIT    \   70% - Unit tests (fast, cheap)
  /--------------\
```

## Unit Testing

```typescript
// ✅ GOOD: Test one thing at a time
describe('UserService', () => {
  describe('createUser', () => {
    it('should hash password before saving', async () => {
      const mockRepository = {
        save: jest.fn().mockResolvedValue({ id: '123' })
      };
      const service = new UserService(mockRepository);
      
      await service.createUser({
        email: 'test@example.com',
        password: 'plaintext'
      });
      
      const savedUser = mockRepository.save.mock.calls[0][0];
      expect(savedUser.password).not.toBe('plaintext');
      expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash
    });
    
    it('should throw ValidationError for invalid email', async () => {
      const service = new UserService(mockRepository);
      
      await expect(
        service.createUser({ email: 'invalid', password: 'pass123' })
      ).rejects.toThrow(ValidationError);
    });
  });
});

// ✅ GOOD: AAA pattern (Arrange, Act, Assert)
it('should calculate total price with tax', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  const taxRate = 0.1;
  
  // Act
  const total = calculateTotalWithTax(items, taxRate);
  
  // Assert
  expect(total).toBe(33); // (10 + 20) * 1.1
});
```

## Test Doubles

```typescript
// Mock - Complete replacement
const mockUserRepository = {
  findById: jest.fn().mockResolvedValue({ id: '123', name: 'John' }),
  save: jest.fn()
};

// Stub - Preset responses
const stubEmailService = {
  sendEmail: () => Promise.resolve()
};

// Spy - Track calls
const spyLogger = jest.spyOn(logger, 'error');
await someFunction();
expect(spyLogger).toHaveBeenCalledWith('Error message');
```

## Integration Testing

```typescript
describe('User API Integration', () => {
  let app: Express;
  let db: Database;
  
  beforeAll(async () => {
    db = await setupTestDatabase();
    app = createApp(db);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  beforeEach(async () => {
    await db.clear(); // Clear data between tests
  });
  
  it('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Password123'
      })
      .expect(201);
    
    expect(response.body.data).toMatchObject({
      email: 'test@example.com',
      name: 'Test User'
    });
    expect(response.body.data.password).toBeUndefined();
    
    // Verify in database
    const user = await db.users.findOne({ email: 'test@example.com' });
    expect(user).toBeDefined();
  });
});
```

## E2E Testing

```typescript
// Playwright example
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('https://app.example.com/register');
    
    // Fill form
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'Password123');
    await page.fill('[name="confirmPassword"]', 'Password123');
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('https://app.example.com/dashboard');
    
    // Verify welcome message
    await expect(page.locator('.welcome-message')).toContainText('Welcome');
  });
});
```

## Test Coverage Guidelines

```bash
# Run tests with coverage
npm test -- --coverage

# Coverage thresholds in jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

## Test-Driven Development (TDD)

```typescript
// 1. Write failing test (RED)
describe('calculateDiscount', () => {
  it('should apply 10% discount for orders over $100', () => {
    expect(calculateDiscount(150)).toBe(135);
  });
});

// 2. Write minimal code to pass (GREEN)
function calculateDiscount(amount: number): number {
  if (amount > 100) {
    return amount * 0.9;
  }
  return amount;
}

// 3. Refactor while keeping tests green (REFACTOR)
function calculateDiscount(amount: number): number {
  const DISCOUNT_THRESHOLD = 100;
  const DISCOUNT_RATE = 0.1;
  
  return amount > DISCOUNT_THRESHOLD 
    ? amount * (1 - DISCOUNT_RATE)
    : amount;
}
```

## Test Data Management

```typescript
// ✅ Use factories for test data
class UserFactory {
  static create(overrides?: Partial<User>): User {
    return {
      id: uuid(),
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      ...overrides
    };
  }
}

// Usage
const user = UserFactory.create({ email: 'custom@example.com' });

// ✅ Use fixtures for consistent test data
const fixtures = {
  users: {
    admin: { email: 'admin@example.com', role: 'admin' },
    regular: { email: 'user@example.com', role: 'user' }
  }
};
```

## Flaky Test Prevention

```typescript
// ❌ BAD: Time-dependent tests
it('should expire after 1 second', async () => {
  const token = createToken();
  await sleep(1000);
  expect(isExpired(token)).toBe(true);
});

// ✅ GOOD: Mock time
it('should expire after 1 second', () => {
  jest.useFakeTimers();
  const token = createToken();
  jest.advanceTimersByTime(1000);
  expect(isExpired(token)).toBe(true);
  jest.useRealTimers();
});

// ❌ BAD: Random values
it('should process random number', () => {
  const value = Math.random();
  expect(process(value)).toBe(/* ??? */);
});

// ✅ GOOD: Deterministic values
it('should process specific value', () => {
  expect(process(0.5)).toBe(1.0);
  expect(process(0.75)).toBe(1.5);
});
```

## Best Practices Summary

- Write tests before code (TDD)
- Test behavior, not implementation
- One assertion per test (when possible)
- Use descriptive test names
- Keep tests fast and isolated
- Mock external dependencies
- Maintain 80%+ code coverage
- Run tests in CI/CD pipeline
- Fix flaky tests immediately
- Review test code as rigorously as production code
