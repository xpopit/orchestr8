#!/usr/bin/env node
import { McpServer, ResourceTemplate, } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PromptLoader } from "./loaders/promptLoader.js";
import { ResourceLoader } from "./loaders/resourceLoader.js";
import { Logger } from "./utils/logger.js";
import { StatsCollector } from "./stats/collector.js";
import { HTTPTransport } from "./transports/http.js";
import { createTokenSystem } from "./token/index.js";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
if (process.env.NODE_ENV !== "test") {
    dotenv.config();
}
else {
    const originalWrite = process.stdout.write;
    process.stdout.write = () => true;
    dotenv.config();
    process.stdout.write = originalWrite;
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logger = new Logger("orchestr8-mcp");
const HTTP_MODE = process.env.ORCHESTR8_HTTP === "true" || process.env.ORCHESTR8_HTTP === "1";
const HTTP_PORT = parseInt(process.env.ORCHESTR8_HTTP_PORT || "1337", 10);
class Orchestr8Server {
    server;
    promptLoader;
    resourceLoader;
    stats;
    httpTransport = null;
    tokenTracker;
    tokenStore;
    tokenMetrics;
    efficiencyEngine;
    constructor() {
        this.server = new McpServer({
            name: "orchestr8",
            version: "1.0.0",
        });
        this.promptLoader = new PromptLoader(logger);
        this.resourceLoader = null;
        this.stats = null;
    }
    async initialize() {
        logger.info("Starting orchestr8 MCP server v1.0.0");
        logger.info("Initializing token efficiency monitoring...");
        const tokenSystem = createTokenSystem({
            tracking: {
                enabled: true,
                baselineStrategy: "no_jit",
                deduplication: true,
                retentionDays: 7,
                enableTrends: true,
            },
            storage: {
                maxRecords: 10000,
                retentionDays: 7,
                autoCleanup: true,
                cleanupIntervalMs: 60 * 60 * 1000,
            },
        });
        this.tokenTracker = tokenSystem.tracker;
        this.tokenStore = tokenSystem.store;
        this.tokenMetrics = tokenSystem.metrics;
        this.efficiencyEngine = tokenSystem.efficiency;
        logger.info("Token efficiency monitoring initialized");
        this.stats = new StatsCollector(this.tokenMetrics);
        this.resourceLoader = new ResourceLoader(logger, this.tokenTracker, this.tokenStore);
        const prompts = await this.promptLoader.loadAllPrompts();
        const resources = await this.resourceLoader.loadAllResources();
        logger.info(`Loaded ${prompts.length} prompts`);
        logger.info(`Loaded ${resources.length} resources`);
        try {
            await this.resourceLoader.loadResourceIndex();
            logger.info("Resource index pre-loaded for dynamic matching");
        }
        catch (error) {
            logger.warn("Failed to pre-load resource index, will load on-demand:", error);
        }
        try {
            await this.resourceLoader.initializeProviders();
            logger.info("Provider system initialized successfully");
        }
        catch (error) {
            logger.error("Failed to initialize provider system:", error);
            logger.warn("Continuing with local resources only");
        }
        this.registerPrompts(prompts);
        this.registerResources(resources);
        this.registerDynamicTemplates();
        if (process.env.NODE_ENV !== "production") {
            this.promptLoader.watchForChanges(() => {
                logger.info("Prompts changed - restart server to reload");
            });
        }
    }
    registerPrompts(prompts) {
        for (const prompt of prompts) {
            const argsSchema = {};
            if (prompt.arguments && prompt.arguments.length > 0) {
                for (const arg of prompt.arguments) {
                    const zodType = arg.required ? z.string() : z.string().optional();
                    argsSchema[arg.name] = zodType;
                }
            }
            this.server.registerPrompt(prompt.name, {
                title: prompt.title,
                description: prompt.description,
                argsSchema: Object.keys(argsSchema).length > 0 ? argsSchema : undefined,
            }, async (args, _extra) => {
                const startTime = Date.now();
                logger.debug(`Loading prompt: ${prompt.name}`);
                this.stats.logActivity("prompt_get", {
                    name: prompt.name,
                    args: args,
                });
                try {
                    const argValues = args || {};
                    const content = await this.promptLoader.loadPromptContent(prompt, argValues);
                    const latency = Date.now() - startTime;
                    this.stats.trackRequest(`prompt:${prompt.name}`, latency);
                    return {
                        messages: [
                            {
                                role: "user",
                                content: {
                                    type: "text",
                                    text: content,
                                },
                            },
                        ],
                    };
                }
                catch (error) {
                    this.stats.trackError(error);
                    throw error;
                }
            });
        }
    }
    registerResources(resources) {
        this.registerResourceRegistry(resources);
        this.registerAggregateListResources(resources);
        this.registerIndividualResources(resources);
    }
    registerResourceRegistry(resources) {
        this.server.registerResource("resource-registry", "orchestr8://registry", {
            mimeType: "application/json",
            description: "Lightweight resource catalog for discovery",
        }, async () => {
            this.stats.logActivity("resource_read", {
                uri: "orchestr8://registry",
                category: "registry",
            });
            const catalog = {
                version: "1.0.0",
                totalResources: resources.length,
                categories: {
                    agents: resources.filter((r) => r.category === "agents").length,
                    skills: resources.filter((r) => r.category === "skills").length,
                    patterns: resources.filter((r) => r.category === "patterns").length,
                    examples: resources.filter((r) => r.category === "examples").length,
                    guides: resources.filter((r) => r.category === "guides").length,
                    workflows: resources.filter((r) => r.category === "workflows")
                        .length,
                },
                searchUri: "@orchestr8://match?query=<keywords>&mode=index&maxResults=5",
                usage: "Use @orchestr8://match?query=... for resource discovery. Default mode is 'index' for optimal efficiency.",
            };
            return {
                contents: [
                    {
                        uri: "orchestr8://registry",
                        mimeType: "application/json",
                        text: JSON.stringify(catalog, null, 2),
                    },
                ],
            };
        });
        logger.debug(`Registered resource registry with ${resources.length} total resources`);
    }
    registerAggregateListResources(resources) {
        const byCategory = resources.reduce((acc, resource) => {
            const category = resource.category || "other";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(resource);
            return acc;
        }, {});
        const categories = [
            {
                name: "workflows",
                description: "Complete list of all available workflows",
            },
            { name: "agents", description: "Complete list of all available agents" },
            { name: "skills", description: "Complete list of all available skills" },
            {
                name: "patterns",
                description: "Complete list of all available patterns",
            },
            {
                name: "examples",
                description: "Complete list of all available examples",
            },
            { name: "guides", description: "Complete list of all available guides" },
        ];
        for (const { name, description } of categories) {
            const categoryResources = byCategory[name] || [];
            const aggregateUri = `orchestr8://${name}`;
            this.server.registerResource(`${name}-list`, aggregateUri, {
                mimeType: "application/json",
                description: description,
            }, async (uri) => {
                const startTime = Date.now();
                logger.debug(`Loading aggregate list: ${aggregateUri}`);
                this.stats.logActivity("resources_list", {
                    category: name,
                    count: categoryResources.length,
                });
                try {
                    const resourceList = categoryResources.map((r) => ({
                        name: r.name,
                        uri: r.uri,
                        description: r.description,
                        mimeType: r.mimeType,
                    }));
                    const jsonContent = JSON.stringify({
                        category: name,
                        count: resourceList.length,
                        resources: resourceList,
                    }, null, 2);
                    const latency = Date.now() - startTime;
                    this.stats.trackRequest(`aggregate:${name}`, latency);
                    return {
                        contents: [
                            {
                                uri: uri.toString(),
                                mimeType: "application/json",
                                text: jsonContent,
                            },
                        ],
                    };
                }
                catch (error) {
                    this.stats.trackError(error);
                    throw error;
                }
            });
            logger.debug(`Registered aggregate list resource: ${aggregateUri}`);
        }
    }
    registerIndividualResources(resources) {
        logger.info(`Registering ${resources.length} individual resources for discovery`);
        for (const resource of resources) {
            this.server.registerResource(resource.uri, resource.uri, {
                mimeType: resource.mimeType,
                description: resource.description,
            }, async (uri) => {
                const startTime = Date.now();
                logger.debug(`Loading individual resource: ${uri.toString()}`);
                this.stats.logActivity("resource_read", {
                    uri: uri.toString(),
                    category: resource.category,
                });
                try {
                    const content = await this.resourceLoader.loadResourceContent(uri.toString());
                    const latency = Date.now() - startTime;
                    this.stats.trackRequest(`individual:${resource.category}`, latency);
                    return {
                        contents: [
                            {
                                uri: uri.toString(),
                                mimeType: resource.mimeType,
                                text: content,
                            },
                        ],
                    };
                }
                catch (error) {
                    this.stats.trackError(error);
                    throw error;
                }
            });
        }
        logger.info(`Successfully registered ${resources.length} individual resources`);
    }
    registerDynamicTemplates() {
        const dynamicCategories = [
            {
                category: "agents",
                description: "Dynamic agent matching - finds and assembles relevant agent resources based on query",
            },
            {
                category: "skills",
                description: "Dynamic skill matching - finds and assembles relevant skill resources based on query",
            },
            {
                category: "examples",
                description: "Dynamic example matching - finds and assembles relevant example resources based on query",
            },
            {
                category: "patterns",
                description: "Dynamic pattern matching - finds and assembles relevant pattern resources based on query",
            },
            {
                category: "guides",
                description: "Dynamic guide matching - finds and assembles relevant guide resources based on query",
            },
            {
                category: "best-practices",
                description: "Dynamic best practice matching - finds and assembles relevant best practice resources based on query",
            },
            {
                category: "workflows",
                description: "Dynamic workflow matching - finds and assembles relevant workflow resources based on query",
            },
        ];
        for (const { category, description } of dynamicCategories) {
            const dynamicTemplateUri = `orchestr8://${category}/match{+rest}`;
            this.server.registerResource(`${category}-dynamic`, new ResourceTemplate(dynamicTemplateUri, { list: undefined }), {
                mimeType: "text/markdown",
                description: description,
            }, async (uri, params) => {
                const startTime = Date.now();
                const fullUri = uri.toString();
                logger.debug(`Loading dynamic resource: ${fullUri}`);
                this.stats.logActivity("resource_read", {
                    uri: fullUri,
                    category: category,
                });
                try {
                    const content = await this.resourceLoader.loadResourceContent(fullUri);
                    const latency = Date.now() - startTime;
                    this.stats.trackRequest(`dynamic:${category}`, latency);
                    return {
                        contents: [
                            {
                                uri: fullUri,
                                mimeType: "text/markdown",
                                text: content,
                            },
                        ],
                    };
                }
                catch (error) {
                    this.stats.trackError(error);
                    throw error;
                }
            });
            logger.debug(`Registered dynamic resource template: ${dynamicTemplateUri}`);
            const staticTemplateUri = `orchestr8://${category}/{+resourceId}`;
            this.server.registerResource(`${category}-static`, new ResourceTemplate(staticTemplateUri, { list: undefined }), {
                mimeType: "text/markdown",
                description: `Access individual ${category} resources by ID`,
            }, async (uri, params) => {
                const startTime = Date.now();
                const fullUri = uri.toString();
                if (fullUri.includes("/match")) {
                    throw new Error(`URI ${fullUri} should be handled by dynamic template`);
                }
                logger.debug(`Loading static resource: ${fullUri}`);
                this.stats.logActivity("resource_read", {
                    uri: fullUri,
                    category: category,
                });
                try {
                    const content = await this.resourceLoader.loadResourceContent(fullUri);
                    const latency = Date.now() - startTime;
                    this.stats.trackRequest(`static:${category}`, latency);
                    return {
                        contents: [
                            {
                                uri: fullUri,
                                mimeType: "text/markdown",
                                text: content,
                            },
                        ],
                    };
                }
                catch (error) {
                    this.stats.trackError(error);
                    throw error;
                }
            });
            logger.debug(`Registered static resource template: ${staticTemplateUri}`);
        }
        const globalTemplateUri = "orchestr8://match{+rest}";
        this.server.registerResource("global-dynamic", new ResourceTemplate(globalTemplateUri, { list: undefined }), {
            mimeType: "text/markdown",
            description: "Dynamic resource matching across all categories",
        }, async (uri, params) => {
            const startTime = Date.now();
            const fullUri = uri.toString();
            logger.debug(`Loading global dynamic resource: ${fullUri}`);
            this.stats.logActivity("resource_read", {
                uri: fullUri,
                category: "global",
            });
            try {
                const content = await this.resourceLoader.loadResourceContent(fullUri);
                const latency = Date.now() - startTime;
                this.stats.trackRequest("dynamic:global", latency);
                return {
                    contents: [
                        {
                            uri: fullUri,
                            mimeType: "text/markdown",
                            text: content,
                        },
                    ],
                };
            }
            catch (error) {
                this.stats.trackError(error);
                throw error;
            }
        });
        logger.debug(`Registered global dynamic resource template: ${globalTemplateUri}`);
    }
    async startStdio() {
        logger.info("Starting in stdio mode (Claude Desktop integration)");
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info("orchestr8 MCP server started successfully in stdio mode");
    }
    async startHttp() {
        logger.info(`Starting in HTTP mode on port ${HTTP_PORT}`);
        const mcpInterface = {
            handleRequest: async (method, params) => {
                throw new Error("Direct MCP request handling not yet implemented");
            },
            getAvailableAgents: async () => {
                return this.resourceLoader.getResourcesByCategory("agents");
            },
            getAvailableSkills: async () => {
                return this.resourceLoader.getResourcesByCategory("skills");
            },
            getAvailableWorkflows: async () => {
                return this.resourceLoader.getResourcesByCategory("workflows");
            },
            getAvailablePatterns: async () => {
                return this.resourceLoader.getResourcesByCategory("patterns");
            },
            searchResources: async (query) => {
                return this.resourceLoader.searchResources(query);
            },
            getResourceContent: async (uri) => {
                return this.resourceLoader.loadResourceContent(uri);
            },
            getProviderNames: () => {
                return this.resourceLoader.getProviderNames(true);
            },
            getProvidersHealth: async () => {
                return this.resourceLoader.getProvidersHealth();
            },
            getProvidersStats: () => {
                return this.resourceLoader.getProvidersStats();
            },
            getAggregateProviderStats: () => {
                return this.resourceLoader.getAggregateProviderStats();
            },
            searchAllProviders: async (query, options) => {
                return this.resourceLoader.searchAllProviders(query, options);
            },
            searchProvider: async (providerName, query, options) => {
                return this.resourceLoader.searchProvider(providerName, query, options);
            },
            getProviders: async () => {
                return this.resourceLoader.getProviders();
            },
            getProviderIndex: async (name) => {
                return this.resourceLoader.getProviderIndex(name);
            },
            getProviderHealth: async (name) => {
                return this.resourceLoader.getProviderHealth(name);
            },
            getAllProvidersHealth: async () => {
                return this.resourceLoader.getProvidersHealth();
            },
            getProviderStats: (name) => {
                return this.resourceLoader.getProviderStats(name);
            },
            enableProvider: async (name) => {
                return this.resourceLoader.enableProvider(name);
            },
            disableProvider: async (name) => {
                return this.resourceLoader.disableProvider(name);
            },
            tokenSystem: {
                tracker: this.tokenTracker,
                store: this.tokenStore,
                metrics: this.tokenMetrics,
                efficiency: this.efficiencyEngine,
            },
        };
        this.httpTransport = new HTTPTransport({
            port: HTTP_PORT,
            staticPath: path.join(__dirname, "web", "static"),
            enableCORS: true,
        }, mcpInterface, this.stats);
        await this.httpTransport.start();
        this.stats.logActivity("server_start", {
            mode: "HTTP",
            port: HTTP_PORT,
            timestamp: Date.now(),
        });
        logger.info(`orchestr8 MCP server started successfully in HTTP mode`);
        logger.info(`Web UI available at: http://localhost:${HTTP_PORT}`);
    }
    async startDual() {
        logger.info("Starting in dual mode (stdio + HTTP)");
        const stdioTransport = new StdioServerTransport();
        await this.server.connect(stdioTransport);
        logger.info("stdio transport ready");
        await this.startHttp();
        logger.info("orchestr8 MCP server started successfully in dual mode");
    }
    async shutdown() {
        logger.info("Shutting down orchestr8 MCP server");
        if (this.httpTransport) {
            await this.httpTransport.stop();
        }
        await this.server.close();
    }
}
async function main() {
    try {
        const orchestr8 = new Orchestr8Server();
        await orchestr8.initialize();
        if (HTTP_MODE) {
            await orchestr8.startHttp();
        }
        else if (process.env.NODE_ENV === "test") {
            await orchestr8.startStdio();
        }
        else {
            await orchestr8.startDual();
        }
        const shutdown = async () => {
            await orchestr8.shutdown();
            process.exit(0);
        };
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    }
    catch (error) {
        logger.error("Failed to start server:", error);
        process.exit(1);
    }
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
