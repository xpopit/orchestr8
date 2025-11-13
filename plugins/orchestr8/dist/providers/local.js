import { promises as fs } from "fs";
import { join } from "path";
import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { FuzzyMatcher } from "../utils/fuzzyMatcher.js";
import { ResourceNotFoundError, ProviderError, ProviderUnavailableError, } from "./types.js";
export class LocalProvider {
    name = "local";
    enabled = true;
    priority = 0;
    resourcesPath;
    config;
    logger;
    fuzzyMatcher;
    resourceCache;
    indexCache = null;
    resourceIndex = null;
    indexLoadPromise = null;
    metrics;
    constructor(config, logger) {
        this.logger = logger;
        this.config = {
            resourcesPath: config.resourcesPath ||
                process.env.RESOURCES_PATH ||
                join(process.cwd(), "resources"),
            cacheSize: config.cacheSize ?? 200,
            cacheTTL: config.cacheTTL ?? 14400000,
            indexCacheTTL: config.indexCacheTTL ?? 86400000,
            enableCache: config.enableCache ?? true,
        };
        this.resourcesPath = this.config.resourcesPath;
        this.resourceCache = new LRUCache({
            max: this.config.cacheSize,
            ttl: this.config.cacheTTL,
            updateAgeOnGet: true,
        });
        this.fuzzyMatcher = new FuzzyMatcher();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            responseTimes: [],
            statsResetAt: new Date(),
        };
        this.logger.debug("LocalProvider initialized", {
            resourcesPath: this.resourcesPath,
            cacheSize: this.config.cacheSize,
        });
    }
    async initialize() {
        this.logger.info("Initializing LocalProvider", {
            resourcesPath: this.resourcesPath,
        });
        try {
            await fs.access(this.resourcesPath, fs.constants.R_OK);
            this.logger.info("Resources directory accessible", {
                path: this.resourcesPath,
            });
            this.loadResourceIndex().catch((error) => {
                this.logger.warn("Failed to pre-load resource index", error);
            });
        }
        catch (error) {
            const message = `Resources directory not accessible: ${this.resourcesPath}`;
            this.logger.error(message, error);
            throw new ProviderUnavailableError("local", message, error);
        }
    }
    async shutdown() {
        this.logger.info("Shutting down LocalProvider");
        this.resourceCache.clear();
        this.indexCache = null;
        this.resourceIndex = null;
        this.indexLoadPromise = null;
        this.logger.info("LocalProvider shutdown complete");
    }
    async fetchIndex() {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            if (this.config.enableCache && this.indexCache) {
                const age = Date.now() - this.indexCache.timestamp.getTime();
                if (age < this.config.indexCacheTTL) {
                    this.logger.debug("Index cache hit", { age: `${Math.round(age / 1000)}s` });
                    this.metrics.cachedRequests++;
                    this.trackResponseTime(Date.now() - startTime);
                    return this.indexCache.index;
                }
                this.logger.debug("Index cache expired, reloading");
            }
            const fragments = await this.loadResourceIndex();
            const resources = fragments.map((fragment) => this.fragmentToMetadata(fragment));
            const byCategory = {};
            const tagCounts = new Map();
            let totalTokens = 0;
            for (const fragment of fragments) {
                byCategory[fragment.category] = (byCategory[fragment.category] || 0) + 1;
                for (const tag of fragment.tags) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
                totalTokens += fragment.estimatedTokens;
            }
            const topTags = Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([tag, count]) => ({ tag, count }));
            const index = {
                provider: this.name,
                totalCount: fragments.length,
                resources,
                version: new Date().toISOString(),
                timestamp: new Date(),
                categories: [
                    "agent",
                    "skill",
                    "example",
                    "pattern",
                    "workflow",
                ],
                stats: {
                    byCategory,
                    totalTokens,
                    topTags,
                },
            };
            if (this.config.enableCache) {
                this.indexCache = {
                    index,
                    timestamp: new Date(),
                };
            }
            this.metrics.successfulRequests++;
            this.trackResponseTime(Date.now() - startTime);
            this.logger.info("Index fetched successfully", {
                totalCount: index.totalCount,
                categories: Object.keys(byCategory),
            });
            return index;
        }
        catch (error) {
            this.metrics.failedRequests++;
            this.trackError(error);
            this.trackResponseTime(Date.now() - startTime);
            const message = "Failed to fetch resource index";
            this.logger.error(message, error);
            throw new ProviderError(message, this.name, "INDEX_FETCH_FAILED", 500, error);
        }
    }
    async fetchResource(id, category) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        const cacheKey = `${category}:${id}`;
        try {
            if (this.config.enableCache && this.resourceCache.has(cacheKey)) {
                this.logger.debug("Resource cache hit", { id, category });
                this.metrics.cachedRequests++;
                this.trackResponseTime(Date.now() - startTime);
                return this.resourceCache.get(cacheKey);
            }
            const categoryPlural = this.categoryToDirectory(category);
            const filePath = join(this.resourcesPath, categoryPlural, `${id}.md`);
            this.logger.debug("Loading resource from filesystem", { filePath });
            let content;
            try {
                content = await fs.readFile(filePath, "utf-8");
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    throw new ResourceNotFoundError(this.name, id, category);
                }
                throw error;
            }
            const parsed = matter(content);
            const frontmatter = parsed.data;
            const body = parsed.content;
            const resource = {
                id,
                category: category,
                title: frontmatter.title || id,
                description: frontmatter.description || "",
                tags: Array.isArray(frontmatter.tags)
                    ? frontmatter.tags.map((t) => String(t).toLowerCase())
                    : [],
                capabilities: Array.isArray(frontmatter.capabilities)
                    ? frontmatter.capabilities.map((c) => String(c))
                    : [],
                useWhen: Array.isArray(frontmatter.useWhen)
                    ? frontmatter.useWhen.map((u) => String(u))
                    : [],
                estimatedTokens: frontmatter.estimatedTokens || Math.ceil(body.length / 4),
                version: frontmatter.version,
                author: frontmatter.author,
                createdAt: frontmatter.createdAt
                    ? new Date(frontmatter.createdAt)
                    : undefined,
                updatedAt: frontmatter.updatedAt
                    ? new Date(frontmatter.updatedAt)
                    : undefined,
                source: this.name,
                sourceUri: `orchestr8://${categoryPlural}/${id}`,
                content: body,
                dependencies: Array.isArray(frontmatter.dependencies)
                    ? frontmatter.dependencies
                    : undefined,
                related: Array.isArray(frontmatter.related)
                    ? frontmatter.related
                    : undefined,
            };
            if (this.config.enableCache) {
                this.resourceCache.set(cacheKey, resource);
            }
            this.metrics.successfulRequests++;
            this.metrics.resourcesFetched++;
            this.metrics.tokensFetched += resource.estimatedTokens;
            this.trackResponseTime(Date.now() - startTime);
            this.logger.debug("Resource fetched successfully", {
                id,
                category,
                tokens: resource.estimatedTokens,
            });
            return resource;
        }
        catch (error) {
            if (error instanceof ResourceNotFoundError) {
                this.logger.debug("Resource not found", { id, category });
                throw error;
            }
            this.metrics.failedRequests++;
            this.trackError(error);
            this.trackResponseTime(Date.now() - startTime);
            const message = `Failed to fetch resource ${id} in category ${category}`;
            this.logger.error(message, error);
            throw new ProviderError(message, this.name, "RESOURCE_FETCH_FAILED", 500, error);
        }
    }
    async search(query, options) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            await this.loadResourceIndex();
            const matchResult = await this.fuzzyMatcher.match({
                query,
                categories: options?.categories,
                maxTokens: options?.maxTokens,
                requiredTags: options?.requiredTags,
                mode: "catalog",
                maxResults: options?.maxResults ?? 15,
                minScore: options?.minScore ?? 10,
            });
            const results = matchResult.fragments.map((fragment, index) => ({
                resource: {
                    ...fragment,
                    source: this.name,
                },
                score: matchResult.matchScores[index],
                matchReason: this.generateMatchReason(fragment, query),
            }));
            if (options?.sortBy && options.sortBy !== "relevance") {
                this.sortResults(results, options.sortBy, options.sortOrder || "desc");
            }
            const offset = options?.offset ?? 0;
            const limit = options?.limit ?? results.length;
            const paginatedResults = results.slice(offset, offset + limit);
            const facets = this.calculateFacets(results);
            const response = {
                results: paginatedResults,
                totalMatches: results.length,
                query,
                searchTime: Date.now() - startTime,
                facets,
            };
            this.metrics.successfulRequests++;
            this.trackResponseTime(Date.now() - startTime);
            this.logger.info("Search completed", {
                query,
                matches: results.length,
                returned: paginatedResults.length,
            });
            return response;
        }
        catch (error) {
            this.metrics.failedRequests++;
            this.trackError(error);
            this.trackResponseTime(Date.now() - startTime);
            const message = `Search failed for query: ${query}`;
            this.logger.error(message, error);
            throw new ProviderError(message, this.name, "SEARCH_FAILED", 500, error);
        }
    }
    async healthCheck() {
        const startTime = Date.now();
        try {
            await fs.access(this.resourcesPath, fs.constants.R_OK);
            const totalAttempts = this.metrics.successfulRequests + this.metrics.failedRequests;
            const successRate = totalAttempts > 0 ? this.metrics.successfulRequests / totalAttempts : 1;
            let status = "healthy";
            if (successRate < 0.5) {
                status = "unhealthy";
            }
            else if (successRate < 0.9) {
                status = "degraded";
            }
            if (this.metrics.lastError) {
                const errorAge = Date.now() - this.metrics.lastError.timestamp.getTime();
                if (errorAge < 300000 && status === "healthy") {
                    status = "degraded";
                }
            }
            const responseTime = Date.now() - startTime;
            return {
                provider: this.name,
                status,
                lastCheck: new Date(),
                responseTime,
                reachable: true,
                authenticated: true,
                error: status !== "healthy" ? this.metrics.lastError?.message : undefined,
                metrics: {
                    successRate,
                    avgResponseTime: this.calculateAvgResponseTime(),
                    consecutiveFailures: 0,
                    lastSuccess: this.metrics.lastRequestTime,
                },
            };
        }
        catch (error) {
            return {
                provider: this.name,
                status: "unhealthy",
                lastCheck: new Date(),
                responseTime: Date.now() - startTime,
                reachable: false,
                authenticated: false,
                error: `Resources directory not accessible: ${error.message}`,
            };
        }
    }
    getStats() {
        const totalAttempts = this.metrics.successfulRequests + this.metrics.failedRequests;
        const uptime = totalAttempts > 0 ? this.metrics.successfulRequests / totalAttempts : 1;
        return {
            provider: this.name,
            totalRequests: this.metrics.totalRequests,
            successfulRequests: this.metrics.successfulRequests,
            failedRequests: this.metrics.failedRequests,
            cachedRequests: this.metrics.cachedRequests,
            resourcesFetched: this.metrics.resourcesFetched,
            tokensFetched: this.metrics.tokensFetched,
            avgResponseTime: this.calculateAvgResponseTime(),
            cacheHitRate: this.metrics.totalRequests > 0
                ? this.metrics.cachedRequests / this.metrics.totalRequests
                : 0,
            uptime,
            statsResetAt: this.metrics.statsResetAt,
        };
    }
    resetStats() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            cachedRequests: 0,
            resourcesFetched: 0,
            tokensFetched: 0,
            responseTimes: [],
            statsResetAt: new Date(),
        };
        this.logger.info("Statistics reset");
    }
    async loadResourceIndex() {
        if (this.resourceIndex !== null) {
            this.logger.debug("Returning cached resource index");
            return this.resourceIndex;
        }
        if (this.indexLoadPromise !== null) {
            this.logger.debug("Waiting for in-progress resource index load");
            return this.indexLoadPromise;
        }
        this.logger.info("Loading resource index...");
        this.indexLoadPromise = this.loadResourceIndexImpl();
        try {
            this.resourceIndex = await this.indexLoadPromise;
            this.fuzzyMatcher.setResourceIndex(this.resourceIndex);
            this.logger.info(`Resource index loaded with ${this.resourceIndex.length} fragments`);
            return this.resourceIndex;
        }
        finally {
            this.indexLoadPromise = null;
        }
    }
    async loadResourceIndexImpl() {
        try {
            const categories = [
                { dir: "agents", type: "agent" },
                { dir: "skills", type: "skill" },
                { dir: "examples", type: "example" },
                { dir: "patterns", type: "pattern" },
                { dir: "guides", type: "pattern" },
                { dir: "workflows", type: "workflow" },
            ];
            const categoryPromises = categories.map(async ({ dir, type }) => {
                const categoryPath = join(this.resourcesPath, dir);
                const categoryFragments = [];
                try {
                    await fs.access(categoryPath);
                    await this.scanFragmentsDirectory(categoryPath, type, dir, categoryFragments);
                }
                catch (error) {
                    this.logger.debug(`Category directory not found: ${categoryPath}`);
                }
                return categoryFragments;
            });
            const fragmentArrays = await Promise.all(categoryPromises);
            const fragments = fragmentArrays.flat();
            this.logger.info(`Scanned ${fragments.length} resource fragments`);
            return fragments;
        }
        catch (error) {
            this.logger.error("Error loading resource index:", error);
            return [];
        }
    }
    async scanFragmentsDirectory(dirPath, category, categoryName, fragments) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await this.scanFragmentsDirectory(fullPath, category, categoryName, fragments);
                }
                else if (entry.name.endsWith(".md")) {
                    try {
                        const content = await fs.readFile(fullPath, "utf-8");
                        const fragment = this.parseResourceFragment(content, category, categoryName, entry.name);
                        fragments.push(fragment);
                    }
                    catch (error) {
                        this.logger.warn(`Failed to parse resource: ${fullPath}`, error);
                    }
                }
            }
        }
        catch (error) {
            this.logger.warn(`Error scanning directory: ${dirPath}`, error);
        }
    }
    parseResourceFragment(content, category, categoryName, filename) {
        const parsed = matter(content);
        const frontmatter = parsed.data;
        const body = parsed.content;
        const id = frontmatter.id || filename.replace(/\.md$/, "");
        return {
            id: `${categoryName}/${id}`,
            category,
            tags: Array.isArray(frontmatter.tags)
                ? frontmatter.tags.map((t) => String(t).toLowerCase())
                : [],
            capabilities: Array.isArray(frontmatter.capabilities)
                ? frontmatter.capabilities.map((c) => String(c))
                : [],
            useWhen: Array.isArray(frontmatter.useWhen)
                ? frontmatter.useWhen.map((u) => String(u))
                : [],
            estimatedTokens: frontmatter.estimatedTokens || Math.ceil(body.length / 4),
            content: body,
        };
    }
    fragmentToMetadata(fragment) {
        const id = fragment.id.split("/").pop() || fragment.id;
        return {
            id,
            category: fragment.category,
            title: id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            description: fragment.capabilities[0] || "",
            tags: fragment.tags,
            capabilities: fragment.capabilities,
            useWhen: fragment.useWhen,
            estimatedTokens: fragment.estimatedTokens,
            source: this.name,
            sourceUri: `orchestr8://${fragment.category}s/${id}`,
        };
    }
    categoryToDirectory(category) {
        const mapping = {
            agent: "agents",
            skill: "skills",
            example: "examples",
            pattern: "patterns",
            workflow: "workflows",
        };
        return mapping[category] || `${category}s`;
    }
    generateMatchReason(fragment, query) {
        const reasons = [];
        const queryLower = query.toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        const matchedTags = fragment.tags.filter((tag) => queryWords.some((word) => tag.includes(word)));
        if (matchedTags.length > 0) {
            reasons.push(`Tags: ${matchedTags.join(", ")}`);
        }
        const matchedCaps = fragment.capabilities.filter((cap) => queryWords.some((word) => cap.toLowerCase().includes(word)));
        if (matchedCaps.length > 0) {
            reasons.push(`Capabilities: ${matchedCaps.slice(0, 2).join(", ")}`);
        }
        if (queryWords.includes(fragment.category)) {
            reasons.push(`Category: ${fragment.category}`);
        }
        return reasons.length > 0 ? reasons : ["General relevance"];
    }
    sortResults(results, sortBy, sortOrder) {
        const multiplier = sortOrder === "asc" ? 1 : -1;
        results.sort((a, b) => {
            switch (sortBy) {
                case "tokens":
                    return ((a.resource.estimatedTokens - b.resource.estimatedTokens) *
                        multiplier);
                case "date":
                    return (a.score - b.score) * multiplier;
                case "popularity":
                    return (a.score - b.score) * multiplier;
                default:
                    return (a.score - b.score) * multiplier;
            }
        });
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
    trackResponseTime(ms) {
        this.metrics.responseTimes.push(ms);
        this.metrics.lastRequestTime = new Date();
        if (this.metrics.responseTimes.length > 100) {
            this.metrics.responseTimes.shift();
        }
    }
    trackError(error) {
        this.metrics.lastError = {
            message: error.message,
            timestamp: new Date(),
        };
    }
    calculateAvgResponseTime() {
        if (this.metrics.responseTimes.length === 0) {
            return 0;
        }
        const sum = this.metrics.responseTimes.reduce((a, b) => a + b, 0);
        return sum / this.metrics.responseTimes.length;
    }
}
