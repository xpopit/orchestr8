---
id: code-quality-standards
category: skill
tags: [code-quality, clean-code, standards, best-practices]
capabilities:
  - Code quality principles
  - Clean code guidelines
  - Maintainability practices
useWhen:
  - Establishing coding standards
  - Code review guidelines
estimatedTokens: 450
---

# Code Quality Standards

## SOLID Principles

### Single Responsibility Principle (SRP)
```typescript
// ❌ BAD: Class doing too much
class User {
  validateEmail() { }
  saveToDatabase() { }
  sendWelcomeEmail() { }
  generateReport() { }
}

// ✅ GOOD: Separate concerns
class User {
  constructor(public email: string, public name: string) {}
}

class UserValidator {
  validateEmail(email: string): boolean { }
}

class UserRepository {
  save(user: User): Promise<void> { }
}

class EmailService {
  sendWelcomeEmail(user: User): Promise<void> { }
}
```

### Dependency Inversion Principle (DIP)
```typescript
// ❌ BAD: High-level depends on low-level
class UserService {
  private db = new PostgresDatabase();
  
  getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}

// ✅ GOOD: Depend on abstractions
interface Database {
  query(sql: string, params: any[]): Promise<any>;
}

class UserService {
  constructor(private db: Database) {}
  
  getUser(id: string) {
    return this.db.query('SELECT * FROM users WHERE id = $1', [id]);
  }
}
```

## DRY (Don't Repeat Yourself)

```typescript
// ❌ BAD: Repeated logic
function getActiveUsers() {
  return users.filter(u => u.isActive && !u.deletedAt);
}

function getActiveAdmins() {
  return users.filter(u => u.isActive && !u.deletedAt && u.role === 'admin');
}

// ✅ GOOD: Extract common logic
function isActiveUser(user: User): boolean {
  return user.isActive && !user.deletedAt;
}

function getActiveUsers() {
  return users.filter(isActiveUser);
}

function getActiveAdmins() {
  return users.filter(u => isActiveUser(u) && u.role === 'admin');
}
```

## Function Best Practices

```typescript
// ✅ Small functions (< 20 lines)
// ✅ Single purpose
// ✅ Descriptive names
// ✅ Limit parameters (< 3)

// ❌ BAD: Too many parameters
function createUser(email, name, age, address, phone, role) { }

// ✅ GOOD: Use objects for multiple parameters
interface CreateUserInput {
  email: string;
  name: string;
  age: number;
  address: string;
  phone: string;
  role: string;
}

function createUser(input: CreateUserInput) { }

// ✅ GOOD: Descriptive names
function calculateMonthlyPayment() { }  // Not calc() or process()

// ✅ GOOD: Pure functions when possible
function calculateTax(amount: number, rate: number): number {
  return amount * rate;  // No side effects
}
```

## Error Handling

```typescript
// ❌ BAD: Silent failures
try {
  await saveUser(user);
} catch (error) {
  // Nothing
}

// ❌ BAD: Generic error catching
try {
  await saveUser(user);
} catch (error) {
  console.log('Error');
}

// ✅ GOOD: Specific error handling
try {
  await saveUser(user);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error, user });
    throw new BadRequestError(error.message);
  } else if (error instanceof DatabaseError) {
    logger.error('Database error', { error, user });
    throw new InternalServerError('Failed to save user');
  } else {
    throw error;
  }
}
```

## Comments and Documentation

```typescript
// ❌ BAD: Obvious comments
// Increment counter by 1
counter++;

// ❌ BAD: Outdated comments
// Returns user email (actually returns full user object now)
function getUser() { return user; }

// ✅ GOOD: Explain WHY, not WHAT
// Use exponential backoff to avoid overwhelming the API during high load
await retry(apiCall, { maxAttempts: 3, backoff: 'exponential' });

// ✅ GOOD: Document complex algorithms
/**
 * Calculates compound interest using the formula: A = P(1 + r/n)^(nt)
 * Where:
 * - P = principal amount
 * - r = annual interest rate (decimal)
 * - n = number of times interest compounds per year
 * - t = time in years
 */
function calculateCompoundInterest(principal, rate, compounds, years) {
  return principal * Math.pow(1 + rate / compounds, compounds * years);
}

// ✅ GOOD: JSDoc for public APIs
/**
 * Creates a new user account
 * @param {CreateUserInput} input - User data
 * @returns {Promise<User>} Created user
 * @throws {ValidationError} If input is invalid
 * @throws {ConflictError} If user already exists
 */
async function createUser(input: CreateUserInput): Promise<User> { }
```

## Naming Conventions

```typescript
// Classes: PascalCase
class UserService { }

// Functions/variables: camelCase
function getUserById() { }
const userName = 'John';

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Private properties: prefix with _
class User {
  private _password: string;
}

// Boolean variables: is/has/can prefix
const isActive = true;
const hasPermission = false;
const canEdit = true;
```

## Code Organization

```
src/
├── controllers/     # HTTP handlers
├── services/        # Business logic
├── repositories/    # Data access
├── models/          # Data models
├── utils/           # Utility functions
├── middleware/      # Express middleware
├── types/           # TypeScript types
└── config/          # Configuration
```

## Linting and Formatting

```json
// .eslintrc.json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "max-len": ["error", { "code": 100 }],
    "max-lines-per-function": ["warn", 50],
    "complexity": ["warn", 10],
    "no-console": "warn"
  }
}

// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true
}
```
