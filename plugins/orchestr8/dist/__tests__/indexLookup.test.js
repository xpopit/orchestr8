import { describe, it, before } from "node:test";
import assert from "node:assert";
import { IndexLookup } from "../utils/indexLookup.js";
import { join } from "path";
describe("IndexLookup", () => {
    let indexLookup;
    const resourcesPath = join(process.cwd(), "resources");
    before(async () => {
        indexLookup = new IndexLookup(resourcesPath);
        await indexLookup.loadIndexes();
    });
    describe("Index Loading", () => {
        it("should load the useWhen index successfully", async () => {
            const stats = indexLookup.getCacheStats();
            assert.strictEqual(stats.indexLoaded, true, "Index should be loaded");
        });
    });
    describe("Keyword-based Lookup", () => {
        it("should find matches for common queries", async () => {
            const result = await indexLookup.lookup("retry exponential backoff", {
                query: "retry exponential backoff",
                maxResults: 5,
            });
            assert.ok(result, "Should return a result");
            assert.ok(result.includes("Resource Matches"), "Result should contain header");
            assert.ok(result.includes("orchestr8://"), "Result should contain URIs");
        });
        it("should handle multi-word queries", async () => {
            const result = await indexLookup.lookup("workflow design autonomous", {
                query: "workflow design autonomous",
                maxResults: 5,
            });
            assert.ok(result, "Should return a result");
            assert.ok(result.length > 0, "Result should not be empty");
        });
        it("should return compact results under token budget", async () => {
            const result = await indexLookup.lookup("api validation typescript", {
                query: "api validation typescript",
                maxResults: 5,
            });
            const estimatedTokens = Math.ceil(result.length / 4);
            assert.ok(estimatedTokens < 200, `Result should be under 200 tokens, got ${estimatedTokens}`);
        });
    });
    describe("Category Filtering", () => {
        it("should filter by category", async () => {
            const result = await indexLookup.lookup("error handling", {
                query: "error handling",
                maxResults: 5,
                categories: ["skill"],
            });
            assert.ok(result, "Should return a result");
            assert.ok(result.toLowerCase().includes("skill"), "Should contain skill category");
        });
    });
    describe("Cache Functionality", () => {
        it("should cache results", async () => {
            const query = "retry logic test query";
            const result1 = await indexLookup.lookup(query, {
                query,
                maxResults: 5,
            });
            const result2 = await indexLookup.lookup(query, {
                query,
                maxResults: 5,
            });
            assert.strictEqual(result1, result2, "Cached results should be identical");
        });
        it("should clear cache", () => {
            indexLookup.clearCache();
            const stats = indexLookup.getCacheStats();
            assert.strictEqual(stats.size, 0, "Cache should be empty after clearing");
        });
    });
    describe("Edge Cases", () => {
        it("should handle queries with no matches gracefully", async () => {
            const result = await indexLookup.lookup("quantum computing blockchain ai xyz123", {
                query: "quantum computing blockchain ai xyz123",
                maxResults: 5,
            });
            assert.ok(result, "Should return a result even with no matches");
        });
        it("should handle very short queries", async () => {
            const result = await indexLookup.lookup("api", {
                query: "api",
                maxResults: 5,
            });
            assert.ok(result, "Should handle short queries");
        });
    });
    describe("Performance", () => {
        it("should complete lookup in under 100ms (warm cache)", async () => {
            await indexLookup.lookup("test performance query", {
                query: "test performance query",
                maxResults: 5,
            });
            const start = Date.now();
            await indexLookup.lookup("test performance query", {
                query: "test performance query",
                maxResults: 5,
            });
            const duration = Date.now() - start;
            assert.ok(duration < 100, `Lookup should be fast (<100ms), took ${duration}ms`);
        });
    });
});
