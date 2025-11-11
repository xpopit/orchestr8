---
id: quality-refactoring-techniques
category: skill
tags: [refactoring, code-quality, clean-code, maintainability, patterns]
capabilities:
  - Safe refactoring patterns
  - Code smell identification
  - Extract method and class techniques
  - DRY principle application
estimatedTokens: 580
useWhen:
  - Implementing refactoring techniques improving code maintainability with extract method, rename, and simplify conditionals
  - Building refactoring strategy for legacy codebase incrementally improving code quality without breaking functionality
  - Designing test-driven refactoring approach ensuring behavior preservation with comprehensive test coverage
  - Creating code smell detection identifying long methods, large classes, and duplicated code for refactoring targets
  - Implementing automated refactoring with IDE tools safely renaming, extracting, and moving code with confidence
---

# Refactoring Techniques

## Safe Refactoring Process

### The Refactoring Cycle

```markdown
1. Ensure tests exist and pass
2. Make small, incremental changes
3. Run tests after each change
4. Commit working state
5. Repeat

Never: Refactor + add features simultaneously
```

### Test-Driven Refactoring

```typescript
// 1. Start with working code + tests
function calculateOrderTotal(order: Order): number {
  let total = 0;
  for (const item of order.items) {
    total += item.price * item.quantity;
  }
  if (order.customer.isPremium) {
    total = total * 0.9;
  }
  if (total > 100) {
    total = total - 10;
  }
  return total;
}

// 2. Extract method - tests still pass
function calculateItemsTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// 3. Extract more methods
function applyPremiumDiscount(total: number, isPremium: boolean): number {
  return isPremium ? total * 0.9 : total;
}

function applyBulkDiscount(total: number): number {
  return total > 100 ? total - 10 : total;
}

// 4. Refactored - tests still pass
function calculateOrderTotal(order: Order): number {
  let total = calculateItemsTotal(order.items);
  total = applyPremiumDiscount(total, order.customer.isPremium);
  total = applyBulkDiscount(total);
  return total;
}
```

## Extract Method

### Long Method Smell

```typescript
// ❌ Bad: Long method doing multiple things
async function processOrder(orderId: string) {
  const order = await db.order.findById(orderId);

  // Validation
  if (!order) throw new Error('Order not found');
  if (order.status !== 'pending') throw new Error('Order already processed');

  // Calculate totals
  let subtotal = 0;
  for (const item of order.items) {
    subtotal += item.price * item.quantity;
  }
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Process payment
  const payment = await stripe.charges.create({
    amount: total * 100,
    currency: 'usd',
    source: order.paymentToken,
  });

  // Update order
  order.status = 'paid';
  order.paidAt = new Date();
  await db.order.update(order);

  // Send email
  await sendEmail(order.customer.email, 'Order confirmed');
}

// ✅ Good: Extracted methods
async function processOrder(orderId: string) {
  const order = await findAndValidateOrder(orderId);
  const total = calculateOrderTotal(order);
  const payment = await processPayment(order, total);
  await updateOrderStatus(order, payment);
  await sendOrderConfirmation(order);
}

async function findAndValidateOrder(orderId: string): Promise<Order> {
  const order = await db.order.findById(orderId);
  if (!order) throw new OrderNotFoundError(orderId);
  if (order.status !== 'pending') throw new OrderAlreadyProcessedError(orderId);
  return order;
}

function calculateOrderTotal(order: Order): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * TAX_RATE;
  return subtotal + tax;
}
```

## Extract Class

### Class Doing Too Much

```typescript
// ❌ Bad: God class
class User {
  id: string;
  email: string;
  password: string;

  // Profile data
  firstName: string;
  lastName: string;
  avatar: string;

  // Settings
  theme: string;
  notifications: boolean;
  language: string;

  // Subscription
  plan: string;
  subscriptionStatus: string;
  billingCycle: string;

  // Methods for all of the above
  updateProfile() { /* ... */ }
  updateSettings() { /* ... */ }
  updateSubscription() { /* ... */ }
  validatePassword() { /* ... */ }
}

// ✅ Good: Separate concerns
class User {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  settings: UserSettings;
  subscription: Subscription;
}

class UserProfile {
  firstName: string;
  lastName: string;
  avatar: string;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

class UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
  language: string;
}

class Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired';
  billingCycle: 'monthly' | 'yearly';

  isActive(): boolean {
    return this.status === 'active';
  }
}
```

## Remove Duplication (DRY)

### Duplicated Logic

```typescript
// ❌ Bad: Duplicated validation
function createUser(data: CreateUserData) {
  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!data.password || data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ...
}

function updateUser(id: string, data: UpdateUserData) {
  if (data.email && !data.email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (data.password && data.password.length < 8) {
    throw new Error('Password too short');
  }
  // ...
}

// ✅ Good: Extracted validation
function validateEmail(email: string): void {
  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email');
  }
}

function validatePassword(password: string): void {
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }
}

function createUser(data: CreateUserData) {
  validateEmail(data.email);
  validatePassword(data.password);
  // ...
}

function updateUser(id: string, data: UpdateUserData) {
  if (data.email) validateEmail(data.email);
  if (data.password) validatePassword(data.password);
  // ...
}
```

## Replace Conditional with Polymorphism

### Type Code Smell

```typescript
// ❌ Bad: Type switching
class Order {
  type: 'standard' | 'express' | 'overnight';

  getShippingCost(): number {
    switch (this.type) {
      case 'standard':
        return 5;
      case 'express':
        return 15;
      case 'overnight':
        return 30;
    }
  }

  getDeliveryDays(): number {
    switch (this.type) {
      case 'standard':
        return 7;
      case 'express':
        return 3;
      case 'overnight':
        return 1;
    }
  }
}

// ✅ Good: Polymorphic classes
abstract class ShippingMethod {
  abstract getShippingCost(): number;
  abstract getDeliveryDays(): number;
}

class StandardShipping extends ShippingMethod {
  getShippingCost(): number { return 5; }
  getDeliveryDays(): number { return 7; }
}

class ExpressShipping extends ShippingMethod {
  getShippingCost(): number { return 15; }
  getDeliveryDays(): number { return 3; }
}

class OvernightShipping extends ShippingMethod {
  getShippingCost(): number { return 30; }
  getDeliveryDays(): number { return 1; }
}

class Order {
  constructor(private shippingMethod: ShippingMethod) {}

  getShippingCost(): number {
    return this.shippingMethod.getShippingCost();
  }

  getDeliveryDays(): number {
    return this.shippingMethod.getDeliveryDays();
  }
}
```

## Introduce Parameter Object

### Long Parameter List

```typescript
// ❌ Bad: Too many parameters
function createInvoice(
  customerId: string,
  items: Item[],
  subtotal: number,
  tax: number,
  discount: number,
  shippingCost: number,
  billingAddress: string,
  shippingAddress: string,
  paymentMethod: string
) {
  // ...
}

// ✅ Good: Parameter object
interface InvoiceData {
  customerId: string;
  items: Item[];
  pricing: {
    subtotal: number;
    tax: number;
    discount: number;
    shippingCost: number;
  };
  addresses: {
    billing: string;
    shipping: string;
  };
  paymentMethod: string;
}

function createInvoice(data: InvoiceData) {
  // Clearer and easier to extend
}

// Usage
createInvoice({
  customerId: 'user-123',
  items: [...],
  pricing: {
    subtotal: 100,
    tax: 8,
    discount: 10,
    shippingCost: 5,
  },
  addresses: {
    billing: '123 Main St',
    shipping: '456 Oak Ave',
  },
  paymentMethod: 'credit_card',
});
```

## Replace Magic Numbers with Constants

```typescript
// ❌ Bad: Magic numbers everywhere
function calculateDiscount(orderTotal: number, customerYears: number): number {
  if (customerYears > 5 && orderTotal > 500) {
    return orderTotal * 0.15;
  } else if (customerYears > 2 && orderTotal > 200) {
    return orderTotal * 0.10;
  } else if (orderTotal > 100) {
    return orderTotal * 0.05;
  }
  return 0;
}

// ✅ Good: Named constants
const LOYALTY_TIERS = {
  GOLD: {
    yearsRequired: 5,
    orderMinimum: 500,
    discountRate: 0.15,
  },
  SILVER: {
    yearsRequired: 2,
    orderMinimum: 200,
    discountRate: 0.10,
  },
  BRONZE: {
    yearsRequired: 0,
    orderMinimum: 100,
    discountRate: 0.05,
  },
};

function calculateDiscount(orderTotal: number, customerYears: number): number {
  if (customerYears >= LOYALTY_TIERS.GOLD.yearsRequired &&
      orderTotal >= LOYALTY_TIERS.GOLD.orderMinimum) {
    return orderTotal * LOYALTY_TIERS.GOLD.discountRate;
  }

  if (customerYears >= LOYALTY_TIERS.SILVER.yearsRequired &&
      orderTotal >= LOYALTY_TIERS.SILVER.orderMinimum) {
    return orderTotal * LOYALTY_TIERS.SILVER.discountRate;
  }

  if (orderTotal >= LOYALTY_TIERS.BRONZE.orderMinimum) {
    return orderTotal * LOYALTY_TIERS.BRONZE.discountRate;
  }

  return 0;
}
```

## Simplify Conditional Logic

### Guard Clauses

```typescript
// ❌ Bad: Nested conditions
function processPayment(order: Order) {
  if (order) {
    if (order.isPaid === false) {
      if (order.total > 0) {
        // Process payment
        return chargeCard(order);
      } else {
        throw new Error('Invalid amount');
      }
    } else {
      throw new Error('Already paid');
    }
  } else {
    throw new Error('Order not found');
  }
}

// ✅ Good: Early returns
function processPayment(order: Order) {
  if (!order) {
    throw new OrderNotFoundError();
  }

  if (order.isPaid) {
    throw new OrderAlreadyPaidError(order.id);
  }

  if (order.total <= 0) {
    throw new InvalidAmountError(order.total);
  }

  return chargeCard(order);
}
```

## Key Principles

✅ **Test before refactoring** - Ensure tests exist and pass
✅ **Small steps** - Incremental changes with tests between
✅ **Commit working states** - Easy to rollback if needed
✅ **Extract methods** - Keep functions small and focused
✅ **Remove duplication** - DRY principle
✅ **Simplify conditionals** - Guard clauses and early returns
✅ **Introduce types** - Replace primitives with objects

❌ **Don't refactor and add features** - Separate concerns
❌ **Don't skip tests** - Refactoring without tests is dangerous
❌ **Don't make big changes** - Hard to debug when things break
❌ **Don't optimize prematurely** - Refactor for clarity first
