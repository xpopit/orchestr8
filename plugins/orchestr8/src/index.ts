#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PromptLoader } from "./loaders/promptLoader.js";
import { ResourceLoader } from "./loaders/resourceLoader.js";
import { Logger } from "./utils/logger.js";
import { StatsCollector } from "./stats/collector.js";
import { HTTPTransport } from "./transports/http.js";
import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Get current file directory for static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize logger (writes to stderr to avoid corrupting MCP protocol)
const logger = new Logger("orchestr8-mcp");

// Check if HTTP mode is enabled via environment variable
const HTTP_MODE =
  process.env.ORCHESTR8_HTTP === "true" || process.env.ORCHESTR8_HTTP === "1";
const HTTP_PORT = parseInt(process.env.ORCHESTR8_HTTP_PORT || "3000", 10);

class Orchestr8Server {
  private server: McpServer;
  private promptLoader: PromptLoader;
  private resourceLoader: ResourceLoader;
  private stats: StatsCollector;
  private httpTransport: HTTPTransport | null = null;

  constructor() {
    this.server = new McpServer({
      name: "orchestr8",
      version: "1.0.0",
    });
    this.promptLoader = new PromptLoader(logger);
    this.resourceLoader = new ResourceLoader(logger);
    this.stats = new StatsCollector();
  }

  async initialize(): Promise<void> {
    logger.info("Starting orchestr8 MCP server v1.0.0");

    // Load all prompts and resources
    const prompts = await this.promptLoader.loadAllPrompts();
    const resources = await this.resourceLoader.loadAllResources();

    logger.info(`Loaded ${prompts.length} prompts`);
    logger.info(`Loaded ${resources.length} resources`);

    // Pre-load resource index for faster first query
    try {
      await this.resourceLoader.loadResourceIndex();
      logger.info("Resource index pre-loaded for dynamic matching");
    } catch (error) {
      logger.warn(
        "Failed to pre-load resource index, will load on-demand:",
        error,
      );
    }

    // Register prompts
    this.registerPrompts(prompts);

    // Register resources
    this.registerResources(resources);

    // Register dynamic resource templates
    this.registerDynamicTemplates();

    // Set up hot reload in development
    if (process.env.NODE_ENV !== "production") {
      this.promptLoader.watchForChanges(() => {
        logger.info("Prompts changed - restart server to reload");
      });
    }
  }

  private registerPrompts(prompts: any[]): void {
    for (const prompt of prompts) {
      // Convert prompt arguments to Zod schema
      const argsSchema: any = {};
      if (prompt.arguments && prompt.arguments.length > 0) {
        for (const arg of prompt.arguments) {
          const zodType = arg.required ? z.string() : z.string().optional();
          argsSchema[arg.name] = zodType;
        }
      }

      this.server.registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema:
            Object.keys(argsSchema).length > 0 ? argsSchema : undefined,
        },
        async (args: any, _extra: any) => {
          const startTime = Date.now();
          logger.debug(`Loading prompt: ${prompt.name}`);

          try {
            // Convert args to the format expected by loader
            const argValues: Record<string, any> = args || {};

            // Load prompt content with argument substitution
            const content = await this.promptLoader.loadPromptContent(
              prompt,
              argValues,
            );

            const latency = Date.now() - startTime;
            this.stats.trackRequest(`prompt:${prompt.name}`, latency);

            return {
              messages: [
                {
                  role: "user" as const,
                  content: {
                    type: "text" as const,
                    text: content,
                  },
                },
              ],
            };
          } catch (error) {
            this.stats.trackError();
            throw error;
          }
        },
      );
    }
  }

  private registerResources(resources: any[]): void {
    for (const resource of resources) {
      this.server.registerResource(
        resource.name,
        resource.uri,
        {
          mimeType: resource.mimeType,
          description: resource.description,
        },
        async (uri) => {
          const startTime = Date.now();
          logger.debug(`Loading resource: ${resource.uri}`);

          try {
            // Check cache
            const cached = this.resourceLoader.getCachedResource(resource.uri);
            if (cached) {
              this.stats.trackCacheHit();
              this.stats.trackRequest(
                `resource:${resource.name}`,
                Date.now() - startTime,
              );
              return {
                contents: [
                  {
                    uri: uri.toString(),
                    mimeType: resource.mimeType,
                    text: cached,
                  },
                ],
              };
            }

            this.stats.trackCacheMiss();

            // Load resource content
            const content = await this.resourceLoader.loadResourceContent(
              resource.uri,
            );

            const latency = Date.now() - startTime;
            this.stats.trackRequest(`resource:${resource.name}`, latency);

            return {
              contents: [
                {
                  uri: uri.toString(),
                  mimeType: resource.mimeType,
                  text: content,
                },
              ],
            };
          } catch (error) {
            this.stats.trackError();
            throw error;
          }
        },
      );
    }
  }

  private registerDynamicTemplates(): void {
    const dynamicCategories = [
      {
        category: "agents",
        description:
          "Dynamic agent matching - finds and assembles relevant agent resources based on query",
      },
      {
        category: "skills",
        description:
          "Dynamic skill matching - finds and assembles relevant skill resources based on query",
      },
      {
        category: "examples",
        description:
          "Dynamic example matching - finds and assembles relevant example resources based on query",
      },
      {
        category: "patterns",
        description:
          "Dynamic pattern matching - finds and assembles relevant pattern resources based on query",
      },
      {
        category: "guides",
        description:
          "Dynamic guide matching - finds and assembles relevant guide resources based on query",
      },
      {
        category: "best-practices",
        description:
          "Dynamic best practice matching - finds and assembles relevant best practice resources based on query",
      },
    ];

    for (const { category, description } of dynamicCategories) {
      const templateUri = `orchestr8://${category}/match{+rest}`;

      this.server.registerResource(
        `${category}-dynamic`,
        new ResourceTemplate(templateUri, { list: undefined }),
        {
          mimeType: "text/markdown",
          description: description,
        },
        async (uri, params: Record<string, any>) => {
          const startTime = Date.now();
          logger.debug(`Loading dynamic resource: ${uri.toString()}`);

          try {
            const fullUri = uri.toString();
            const content =
              await this.resourceLoader.loadResourceContent(fullUri);

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
          } catch (error) {
            this.stats.trackError();
            throw error;
          }
        },
      );

      logger.debug(`Registered dynamic resource template: ${templateUri}`);
    }

    // Register global catch-all template
    const globalTemplateUri = "orchestr8://match{+rest}";
    this.server.registerResource(
      "global-dynamic",
      new ResourceTemplate(globalTemplateUri, { list: undefined }),
      {
        mimeType: "text/markdown",
        description: "Dynamic resource matching across all categories",
      },
      async (uri, params: Record<string, any>) => {
        const startTime = Date.now();
        logger.debug(`Loading global dynamic resource: ${uri.toString()}`);

        try {
          const fullUri = uri.toString();
          const content =
            await this.resourceLoader.loadResourceContent(fullUri);

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
        } catch (error) {
          this.stats.trackError();
          throw error;
        }
      },
    );
    logger.debug(
      `Registered global dynamic resource template: ${globalTemplateUri}`,
    );
  }

  async startStdio(): Promise<void> {
    logger.info("Starting in stdio mode (Claude Desktop integration)");

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info("orchestr8 MCP server started successfully in stdio mode");
  }

  async startHttp(): Promise<void> {
    logger.info(`Starting in HTTP mode on port ${HTTP_PORT}`);

    // Create HTTP transport with methods to access MCP functionality
    const mcpInterface = {
      handleRequest: async (method: string, params: any) => {
        // This would need to be implemented based on MCP server internals
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
      searchResources: async (query: string) => {
        return this.resourceLoader.searchResources(query);
      },
      getResourceContent: async (uri: string) => {
        return this.resourceLoader.loadResourceContent(uri);
      },
    };

    this.httpTransport = new HTTPTransport(
      {
        port: HTTP_PORT,
        staticPath: path.join(__dirname, "web", "static"),
        enableCORS: true,
      },
      mcpInterface,
      this.stats,
    );

    await this.httpTransport.start();

    logger.info(`orchestr8 MCP server started successfully in HTTP mode`);
    logger.info(`Web UI available at: http://localhost:${HTTP_PORT}`);
  }

  async startDual(): Promise<void> {
    logger.info("Starting in dual mode (stdio + HTTP)");

    // Start stdio for Claude Desktop
    const stdioTransport = new StdioServerTransport();
    await this.server.connect(stdioTransport);
    logger.info("stdio transport ready");

    // Start HTTP for web UI
    await this.startHttp();

    logger.info("orchestr8 MCP server started successfully in dual mode");
  }

  async shutdown(): Promise<void> {
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

    // Determine which mode to run in
    if (HTTP_MODE) {
      // HTTP only mode (for development/testing)
      await orchestr8.startHttp();
    } else {
      // Default: Dual mode (stdio for Claude + HTTP for web UI)
      await orchestr8.startDual();
    }

    // Handle graceful shutdown
    const shutdown = async () => {
      await orchestr8.shutdown();
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
