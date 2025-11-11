# Testing Guide

Comprehensive guide to testing the orchestr8 MCP server, including unit tests, integration tests, and performance benchmarks.

## Table of Contents

- [Testing Philosophy](#testing-philosophy)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Related Documentation](#related-documentation)

## Testing Philosophy

The orchestr8 MCP server follows a comprehensive testing strategy designed to ensure:

- **Reliability**: All components work correctly under various conditions
- **Performance**: The system meets performance requirements at scale
- **Maintainability**: Tests are clear, focused, and easy to update
- **Protocol Compliance**: Full adherence to MCP protocol specifications

### Core Principles

1. **Test Pyramid**: Focus on fast unit tests, complemented by integration tests and benchmarks
2. **Native Testing**: Use Node.js native test runner (no external frameworks)
3. **Real-World Scenarios**: Tests reflect actual usage patterns
4. **Performance First**: Benchmarks track performance regressions
5. **Isolation**: Each test is independent and can run in any order

## Test Structure

```
tests/
├── unit/                         # Unit tests for individual components
│   ├── promptLoader.test.js      # Prompt loading and substitution
│   ├── resourceLoader.test.js    # Resource loading and caching
│   ├── uriParser.test.js         # URI parsing (static and dynamic)
│   └── fuzzyMatcher.test.js      # Fuzzy matching algorithm
├── integration/                  # Integration and end-to-end tests
│   ├── mcp-protocol.test.js      # MCP protocol compliance
│   └── mcp-server.test.js        # Full server functionality
├── benchmarks/                   # Performance benchmarks
│   ├── resourceLoader.bench.js   # Resource loading performance
│   └── fuzzyMatcher.bench.js     # Matching algorithm performance
└── verify-structure.sh           # Project structure validation
src/__tests__/
└── indexLookup.test.ts           # Index-based lookup tests
```

## Running Tests

### All Tests

Run the complete test suite:

```bash
npm test
```

This runs both unit tests and integration tests sequentially.

### Unit Tests Only

Run fast unit tests for individual components:

```bash
npm run test:unit
```

Unit tests typically complete in under 5 seconds.

### Integration Tests

Run integration tests that validate the full MCP protocol:

```bash
npm run test:integration
```

Run specific integration test suites:

```bash
# Protocol compliance tests only
npm run test:integration:protocol

# Server functionality tests only
npm run test:integration:server
```

### Watch Mode

Automatically re-run unit tests on file changes:

```bash
npm run test:watch
```

### Performance Benchmarks

Run performance benchmarks to track system performance:

```bash
npm run benchmark
```

See [Benchmarks](./benchmarks.md) for interpreting results.

### Structure Verification

Validate project structure and configuration:

```bash
npm run verify
```

This ensures:
- No root-level agents/skills directories (prevents auto-loading)
- Resources are in correct locations
- Build output exists
- Required configuration files present

## Test Coverage

### What's Tested

#### Unit Tests (150+ assertions)
- Prompt loading and metadata parsing
- Argument substitution ($ARGUMENTS and ${arg-name})
- Resource loading from all categories
- URI parsing (static and dynamic)
- Fuzzy matching algorithm
- Caching behavior
- Error handling

#### Integration Tests (35+ assertions)
- MCP protocol handshake
- Resource listing
- Static resource retrieval
- Dynamic resource matching
- Query parameter parsing
- Token budget enforcement
- Error responses
- Caching behavior

#### Benchmarks (Performance Targets)
- Resource loading: < 150ms for 100 resources
- Index building: < 100ms (parallel)
- Cache hits: < 1ms
- Fuzzy matching: < 20ms for 100 resources
- URI parsing: < 0.01ms per call

### Coverage Goals

| Component | Unit Tests | Integration Tests | Benchmarks |
|-----------|------------|-------------------|------------|
| PromptLoader | ✓ | ✓ | - |
| ResourceLoader | ✓ | ✓ | ✓ |
| URIParser | ✓ | ✓ | ✓ |
| FuzzyMatcher | ✓ | ✓ | ✓ |
| IndexLookup | ✓ | - | - |
| MCP Server | - | ✓ | - |
| Protocol Compliance | - | ✓ | - |

## Writing Tests

### Test Framework

The project uses **Node.js native test runner** (available since Node.js 18):

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
```

No external test frameworks (Mocha, Jest, etc.) are required.

### Unit Test Template

```javascript
/**
 * Unit tests for ComponentName
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { ComponentName } = require('../../dist/component.js');

describe('ComponentName', () => {
  let component;

  before(() => {
    // Setup before all tests
    component = new ComponentName();
  });

  after(() => {
    // Cleanup after all tests
  });

  it('should do something specific', () => {
    const result = component.doSomething();
    assert.strictEqual(result, expectedValue);
  });

  it('should handle edge cases', () => {
    assert.throws(() => {
      component.invalidOperation();
    }, /Expected error message/);
  });
});
```

### Integration Test Template

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');

describe('Integration Test', () => {
  let client;

  before(async () => {
    // Start server
    client = new MCPClient();
    await client.start();
  });

  after(async () => {
    // Stop server
    await client.stop();
  });

  it('should complete workflow', async () => {
    const result = await client.sendRequest('method', params);
    assert.ok(result);
  });
});
```

### Best Practices

1. **Descriptive Test Names**: Use "should" statements that describe expected behavior
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **One Assertion Per Concept**: Focus each test on a single behavior
4. **Use Strict Equality**: Prefer `assert.strictEqual()` over `assert.equal()`
5. **Test Error Cases**: Include negative tests for error conditions
6. **Clean Up Resources**: Use `before`/`after` hooks for setup and teardown
7. **Avoid Test Interdependence**: Each test should be independent
8. **Use Meaningful Assertions**: Include descriptive messages for failures

### Common Assertion Patterns

```javascript
// Equality checks
assert.strictEqual(actual, expected);
assert.deepStrictEqual(actualObject, expectedObject);

// Boolean checks
assert.ok(value, 'Value should be truthy');
assert.strictEqual(value, true);

// Array checks
assert.ok(Array.isArray(value));
assert.strictEqual(array.length, expectedLength);

// Error checking
assert.throws(() => {
  dangerousOperation();
}, /Expected error pattern/);

// Async error checking
await assert.rejects(
  async () => await asyncOperation(),
  /Expected error pattern/
);

// Type checks
assert.strictEqual(typeof value, 'string');
assert.ok(value instanceof ClassName);

// String content
assert.ok(text.includes('expected substring'));
assert.ok(text.length > minLength);
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Verify structure
        run: npm run verify

      - name: Run benchmarks
        run: npm run benchmark
```

### Pre-commit Hooks

Ensure tests pass before committing:

```bash
#!/bin/sh
# .git/hooks/pre-commit

npm run build
npm run test:unit
npm run verify
```

### Test Execution Order

1. **Unit Tests**: Fast, isolated component tests
2. **Integration Tests**: Server startup and protocol tests
3. **Structure Verification**: Configuration and file structure
4. **Benchmarks**: Performance validation (optional in CI)

## Related Documentation

- [Unit Tests](./unit-tests.md) - Detailed unit test documentation
- [Integration Tests](./integration-tests.md) - Integration test guide
- [Benchmarks](./benchmarks.md) - Performance testing guide
- [Architecture](../architecture/) - System architecture documentation
- [Development Guide](../guides/development.md) - Development setup

## Troubleshooting

### Common Issues

**Tests fail with "Cannot find module"**
```bash
# Rebuild the project
npm run build
```

**Integration tests timeout**
```bash
# Check if port is already in use
# Increase timeout in test file if needed
```

**Benchmarks fail performance targets**
```bash
# Run benchmarks in isolation
npm run benchmark

# Check for system load
# Review recent changes for performance regressions
```

**Watch mode not working**
```bash
# Ensure Node.js version >= 18
node --version

# Try with explicit path
node --test --watch tests/unit/**/*.test.js
```

## Summary

The orchestr8 testing strategy ensures:
- **Fast feedback**: Unit tests complete in seconds
- **Confidence**: Integration tests validate real-world scenarios
- **Performance**: Benchmarks prevent regressions
- **Maintainability**: Clear, focused tests that are easy to update

For detailed information on specific test types:
- [Unit Tests Guide](./unit-tests.md)
- [Integration Tests Guide](./integration-tests.md)
- [Benchmarks Guide](./benchmarks.md)
