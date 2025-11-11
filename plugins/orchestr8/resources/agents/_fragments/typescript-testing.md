---
id: typescript-testing
category: agent
tags: [typescript, testing, jest, mocking, tdd, unit-tests]
capabilities:
  - Jest configuration for TypeScript
  - Type-safe mocking patterns
  - Test organization and structure
  - Advanced testing techniques
useWhen:
  - Writing type-safe Jest tests for TypeScript with ts-jest preset, testMatch patterns, moduleNameMapper for path aliases, and collectCoverageFrom configuration
  - Creating type-safe mocks using DeepPartial<T>, jest.Mocked<T>, MockedFunction<typeof func>, and MockedClass<typeof Class> for full type inference in tests
  - Mocking complex dependencies including module mocks with jest.mock(), class prototype mocking, spy patterns with jest.spyOn(), and mockResolvedValue/mockRejectedValue for async
  - Organizing tests with AAA pattern (Arrange, Act, Assert), beforeEach cleanup, describe blocks for grouping, and custom type-safe matchers with expect.extend()
  - Testing async operations using await expect().resolves/.rejects, Promise.all for concurrent assertions, and event-based testing with promise wrappers
  - Setting up test infrastructure with jest.config.js including ts-jest globals, test environment (node/jsdom), coverage thresholds (80%+), and test data factories
estimatedTokens: 720
---

# TypeScript Testing

## Jest TypeScript Setup

**Essential configuration (`jest.config.js`):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1' // Path alias support
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
}
```

## Type-Safe Mocking

**Mock factory pattern:**
```typescript
// Generic mock builder
type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>
} : T

function mockOf<T>(partial: DeepPartial<T> = {}): jest.Mocked<T> {
  return partial as jest.Mocked<T>
}

// Usage
interface UserService {
  findById(id: string): Promise<User>
  create(data: CreateUserDto): Promise<User>
}

const mockUserService = mockOf<UserService>({
  findById: jest.fn(),
  create: jest.fn()
})

// Type-safe mock implementation
mockUserService.findById.mockResolvedValue({ 
  id: '1', 
  name: 'Test' 
})
```

**Module mocking with types:**
```typescript
// Mock external module
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  transaction: jest.fn()
}))

import { query } from '@/lib/db'
const mockQuery = query as jest.MockedFunction<typeof query>

// In test
mockQuery.mockResolvedValue([{ id: 1, name: 'Test' }])
```

**Class mocking:**
```typescript
class Database {
  async query(sql: string): Promise<any[]> { /* ... */ }
}

jest.mock('@/lib/Database')
const MockDatabase = Database as jest.MockedClass<typeof Database>

beforeEach(() => {
  MockDatabase.mockClear()
  MockDatabase.prototype.query.mockResolvedValue([])
})

test('uses database', async () => {
  const db = new Database()
  await db.query('SELECT * FROM users')
  
  expect(MockDatabase).toHaveBeenCalledTimes(1)
  expect(db.query).toHaveBeenCalledWith('SELECT * FROM users')
})
```

## Test Organization

**AAA pattern with describe blocks:**
```typescript
describe('UserService', () => {
  let service: UserService
  let mockDb: jest.Mocked<Database>

  beforeEach(() => {
    mockDb = mockOf<Database>({ query: jest.fn() })
    service = new UserService(mockDb)
  })

  describe('findById', () => {
    it('should return user when found', async () => {
      // Arrange
      const userId = '123'
      const expectedUser = { id: userId, name: 'Test User' }
      mockDb.query.mockResolvedValue([expectedUser])

      // Act
      const result = await service.findById(userId)

      // Assert
      expect(result).toEqual(expectedUser)
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      )
    })

    it('should throw when user not found', async () => {
      // Arrange
      mockDb.query.mockResolvedValue([])

      // Act & Assert
      await expect(service.findById('999'))
        .rejects
        .toThrow('User not found')
    })
  })
})
```

## Custom Matchers

**Type-safe custom matchers:**
```typescript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R
      toHaveErrorCode(code: string): R
    }
  }
}

expect.extend({
  toBeValidUser(received: any) {
    const pass = 
      typeof received?.id === 'string' &&
      typeof received?.email === 'string' &&
      received.email.includes('@')

    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be a valid user`
          : `expected ${received} to be a valid user`
    }
  },

  toHaveErrorCode(received: Error, expected: string) {
    const actual = (received as any).code
    const pass = actual === expected

    return {
      pass,
      message: () =>
        `expected error code ${actual} to ${pass ? 'not ' : ''}equal ${expected}`
    }
  }
})

// Usage
expect(user).toBeValidUser()
expect(error).toHaveErrorCode('USER_NOT_FOUND')
```

## Async Testing Patterns

**Testing promises:**
```typescript
// Resolves
test('fetches user', async () => {
  await expect(fetchUser('123')).resolves.toEqual({ id: '123' })
})

// Rejects
test('throws on invalid id', async () => {
  await expect(fetchUser('')).rejects.toThrow('Invalid ID')
})

// Multiple async assertions
test('handles multiple operations', async () => {
  const [users, posts] = await Promise.all([
    fetchUsers(),
    fetchPosts()
  ])
  
  expect(users).toHaveLength(10)
  expect(posts).toHaveLength(5)
})
```

**Testing callbacks/events:**
```typescript
test('emits event on completion', (done) => {
  const emitter = new EventEmitter()
  
  emitter.on('complete', (data) => {
    expect(data).toEqual({ status: 'success' })
    done()
  })
  
  processData(emitter)
})

// Or use promise wrapper
test('emits event', async () => {
  const emitter = new EventEmitter()
  
  const eventPromise = new Promise(resolve => {
    emitter.on('complete', resolve)
  })
  
  processData(emitter)
  
  const result = await eventPromise
  expect(result).toEqual({ status: 'success' })
})
```

## Spy Patterns

**Method spies:**
```typescript
test('calls dependency method', () => {
  const service = new UserService()
  const spy = jest.spyOn(service, 'validateEmail')
  
  service.createUser({ email: 'test@example.com', name: 'Test' })
  
  expect(spy).toHaveBeenCalledWith('test@example.com')
  expect(spy).toHaveBeenCalledTimes(1)
  
  spy.mockRestore() // Clean up
})

// Spy on implementation
test('overrides implementation', async () => {
  const service = new UserService()
  jest.spyOn(service, 'findById').mockResolvedValue({ id: '1', name: 'Mock' })
  
  const user = await service.findById('1')
  expect(user.name).toBe('Mock')
})
```

## Snapshot Testing

**Type-safe snapshots:**
```typescript
test('generates correct API response', () => {
  const response = createApiResponse({
    data: { id: 1, name: 'Test' },
    meta: { page: 1, total: 10 }
  })
  
  expect(response).toMatchSnapshot()
})

// Inline snapshots for small values
test('formats error message', () => {
  const error = new ValidationError(['email is required'])
  expect(error.message).toMatchInlineSnapshot(`"Validation failed: email is required"`)
})
```

## Test Utilities

**Test data factories:**
```typescript
let userIdCounter = 0

function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: `user-${++userIdCounter}`,
    email: `test${userIdCounter}@example.com`,
    name: `Test User ${userIdCounter}`,
    createdAt: new Date(),
    ...overrides
  }
}

// Usage
const admin = createTestUser({ role: 'admin' })
const users = Array.from({ length: 5 }, () => createTestUser())
```

**Setup helpers:**
```typescript
async function setupTestDb() {
  const db = await createConnection()
  await db.migrate.latest()
  return db
}

async function teardownTestDb(db: Database) {
  await db.migrate.rollback()
  await db.destroy()
}

// Usage in tests
let db: Database

beforeAll(async () => { db = await setupTestDb() })
afterAll(async () => { await teardownTestDb(db) })
```

## Coverage Best Practices

- Aim for 80%+ coverage on business logic
- Exclude types, interfaces, and constants from coverage
- Use `istanbul ignore next` for unreachable code
- Test edge cases: null, undefined, empty arrays, boundaries
- Integration tests > unit tests for complex flows
