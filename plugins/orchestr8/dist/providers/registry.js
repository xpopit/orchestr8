import { EventEmitter } from "events";
import { ProviderError, ProviderUnavailableError, } from "./types.js";
const DEFAULT_CONFIG = {
    enableHealthChecks: true,
    healthCheckInterval: 60000,
    autoDisableUnhealthy: true,
    maxConsecutiveFailures: 3,
    enableEvents: true,
};
export class ProviderRegistry extends EventEmitter {
    providers = new Map();
    config;
    healthCheckTimer;
    consecutiveFailures = new Map();
    constructor(config) {
        super();
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    async register(provider) {
        if (this.providers.has(provider.name)) {
            throw new Error(`Provider ${provider.name} is already registered`);
        }
        await provider.initialize();
        this.providers.set(provider.name, provider);
        this.consecutiveFailures.set(provider.name, 0);
        this.emitEvent({
            type: "provider-registered",
            provider: provider.name,
            timestamp: new Date(),
            data: { enabled: provider.enabled, priority: provider.priority },
        });
        if (this.providers.size === 1 && this.config.enableHealthChecks) {
            this.startHealthChecks();
        }
    }
    async unregister(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        await provider.shutdown();
        this.providers.delete(name);
        this.consecutiveFailures.delete(name);
        this.emitEvent({
            type: "provider-unregistered",
            provider: name,
            timestamp: new Date(),
        });
        if (this.providers.size === 0) {
            this.stopHealthChecks();
        }
        return true;
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    getProviders(enabledOnly = false) {
        const providers = Array.from(this.providers.values());
        const filtered = enabledOnly
            ? providers.filter((p) => p.enabled)
            : providers;
        return filtered.sort((a, b) => a.priority - b.priority);
    }
    enable(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        provider.enabled = true;
        this.emitEvent({
            type: "provider-enabled",
            provider: name,
            timestamp: new Date(),
        });
        return true;
    }
    disable(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            return false;
        }
        provider.enabled = false;
        this.emitEvent({
            type: "provider-disabled",
            provider: name,
            timestamp: new Date(),
        });
        return true;
    }
    async fetchIndex(providerName) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.fetchIndex(), "fetchIndex");
    }
    async fetchResource(providerName, id, category) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.fetchResource(id, category), "fetchResource");
    }
    async search(providerName, query, options) {
        const provider = this.getEnabledProvider(providerName);
        return this.executeWithErrorHandling(provider, () => provider.search(query, options), "search");
    }
    async fetchAllIndexes() {
        const providers = this.getProviders(true);
        const results = await Promise.allSettled(providers.map((p) => this.executeWithErrorHandling(p, () => p.fetchIndex(), "fetchIndex")));
        return results
            .filter((r) => r.status === "fulfilled")
            .map((r) => r.value);
    }
    async searchAll(query, options) {
        const providers = this.getProviders(true);
        const startTime = Date.now();
        const results = await Promise.allSettled(providers.map((p) => this.executeWithErrorHandling(p, () => p.search(query, options), "search")));
        const allResults = results
            .filter((r) => r.status === "fulfilled")
            .flatMap((r) => r.value.results);
        allResults.sort((a, b) => b.score - a.score);
        const maxResults = options?.maxResults || allResults.length;
        const limitedResults = allResults.slice(0, maxResults);
        const facets = this.calculateFacets(allResults);
        return {
            results: limitedResults,
            totalMatches: allResults.length,
            query,
            searchTime: Date.now() - startTime,
            facets,
        };
    }
    async fetchResourceAny(id, category) {
        const providers = this.getProviders(true);
        if (providers.length === 0) {
            throw new ProviderUnavailableError("registry", "No enabled providers");
        }
        const errors = [];
        for (const provider of providers) {
            try {
                return await this.executeWithErrorHandling(provider, () => provider.fetchResource(id, category), "fetchResource");
            }
            catch (error) {
                errors.push(error);
            }
        }
        throw new ProviderError(`Failed to fetch resource ${id} from any provider: ${errors.map((e) => e.message).join("; ")}`, "registry", "ALL_FAILED");
    }
    async checkHealth(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        try {
            const health = await provider.healthCheck();
            if (health.status === "healthy") {
                this.consecutiveFailures.set(name, 0);
            }
            else if (health.status === "unhealthy") {
                const failures = (this.consecutiveFailures.get(name) || 0) + 1;
                this.consecutiveFailures.set(name, failures);
                if (this.config.autoDisableUnhealthy &&
                    failures >= this.config.maxConsecutiveFailures) {
                    this.disable(name);
                    this.emitEvent({
                        type: "provider-disabled",
                        provider: name,
                        timestamp: new Date(),
                        data: { reason: "auto-disabled", consecutiveFailures: failures },
                    });
                }
            }
            return health;
        }
        catch (error) {
            const failures = (this.consecutiveFailures.get(name) || 0) + 1;
            this.consecutiveFailures.set(name, failures);
            throw error;
        }
    }
    async checkAllHealth() {
        const providers = Array.from(this.providers.values());
        const results = await Promise.allSettled(providers.map((p) => this.checkHealth(p.name)));
        const healthMap = new Map();
        providers.forEach((provider, index) => {
            const result = results[index];
            if (result.status === "fulfilled") {
                healthMap.set(provider.name, result.value);
            }
            else {
                healthMap.set(provider.name, {
                    provider: provider.name,
                    status: "unhealthy",
                    lastCheck: new Date(),
                    reachable: false,
                    authenticated: false,
                    error: result.reason?.message || "Health check failed",
                });
            }
        });
        return healthMap;
    }
    getProviderStats(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        return provider.getStats();
    }
    getAggregateStats() {
        const providers = Array.from(this.providers.values());
        const enabledProviders = providers.filter((p) => p.enabled);
        let healthyProviders = 0;
        for (const provider of providers) {
            const failures = this.consecutiveFailures.get(provider.name) || 0;
            if (failures === 0 && provider.enabled) {
                healthyProviders++;
            }
        }
        const aggregate = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            totalResourcesFetched: 0,
            totalTokensFetched: 0,
            avgResponseTime: 0,
        };
        let totalResponseTime = 0;
        let providersWithStats = 0;
        for (const provider of providers) {
            const stats = provider.getStats();
            aggregate.totalRequests += stats.totalRequests;
            aggregate.successfulRequests += stats.successfulRequests;
            aggregate.failedRequests += stats.failedRequests;
            aggregate.totalResourcesFetched += stats.resourcesFetched;
            aggregate.totalTokensFetched += stats.tokensFetched;
            if (stats.totalRequests > 0) {
                totalResponseTime += stats.avgResponseTime;
                providersWithStats++;
            }
        }
        aggregate.avgResponseTime =
            providersWithStats > 0 ? totalResponseTime / providersWithStats : 0;
        return {
            totalProviders: providers.length,
            enabledProviders: enabledProviders.length,
            healthyProviders,
            aggregate,
        };
    }
    getEnabledProvider(name) {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new ProviderUnavailableError("registry", `Provider ${name} not found`);
        }
        if (!provider.enabled) {
            throw new ProviderUnavailableError("registry", `Provider ${name} is disabled`);
        }
        return provider;
    }
    async executeWithErrorHandling(provider, operation, operationName) {
        try {
            const result = await operation();
            this.consecutiveFailures.set(provider.name, 0);
            return result;
        }
        catch (error) {
            const failures = (this.consecutiveFailures.get(provider.name) || 0) + 1;
            this.consecutiveFailures.set(provider.name, failures);
            this.emitEvent({
                type: "provider-error",
                provider: provider.name,
                timestamp: new Date(),
                data: { operation: operationName, error: error.message },
            });
            if (this.config.autoDisableUnhealthy &&
                failures >= this.config.maxConsecutiveFailures) {
                this.disable(provider.name);
            }
            throw error;
        }
    }
    calculateFacets(results) {
        const categories = {};
        const tags = {};
        for (const result of results) {
            const cat = result.resource.category;
            categories[cat] = (categories[cat] || 0) + 1;
            for (const tag of result.resource.tags || []) {
                tags[tag] = (tags[tag] || 0) + 1;
            }
        }
        return { categories, tags };
    }
    emitEvent(event) {
        if (this.config.enableEvents) {
            this.emit(event.type, event);
            this.emit("event", event);
        }
    }
    startHealthChecks() {
        if (this.healthCheckTimer) {
            return;
        }
        this.healthCheckTimer = setInterval(async () => {
            const healthMap = await this.checkAllHealth();
            for (const [name, health] of healthMap.entries()) {
                if (health.status !== "healthy") {
                    this.emitEvent({
                        type: "provider-health-changed",
                        provider: name,
                        timestamp: new Date(),
                        data: health,
                    });
                }
            }
        }, this.config.healthCheckInterval);
        this.healthCheckTimer.unref();
    }
    stopHealthChecks() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = undefined;
        }
    }
    async shutdown() {
        this.stopHealthChecks();
        const providers = Array.from(this.providers.values());
        await Promise.allSettled(providers.map((p) => p.shutdown()));
        this.providers.clear();
        this.consecutiveFailures.clear();
    }
}
