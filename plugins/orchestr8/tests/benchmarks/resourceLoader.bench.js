/**
 * Performance benchmarks for ResourceLoader
 *
 * Tests the performance of resource loading, caching, and index building.
 */

const { test } = require("node:test");
const assert = require("node:assert");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { mkdir, writeFile, rm } = require("node:fs/promises");
const { ResourceLoader } = require("../../dist/loaders/resourceLoader.js");
const { Logger } = require("../../dist/utils/logger.js");

// Helper function to measure execution time
function measureTime(fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1_000_000;
  return { result, durationMs };
}

// Helper to create mock resource files
async function createMockResources(basePath, count) {
  const categories = ["agents", "skills", "examples"];

  for (const category of categories) {
    const categoryPath = join(basePath, category);
    await mkdir(categoryPath, { recursive: true });

    const resourcesPerCategory = Math.floor(count / categories.length);
    for (let i = 0; i < resourcesPerCategory; i++) {
      const content = `---
id: ${category}-resource-${i}
category: ${category === "agents" ? "agent" : category === "skills" ? "skill" : "example"}
tags: [typescript, api, async]
capabilities:
  - Feature ${i}
  - Capability ${i}
useWhen:
  - Use case ${i}
estimatedTokens: 500
---

# Resource ${i}

This is mock content for ${category} resource ${i}.
`;

      await writeFile(join(categoryPath, `resource-${i}.md`), content, "utf-8");
    }
  }
}

test("ResourceLoader Performance Benchmarks", async (t) => {
  await t.test("Load all resources - small dataset (30 files)", async () => {
    const testDir = join(tmpdir(), `resource-bench-${Date.now()}`);
    await createMockResources(testDir, 30);

    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);
    loader["resourcesPath"] = testDir;

    const { durationMs } = measureTime(() => {
      return loader.loadAllResources();
    });

    console.log(`  ⚡ Load 30 resources: ${durationMs.toFixed(2)}ms`);

    // Should be very fast (< 50ms)
    assert.ok(durationMs < 50, `Loading too slow: ${durationMs}ms`);

    await rm(testDir, { recursive: true, force: true });
  });

  await t.test("Load all resources - medium dataset (100 files)", async () => {
    const testDir = join(tmpdir(), `resource-bench-${Date.now()}`);
    await createMockResources(testDir, 100);

    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);
    loader["resourcesPath"] = testDir;

    const { durationMs } = measureTime(() => {
      return loader.loadAllResources();
    });

    console.log(`  ⚡ Load 100 resources: ${durationMs.toFixed(2)}ms`);

    // Should still be fast (< 150ms)
    assert.ok(durationMs < 150, `Loading too slow: ${durationMs}ms`);

    await rm(testDir, { recursive: true, force: true });
  });

  await t.test("Build resource index - parallel scanning", async () => {
    const testDir = join(tmpdir(), `resource-bench-${Date.now()}`);
    await createMockResources(testDir, 60);

    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);
    loader["resourcesPath"] = testDir;

    const { durationMs } = measureTime(() => {
      return loader.loadResourceIndex();
    });

    console.log(
      `  ⚡ Build index (60 resources, parallel): ${durationMs.toFixed(2)}ms`,
    );

    // Parallel scanning should be fast (< 100ms)
    assert.ok(durationMs < 100, `Index building too slow: ${durationMs}ms`);

    await rm(testDir, { recursive: true, force: true });
  });

  await t.test("Cache hit performance - static resource", async () => {
    const testDir = join(tmpdir(), `resource-bench-${Date.now()}`);
    await createMockResources(testDir, 10);

    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);
    loader["resourcesPath"] = testDir;

    const uri = "orchestr8://agents/resource-0";

    // First load (cache miss)
    await loader.loadResourceContent(uri);

    // Second load (cache hit)
    const { durationMs } = measureTime(() => {
      return loader.loadResourceContent(uri);
    });

    console.log(`  ⚡ Cache hit: ${durationMs.toFixed(3)}ms`);

    // Cache hits should be instant (< 1ms)
    assert.ok(durationMs < 1, `Cache hit too slow: ${durationMs}ms`);

    await rm(testDir, { recursive: true, force: true });
  });

  await t.test("URI parsing performance", async () => {
    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);

    const uris = [
      "orchestr8://agents/typescript-developer",
      "orchestr8://skills/error-handling",
      "orchestr8://examples/api/rest",
      "orchestr8://agents/match?query=typescript+api&maxTokens=2000",
      "orchestr8://match?query=development&categories=agent,skill",
    ];

    const { durationMs } = measureTime(() => {
      for (let i = 0; i < 1000; i++) {
        const uri = uris[i % uris.length];
        loader["uriParser"].parse(uri);
      }
    });

    const avgMs = durationMs / 1000;
    console.log(
      `  ⚡ URI parsing: ${avgMs.toFixed(3)}ms per call (1000 iterations)`,
    );

    // URI parsing should be very fast (< 0.01ms per call)
    assert.ok(avgMs < 0.01, `URI parsing too slow: ${avgMs}ms`);
  });

  await t.test("Metadata extraction performance", async () => {
    const testDir = join(tmpdir(), `resource-bench-${Date.now()}`);
    await createMockResources(testDir, 50);

    const logger = new Logger("bench");
    const loader = new ResourceLoader(logger);
    loader["resourcesPath"] = testDir;

    const { durationMs } = measureTime(() => {
      return loader.loadResourceIndex();
    });

    const avgPerResource = durationMs / 50;
    console.log(
      `  ⚡ Metadata extraction: ${avgPerResource.toFixed(2)}ms per resource (50 resources)`,
    );

    // Should process each resource quickly (< 5ms per resource)
    assert.ok(
      avgPerResource < 5,
      `Metadata extraction too slow: ${avgPerResource}ms per resource`,
    );

    await rm(testDir, { recursive: true, force: true });
  });
});

console.log("\n📊 Performance Targets:");
console.log("  • Load 100 resources: < 150ms");
console.log("  • Build index (parallel): < 100ms");
console.log("  • Cache hit: < 1ms");
console.log("  • URI parsing: < 0.01ms per call");
console.log("  • Metadata extraction: < 5ms per resource");
