---
id: quality-code-review-checklist
category: skill
tags: [code-review, quality, best-practices, security, performance]
capabilities:
  - Code review guidelines and checklists
  - Common issue identification
  - Security vulnerability detection
  - Performance optimization review
estimatedTokens: 560
useWhen:
  - Creating comprehensive code review checklist covering functionality, readability, performance, and security
  - Building code review culture emphasizing constructive feedback, knowledge sharing, and continuous improvement
  - Implementing automated code review tools with linters, formatters, and static analysis integrated in CI/CD
  - Designing code review process with clear approval criteria and turnaround time SLAs for fast feedback
  - Creating security-focused code review checklist identifying common vulnerabilities like SQL injection and XSS
---

# Code Review Checklist

## Architecture and Design

### Separation of Concerns

```typescript
// ❌ Bad: Mixed responsibilities
class UserController {
  async createUser(req: Request, res: Response) {
    // Validation
    if (!req.body.email?.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    // Business logic
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Database access
    const user = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2)',
      [req.body.email, hashedPassword]
    );

    // Email sending
    await sendEmail(user.email, 'Welcome!');

    return res.json(user);
  }
}

// ✅ Good: Layered architecture
class UserController {
  constructor(private userService: UserService) {}

  async createUser(req: Request, res: Response) {
    const dto = validateUserInput(req.body); // Validation layer
    const user = await this.userService.createUser(dto); // Service layer
    return res.status(201).json(user); // Presentation layer
  }
}
```

### Single Responsibility Principle

```typescript
// ❌ Bad: Class does too much
class OrderProcessor {
  validateOrder(order: Order) { /* ... */ }
  calculateTotal(order: Order) { /* ... */ }
  applyDiscounts(order: Order) { /* ... */ }
  processPayment(order: Order) { /* ... */ }
  sendConfirmationEmail(order: Order) { /* ... */ }
  updateInventory(order: Order) { /* ... */ }
}

// ✅ Good: Focused classes
class OrderValidator { validateOrder(order: Order) { /* ... */ } }
class PricingService { calculateTotal(order: Order) { /* ... */ } }
class PaymentProcessor { processPayment(order: Order) { /* ... */ } }
class InventoryService { updateInventory(order: Order) { /* ... */ } }
```

## Code Quality

### Error Handling

```typescript
// ❌ Bad: Swallowing errors
try {
  await processOrder(orderId);
} catch (error) {
  console.log('Error occurred');
}

// ❌ Bad: Generic errors
throw new Error('Something went wrong');

// ✅ Good: Specific errors with context
try {
  await processOrder(orderId);
} catch (error) {
  logger.error('Order processing failed', {
    orderId,
    error: error.message,
    stack: error.stack,
  });
  throw new OrderProcessingError(
    `Failed to process order ${orderId}`,
    { cause: error }
  );
}
```

### Null and Undefined Handling

```typescript
// ❌ Bad: No null checks
function getUserEmail(user: User): string {
  return user.email.toLowerCase(); // Crashes if email is null
}

// ✅ Good: Explicit handling
function getUserEmail(user: User | null): string | null {
  if (!user?.email) {
    return null;
  }
  return user.email.toLowerCase();
}

// ✅ Better: Type safety with optional chaining
function getUserEmail(user?: User): string {
  return user?.email?.toLowerCase() ?? 'unknown@example.com';
}
```

### Magic Numbers and Strings

```typescript
// ❌ Bad: Magic values
if (user.age > 18 && order.total > 100) {
  applyDiscount(order, 0.15);
}

// ✅ Good: Named constants
const ADULT_AGE = 18;
const FREE_SHIPPING_THRESHOLD = 100;
const LOYALTY_DISCOUNT = 0.15;

if (user.age > ADULT_AGE && order.total > FREE_SHIPPING_THRESHOLD) {
  applyDiscount(order, LOYALTY_DISCOUNT);
}
```

## Security Vulnerabilities

### SQL Injection Prevention

```typescript
// ❌ Bad: String concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`;
await db.query(query);

// ✅ Good: Parameterized queries
await db.query('SELECT * FROM users WHERE email = $1', [email]);
```

### Authentication and Authorization

```typescript
// ❌ Bad: No authorization check
app.delete('/api/users/:id', async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
});

// ✅ Good: Authorization middleware
app.delete('/api/users/:id',
  requireAuth,
  requireRole('admin'),
  async (req, res) => {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  }
);

// ✅ Good: Resource ownership check
app.delete('/api/posts/:id', requireAuth, async (req, res) => {
  const post = await postService.findById(req.params.id);

  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await postService.deletePost(req.params.id);
  res.status(204).send();
});
```

### Input Validation

```typescript
// ❌ Bad: No validation
app.post('/api/users', async (req, res) => {
  const user = await createUser(req.body);
  res.json(user);
});

// ✅ Good: Schema validation
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
  age: z.number().int().min(0).max(120).optional(),
});

app.post('/api/users', async (req, res) => {
  const data = createUserSchema.parse(req.body);
  const user = await createUser(data);
  res.status(201).json(user);
});
```

### Sensitive Data Exposure

```typescript
// ❌ Bad: Logging sensitive data
logger.info('User login', {
  email: user.email,
  password: user.password // NEVER LOG PASSWORDS
});

// ✅ Good: Redacted logging
logger.info('User login', {
  email: user.email,
  userId: user.id,
});

// ❌ Bad: Returning sensitive data
return { id, email, password, apiKey };

// ✅ Good: DTO with excluded fields
return { id, email, name, createdAt };
```

## Performance Considerations

### N+1 Query Problem

```typescript
// ❌ Bad: N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  user.orders = await db.order.findMany({
    where: { userId: user.id }
  });
}

// ✅ Good: Single query with join
const users = await db.user.findMany({
  include: { orders: true },
});
```

### Unnecessary Computation

```typescript
// ❌ Bad: Computing in loop
for (let i = 0; i < items.length; i++) {
  const taxRate = calculateTaxRate(user.location); // Computed every iteration
  items[i].total = items[i].price * (1 + taxRate);
}

// ✅ Good: Compute once
const taxRate = calculateTaxRate(user.location);
for (let i = 0; i < items.length; i++) {
  items[i].total = items[i].price * (1 + taxRate);
}
```

### Memory Leaks

```typescript
// ❌ Bad: Event listeners not cleaned up
componentDidMount() {
  window.addEventListener('resize', this.handleResize);
}

// ✅ Good: Cleanup in unmount
componentDidMount() {
  window.addEventListener('resize', this.handleResize);
}
componentWillUnmount() {
  window.removeEventListener('resize', this.handleResize);
}
```

## Testing Coverage

### Critical Path Coverage

```typescript
// Review checklist:
// ✅ Happy path tested
// ✅ Error cases tested
// ✅ Edge cases tested
// ✅ Boundary conditions tested

describe('calculateShipping', () => {
  it('should return $5 for orders under $50', () => { /* ... */ });
  it('should return $0 for orders $50 and above', () => { /* ... */ });
  it('should handle $0 orders', () => { /* ... */ });
  it('should handle negative amounts', () => { /* ... */ });
  it('should handle very large orders', () => { /* ... */ });
});
```

## Code Review Questions

**Architecture:**
- [ ] Is the code in the right layer/module?
- [ ] Does it follow SOLID principles?
- [ ] Are dependencies properly injected?

**Security:**
- [ ] Are inputs validated?
- [ ] Are SQL queries parameterized?
- [ ] Is authentication/authorization enforced?
- [ ] Are secrets not hardcoded?
- [ ] Is sensitive data not logged?

**Error Handling:**
- [ ] Are errors caught and logged?
- [ ] Are error messages user-friendly?
- [ ] Are errors propagated correctly?

**Testing:**
- [ ] Are new features tested?
- [ ] Are edge cases covered?
- [ ] Are tests independent and deterministic?

**Performance:**
- [ ] No N+1 queries?
- [ ] Appropriate use of indexes?
- [ ] No memory leaks?
- [ ] Efficient algorithms?

**Readability:**
- [ ] Clear variable names?
- [ ] Functions are focused and small?
- [ ] Comments explain "why", not "what"?
- [ ] No magic numbers?

**Documentation:**
- [ ] Public APIs documented?
- [ ] Complex logic explained?
- [ ] Breaking changes noted?

## Key Principles

✅ **Review with empathy** - Constructive, not critical
✅ **Check security first** - Vulnerabilities are high priority
✅ **Question complexity** - Simple solutions are better
✅ **Verify tests** - Code without tests is incomplete
✅ **Consider maintainability** - Code is read more than written

❌ **Don't nitpick style** - Use automated linters
❌ **Don't approve without understanding** - Ask questions
❌ **Don't block on personal preference** - Focus on correctness
