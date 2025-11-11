---
id: qa-test-automation
category: agent
tags: [qa, testing, automation, test-frameworks, selenium, playwright, cypress, ci-cd, test-strategy]
capabilities:
  - Test automation framework design and implementation
  - E2E, integration, and unit test strategies
  - CI/CD test integration and parallel execution
  - Test data management and fixture patterns
  - Flaky test prevention and debugging
useWhen:
  - Building test automation frameworks using Selenium WebDriver, Playwright, or Cypress for E2E testing with page object pattern and reusable test utilities
  - Implementing continuous testing in CI/CD pipelines with parallel test execution, test result reporting (JUnit XML, Allure), and flaky test detection
  - Designing API test automation using REST Assured, Postman/Newman, or pytest with request/response validation, schema validation, and data-driven testing
  - Creating maintainable test suites with test data factories, fixture management, and separation of test logic from test data using external files or databases
  - Implementing visual regression testing with Percy, Applitools, or Playwright screenshots comparing baseline vs. current renders for UI changes
  - Measuring test effectiveness with code coverage (80%+ target), mutation testing to verify test quality, and test execution time optimization
estimatedTokens: 620
---

# QA Expert - Test Automation

Expert in test automation frameworks, strategies, and CI/CD integration for reliable, maintainable test suites.

## Test Automation Frameworks

### Playwright (Modern, Recommended)
```typescript
// Parallel execution, auto-wait, multi-browser
import { test, expect } from '@playwright/test';

test('user login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@test.com');
  await page.fill('[name="password"]', 'pass123');
  await page.click('button[type="submit"]');

  // Auto-wait for navigation and element
  await expect(page.locator('.dashboard')).toBeVisible();
});

// API testing
test('API returns user data', async ({ request }) => {
  const response = await request.get('/api/users/1');
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  expect(data.id).toBe(1);
});
```

### Cypress (E2E Focused)
```javascript
describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login('user@test.com', 'pass123');
  });

  it('completes purchase', () => {
    cy.visit('/products');
    cy.get('[data-testid="add-to-cart"]').first().click();
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-btn"]').click();

    cy.get('[data-testid="order-confirmation"]')
      .should('contain', 'Order successful');
  });
});
```

## Test Strategy Patterns

### Test Pyramid
```
    /\      E2E Tests (10%)
   /  \     Integration Tests (30%)
  /____\    Unit Tests (60%)
```

**Unit Tests:**
- Fast, isolated, no dependencies
- Mock external services
- High coverage (>80%)

**Integration Tests:**
- Test component interactions
- Use test databases
- Mock external APIs

**E2E Tests:**
- Full user flows only
- Critical paths coverage
- Run in parallel

## Page Object Model (POM)

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}

// tests/login.spec.ts
test('invalid login shows error', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('bad@email.com', 'wrong');

  const error = await loginPage.getErrorMessage();
  expect(error).toContain('Invalid credentials');
});
```

## Test Data Management

### Fixtures
```typescript
// fixtures/users.ts
export const testUsers = {
  admin: { email: 'admin@test.com', role: 'admin' },
  user: { email: 'user@test.com', role: 'user' }
};

// fixtures/database.ts
export async function seedDatabase() {
  await db.users.create(testUsers.admin);
  await db.users.create(testUsers.user);
}

test.beforeEach(async () => {
  await seedDatabase();
});
```

### Factory Pattern
```typescript
function createUser(overrides = {}) {
  return {
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    name: faker.name.fullName(),
    ...overrides
  };
}

const user = createUser({ role: 'admin' });
```

## CI/CD Integration

### GitHub Actions
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        shard: [1, 2, 3, 4]

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests (shard ${{ matrix.shard }})
        run: |
          npx playwright test --shard=${{ matrix.shard }}/4 \
            --project=${{ matrix.browser }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

## Flaky Test Prevention

### Explicit Waits
```typescript
// Bad - implicit timeout
await page.click('#submit');

// Good - explicit wait
await page.waitForSelector('#submit', { state: 'visible' });
await page.click('#submit');

// Better - built-in auto-wait
await page.locator('#submit').click();
```

### Network Stability
```typescript
// Wait for API responses
await Promise.all([
  page.waitForResponse(resp =>
    resp.url().includes('/api/data') && resp.status() === 200
  ),
  page.click('#load-data')
]);
```

### Retry Logic
```typescript
test.describe.configure({ retries: 2 });

test('flaky operation', async ({ page }) => {
  await test.step('attempt with retry', async () => {
    // Test code
  });
});
```

## Test Reporting

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
});
```

## Performance Optimization

- Run tests in parallel: `--workers=4`
- Use test sharding for large suites
- Cache node_modules in CI
- Reuse browser contexts
- Mock slow external APIs

## Best Practices

✅ Write deterministic tests (no race conditions)
✅ Use data-testid attributes for selectors
✅ Keep tests independent
✅ Test user behavior, not implementation
✅ Use factories for test data
✅ Run tests on every commit

❌ Don't use fragile CSS selectors
❌ Don't share state between tests
❌ Don't test external services directly
❌ Don't ignore flaky tests
