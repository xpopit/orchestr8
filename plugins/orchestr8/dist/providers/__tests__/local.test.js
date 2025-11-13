import { describe, it, after, beforeEach } from "node:test";
import assert from "node:assert";
import { join } from "path";
import { LocalProvider } from "../local.js";
import { Logger } from "../../utils/logger.js";
import { ResourceNotFoundError, ProviderUnavailableError, } from "../types.js";
describe("LocalProvider", () => {
    let provider;
    let logger;
    const resourcesPath = join(process.cwd(), "resources");
    beforeEach(() => {
        logger = new Logger("LocalProvider:Test");
        provider = new LocalProvider({
            resourcesPath,
            cacheSize: 50,
            cacheTTL: 60000,
            enableCache: true,
        }, logger);
    });
    after(async () => {
        if (provider) {
            await provider.shutdown();
        }
    });
    describe("Lifecycle", () => {
        it("should initialize successfully", async () => {
            await provider.initialize();
            assert.ok(true, "Initialization should succeed");
        });
        it("should fail initialization if resources path doesn't exist", async () => {
            const badProvider = new LocalProvider({ resourcesPath: "/nonexistent/path" }, logger);
            await assert.rejects(async () => {
                await badProvider.initialize();
            }, (error) => {
                assert.ok(error instanceof ProviderUnavailableError);
                assert.strictEqual(error.provider, "local");
                return true;
            }, "Should throw ProviderUnavailableError for invalid path");
        });
        it("should shutdown gracefully", async () => {
            await provider.initialize();
            await provider.shutdown();
            assert.ok(true, "Shutdown should succeed");
        });
        it("should clear caches on shutdown", async () => {
            await provider.initialize();
            const index = await provider.fetchIndex();
            assert.ok(index.resources.length > 0, "Should have cached resources");
            await provider.shutdown();
            const stats = provider.getStats();
            assert.ok(stats.totalRequests > 0, "Stats should persist");
        });
    });
    describe("Provider Metadata", () => {
        it("should have correct provider name", () => {
            assert.strictEqual(provider.name, "local");
        });
        it("should be enabled by default", () => {
            assert.strictEqual(provider.enabled, true);
        });
        it("should have priority 0 (highest)", () => {
            assert.strictEqual(provider.priority, 0);
        });
    });
    describe("fetchIndex()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should fetch complete resource index", async () => {
            const index = await provider.fetchIndex();
            assert.ok(index, "Index should exist");
            assert.strictEqual(index.provider, "local");
            assert.ok(index.totalCount > 0, "Should have resources");
            assert.ok(Array.isArray(index.resources), "Resources should be an array");
            assert.ok(Array.isArray(index.categories), "Categories should be an array");
            assert.ok(index.timestamp instanceof Date, "Timestamp should be a Date");
        });
        it("should include valid resource metadata", async () => {
            const index = await provider.fetchIndex();
            const resource = index.resources[0];
            assert.ok(resource, "Should have at least one resource");
            assert.ok(resource.id, "Resource should have ID");
            assert.ok(resource.category, "Resource should have category");
            assert.ok(resource.title, "Resource should have title");
            assert.ok(Array.isArray(resource.tags), "Tags should be an array");
            assert.ok(Array.isArray(resource.capabilities), "Capabilities should be an array");
            assert.ok(Array.isArray(resource.useWhen), "UseWhen should be an array");
            assert.ok(typeof resource.estimatedTokens === "number", "EstimatedTokens should be a number");
            assert.strictEqual(resource.source, "local");
            assert.ok(resource.sourceUri, "Should have source URI");
        });
        it("should include statistics in index", async () => {
            const index = await provider.fetchIndex();
            assert.ok(index.stats, "Index should have stats");
            assert.ok(index.stats.byCategory, "Should have category breakdown");
            assert.ok(typeof index.stats.totalTokens === "number", "Should have total tokens");
            assert.ok(Array.isArray(index.stats.topTags), "Should have top tags");
            assert.ok(index.stats.topTags.length > 0, "Should have at least one tag");
        });
        it("should cache index results", async () => {
            const index1 = await provider.fetchIndex();
            const stats1 = provider.getStats();
            const index2 = await provider.fetchIndex();
            const stats2 = provider.getStats();
            assert.strictEqual(index1.version, index2.version, "Cached index should be identical");
            assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should have cache hit");
        });
        it("should include all expected categories", async () => {
            const index = await provider.fetchIndex();
            const expectedCategories = ["agent", "skill", "example", "pattern", "workflow"];
            for (const category of expectedCategories) {
                assert.ok(index.categories.includes(category), `Should include ${category} category`);
            }
        });
    });
    describe("fetchResource()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should fetch a specific resource", async () => {
            const index = await provider.fetchIndex();
            const firstResource = index.resources[0];
            const resource = await provider.fetchResource(firstResource.id, firstResource.category);
            assert.ok(resource, "Resource should exist");
            assert.strictEqual(resource.id, firstResource.id);
            assert.strictEqual(resource.category, firstResource.category);
            assert.ok(resource.content, "Resource should have content");
            assert.ok(resource.content.length > 0, "Content should not be empty");
        });
        it("should include complete metadata", async () => {
            const index = await provider.fetchIndex();
            const firstResource = index.resources[0];
            const resource = await provider.fetchResource(firstResource.id, firstResource.category);
            assert.strictEqual(resource.source, "local");
            assert.ok(resource.sourceUri, "Should have source URI");
            assert.ok(resource.title, "Should have title");
            assert.ok(resource.description !== undefined, "Should have description");
            assert.ok(resource.estimatedTokens > 0, "Should have estimated tokens");
        });
        it("should cache fetched resources", async () => {
            const index = await provider.fetchIndex();
            const firstResource = index.resources[0];
            const resource1 = await provider.fetchResource(firstResource.id, firstResource.category);
            const stats1 = provider.getStats();
            const resource2 = await provider.fetchResource(firstResource.id, firstResource.category);
            const stats2 = provider.getStats();
            assert.strictEqual(resource1.content, resource2.content, "Content should be identical");
            assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should have cache hit");
        });
        it("should throw ResourceNotFoundError for non-existent resource", async () => {
            await assert.rejects(async () => {
                await provider.fetchResource("nonexistent-resource-xyz", "agent");
            }, (error) => {
                assert.ok(error instanceof ResourceNotFoundError);
                assert.strictEqual(error.provider, "local");
                assert.strictEqual(error.resourceId, "nonexistent-resource-xyz");
                assert.strictEqual(error.category, "agent");
                return true;
            }, "Should throw ResourceNotFoundError");
        });
        it("should throw ResourceNotFoundError for invalid category", async () => {
            const index = await provider.fetchIndex();
            const firstResource = index.resources[0];
            await assert.rejects(async () => {
                await provider.fetchResource(firstResource.id, "invalid-category");
            }, ResourceNotFoundError, "Should throw ResourceNotFoundError for invalid category");
        });
    });
    describe("search()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should search and return results", async () => {
            const response = await provider.search("typescript", {
                maxResults: 10,
            });
            assert.ok(response, "Search response should exist");
            assert.ok(Array.isArray(response.results), "Results should be an array");
            assert.strictEqual(response.query, "typescript");
            assert.ok(typeof response.searchTime === "number", "Should include search time");
            assert.ok(typeof response.totalMatches === "number", "Should include total matches");
        });
        it("should return results with scores", async () => {
            const response = await provider.search("api", { maxResults: 5 });
            if (response.results.length > 0) {
                const result = response.results[0];
                assert.ok(result.resource, "Result should have resource");
                assert.ok(typeof result.score === "number", "Result should have score");
                assert.ok(result.score >= 0, "Score should be non-negative");
                assert.ok(result.score <= 100, "Score should be <= 100");
            }
        });
        it("should respect maxResults option", async () => {
            const maxResults = 3;
            const response = await provider.search("test", { maxResults });
            assert.ok(response.results.length <= maxResults, `Should return at most ${maxResults} results`);
        });
        it("should respect minScore option", async () => {
            const minScore = 50;
            const response = await provider.search("typescript", { minScore });
            for (const result of response.results) {
                assert.ok(result.score >= minScore, `All scores should be >= ${minScore}`);
            }
        });
        it("should filter by category", async () => {
            const response = await provider.search("test", {
                categories: ["skill"],
                maxResults: 10,
            });
            for (const result of response.results) {
                assert.strictEqual(result.resource.category, "skill", "All results should be skills");
            }
        });
        it("should filter by required tags", async () => {
            const requiredTags = ["typescript"];
            const response = await provider.search("api", {
                requiredTags,
                maxResults: 10,
            });
            for (const result of response.results) {
                const hasTags = requiredTags.every((tag) => result.resource.tags.includes(tag));
                assert.ok(hasTags, "All results should have required tags");
            }
        });
        it("should include match reasons", async () => {
            const response = await provider.search("typescript", { maxResults: 5 });
            if (response.results.length > 0) {
                const result = response.results[0];
                assert.ok(result.matchReason, "Should have match reason");
                assert.ok(Array.isArray(result.matchReason), "Match reason should be an array");
            }
        });
        it("should include facets in response", async () => {
            const response = await provider.search("test");
            assert.ok(response.facets, "Should have facets");
            assert.ok(response.facets.categories, "Should have category facets");
            assert.ok(response.facets.tags, "Should have tag facets");
        });
        it("should handle queries with no matches", async () => {
            const response = await provider.search("xyzzzyqwertnonexistentqueryabc123", { maxResults: 10 });
            assert.ok(response, "Should return response even with no matches");
            assert.strictEqual(response.results.length, 0, "Should have no results");
            assert.strictEqual(response.totalMatches, 0, "Total matches should be 0");
        });
        it("should sort results by relevance by default", async () => {
            const response = await provider.search("typescript api", {
                maxResults: 10,
            });
            if (response.results.length > 1) {
                for (let i = 0; i < response.results.length - 1; i++) {
                    assert.ok(response.results[i].score >= response.results[i + 1].score, "Results should be sorted by score descending");
                }
            }
        });
    });
    describe("healthCheck()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should return healthy status", async () => {
            const health = await provider.healthCheck();
            assert.ok(health, "Health check should return result");
            assert.strictEqual(health.provider, "local");
            assert.strictEqual(health.status, "healthy");
            assert.strictEqual(health.reachable, true);
            assert.strictEqual(health.authenticated, true);
            assert.ok(health.lastCheck instanceof Date);
            assert.ok(typeof health.responseTime === "number", "Should have response time");
        });
        it("should include metrics", async () => {
            await provider.fetchIndex();
            await provider.search("test");
            const health = await provider.healthCheck();
            assert.ok(health.metrics, "Should have metrics");
            assert.ok(typeof health.metrics.successRate === "number", "Should have success rate");
            assert.ok(health.metrics.successRate >= 0 && health.metrics.successRate <= 1, "Success rate should be between 0 and 1");
            assert.ok(typeof health.metrics.avgResponseTime === "number", "Should have avg response time");
        });
        it("should return unhealthy if resources path is inaccessible", async () => {
            const badProvider = new LocalProvider({ resourcesPath: "/nonexistent/path" }, logger);
            const health = await badProvider.healthCheck();
            assert.strictEqual(health.status, "unhealthy");
            assert.strictEqual(health.reachable, false);
            assert.ok(health.error, "Should have error message");
        });
    });
    describe("getStats()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should return statistics", () => {
            const stats = provider.getStats();
            assert.ok(stats, "Stats should exist");
            assert.strictEqual(stats.provider, "local");
            assert.ok(typeof stats.totalRequests === "number", "Should have total requests");
            assert.ok(typeof stats.successfulRequests === "number", "Should have successful requests");
            assert.ok(typeof stats.failedRequests === "number", "Should have failed requests");
            assert.ok(typeof stats.cachedRequests === "number", "Should have cached requests");
            assert.ok(stats.statsResetAt instanceof Date, "Should have reset time");
        });
        it("should track requests accurately", async () => {
            const statsBefore = provider.getStats();
            await provider.fetchIndex();
            await provider.search("test");
            const statsAfter = provider.getStats();
            assert.ok(statsAfter.totalRequests > statsBefore.totalRequests, "Total requests should increase");
            assert.ok(statsAfter.successfulRequests > statsBefore.successfulRequests, "Successful requests should increase");
        });
        it("should track cache hits", async () => {
            const index = await provider.fetchIndex();
            const statsBefore = provider.getStats();
            await provider.fetchIndex();
            const statsAfter = provider.getStats();
            assert.ok(statsAfter.cachedRequests > statsBefore.cachedRequests, "Cached requests should increase");
            assert.ok(statsAfter.cacheHitRate > 0, "Cache hit rate should be > 0");
        });
        it("should track resources fetched", async () => {
            const index = await provider.fetchIndex();
            const firstResource = index.resources[0];
            const statsBefore = provider.getStats();
            await provider.fetchResource(firstResource.id, firstResource.category);
            const statsAfter = provider.getStats();
            assert.ok(statsAfter.resourcesFetched > statsBefore.resourcesFetched, "Resources fetched should increase");
            assert.ok(statsAfter.tokensFetched > statsBefore.tokensFetched, "Tokens fetched should increase");
        });
        it("should calculate average response time", async () => {
            await provider.fetchIndex();
            await provider.search("test");
            await provider.search("api");
            const stats = provider.getStats();
            assert.ok(stats.avgResponseTime > 0, "Average response time should be > 0");
            assert.ok(stats.avgResponseTime < 10000, "Average response time should be reasonable");
        });
        it("should calculate uptime correctly", async () => {
            await provider.fetchIndex();
            await provider.search("test");
            const stats = provider.getStats();
            assert.ok(stats.uptime >= 0 && stats.uptime <= 1, "Uptime should be 0-1");
            assert.ok(stats.uptime > 0.5, "Uptime should be high for successful ops");
        });
    });
    describe("resetStats()", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should reset statistics", async () => {
            await provider.fetchIndex();
            await provider.search("test");
            const statsBefore = provider.getStats();
            assert.ok(statsBefore.totalRequests > 0, "Should have requests before reset");
            provider.resetStats();
            const statsAfter = provider.getStats();
            assert.strictEqual(statsAfter.totalRequests, 0, "Total requests should be 0");
            assert.strictEqual(statsAfter.successfulRequests, 0, "Successful requests should be 0");
            assert.strictEqual(statsAfter.failedRequests, 0, "Failed requests should be 0");
            assert.strictEqual(statsAfter.cachedRequests, 0, "Cached requests should be 0");
            assert.strictEqual(statsAfter.resourcesFetched, 0, "Resources fetched should be 0");
            assert.ok(statsAfter.statsResetAt > statsBefore.statsResetAt, "Reset timestamp should be updated");
        });
    });
    describe("Error Handling", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should handle errors gracefully", async () => {
            try {
                await provider.fetchResource("nonexistent", "agent");
                assert.fail("Should have thrown error");
            }
            catch (error) {
                assert.ok(error instanceof ResourceNotFoundError);
                const stats = provider.getStats();
            }
        });
        it("should track failed requests in stats", async () => {
            const statsBefore = provider.getStats();
            try {
                await provider.fetchResource("", "");
            }
            catch (error) {
            }
            const statsAfter = provider.getStats();
            assert.ok(statsAfter.failedRequests >= statsBefore.failedRequests, "Failed requests should be tracked");
        });
    });
    describe("Caching", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should cache index with correct TTL", async () => {
            const shortTTLProvider = new LocalProvider({
                resourcesPath,
                cacheTTL: 100,
                indexCacheTTL: 100,
            }, logger);
            await shortTTLProvider.initialize();
            await shortTTLProvider.fetchIndex();
            const stats1 = shortTTLProvider.getStats();
            await shortTTLProvider.fetchIndex();
            const stats2 = shortTTLProvider.getStats();
            assert.ok(stats2.cachedRequests > stats1.cachedRequests, "Should hit cache");
            await shortTTLProvider.shutdown();
        });
        it("should respect cache size limit", async () => {
            const smallCacheProvider = new LocalProvider({
                resourcesPath,
                cacheSize: 2,
            }, logger);
            await smallCacheProvider.initialize();
            const index = await smallCacheProvider.fetchIndex();
            const resources = index.resources.slice(0, 5);
            for (const res of resources) {
                await smallCacheProvider.fetchResource(res.id, res.category);
            }
            assert.ok(true, "Should handle cache evictions gracefully");
            await smallCacheProvider.shutdown();
        });
        it("should allow disabling cache", async () => {
            const noCacheProvider = new LocalProvider({
                resourcesPath,
                enableCache: false,
            }, logger);
            await noCacheProvider.initialize();
            await noCacheProvider.fetchIndex();
            const stats1 = noCacheProvider.getStats();
            await noCacheProvider.fetchIndex();
            const stats2 = noCacheProvider.getStats();
            assert.strictEqual(stats2.cachedRequests, stats1.cachedRequests, "Should not use cache");
            await noCacheProvider.shutdown();
        });
    });
    describe("Performance", () => {
        beforeEach(async () => {
            await provider.initialize();
        });
        it("should load index in reasonable time", async () => {
            const start = Date.now();
            await provider.fetchIndex();
            const duration = Date.now() - start;
            assert.ok(duration < 5000, `Index load should be fast (<5s), took ${duration}ms`);
        });
        it("should perform search quickly", async () => {
            await provider.fetchIndex();
            const start = Date.now();
            await provider.search("typescript", { maxResults: 10 });
            const duration = Date.now() - start;
            assert.ok(duration < 1000, `Search should be fast (<1s), took ${duration}ms`);
        });
        it("should benefit from caching", async () => {
            const start1 = Date.now();
            await provider.fetchIndex();
            const duration1 = Date.now() - start1;
            const start2 = Date.now();
            await provider.fetchIndex();
            const duration2 = Date.now() - start2;
            assert.ok(duration2 < duration1, "Cached call should be faster than cold call");
        });
    });
});
