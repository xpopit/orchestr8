import { promises as fs } from "fs";
import { join } from "path";
import { LRUCache } from "lru-cache";
import matter from "gray-matter";
import { URIParser } from "../utils/uriParser.js";
import { FuzzyMatcher } from "../utils/fuzzyMatcher.js";
import { IndexLookup } from "../utils/indexLookup.js";
import { ProviderRegistry } from "../providers/registry.js";
import { LocalProvider } from "../providers/local.js";
import { AITMPLProvider } from "../providers/aitmpl.js";
import { GitHubProvider } from "../providers/github.js";
import { ProviderConfigManager } from "../config/providers.js";
import { ConfigLoader } from "../config/loader.js";
export class ResourceLoader {
    logger;
    resourcesPath;
    cache;
    uriParser;
    fuzzyMatcher;
    indexLookup;
    resourceIndex = null;
    indexLoadPromise = null;
    registry;
    providerConfigManager = null;
    tokenTracker = null;
    tokenStore = null;
    constructor(logger, tokenTracker, tokenStore) {
        this.logger = logger;
        this.resourcesPath =
            process.env.RESOURCES_PATH || join(process.cwd(), "resources");
        const cacheSize = parseInt(process.env.CACHE_SIZE || "200", 10);
        this.cache = new LRUCache({
            max: cacheSize,
            ttl: 1000 * 60 * 60 * 4,
            updateAgeOnGet: true,
        });
        this.uriParser = new URIParser();
        this.fuzzyMatcher = new FuzzyMatcher();
        this.indexLookup = new IndexLookup(this.resourcesPath);
        this.registry = new ProviderRegistry({
            enableHealthChecks: true,
            healthCheckInterval: 60000,
            autoDisableUnhealthy: true,
            maxConsecutiveFailures: 3,
            enableEvents: true,
        });
        this.tokenTracker = tokenTracker || null;
        this.tokenStore = tokenStore || null;
        this.logger.debug(`Resource loader initialized with path: ${this.resourcesPath}`);
    }
    async loadAllResources() {
        const resources = [];
        try {
            await this.scanDirectory("examples", "orchestr8://examples", resources);
            await this.scanDirectory("patterns", "orchestr8://patterns", resources);
            await this.scanDirectory("guides", "orchestr8://guides", resources);
            await this.scanDirectory("workflows", "orchestr8://workflows", resources);
            await this.scanDirectory("agents", "orchestr8://agents", resources);
            await this.scanDirectory("skills", "orchestr8://skills", resources);
        }
        catch (error) {
            this.logger.error("Error loading resources:", error);
            return [];
        }
        return resources;
    }
    async initializeProviders() {
        this.logger.info("Initializing resource providers");
        try {
            const configLoader = new ConfigLoader(this.logger);
            this.providerConfigManager = new ProviderConfigManager(this.logger, configLoader);
            await this.providerConfigManager.initialize();
            const validation = this.providerConfigManager.validateConfiguration();
            if (!validation.valid) {
                this.logger.warn("Provider configuration has issues:", validation.warnings);
            }
            if (validation.errors.length > 0) {
                this.logger.error("Provider configuration errors:", validation.errors);
            }
            this.logger.info("Initializing LocalProvider");
            const localProvider = new LocalProvider({ resourcesPath: this.resourcesPath }, this.logger);
            await this.registry.register(localProvider);
            this.logger.info("LocalProvider registered successfully");
            const aitmplConfig = this.providerConfigManager.getAitmplConfig();
            if (aitmplConfig.enabled) {
                this.logger.info("Initializing AITMPLProvider");
                try {
                    const aitmplProvider = new AITMPLProvider(aitmplConfig, this.logger);
                    await this.registry.register(aitmplProvider);
                    this.logger.info("AITMPLProvider registered successfully");
                }
                catch (error) {
                    this.logger.error("Failed to initialize AITMPLProvider:", error);
                }
            }
            else {
                this.logger.debug("AITMPLProvider is disabled in configuration");
            }
            const githubConfig = this.providerConfigManager.getGithubConfig();
            if (githubConfig.enabled) {
                this.logger.info("Initializing GitHubProvider");
                try {
                    const githubProvider = new GitHubProvider(githubConfig, this.logger);
                    await this.registry.register(githubProvider);
                    this.logger.info("GitHubProvider registered successfully");
                }
                catch (error) {
                    this.logger.error("Failed to initialize GitHubProvider:", error);
                }
            }
            else {
                this.logger.debug("GitHubProvider is disabled in configuration");
            }
            const registeredProviders = this.registry.getProviders();
            this.logger.info(`Provider initialization complete. Registered ${registeredProviders.length} providers:`, registeredProviders.map((p) => p.name));
            const healthStatuses = await this.registry.checkAllHealth();
            for (const [name, health] of healthStatuses.entries()) {
                this.logger.info(`Provider ${name} health: ${health.status}`);
            }
        }
        catch (error) {
            this.logger.error("Failed to initialize providers:", error);
            this.logger.warn("Continuing with local filesystem access only");
        }
    }
    async scanDirectory(relativePath, uriPrefix, resources) {
        const fullPath = join(this.resourcesPath, relativePath);
        try {
            await fs.access(fullPath);
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            for (const entry of entries) {
                const entryPath = join(relativePath, entry.name);
                const uri = `${uriPrefix}/${entry.name.replace(/\.(md|json|yaml)$/, "")}`;
                if (entry.isDirectory()) {
                    await this.scanDirectory(entryPath, uri, resources);
                }
                else if (entry.name.endsWith(".md") ||
                    entry.name.endsWith(".json") ||
                    entry.name.endsWith(".yaml")) {
                    const mimeType = entry.name.endsWith(".json")
                        ? "application/json"
                        : entry.name.endsWith(".yaml")
                            ? "application/yaml"
                            : "text/markdown";
                    resources.push({
                        uri,
                        name: entry.name.replace(/\.(md|json|yaml)$/, ""),
                        description: `Resource: ${uri}`,
                        mimeType,
                        category: relativePath.split("/")[0],
                    });
                }
            }
        }
        catch (error) {
            this.logger.warn(`Resource directory not found: ${fullPath}`);
        }
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
        this.indexLoadPromise = this._loadResourceIndexImpl();
        try {
            this.resourceIndex = await this.indexLoadPromise;
            this.logger.info(`Resource index loaded with ${this.resourceIndex.length} fragments`);
            return this.resourceIndex;
        }
        finally {
            this.indexLoadPromise = null;
        }
    }
    async _loadResourceIndexImpl() {
        try {
            const categories = [
                "agents",
                "skills",
                "examples",
                "patterns",
                "guides",
                "workflows",
            ];
            const categoryPromises = categories.map(async (category) => {
                const categoryPath = join(this.resourcesPath, category);
                const categoryFragments = [];
                try {
                    await fs.access(categoryPath);
                    await this._scanForFragments(categoryPath, category, category, categoryFragments);
                }
                catch (error) {
                    this.logger.debug(`Category directory not found: ${category}`);
                }
                return categoryFragments;
            });
            const fragmentArrays = await Promise.all(categoryPromises);
            const fragments = fragmentArrays.flat();
            this.fuzzyMatcher.setResourceIndex(fragments);
            return fragments;
        }
        catch (error) {
            this.logger.error("Error loading resource index:", error);
            return [];
        }
    }
    async _scanForFragments(dirPath, category, relativePath, fragments) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dirPath, entry.name);
            const newRelativePath = join(relativePath, entry.name);
            if (entry.isDirectory()) {
                await this._scanForFragments(fullPath, category, newRelativePath, fragments);
            }
            else if (entry.name.endsWith(".md")) {
                try {
                    const content = await fs.readFile(fullPath, "utf-8");
                    const fragment = await this._parseResourceFragment(content, category, newRelativePath);
                    fragments.push(fragment);
                    this.logger.debug(`Parsed fragment: ${fragment.id}`);
                }
                catch (error) {
                    this.logger.warn(`Failed to parse resource: ${fullPath}`, error);
                }
            }
        }
    }
    async _parseResourceFragment(content, category, relativePath) {
        const parsed = matter(content);
        const frontmatter = parsed.data;
        const body = parsed.content;
        const tags = this._extractTags(frontmatter, body);
        const capabilities = this._extractCapabilities(frontmatter, body);
        const useWhen = this._extractUseWhen(frontmatter, body);
        const estimatedTokens = Math.ceil(body.length / 4);
        const id = relativePath.replace(/\.md$/, "").replace(/\\/g, "/");
        const fragmentCategory = this._mapCategory(category);
        return {
            id,
            category: fragmentCategory,
            tags,
            capabilities,
            useWhen,
            estimatedTokens,
            content: body,
        };
    }
    _extractTags(frontmatter, content) {
        if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
            return frontmatter.tags.map((tag) => String(tag).toLowerCase());
        }
        const tags = new Set();
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
            const words = titleMatch[1]
                .toLowerCase()
                .replace(/[^\w\s-]/g, "")
                .split(/\s+/);
            words.forEach((word) => {
                if (word.length > 2)
                    tags.add(word);
            });
        }
        const keywords = [
            "typescript",
            "javascript",
            "node",
            "react",
            "api",
            "rest",
            "graphql",
            "database",
            "sql",
            "testing",
            "async",
            "error",
            "security",
            "auth",
            "validation",
        ];
        keywords.forEach((keyword) => {
            if (content.toLowerCase().includes(keyword)) {
                tags.add(keyword);
            }
        });
        return Array.from(tags);
    }
    _extractCapabilities(frontmatter, content) {
        if (frontmatter.capabilities && Array.isArray(frontmatter.capabilities)) {
            return frontmatter.capabilities.map((cap) => String(cap));
        }
        const capabilities = [];
        const capabilitiesMatch = content.match(/##\s*(?:Core\s+)?Capabilities\s*\n([\s\S]*?)(?=\n##|\n#\s|$)/i);
        if (capabilitiesMatch) {
            const capSection = capabilitiesMatch[1];
            const bullets = capSection.match(/^[-*]\s+(.+)$/gm);
            if (bullets) {
                bullets.forEach((bullet) => {
                    const cap = bullet.replace(/^[-*]\s+/, "").trim();
                    if (cap)
                        capabilities.push(cap);
                });
            }
        }
        return capabilities;
    }
    _extractUseWhen(frontmatter, content) {
        if (frontmatter.useWhen && Array.isArray(frontmatter.useWhen)) {
            return frontmatter.useWhen.map((use) => String(use));
        }
        const useWhen = [];
        const useWhenMatch = content.match(/##\s*(?:When to Use|When This (?:Agent|Skill) (?:Applies|Is Used))\s*\n([\s\S]*?)(?=\n##|\n#\s|$)/i);
        if (useWhenMatch) {
            const useSection = useWhenMatch[1];
            const bullets = useSection.match(/^[-*]\s+(.+)$/gm);
            if (bullets) {
                bullets.forEach((bullet) => {
                    const use = bullet.replace(/^[-*]\s+/, "").trim();
                    if (use)
                        useWhen.push(use);
                });
            }
        }
        return useWhen;
    }
    _mapCategory(category) {
        const normalized = category.toLowerCase().split("/")[0];
        switch (normalized) {
            case "agents":
                return "agent";
            case "skills":
                return "skill";
            case "examples":
                return "example";
            case "workflows":
                return "workflow";
            case "patterns":
            case "guides":
                return "pattern";
            default:
                return "pattern";
        }
    }
    async loadResourceContent(uri) {
        if (this.cache.has(uri)) {
            this.logger.debug(`Cache hit for resource: ${uri}`);
            return this.cache.get(uri);
        }
        try {
            if (uri === "orchestr8://registry") {
                this.logger.debug("Generating registry catalog");
                await this.ensureIndexLoaded();
                const resources = this.resourceIndex || [];
                const catalog = {
                    version: "1.0.0",
                    totalResources: resources.length,
                    categories: {
                        agents: resources.filter((r) => r.category === "agent").length,
                        skills: resources.filter((r) => r.category === "skill").length,
                        patterns: resources.filter((r) => r.category === "pattern").length,
                        examples: resources.filter((r) => r.category === "example").length,
                        workflows: resources.filter((r) => r.category === "workflow")
                            .length,
                    },
                    searchUri: "@orchestr8://match?query=<keywords>&mode=index&maxResults=5",
                    usage: "Use @orchestr8://match?query=... for resource discovery. Default mode is 'index' for optimal efficiency.",
                };
                const content = JSON.stringify(catalog, null, 2);
                this.cache.set(uri, content);
                return content;
            }
            if (uri.startsWith("aitmpl://")) {
                this.logger.debug(`Routing to AITMPL provider: ${uri}`);
                const [_, pathPart] = uri.split("aitmpl://");
                const [categoryPart, ...resourceIdParts] = pathPart.split("/");
                const resourceId = resourceIdParts.join("/");
                const categorySingular = categoryPart === "agents"
                    ? "agent"
                    : categoryPart === "skills"
                        ? "skill"
                        : categoryPart === "examples"
                            ? "example"
                            : categoryPart === "patterns"
                                ? "pattern"
                                : categoryPart === "workflows"
                                    ? "workflow"
                                    : categoryPart;
                try {
                    const resource = await this.registry.fetchResource("aitmpl", resourceId, categorySingular);
                    this.cache.set(uri, resource.content);
                    return resource.content;
                }
                catch (error) {
                    this.logger.error(`Failed to fetch from AITMPL provider: ${uri}`, error);
                    throw error;
                }
            }
            if (uri.startsWith("github://")) {
                this.logger.debug(`Routing to GitHub provider: ${uri}`);
                const [_, fullPath] = uri.split("github://");
                const pathParts = fullPath.split("/");
                if (pathParts.length < 3) {
                    throw new Error(`Invalid GitHub URI format: ${uri}. Expected github://owner/repo/category/path`);
                }
                const owner = pathParts[0];
                const repo = pathParts[1];
                const category = pathParts[2];
                const resourcePath = pathParts.slice(2).join("/");
                const resourceId = `${owner}/${repo}/${resourcePath}`;
                try {
                    const resource = await this.registry.fetchResource("github", resourceId, category);
                    this.cache.set(uri, resource.content);
                    return resource.content;
                }
                catch (error) {
                    this.logger.error(`Failed to fetch from GitHub provider: ${uri}`, error);
                    throw error;
                }
            }
            const parsed = this.uriParser.parse(uri);
            if (parsed.type === "static") {
                return await this._loadStaticResource(uri, parsed);
            }
            else {
                return await this._loadDynamicResource(uri, parsed);
            }
        }
        catch (error) {
            this.logger.error(`Error loading resource content for ${uri}:`, error);
            throw error;
        }
    }
    async _loadStaticResource(uri, parsed) {
        const filePath = this.uriToFilePath(uri);
        const content = await fs.readFile(filePath, "utf-8");
        this.cache.set(uri, content);
        this.logger.debug(`Cached static resource content: ${uri}`);
        return content;
    }
    async _loadDynamicResource(uri, parsed) {
        this.logger.info(`Dynamic resource request: ${uri}`);
        const useIndexLookup = parsed.matchParams.mode !== "catalog" &&
            parsed.matchParams.mode !== "full";
        if (useIndexLookup) {
            this.logger.debug("Using index-based lookup");
            try {
                const result = await this.indexLookup.lookup(parsed.matchParams.query, {
                    query: parsed.matchParams.query,
                    maxResults: parsed.matchParams.maxResults || 5,
                    minScore: parsed.matchParams.minScore || 50,
                    categories: parsed.matchParams.categories,
                    mode: parsed.matchParams.mode,
                });
                this.cache.set(uri, result);
                return result;
            }
            catch (error) {
                this.logger.warn("Index lookup failed, falling back to fuzzy match", error);
            }
        }
        this.logger.debug("Using fuzzy match");
        await this.loadResourceIndex();
        const matchResult = await this.fuzzyMatcher.match({
            query: parsed.matchParams.query,
            maxTokens: parsed.matchParams.maxTokens,
            requiredTags: parsed.matchParams.tags,
            category: parsed.category,
            categories: parsed.matchParams.categories,
            mode: parsed.matchParams.mode || "catalog",
            maxResults: parsed.matchParams.maxResults,
            minScore: parsed.matchParams.minScore,
        });
        if (this.tokenTracker && this.tokenStore) {
            const messageId = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            const wasCached = this.cache.has(uri);
            const tokenUsage = this.tokenTracker.track(messageId, {
                input_tokens: matchResult.totalTokens,
                output_tokens: 0,
                cache_creation_input_tokens: wasCached ? 0 : matchResult.totalTokens,
                cache_read_input_tokens: wasCached ? matchResult.totalTokens : 0,
            }, {
                category: parsed.category,
                resourceUri: uri,
                resourceCount: matchResult.fragments.length,
            });
            if (tokenUsage) {
                this.tokenStore.saveUsage(tokenUsage);
                this.logger.debug(`Token usage tracked: ${tokenUsage.totalTokens} tokens, ${tokenUsage.efficiencyPercentage.toFixed(1)}% efficient`);
            }
        }
        this.cache.set(uri, matchResult.assembledContent);
        this.logger.info(`Assembled ${matchResult.fragments.length} fragments (${matchResult.totalTokens} tokens)`);
        return matchResult.assembledContent;
    }
    uriToFilePath(uri) {
        const pathPart = uri.replace("orchestr8://", "");
        const extensions = [".md", ".json", ".yaml"];
        for (const ext of extensions) {
            const filePath = join(this.resourcesPath, pathPart + ext);
            return filePath;
        }
        return join(this.resourcesPath, pathPart + ".md");
    }
    async getResourcesByCategory(category) {
        await this.ensureIndexLoaded();
        if (!this.resourceIndex) {
            return [];
        }
        const normalizedCategory = category.endsWith("s")
            ? category.slice(0, -1)
            : category;
        return this.resourceIndex
            .filter((fragment) => fragment.category === normalizedCategory)
            .map((fragment) => ({
            id: fragment.id,
            name: fragment.id,
            uri: `orchestr8://${fragment.id}`,
            description: fragment.capabilities?.slice(0, 3).join(", ") || "No description",
            tags: fragment.tags || [],
            capabilities: fragment.capabilities || [],
            tokens: fragment.estimatedTokens,
        }));
    }
    async searchResources(query) {
        await this.ensureIndexLoaded();
        if (!this.resourceIndex) {
            return [];
        }
        const lowerQuery = query.toLowerCase();
        return this.resourceIndex
            .filter((fragment) => {
            const idMatch = fragment.id.toLowerCase().includes(lowerQuery);
            const tagMatch = fragment.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery));
            const capMatch = fragment.capabilities?.some((cap) => cap.toLowerCase().includes(lowerQuery));
            return idMatch || tagMatch || capMatch;
        })
            .map((fragment) => ({
            id: fragment.id,
            uri: `orchestr8://${fragment.id}`,
            category: fragment.category,
            tags: fragment.tags || [],
            capabilities: fragment.capabilities || [],
            tokens: fragment.estimatedTokens,
        }))
            .slice(0, 50);
    }
    async searchAllProviders(query, options) {
        this.logger.info(`Searching all providers for: ${query}`);
        try {
            const searchResponse = await this.registry.searchAll(query, options);
            this.logger.info(`Found ${searchResponse.totalMatches} matches across all providers (returned ${searchResponse.results.length})`);
            return searchResponse.results;
        }
        catch (error) {
            this.logger.error("Failed to search across providers:", error);
            this.logger.warn("Falling back to local search only");
            return [];
        }
    }
    async searchProvider(providerName, query, options) {
        this.logger.info(`Searching ${providerName} provider for: ${query}`);
        try {
            const searchResponse = await this.registry.search(providerName, query, options);
            this.logger.info(`Found ${searchResponse.totalMatches} matches in ${providerName} (returned ${searchResponse.results.length})`);
            return searchResponse.results;
        }
        catch (error) {
            this.logger.error(`Failed to search ${providerName} provider:`, error);
            return [];
        }
    }
    async getProvidersHealth() {
        this.logger.debug("Checking health of all providers");
        try {
            const healthMap = await this.registry.checkAllHealth();
            const healthObj = {};
            for (const [name, health] of healthMap.entries()) {
                healthObj[name] = health;
            }
            return healthObj;
        }
        catch (error) {
            this.logger.error("Failed to check provider health:", error);
            return {};
        }
    }
    getProvidersStats() {
        this.logger.debug("Getting statistics for all providers");
        try {
            const providers = this.registry.getProviders();
            const statsObj = {};
            for (const provider of providers) {
                statsObj[provider.name] = provider.getStats();
            }
            return statsObj;
        }
        catch (error) {
            this.logger.error("Failed to get provider statistics:", error);
            return {};
        }
    }
    getAggregateProviderStats() {
        try {
            return this.registry.getAggregateStats();
        }
        catch (error) {
            this.logger.error("Failed to get aggregate provider statistics:", error);
            return {
                totalProviders: 0,
                enabledProviders: 0,
                healthyProviders: 0,
                aggregate: {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    totalResourcesFetched: 0,
                    totalTokensFetched: 0,
                    avgResponseTime: 0,
                },
            };
        }
    }
    getProviderNames(enabledOnly = false) {
        const providers = this.registry.getProviders(enabledOnly);
        return providers.map((p) => p.name);
    }
    getCachedResource(uri) {
        return this.cache.get(uri);
    }
    async getProviders() {
        const providers = this.registry.getProviders();
        return Promise.all(providers.map(async (provider) => ({
            name: provider.name,
            enabled: provider.enabled,
            priority: provider.priority,
            health: await provider.healthCheck(),
            stats: provider.getStats(),
        })));
    }
    async getProviderIndex(name) {
        return this.registry.fetchIndex(name);
    }
    async getProviderHealth(name) {
        return this.registry.checkHealth(name);
    }
    getProviderStats(name) {
        return this.registry.getProviderStats(name);
    }
    async enableProvider(name) {
        const success = this.registry.enable(name);
        if (!success) {
            throw new Error(`Provider ${name} not found`);
        }
    }
    async disableProvider(name) {
        const success = this.registry.disable(name);
        if (!success) {
            throw new Error(`Provider ${name} not found`);
        }
    }
    async ensureIndexLoaded() {
        if (this.resourceIndex) {
            return;
        }
        if (this.indexLoadPromise) {
            await this.indexLoadPromise;
            return;
        }
        this.indexLoadPromise = this.loadResourceIndex();
        await this.indexLoadPromise;
    }
}
