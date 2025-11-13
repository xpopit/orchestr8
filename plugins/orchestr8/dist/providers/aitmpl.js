import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { Logger } from "../utils/logger.js";
import { ProviderError, ProviderTimeoutError, ProviderUnavailableError, ResourceNotFoundError, RateLimitError, } from "./types.js";
import { CATEGORY_MAPPING, AITMPL_DATA_SOURCES, AITMPL_DEFAULTS, } from "./aitmpl-types.js";
export class AITMPLProvider {
    name = "aitmpl";
    enabled = true;
    priority = 10;
    config;
    logger;
    indexCache = null;
    resourceCache;
    minuteBucket;
    hourBucket;
    metrics;
    statsResetAt;
    consecutiveFailures = 0;
    lastSuccessfulRequest = null;
    lastHealthCheck = null;
    constructor(config, logger) {
        this.config = config;
        this.logger = logger || new Logger("AITMPLProvider");
        this.resourceCache = new LRUCache({
            max: AITMPL_DEFAULTS.MAX_CACHE_SIZE,
            ttl: config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
        });
        const now = new Date();
        this.minuteBucket = {
            tokens: config.rateLimit.requestsPerMinute,
            capacity: config.rateLimit.requestsPerMinute,
            lastRefill: now,
            refillRate: config.rateLimit.requestsPerMinute / 60000,
        };
        this.hourBucket = {
            tokens: config.rateLimit.requestsPerHour,
            capacity: config.rateLimit.requestsPerHour,
            lastRefill: now,
            refillRate: config.rateLimit.requestsPerHour / 3600000,
        };
        this.statsResetAt = now;
        this.metrics = {
            apiRequests: 0,
            apiSuccesses: 0,
            apiFailures: 0,
            cacheHits: 0,
            cacheMisses: 0,
            bytesDownloaded: 0,
            avgResponseTime: 0,
            rateLimitHits: 0,
        };
    }
    async initialize() {
        this.logger.info("Initializing AITMPL provider", {
            enabled: this.enabled,
            cacheTTL: this.config.cacheTTL,
            rateLimit: this.config.rateLimit,
        });
        if (!this.config.enabled) {
            this.enabled = false;
            this.logger.info("AITMPL provider is disabled in configuration");
            return;
        }
        try {
            const health = await this.healthCheck();
            if (health.status === "unhealthy") {
                this.logger.warn("AITMPL provider is unhealthy", { health });
            }
            else {
                this.logger.info("AITMPL provider initialized successfully", {
                    health,
                });
            }
        }
        catch (error) {
            this.logger.error("Failed to perform initial health check", error);
        }
    }
    async shutdown() {
        this.logger.info("Shutting down AITMPL provider");
        this.indexCache = null;
        this.resourceCache.clear();
        this.enabled = false;
        this.consecutiveFailures = 0;
        this.lastSuccessfulRequest = null;
        this.logger.info("AITMPL provider shutdown complete");
    }
    async fetchIndex() {
        this.logger.debug("Fetching resource index");
        if (this.indexCache && this.isCacheValid(this.indexCache)) {
            this.logger.debug("Returning cached index");
            this.metrics.cacheHits++;
            return this.buildIndexFromComponents(this.indexCache.data);
        }
        this.metrics.cacheMisses++;
        const components = await this.fetchComponentsJson();
        this.indexCache = {
            data: components,
            cachedAt: new Date(),
            ttl: this.config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
        };
        return this.buildIndexFromComponents(components);
    }
    async fetchResource(id, category) {
        this.logger.debug("Fetching resource", { id, category });
        const cacheKey = `${category}:${id}`;
        const cached = this.resourceCache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            this.logger.debug("Returning cached resource", { id });
            this.metrics.cacheHits++;
            return cached.data;
        }
        this.metrics.cacheMisses++;
        const components = await this.getComponents();
        const component = components.find((c) => {
            const mappedCategory = CATEGORY_MAPPING[c.type];
            return c.name === id && mappedCategory === category;
        });
        if (!component) {
            throw new ResourceNotFoundError(this.name, id, category);
        }
        const resource = this.convertToResource(component);
        this.resourceCache.set(cacheKey, {
            data: resource,
            cachedAt: new Date(),
            ttl: AITMPL_DEFAULTS.RESOURCE_CACHE_TTL,
        });
        return resource;
    }
    async search(query, options) {
        const startTime = Date.now();
        this.logger.debug("Searching resources", { query, options });
        const components = await this.getComponents();
        const keywords = this.extractKeywords(query);
        const scored = [];
        for (const component of components) {
            const resource = this.convertToResourceFragment(component);
            const score = this.calculateRelevanceScore(component, resource, keywords, options);
            const minScore = options?.minScore ?? 10;
            if (score >= minScore) {
                scored.push({
                    resource: {
                        ...resource,
                        source: this.name,
                    },
                    score,
                    matchReason: this.getMatchReasons(component, keywords),
                });
            }
        }
        scored.sort((a, b) => b.score - a.score);
        const maxResults = options?.maxResults ?? scored.length;
        const results = scored.slice(0, maxResults);
        const facets = this.calculateFacets(results);
        const searchTime = Date.now() - startTime;
        this.logger.debug("Search complete", {
            query,
            totalMatches: scored.length,
            returnedResults: results.length,
            searchTime,
        });
        return {
            results,
            totalMatches: scored.length,
            query,
            searchTime,
            facets,
        };
    }
    async healthCheck() {
        const startTime = Date.now();
        this.lastHealthCheck = new Date();
        this.logger.debug("Performing health check");
        const health = {
            provider: this.name,
            status: "unknown",
            lastCheck: this.lastHealthCheck,
            reachable: false,
            authenticated: true,
        };
        try {
            const index = await this.fetchIndex();
            if (index.resources.length > 0) {
                health.reachable = true;
                health.status = "healthy";
                health.responseTime = Date.now() - startTime;
            }
            else {
                health.status = "degraded";
                health.error = "No resources found in index";
            }
            const totalRequests = this.metrics.apiRequests;
            if (totalRequests > 0) {
                const successRate = this.metrics.apiSuccesses / totalRequests;
                health.metrics = {
                    successRate,
                    avgResponseTime: this.metrics.avgResponseTime,
                    consecutiveFailures: this.consecutiveFailures,
                    lastSuccess: this.lastSuccessfulRequest || undefined,
                };
                if (successRate < 0.5) {
                    health.status = "degraded";
                    health.error = `Low success rate: ${(successRate * 100).toFixed(1)}%`;
                }
                else if (successRate < 0.9 && health.status === "healthy") {
                    health.status = "degraded";
                }
            }
            if (this.consecutiveFailures >= 3) {
                health.status = "unhealthy";
                health.error = `${this.consecutiveFailures} consecutive failures`;
            }
            this.logger.debug("Health check complete", { health });
        }
        catch (error) {
            health.status = "unhealthy";
            health.reachable = false;
            health.error = error.message;
            health.responseTime = Date.now() - startTime;
            this.logger.warn("Health check failed", error);
        }
        return health;
    }
    getStats() {
        const totalRequests = this.metrics.apiRequests;
        const cacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
        const totalWithCache = totalRequests + cacheRequests;
        return {
            provider: this.name,
            totalRequests: totalWithCache,
            successfulRequests: this.metrics.apiSuccesses + this.metrics.cacheHits,
            failedRequests: this.metrics.apiFailures,
            cachedRequests: this.metrics.cacheHits,
            resourcesFetched: this.metrics.apiSuccesses,
            tokensFetched: 0,
            avgResponseTime: this.metrics.avgResponseTime,
            cacheHitRate: cacheRequests > 0 ? this.metrics.cacheHits / cacheRequests : 0,
            uptime: totalRequests > 0 ? this.metrics.apiSuccesses / totalRequests : 1,
            rateLimit: {
                remaining: Math.floor(Math.min(this.minuteBucket.tokens, this.hourBucket.tokens)),
                limit: this.config.rateLimit.requestsPerMinute,
                resetAt: new Date(Date.now() + 60000),
            },
            statsResetAt: this.statsResetAt,
        };
    }
    resetStats() {
        this.metrics = {
            apiRequests: 0,
            apiSuccesses: 0,
            apiFailures: 0,
            cacheHits: 0,
            cacheMisses: 0,
            bytesDownloaded: 0,
            avgResponseTime: 0,
            rateLimitHits: 0,
        };
        this.statsResetAt = new Date();
        this.consecutiveFailures = 0;
        this.logger.info("Provider statistics reset");
    }
    async httpFetch(url, options) {
        const timeout = options?.timeout || this.config.timeout || AITMPL_DEFAULTS.TIMEOUT;
        const maxRetries = options?.retries ??
            this.config.retryAttempts ??
            AITMPL_DEFAULTS.MAX_RETRIES;
        let lastError = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                this.checkRateLimit();
                this.metrics.apiRequests++;
                const startTime = Date.now();
                const headers = {
                    "User-Agent": AITMPL_DEFAULTS.USER_AGENT,
                    ...(options?.headers || {}),
                };
                if (options?.etag) {
                    headers["If-None-Match"] = options.etag;
                }
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                try {
                    const response = await fetch(url, {
                        headers,
                        signal: controller.signal,
                    });
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        if (response.status === 304) {
                            this.logger.debug("HTTP 304 Not Modified", { url });
                            throw new Error("Not modified");
                        }
                        if (response.status === 429) {
                            const retryAfter = response.headers.get("Retry-After");
                            throw new RateLimitError(this.name, retryAfter ? parseInt(retryAfter) * 1000 : undefined);
                        }
                        if (response.status === 404) {
                            throw new ResourceNotFoundError(this.name, url);
                        }
                        throw new ProviderError(`HTTP ${response.status}: ${response.statusText}`, this.name, "HTTP_ERROR", response.status);
                    }
                    const text = await response.text();
                    const responseTime = Date.now() - startTime;
                    this.metrics.apiSuccesses++;
                    this.metrics.bytesDownloaded += text.length;
                    this.updateAvgResponseTime(responseTime);
                    this.consecutiveFailures = 0;
                    this.lastSuccessfulRequest = new Date();
                    this.logger.debug("HTTP request successful", {
                        url,
                        responseTime,
                        bytes: text.length,
                    });
                    return text;
                }
                catch (error) {
                    clearTimeout(timeoutId);
                    if (error.name === "AbortError") {
                        throw new ProviderTimeoutError(this.name, timeout);
                    }
                    throw error;
                }
            }
            catch (error) {
                lastError = error;
                if (error instanceof RateLimitError) {
                    this.metrics.rateLimitHits++;
                    throw error;
                }
                if (error instanceof ResourceNotFoundError) {
                    throw error;
                }
                if (attempt < maxRetries) {
                    const backoff = this.calculateBackoff(attempt);
                    this.logger.warn(`Request failed, retrying in ${backoff}ms`, {
                        url,
                        attempt: attempt + 1,
                        maxRetries,
                        error: lastError.message,
                    });
                    await this.sleep(backoff);
                }
            }
        }
        this.metrics.apiFailures++;
        this.consecutiveFailures++;
        if (this.metrics.lastError) {
            this.metrics.lastError = {
                message: lastError?.message || "Unknown error",
                timestamp: new Date(),
            };
        }
        throw new ProviderUnavailableError(this.name, `Failed after ${maxRetries} retries: ${lastError?.message}`, lastError || undefined);
    }
    checkRateLimit() {
        const now = new Date();
        const minuteElapsed = now.getTime() - this.minuteBucket.lastRefill.getTime();
        this.minuteBucket.tokens = Math.min(this.minuteBucket.capacity, this.minuteBucket.tokens + minuteElapsed * this.minuteBucket.refillRate);
        this.minuteBucket.lastRefill = now;
        const hourElapsed = now.getTime() - this.hourBucket.lastRefill.getTime();
        this.hourBucket.tokens = Math.min(this.hourBucket.capacity, this.hourBucket.tokens + hourElapsed * this.hourBucket.refillRate);
        this.hourBucket.lastRefill = now;
        if (this.minuteBucket.tokens < 1) {
            const resetIn = Math.ceil((1 - this.minuteBucket.tokens) / this.minuteBucket.refillRate);
            throw new RateLimitError(this.name, resetIn);
        }
        if (this.hourBucket.tokens < 1) {
            const resetIn = Math.ceil((1 - this.hourBucket.tokens) / this.hourBucket.refillRate);
            throw new RateLimitError(this.name, resetIn);
        }
        this.minuteBucket.tokens -= 1;
        this.hourBucket.tokens -= 1;
    }
    calculateBackoff(attempt) {
        const base = AITMPL_DEFAULTS.BACKOFF_BASE;
        const max = AITMPL_DEFAULTS.MAX_BACKOFF;
        const exponential = base * Math.pow(2, attempt);
        const jitter = Math.random() * 0.3 * exponential;
        return Math.min(exponential + jitter, max);
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    updateAvgResponseTime(responseTime) {
        const totalRequests = this.metrics.apiSuccesses;
        if (totalRequests === 1) {
            this.metrics.avgResponseTime = responseTime;
        }
        else {
            this.metrics.avgResponseTime =
                (this.metrics.avgResponseTime * (totalRequests - 1) + responseTime) /
                    totalRequests;
        }
    }
    async fetchComponentsJson() {
        this.logger.debug("Fetching components.json");
        const url = AITMPL_DATA_SOURCES.COMPONENTS_JSON;
        try {
            const text = await this.httpFetch(url);
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                return data;
            }
            else if (data.components && Array.isArray(data.components)) {
                return data.components;
            }
            else if (data.agents && Array.isArray(data.agents)) {
                return data.agents;
            }
            else if (typeof data === "object") {
                const components = [];
                for (const key of Object.keys(data)) {
                    if (Array.isArray(data[key])) {
                        components.push(...data[key]);
                    }
                }
                if (components.length > 0) {
                    return components;
                }
            }
            throw new Error("Unexpected JSON structure: " + JSON.stringify(Object.keys(data)));
        }
        catch (error) {
            if (error instanceof ProviderError) {
                throw error;
            }
            throw new ProviderError(`Failed to fetch components.json: ${error.message}`, this.name, "FETCH_FAILED", undefined, error);
        }
    }
    async getComponents() {
        if (this.indexCache && this.isCacheValid(this.indexCache)) {
            return this.indexCache.data;
        }
        const components = await this.fetchComponentsJson();
        this.indexCache = {
            data: components,
            cachedAt: new Date(),
            ttl: this.config.cacheTTL || AITMPL_DEFAULTS.CACHE_TTL,
        };
        return components;
    }
    buildIndexFromComponents(components) {
        const resources = components.map((c) => this.convertToResourceMetadata(c));
        const byCategory = {};
        const tagCounts = new Map();
        let totalTokens = 0;
        for (const resource of resources) {
            byCategory[resource.category] = (byCategory[resource.category] || 0) + 1;
            for (const tag of resource.tags) {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
            totalTokens += resource.estimatedTokens;
        }
        const topTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));
        const categories = Array.from(new Set(resources.map((r) => r.category)));
        return {
            provider: this.name,
            totalCount: resources.length,
            resources,
            version: "1.0",
            timestamp: new Date(),
            categories,
            stats: {
                byCategory,
                totalTokens,
                topTags,
            },
        };
    }
    convertToResourceMetadata(component) {
        const frontmatter = this.parseFrontmatter(component.content);
        const category = CATEGORY_MAPPING[component.type];
        return {
            id: component.name,
            category,
            title: frontmatter.name || component.name,
            description: frontmatter.description || component.description || "No description",
            tags: frontmatter.tags || [component.category, component.type],
            capabilities: frontmatter.capabilities || [],
            useWhen: frontmatter.useWhen || [],
            estimatedTokens: frontmatter.estimatedTokens || this.estimateTokens(component.content),
            version: frontmatter.version,
            author: frontmatter.author,
            source: this.name,
            sourceUri: `${AITMPL_DATA_SOURCES.GITHUB_REPO}/blob/main/${component.path}`,
        };
    }
    convertToResource(component) {
        const metadata = this.convertToResourceMetadata(component);
        const frontmatter = this.parseFrontmatter(component.content);
        return {
            ...metadata,
            content: component.content,
            dependencies: frontmatter.dependencies,
            related: frontmatter.related,
        };
    }
    convertToResourceFragment(component) {
        const metadata = this.convertToResourceMetadata(component);
        return {
            id: metadata.id,
            category: metadata.category,
            tags: metadata.tags,
            capabilities: metadata.capabilities,
            useWhen: metadata.useWhen,
            estimatedTokens: metadata.estimatedTokens,
            content: component.content,
        };
    }
    parseFrontmatter(content) {
        try {
            const parsed = matter(content);
            return parsed.data;
        }
        catch (error) {
            this.logger.warn("Failed to parse frontmatter", error);
            return {};
        }
    }
    estimateTokens(content) {
        return Math.max(Math.ceil(content.length / 4), AITMPL_DEFAULTS.MIN_ESTIMATED_TOKENS);
    }
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a",
            "an",
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "as",
            "is",
            "was",
            "are",
            "were",
            "be",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    calculateRelevanceScore(component, resource, keywords, options) {
        let score = 0;
        if (options?.categories && options.categories.length > 0) {
            if (!options.categories.includes(resource.category)) {
                return 0;
            }
            score += 15;
        }
        if (options?.requiredTags && options.requiredTags.length > 0) {
            const hasAll = options.requiredTags.every((tag) => resource.tags.includes(tag));
            if (!hasAll) {
                return 0;
            }
            score += 10;
        }
        if (options?.optionalTags && options.optionalTags.length > 0) {
            const matchedOptional = options.optionalTags.filter((tag) => resource.tags.includes(tag)).length;
            score += matchedOptional * 5;
        }
        const nameLower = component.name.toLowerCase();
        const descLower = (component.description || "").toLowerCase();
        for (const keyword of keywords) {
            if (nameLower.includes(keyword)) {
                score += 15;
            }
            if (descLower.includes(keyword)) {
                score += 8;
            }
            if (resource.tags.some((tag) => tag.includes(keyword))) {
                score += 10;
            }
            if (resource.capabilities.some((cap) => cap.toLowerCase().includes(keyword))) {
                score += 8;
            }
            if (resource.useWhen.some((use) => use.toLowerCase().includes(keyword))) {
                score += 5;
            }
        }
        if (component.downloads > 1000) {
            score += 10;
        }
        else if (component.downloads > 100) {
            score += 5;
        }
        if (component.security && component.security.valid) {
            const securityBonus = Math.floor(component.security.score / 20);
            score += securityBonus;
        }
        if (resource.estimatedTokens < 1000) {
            score += 5;
        }
        else if (resource.estimatedTokens > 5000) {
            score -= 5;
        }
        return Math.min(score, 100);
    }
    getMatchReasons(component, keywords) {
        const reasons = [];
        const nameLower = component.name.toLowerCase();
        const descLower = (component.description || "").toLowerCase();
        for (const keyword of keywords) {
            if (nameLower.includes(keyword)) {
                reasons.push(`Name contains "${keyword}"`);
            }
            if (descLower.includes(keyword)) {
                reasons.push(`Description contains "${keyword}"`);
            }
        }
        if (component.downloads > 1000) {
            reasons.push("Popular component (1000+ downloads)");
        }
        if (component.security && component.security.score >= 95) {
            reasons.push("High security score");
        }
        return reasons.slice(0, 3);
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
    isCacheValid(entry) {
        const age = Date.now() - entry.cachedAt.getTime();
        return age < entry.ttl;
    }
}
