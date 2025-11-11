/**
 * Performance benchmarks for FuzzyMatcher
 *
 * Tests the performance of the fuzzy matching algorithm with various
 * dataset sizes and query complexities.
 */

const { test } = require("node:test");
const assert = require("node:assert");
const { FuzzyMatcher } = require("../../dist/utils/fuzzyMatcher.js");

// Helper function to measure execution time
function measureTime(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1_000_000;
  return { result, durationMs };
}

// Generate mock resources for testing
function generateMockResources(count) {
  const resources = [];
  const categories = ["agent", "skill", "example", "pattern"];
  const tags = [
    "typescript",
    "javascript",
    "api",
    "rest",
    "async",
    "testing",
    "node",
  ];

  for (let i = 0; i < count; i++) {
    resources.push({
      id: `resource-${i}`,
      category: categories[i % categories.length],
      tags: [tags[i % tags.length], tags[(i + 1) % tags.length]],
      capabilities: [`Capability ${i}`, `Feature ${i}`],
      useWhen: [`Use case ${i}`, `Scenario ${i}`],
      estimatedTokens: 500 + (i % 1000),
      content: `Content for resource ${i}`,
    });
  }

  return resources;
}

test("FuzzyMatcher Performance Benchmarks", async (t) => {
  await t.test("Keyword extraction performance", () => {
    const matcher = new FuzzyMatcher();
    const query =
      "build typescript rest api with authentication and error handling using async await patterns";

    const { durationMs } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        matcher.extractKeywords(query);
      }
    });

    const avgMs = durationMs / 1000;
    console.log(
      `  ⚡ Keyword extraction: ${avgMs.toFixed(3)}ms per call (1000 iterations)`,
    );

    // Should be very fast (< 0.1ms per call)
    assert.ok(avgMs < 0.1, `Keyword extraction too slow: ${avgMs}ms`);
  });

  await t.test("Scoring algorithm performance - 10 resources", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(10);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      matcher.match({ query: "typescript api development", maxTokens: 3000 });
    });

    console.log(`  ⚡ Matching 10 resources: ${durationMs.toFixed(2)}ms`);

    // Should be very fast (< 5ms)
    assert.ok(durationMs < 5, `Matching too slow: ${durationMs}ms`);
  });

  await t.test("Scoring algorithm performance - 100 resources", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(100);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      matcher.match({ query: "typescript api development", maxTokens: 3000 });
    });

    console.log(`  ⚡ Matching 100 resources: ${durationMs.toFixed(2)}ms`);

    // Should be reasonably fast (< 20ms)
    assert.ok(durationMs < 20, `Matching too slow: ${durationMs}ms`);
  });

  await t.test("Scoring algorithm performance - 500 resources", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(500);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      matcher.match({ query: "typescript api development", maxTokens: 3000 });
    });

    console.log(`  ⚡ Matching 500 resources: ${durationMs.toFixed(2)}ms`);

    // Should still be fast (< 100ms)
    assert.ok(durationMs < 100, `Matching too slow: ${durationMs}ms`);
  });

  await t.test("Complex query performance", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(100);
    matcher.setResourceIndex(resources);

    const complexQuery =
      "build secure scalable typescript rest api with jwt authentication error handling input validation async await patterns unit testing integration testing";

    const { durationMs } = measureTime(() => {
      matcher.match({ query: complexQuery, maxTokens: 3000 });
    });

    console.log(`  ⚡ Complex query (20 keywords): ${durationMs.toFixed(2)}ms`);

    // Should handle complex queries efficiently (< 30ms)
    assert.ok(durationMs < 30, `Complex query too slow: ${durationMs}ms`);
  });

  await t.test("Budget selection performance", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(100);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        matcher.match({ query: "typescript", maxTokens: 2000 });
      }
    });

    const avgMs = durationMs / 100;
    console.log(
      `  ⚡ Budget selection: ${avgMs.toFixed(2)}ms per call (100 iterations)`,
    );

    // Should be consistently fast (< 20ms per call)
    assert.ok(avgMs < 20, `Budget selection too slow: ${avgMs}ms`);
  });

  await t.test("Category filtering performance", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(200);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      matcher.match({
        query: "typescript api",
        category: "agent",
        maxTokens: 3000,
      });
    });

    console.log(
      `  ⚡ Category filtering (200 resources): ${durationMs.toFixed(2)}ms`,
    );

    // Should be fast even with filtering (< 25ms)
    assert.ok(durationMs < 25, `Category filtering too slow: ${durationMs}ms`);
  });

  await t.test("Required tags filtering performance", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(200);
    matcher.setResourceIndex(resources);

    const { durationMs } = measureTime(() => {
      matcher.match({
        query: "api development",
        requiredTags: ["typescript", "async"],
        maxTokens: 3000,
      });
    });

    console.log(
      `  ⚡ Required tags filtering (200 resources): ${durationMs.toFixed(2)}ms`,
    );

    // Required tags should enable early exit (< 20ms)
    assert.ok(
      durationMs < 20,
      `Required tags filtering too slow: ${durationMs}ms`,
    );
  });

  await t.test("Content assembly performance", async () => {
    const matcher = new FuzzyMatcher();
    const resources = generateMockResources(50);
    matcher.setResourceIndex(resources);

    const { result, durationMs } = measureTime(() => {
      return matcher.match({ query: "typescript", maxTokens: 10000 });
    });

    console.log(
      `  ⚡ Content assembly (${result.fragments.length} fragments): ${durationMs.toFixed(2)}ms`,
    );

    // Assembly should be fast (< 15ms)
    assert.ok(durationMs < 15, `Content assembly too slow: ${durationMs}ms`);
  });
});

console.log("\n📊 Performance Targets:");
console.log("  • Keyword extraction: < 0.1ms");
console.log("  • Match 100 resources: < 20ms");
console.log("  • Match 500 resources: < 100ms");
console.log("  • Complex queries: < 30ms");
console.log("  • Category filtering: < 25ms");
