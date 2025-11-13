import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { join } from "path";
import { ProviderRegistry } from "../registry.js";
import { LocalProvider } from "../local.js";
import { Logger } from "../../utils/logger.js";
import { ProviderUnavailableError, ResourceNotFoundError, } from "../types.js";
class MockProvider {
    name;
    enabled = true;
    priority;
    failNextOperation = false;
    stats;
    constructor(name, priority) {
        this.name = name;
        this.priority = priority;
        this.stats = {
            provider: name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 10,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
    }
    setFailNextOperation(fail) {
        this.failNextOperation = fail;
    }
    async initialize() {
    }
    async shutdown() {
    }
    async fetchIndex() {
        this.stats.totalRequests++;
        if (this.failNextOperation) {
            this.stats.failedRequests++;
            this.failNextOperation = false;
            throw new Error(`${this.name} fetch index failed`);
        }
        this.stats.successfulRequests++;
        return {
            provider: this.name,
            totalCount: 5,
            resources: [
                {
                    id: `${this.name}-resource-1`,
                    category: "agent",
                    title: `${this.name} Resource 1`,
                    description: "Test resource",
                    tags: ["test"],
                    capabilities: ["testing"],
                    useWhen: ["testing"],
                    estimatedTokens: 100,
                    source: this.name,
                    sourceUri: `${this.name}://resource-1`,
                },
            ],
            version: "1.0",
            timestamp: new Date(),
            categories: ["agent", "skill"],
            stats: {
                byCategory: { agent: 3, skill: 2 },
                totalTokens: 500,
                topTags: [{ tag: "test", count: 5 }],
            },
        };
    }
    async fetchResource(id, category) {
        this.stats.totalRequests++;
        if (this.failNextOperation) {
            this.stats.failedRequests++;
            this.failNextOperation = false;
            throw new ResourceNotFoundError(this.name, id, category);
        }
        this.stats.successfulRequests++;
        return {
            id,
            category: category,
            title: `Resource ${id}`,
            description: "Test resource",
            tags: ["test"],
            capabilities: ["testing"],
            useWhen: ["testing"],
            estimatedTokens: 100,
            source: this.name,
            sourceUri: `${this.name}://${id}`,
            content: `Content for ${id} from ${this.name}`,
        };
    }
    async search(query, options) {
        this.stats.totalRequests++;
        if (this.failNextOperation) {
            this.stats.failedRequests++;
            this.failNextOperation = false;
            throw new Error(`${this.name} search failed`);
        }
        this.stats.successfulRequests++;
        const results = [
            {
                resource: {
                    id: `${this.name}-match-1`,
                    category: "agent",
                    tags: ["test", query.toLowerCase()],
                    capabilities: ["testing"],
                    useWhen: ["testing"],
                    estimatedTokens: 100,
                    content: `Matched content for ${query}`,
                },
                score: 85,
                matchReason: [`Matched query: ${query}`],
            },
        ];
        return {
            results,
            totalMatches: results.length,
            query,
            searchTime: 10,
        };
    }
    async healthCheck() {
        return {
            provider: this.name,
            status: this.failNextOperation ? "unhealthy" : "healthy",
            lastCheck: new Date(),
            responseTime: 10,
            reachable: !this.failNextOperation,
            authenticated: true,
        };
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = {
            provider: this.name,
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            avgResponseTime: 10,
            cacheHitRate: 0,
            uptime: 1.0,
            statsResetAt: new Date(),
        };
    }
}
describe("ProviderRegistry", () => {
    let registry;
    let logger;
    beforeEach(() => {
        logger = new Logger("ProviderRegistry:Test");
        registry = new ProviderRegistry({
            enableHealthChecks: false,
            autoDisableUnhealthy: true,
            maxConsecutiveFailures: 3,
            enableEvents: true,
        });
    });
    afterEach(async () => {
        if (registry) {
            await registry.shutdown();
        }
    });
    describe("Provider Registration", () => {
        it("should register a provider", async () => {
            const provider = new MockProvider("test-provider", 10);
            await registry.register(provider);
            const registered = registry.getProvider("test-provider");
            assert.ok(registered, "Provider should be registered");
            assert.strictEqual(registered.name, "test-provider");
        });
        it("should reject duplicate provider names", async () => {
            const provider1 = new MockProvider("duplicate", 10);
            const provider2 = new MockProvider("duplicate", 20);
            await registry.register(provider1);
            await assert.rejects(async () => {
                await registry.register(provider2);
            }, /already registered/, "Should reject duplicate provider name");
        });
        it("should initialize provider on registration", async () => {
            const provider = new MockProvider("init-test", 10);
            await registry.register(provider);
            assert.ok(true, "Provider should be initialized");
        });
        it("should emit provider-registered event", async () => {
            let eventEmitted = false;
            registry.on("provider-registered", (event) => {
                eventEmitted = true;
                assert.strictEqual(event.type, "provider-registered");
                assert.strictEqual(event.provider, "event-test");
            });
            const provider = new MockProvider("event-test", 10);
            await registry.register(provider);
            assert.ok(eventEmitted, "Should emit provider-registered event");
        });
        it("should unregister a provider", async () => {
            const provider = new MockProvider("unregister-test", 10);
            await registry.register(provider);
            const unregistered = await registry.unregister("unregister-test");
            assert.strictEqual(unregistered, true, "Should return true");
            const notFound = registry.getProvider("unregister-test");
            assert.strictEqual(notFound, undefined, "Provider should be removed");
        });
        it("should return false when unregistering non-existent provider", async () => {
            const result = await registry.unregister("nonexistent");
            assert.strictEqual(result, false);
        });
        it("should emit provider-unregistered event", async () => {
            let eventEmitted = false;
            const provider = new MockProvider("unreg-event", 10);
            await registry.register(provider);
            registry.on("provider-unregistered", (event) => {
                eventEmitted = true;
                assert.strictEqual(event.type, "provider-unregistered");
                assert.strictEqual(event.provider, "unreg-event");
            });
            await registry.unregister("unreg-event");
            assert.ok(eventEmitted, "Should emit provider-unregistered event");
        });
    });
    describe("Provider Management", () => {
        it("should get a provider by name", async () => {
            const provider = new MockProvider("get-test", 10);
            await registry.register(provider);
            const retrieved = registry.getProvider("get-test");
            assert.ok(retrieved, "Should retrieve provider");
            assert.strictEqual(retrieved.name, "get-test");
        });
        it("should return undefined for non-existent provider", () => {
            const provider = registry.getProvider("nonexistent");
            assert.strictEqual(provider, undefined);
        });
        it("should get all providers", async () => {
            const provider1 = new MockProvider("provider-1", 10);
            const provider2 = new MockProvider("provider-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const providers = registry.getProviders();
            assert.strictEqual(providers.length, 2, "Should have 2 providers");
        });
        it("should get only enabled providers", async () => {
            const provider1 = new MockProvider("enabled-1", 10);
            const provider2 = new MockProvider("enabled-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            provider2.enabled = false;
            const enabledProviders = registry.getProviders(true);
            assert.strictEqual(enabledProviders.length, 1, "Should have 1 enabled provider");
            assert.strictEqual(enabledProviders[0].name, "enabled-1");
        });
        it("should sort providers by priority", async () => {
            const provider1 = new MockProvider("low-priority", 20);
            const provider2 = new MockProvider("high-priority", 5);
            const provider3 = new MockProvider("medium-priority", 10);
            await registry.register(provider1);
            await registry.register(provider2);
            await registry.register(provider3);
            const providers = registry.getProviders();
            assert.strictEqual(providers[0].priority, 5, "First should be highest priority");
            assert.strictEqual(providers[1].priority, 10);
            assert.strictEqual(providers[2].priority, 20);
        });
        it("should enable a provider", async () => {
            const provider = new MockProvider("enable-test", 10);
            await registry.register(provider);
            provider.enabled = false;
            const result = registry.enable("enable-test");
            assert.strictEqual(result, true, "Should return true");
            assert.strictEqual(provider.enabled, true, "Provider should be enabled");
        });
        it("should disable a provider", async () => {
            const provider = new MockProvider("disable-test", 10);
            await registry.register(provider);
            const result = registry.disable("disable-test");
            assert.strictEqual(result, true, "Should return true");
            assert.strictEqual(provider.enabled, false, "Provider should be disabled");
        });
        it("should emit events when enabling/disabling", async () => {
            const provider = new MockProvider("event-toggle", 10);
            await registry.register(provider);
            let enableEvent = false;
            let disableEvent = false;
            registry.on("provider-enabled", (event) => {
                enableEvent = true;
            });
            registry.on("provider-disabled", (event) => {
                disableEvent = true;
            });
            registry.disable("event-toggle");
            registry.enable("event-toggle");
            assert.ok(enableEvent, "Should emit enabled event");
            assert.ok(disableEvent, "Should emit disabled event");
        });
    });
    describe("Single Provider Operations", () => {
        it("should fetch index from specific provider", async () => {
            const provider = new MockProvider("index-test", 10);
            await registry.register(provider);
            const index = await registry.fetchIndex("index-test");
            assert.ok(index, "Should return index");
            assert.strictEqual(index.provider, "index-test");
            assert.ok(index.resources.length > 0, "Should have resources");
        });
        it("should throw error for disabled provider", async () => {
            const provider = new MockProvider("disabled-test", 10);
            await registry.register(provider);
            registry.disable("disabled-test");
            await assert.rejects(async () => {
                await registry.fetchIndex("disabled-test");
            }, ProviderUnavailableError, "Should throw for disabled provider");
        });
        it("should fetch resource from specific provider", async () => {
            const provider = new MockProvider("resource-test", 10);
            await registry.register(provider);
            const resource = await registry.fetchResource("resource-test", "test-id", "agent");
            assert.ok(resource, "Should return resource");
            assert.strictEqual(resource.id, "test-id");
            assert.strictEqual(resource.source, "resource-test");
        });
        it("should search in specific provider", async () => {
            const provider = new MockProvider("search-test", 10);
            await registry.register(provider);
            const response = await registry.search("search-test", "typescript");
            assert.ok(response, "Should return search response");
            assert.strictEqual(response.query, "typescript");
            assert.ok(Array.isArray(response.results), "Results should be an array");
        });
    });
    describe("Multi-Provider Operations", () => {
        it("should fetch indexes from all providers", async () => {
            const provider1 = new MockProvider("multi-1", 10);
            const provider2 = new MockProvider("multi-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const indexes = await registry.fetchAllIndexes();
            assert.strictEqual(indexes.length, 2, "Should return 2 indexes");
            assert.ok(indexes.some((idx) => idx.provider === "multi-1"), "Should include first provider");
            assert.ok(indexes.some((idx) => idx.provider === "multi-2"), "Should include second provider");
        });
        it("should handle partial failures in fetchAllIndexes", async () => {
            const provider1 = new MockProvider("good-provider", 10);
            const provider2 = new MockProvider("bad-provider", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            provider2.setFailNextOperation(true);
            const indexes = await registry.fetchAllIndexes();
            assert.ok(indexes.length >= 1, "Should return at least one index");
            assert.ok(indexes.some((idx) => idx.provider === "good-provider"), "Should include successful provider");
        });
        it("should search across all providers", async () => {
            const provider1 = new MockProvider("search-1", 10);
            const provider2 = new MockProvider("search-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const response = await registry.searchAll("test query");
            assert.ok(response, "Should return search response");
            assert.ok(response.results.length >= 2, "Should have results from both providers");
            assert.strictEqual(response.query, "test query");
        });
        it("should merge and sort results by score", async () => {
            const provider1 = new MockProvider("score-1", 10);
            const provider2 = new MockProvider("score-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const response = await registry.searchAll("test");
            if (response.results.length > 1) {
                for (let i = 0; i < response.results.length - 1; i++) {
                    assert.ok(response.results[i].score >= response.results[i + 1].score, "Results should be sorted by score");
                }
            }
        });
        it("should respect maxResults in searchAll", async () => {
            const provider1 = new MockProvider("limit-1", 10);
            const provider2 = new MockProvider("limit-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const response = await registry.searchAll("test", { maxResults: 1 });
            assert.ok(response.results.length <= 1, "Should respect maxResults limit");
        });
        it("should try providers in priority order for fetchResourceAny", async () => {
            const highPriority = new MockProvider("high", 5);
            const lowPriority = new MockProvider("low", 20);
            await registry.register(highPriority);
            await registry.register(lowPriority);
            highPriority.setFailNextOperation(true);
            const resource = await registry.fetchResourceAny("test-id", "agent");
            assert.ok(resource, "Should return resource from fallback provider");
            assert.strictEqual(resource.source, "low", "Should use low priority as fallback");
        });
        it("should throw error when all providers fail in fetchResourceAny", async () => {
            const provider1 = new MockProvider("fail-1", 10);
            const provider2 = new MockProvider("fail-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            provider1.setFailNextOperation(true);
            provider2.setFailNextOperation(true);
            await assert.rejects(async () => {
                await registry.fetchResourceAny("test-id", "agent");
            }, /Failed to fetch resource/, "Should throw when all providers fail");
        });
    });
    describe("Health Monitoring", () => {
        it("should check health of specific provider", async () => {
            const provider = new MockProvider("health-test", 10);
            await registry.register(provider);
            const health = await registry.checkHealth("health-test");
            assert.ok(health, "Should return health status");
            assert.strictEqual(health.provider, "health-test");
            assert.strictEqual(health.status, "healthy");
        });
        it("should check health of all providers", async () => {
            const provider1 = new MockProvider("health-1", 10);
            const provider2 = new MockProvider("health-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            const healthMap = await registry.checkAllHealth();
            assert.strictEqual(healthMap.size, 2, "Should have health for 2 providers");
            assert.ok(healthMap.has("health-1"), "Should have health-1");
            assert.ok(healthMap.has("health-2"), "Should have health-2");
        });
        it("should auto-disable unhealthy providers after consecutive failures", async () => {
            const provider = new MockProvider("auto-disable", 10);
            await registry.register(provider);
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("auto-disable");
            }
            catch (e) { }
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("auto-disable");
            }
            catch (e) { }
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("auto-disable");
            }
            catch (e) { }
            assert.strictEqual(provider.enabled, false, "Provider should be auto-disabled after 3 failures");
        });
        it("should reset failure counter on success", async () => {
            const provider = new MockProvider("reset-test", 10);
            await registry.register(provider);
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("reset-test");
            }
            catch (e) { }
            await registry.fetchIndex("reset-test");
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("reset-test");
            }
            catch (e) { }
            assert.strictEqual(provider.enabled, true, "Provider should still be enabled");
        });
        it("should emit provider-error event on failures", async () => {
            let errorEventEmitted = false;
            const provider = new MockProvider("error-event", 10);
            await registry.register(provider);
            registry.on("provider-error", (event) => {
                errorEventEmitted = true;
                assert.strictEqual(event.type, "provider-error");
                assert.strictEqual(event.provider, "error-event");
            });
            provider.setFailNextOperation(true);
            try {
                await registry.fetchIndex("error-event");
            }
            catch (e) { }
            assert.ok(errorEventEmitted, "Should emit provider-error event");
        });
    });
    describe("Statistics", () => {
        it("should get statistics for specific provider", async () => {
            const provider = new MockProvider("stats-test", 10);
            await registry.register(provider);
            await registry.fetchIndex("stats-test");
            const stats = registry.getProviderStats("stats-test");
            assert.ok(stats, "Should return stats");
            assert.strictEqual(stats.provider, "stats-test");
            assert.ok(stats.totalRequests > 0, "Should have tracked requests");
        });
        it("should get aggregate statistics", async () => {
            const provider1 = new MockProvider("agg-1", 10);
            const provider2 = new MockProvider("agg-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            await registry.fetchIndex("agg-1");
            await registry.fetchIndex("agg-2");
            const aggStats = registry.getAggregateStats();
            assert.ok(aggStats, "Should return aggregate stats");
            assert.strictEqual(aggStats.totalProviders, 2, "Should count total providers");
            assert.strictEqual(aggStats.enabledProviders, 2, "Should count enabled providers");
            assert.ok(aggStats.aggregate.totalRequests > 0, "Should aggregate requests");
        });
        it("should aggregate statistics across all providers", async () => {
            const provider1 = new MockProvider("agg-req-1", 10);
            const provider2 = new MockProvider("agg-req-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            await registry.fetchIndex("agg-req-1");
            await registry.searchAll("test");
            const aggStats = registry.getAggregateStats();
            assert.ok(aggStats.aggregate.totalRequests >= 3, "Should aggregate all requests");
            assert.ok(aggStats.aggregate.avgResponseTime > 0, "Should calculate average response time");
        });
        it("should count healthy providers correctly", async () => {
            const provider1 = new MockProvider("healthy-1", 10);
            const provider2 = new MockProvider("unhealthy-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            provider2.setFailNextOperation(true);
            try {
                await registry.fetchIndex("unhealthy-2");
            }
            catch (e) { }
            const aggStats = registry.getAggregateStats();
            assert.ok(aggStats.healthyProviders >= 1, "Should count healthy providers");
        });
    });
    describe("Integration with LocalProvider", () => {
        const resourcesPath = join(process.cwd(), "resources");
        it("should work with LocalProvider", async () => {
            const localProvider = new LocalProvider({ resourcesPath }, logger);
            await registry.register(localProvider);
            const providers = registry.getProviders();
            assert.strictEqual(providers.length, 1, "Should have 1 provider");
            assert.strictEqual(providers[0].name, "local");
            assert.strictEqual(providers[0].priority, 0, "Local should have priority 0");
        });
        it("should fetch index from LocalProvider", async () => {
            const localProvider = new LocalProvider({ resourcesPath }, logger);
            await registry.register(localProvider);
            const index = await registry.fetchIndex("local");
            assert.ok(index, "Should return index");
            assert.strictEqual(index.provider, "local");
            assert.ok(index.totalCount > 0, "Should have resources");
        });
        it("should search across LocalProvider", async () => {
            const localProvider = new LocalProvider({ resourcesPath }, logger);
            await registry.register(localProvider);
            const response = await registry.searchAll("typescript");
            assert.ok(response, "Should return search results");
            assert.ok(Array.isArray(response.results), "Should have results array");
        });
        it("should handle mixed mock and real providers", async () => {
            const localProvider = new LocalProvider({ resourcesPath }, logger);
            const mockProvider = new MockProvider("mock-provider", 20);
            await registry.register(localProvider);
            await registry.register(mockProvider);
            const providers = registry.getProviders();
            assert.strictEqual(providers.length, 2, "Should have 2 providers");
            assert.strictEqual(providers[0].name, "local");
            assert.strictEqual(providers[1].name, "mock-provider");
        });
    });
    describe("Lifecycle", () => {
        it("should shutdown all providers", async () => {
            const provider1 = new MockProvider("shutdown-1", 10);
            const provider2 = new MockProvider("shutdown-2", 20);
            await registry.register(provider1);
            await registry.register(provider2);
            await registry.shutdown();
            const providers = registry.getProviders();
            assert.strictEqual(providers.length, 0, "All providers should be removed");
        });
        it("should handle shutdown gracefully even with errors", async () => {
            const provider = new MockProvider("shutdown-error", 10);
            await registry.register(provider);
            await registry.shutdown();
            assert.ok(true, "Should handle shutdown gracefully");
        });
    });
});
