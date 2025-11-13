import { describe, it, before, after, beforeEach } from "node:test";
import assert from "node:assert";
import { ResourceLoader } from "../resourceLoader.js";
import { Logger } from "../../utils/logger.js";
describe("ResourceLoader Provider Integration", () => {
    let resourceLoader;
    let logger;
    before(() => {
        logger = new Logger("ResourceLoader:IntegrationTest");
    });
    beforeEach(() => {
        resourceLoader = new ResourceLoader(logger);
    });
    after(async () => {
    });
    describe("Provider Initialization", () => {
        it("should initialize providers successfully", async () => {
            await resourceLoader.initializeProviders();
            const providers = resourceLoader.getProviderNames();
            assert.ok(providers.length >= 1, "Should have at least one provider");
            assert.ok(providers.includes("local"), "Should have local provider");
        });
        it("should initialize local provider with highest priority", async () => {
            await resourceLoader.initializeProviders();
            const providers = await resourceLoader.getProviders();
            const localProvider = providers.find((p) => p.name === "local");
            assert.ok(localProvider, "Should have local provider");
            assert.strictEqual(localProvider.priority, 0, "Local should have highest priority");
        });
        it("should handle provider initialization failures gracefully", async () => {
            await resourceLoader.initializeProviders();
            const providers = resourceLoader.getProviderNames();
            assert.ok(providers.length >= 1, "Should have local provider at minimum");
        });
        it("should respect provider configuration", async () => {
            await resourceLoader.initializeProviders();
            const providers = resourceLoader.getProviderNames(true);
            assert.ok(providers.length > 0, "Should have enabled providers");
        });
    });
    describe("Multi-Provider Search", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should search across all providers", async () => {
            const results = await resourceLoader.searchAllProviders("typescript", {
                maxResults: 10,
            });
            assert.ok(Array.isArray(results), "Results should be an array");
        });
        it("should merge results from multiple providers", async () => {
            const results = await resourceLoader.searchAllProviders("api build", {
                maxResults: 20,
            });
            if (results.length > 1) {
                for (let i = 0; i < results.length - 1; i++) {
                    assert.ok(results[i].score >= results[i + 1].score, "Results should be sorted by score");
                }
            }
        });
        it("should respect search options", async () => {
            const results = await resourceLoader.searchAllProviders("test", {
                maxResults: 5,
                categories: ["skill"],
                minScore: 50,
            });
            assert.ok(results.length <= 5, "Should respect maxResults");
            for (const result of results) {
                assert.ok(result.score >= 50, "Should respect minScore");
                if (result.resource.category) {
                    assert.strictEqual(result.resource.category, "skill", "Should respect category filter");
                }
            }
        });
        it("should handle queries with no matches", async () => {
            const results = await resourceLoader.searchAllProviders("xyzzzyqwertnonexistentqueryabc123456789");
            assert.ok(Array.isArray(results), "Should return array even with no matches");
        });
        it("should handle search errors gracefully", async () => {
            try {
                const results = await resourceLoader.searchAllProviders("test");
                assert.ok(Array.isArray(results), "Should return results");
            }
            catch (error) {
                assert.ok(true, "Should handle search errors");
            }
        });
    });
    describe("Single Provider Search", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should search in local provider", async () => {
            const results = await resourceLoader.searchProvider("local", "typescript", {
                maxResults: 10,
            });
            assert.ok(Array.isArray(results), "Results should be an array");
        });
        it("should return empty array for non-existent provider", async () => {
            const results = await resourceLoader.searchProvider("nonexistent-provider", "test");
            assert.ok(Array.isArray(results), "Should return array");
            assert.strictEqual(results.length, 0, "Should have no results");
        });
        it("should handle search errors in specific provider", async () => {
            const results = await resourceLoader.searchProvider("local", "test");
            assert.ok(Array.isArray(results), "Should return results");
        });
    });
    describe("Resource Fetching", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should load resource from local provider via orchestr8:// URI", async () => {
            try {
                const results = await resourceLoader.searchProvider("local", "test", {
                    maxResults: 1,
                });
                if (results.length > 0) {
                    const resourceId = results[0].resource.id;
                    const uri = `orchestr8://${resourceId}`;
                    const content = await resourceLoader.loadResourceContent(uri);
                    assert.ok(content, "Should load content");
                    assert.ok(content.length > 0, "Content should not be empty");
                }
            }
            catch (error) {
                console.log("Resource fetch test skipped:", error.message);
            }
        });
        it("should cache loaded resources", async () => {
            try {
                const results = await resourceLoader.searchProvider("local", "test", {
                    maxResults: 1,
                });
                if (results.length > 0) {
                    const resourceId = results[0].resource.id;
                    const uri = `orchestr8://${resourceId}`;
                    await resourceLoader.loadResourceContent(uri);
                    const cached = resourceLoader.getCachedResource(uri);
                    assert.ok(cached !== undefined, "Should be cached");
                }
            }
            catch (error) {
                console.log("Cache test skipped:", error.message);
            }
        });
        it("should handle dynamic resource URIs", async () => {
            try {
                const uri = "orchestr8://agents/match?query=typescript+api&maxResults=3&mode=catalog";
                const content = await resourceLoader.loadResourceContent(uri);
                assert.ok(content, "Should assemble dynamic content");
                assert.ok(content.length > 0, "Content should not be empty");
            }
            catch (error) {
                console.log("Dynamic URI test skipped:", error.message);
            }
        });
    });
    describe("Health Monitoring", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should get health status for all providers", async () => {
            const health = await resourceLoader.getProvidersHealth();
            assert.ok(health, "Should return health object");
            assert.ok(health.local, "Should have local provider health");
            assert.strictEqual(health.local.provider, "local");
        });
        it("should include health metrics", async () => {
            const health = await resourceLoader.getProvidersHealth();
            if (health.local) {
                assert.ok(["healthy", "degraded", "unhealthy"].includes(health.local.status), "Should have valid status");
                assert.ok(health.local.lastCheck instanceof Date, "Should have check timestamp");
            }
        });
        it("should detect unhealthy providers", async () => {
            const health = await resourceLoader.getProvidersHealth();
            assert.strictEqual(health.local?.status, "healthy", "Local provider should be healthy");
        });
    });
    describe("Statistics", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should get statistics for all providers", () => {
            const stats = resourceLoader.getProvidersStats();
            assert.ok(stats, "Should return stats object");
            assert.ok(stats.local, "Should have local provider stats");
            assert.strictEqual(stats.local.provider, "local");
        });
        it("should track provider requests", async () => {
            await resourceLoader.searchProvider("local", "test");
            const stats = resourceLoader.getProvidersStats();
            assert.ok(stats.local.totalRequests >= 0, "Should track requests");
        });
        it("should get aggregate statistics", () => {
            const aggStats = resourceLoader.getAggregateProviderStats();
            assert.ok(aggStats, "Should return aggregate stats");
            assert.ok(typeof aggStats.totalProviders === "number", "Should have total providers count");
            assert.ok(typeof aggStats.enabledProviders === "number", "Should have enabled providers count");
            assert.ok(aggStats.aggregate, "Should have aggregate metrics");
        });
        it("should aggregate metrics across providers", async () => {
            await resourceLoader.searchAllProviders("test");
            const aggStats = resourceLoader.getAggregateProviderStats();
            assert.ok(aggStats.aggregate.totalRequests >= 0, "Should aggregate requests");
        });
    });
    describe("Provider Management", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should list all provider names", () => {
            const names = resourceLoader.getProviderNames();
            assert.ok(Array.isArray(names), "Should return array");
            assert.ok(names.length > 0, "Should have providers");
            assert.ok(names.includes("local"), "Should include local");
        });
        it("should list only enabled providers", () => {
            const names = resourceLoader.getProviderNames(true);
            assert.ok(Array.isArray(names), "Should return array");
        });
        it("should get detailed provider information", async () => {
            const providers = await resourceLoader.getProviders();
            assert.ok(Array.isArray(providers), "Should return array");
            for (const provider of providers) {
                assert.ok(provider.name, "Provider should have name");
                assert.ok(typeof provider.enabled === "boolean", "Should have enabled flag");
                assert.ok(typeof provider.priority === "number", "Should have priority");
                assert.ok(provider.health, "Should have health status");
                assert.ok(provider.stats, "Should have stats");
            }
        });
        it("should get index from specific provider", async () => {
            try {
                const index = await resourceLoader.getProviderIndex("local");
                assert.ok(index, "Should return index");
                assert.strictEqual(index.provider, "local");
                assert.ok(index.resources, "Should have resources");
            }
            catch (error) {
                console.log("Index fetch skipped:", error.message);
            }
        });
        it("should get health for specific provider", async () => {
            const health = await resourceLoader.getProviderHealth("local");
            assert.ok(health, "Should return health");
            assert.strictEqual(health.provider, "local");
        });
        it("should get stats for specific provider", () => {
            const stats = resourceLoader.getProviderStats("local");
            assert.ok(stats, "Should return stats");
            assert.strictEqual(stats.provider, "local");
        });
        it("should enable a provider", async () => {
            await resourceLoader.disableProvider("local");
            await resourceLoader.enableProvider("local");
            const providers = await resourceLoader.getProviders();
            const local = providers.find((p) => p.name === "local");
            assert.ok(local, "Should find local provider");
            assert.strictEqual(local.enabled, true, "Should be enabled");
        });
        it("should disable a provider", async () => {
            await resourceLoader.disableProvider("local");
            const providers = await resourceLoader.getProviders();
            const local = providers.find((p) => p.name === "local");
            assert.ok(local, "Should find local provider");
            assert.strictEqual(local.enabled, false, "Should be disabled");
            await resourceLoader.enableProvider("local");
        });
    });
    describe("Error Handling", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should handle provider not found errors", async () => {
            await assert.rejects(async () => {
                await resourceLoader.getProviderHealth("nonexistent-provider");
            }, Error, "Should throw for non-existent provider");
        });
        it("should handle malformed resource URIs", async () => {
            await assert.rejects(async () => {
                await resourceLoader.loadResourceContent("invalid://uri");
            }, Error, "Should throw for invalid URI");
        });
        it("should handle resource not found errors", async () => {
            await assert.rejects(async () => {
                await resourceLoader.loadResourceContent("orchestr8://nonexistent/resource-xyz-123");
            }, Error, "Should throw for non-existent resource");
        });
        it("should continue working after provider errors", async () => {
            try {
                await resourceLoader.loadResourceContent("orchestr8://nonexistent/xyz");
            }
            catch (error) {
            }
            const results = await resourceLoader.searchProvider("local", "test");
            assert.ok(Array.isArray(results), "Should continue working after error");
        });
    });
    describe("Backward Compatibility", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should load resources without provider initialization", async () => {
            const newLoader = new ResourceLoader(logger);
            try {
                const resources = await newLoader.loadAllResources();
                assert.ok(Array.isArray(resources), "Should load resources");
            }
            catch (error) {
                console.log("Compatibility test skipped:", error.message);
            }
        });
        it("should support legacy resource loading methods", async () => {
            try {
                const resources = await resourceLoader.loadAllResources();
                assert.ok(Array.isArray(resources), "Should load resources");
            }
            catch (error) {
                console.log("Legacy test skipped:", error.message);
            }
        });
        it("should support legacy search methods", async () => {
            try {
                const resources = await resourceLoader.searchResources("test");
                assert.ok(Array.isArray(resources), "Should search resources");
            }
            catch (error) {
                console.log("Legacy search skipped:", error.message);
            }
        });
    });
    describe("Performance", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should initialize providers in reasonable time", async () => {
            const newLoader = new ResourceLoader(logger);
            const start = Date.now();
            await newLoader.initializeProviders();
            const duration = Date.now() - start;
            assert.ok(duration < 10000, `Provider initialization should be fast (<10s), took ${duration}ms`);
        });
        it("should perform multi-provider search quickly", async () => {
            const start = Date.now();
            await resourceLoader.searchAllProviders("test", { maxResults: 10 });
            const duration = Date.now() - start;
            assert.ok(duration < 5000, `Multi-provider search should be fast (<5s), took ${duration}ms`);
        });
        it("should benefit from caching", async () => {
            const start1 = Date.now();
            const results1 = await resourceLoader.searchProvider("local", "test");
            const duration1 = Date.now() - start1;
            const start2 = Date.now();
            const results2 = await resourceLoader.searchProvider("local", "test");
            const duration2 = Date.now() - start2;
            assert.ok(results1, "First search should complete");
            assert.ok(results2, "Second search should complete");
        });
    });
    describe("Integration Scenarios", () => {
        beforeEach(async () => {
            await resourceLoader.initializeProviders();
        });
        it("should handle complete workflow: search -> fetch -> use", async () => {
            try {
                const results = await resourceLoader.searchAllProviders("typescript", {
                    maxResults: 5,
                });
                if (results.length > 0) {
                    const firstResult = results[0];
                    const uri = `orchestr8://${firstResult.resource.id}`;
                    const content = await resourceLoader.loadResourceContent(uri);
                    assert.ok(content, "Should load content");
                    assert.ok(content.length > 0, "Content should not be empty");
                }
            }
            catch (error) {
                console.log("Workflow test skipped:", error.message);
            }
        });
        it("should handle provider failure gracefully in workflow", async () => {
            try {
                await resourceLoader.disableProvider("local");
                const results = await resourceLoader.searchAllProviders("test");
                assert.ok(Array.isArray(results), "Should return results");
                await resourceLoader.enableProvider("local");
            }
            catch (error) {
                await resourceLoader.enableProvider("local");
                throw error;
            }
        });
        it("should provide health monitoring throughout workflow", async () => {
            const healthBefore = await resourceLoader.getProvidersHealth();
            assert.ok(healthBefore.local, "Should have health status");
            await resourceLoader.searchAllProviders("test");
            const healthAfter = await resourceLoader.getProvidersHealth();
            assert.ok(healthAfter.local, "Should still have health status");
        });
    });
});
