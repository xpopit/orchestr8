#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PromptLoader } from "./loaders/promptLoader.js";
import { ResourceLoader } from "./loaders/resourceLoader.js";
import { Logger } from "./utils/logger.js";
import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize logger (writes to stderr to avoid corrupting MCP protocol)
const logger = new Logger("orchestr8-mcp");

async function main() {
  logger.info("Starting orchestr8 MCP server v1.0.0");

  try {
    // Create MCP server instance
    const server = new McpServer({
      name: "orchestr8",
      version: "1.0.0",
    });

    // Initialize loaders
    const promptLoader = new PromptLoader(logger);
    const resourceLoader = new ResourceLoader(logger);

    // Load all prompts and resources
    const prompts = await promptLoader.loadAllPrompts();
    const resources = await resourceLoader.loadAllResources();

    logger.info(`Loaded ${prompts.length} prompts`);
    logger.info(`Loaded ${resources.length} resources`);

    // Pre-load resource index for faster first query (optional)
    // The index lookup will auto-load on first use if not done here
    try {
      await resourceLoader.loadResourceIndex();
      logger.info("Resource index pre-loaded for dynamic matching");
    } catch (error) {
      logger.warn("Failed to pre-load resource index, will load on-demand:", error);
    }

    // Register each prompt with the server
    for (const prompt of prompts) {
      // Convert prompt arguments to Zod schema
      const argsSchema: any = {};
      if (prompt.arguments && prompt.arguments.length > 0) {
        for (const arg of prompt.arguments) {
          const zodType = arg.required ? z.string() : z.string().optional();
          argsSchema[arg.name] = zodType;
        }
      }

      server.registerPrompt(
        prompt.name,
        {
          title: prompt.title,
          description: prompt.description,
          argsSchema:
            Object.keys(argsSchema).length > 0 ? argsSchema : undefined,
        },
        async (args: any, _extra: any) => {
          logger.debug(`Loading prompt: ${prompt.name}`);

          // Convert args to the format expected by loader
          const argValues: Record<string, any> = args || {};

          // Load prompt content with argument substitution
          const content = await promptLoader.loadPromptContent(
            prompt,
            argValues,
          );

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
        },
      );
    }

    // Register each resource with the server
    for (const resource of resources) {
      server.registerResource(
        resource.name,
        resource.uri,
        {
          mimeType: resource.mimeType,
          description: resource.description,
        },
        async (uri) => {
          logger.debug(`Loading resource: ${resource.uri}`);

          // Load resource content
          const content = await resourceLoader.loadResourceContent(
            resource.uri,
          );

          return {
            contents: [
              {
                uri: uri.toString(),
                mimeType: resource.mimeType,
                text: content,
              },
            ],
          };
        },
      );
    }

    // Register dynamic resource templates for fuzzy matching
    // These enable URIs like: orchestr8://agents/match?query=build+api&maxTokens=2000
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
      // Use {+rest} wildcard to capture the entire query string with all parameters
      // This allows optional parameters like maxTokens and tags
      const templateUri = `orchestr8://${category}/match{+rest}`;

      server.registerResource(
        `${category}-dynamic`,
        new ResourceTemplate(templateUri, { list: undefined }),
        {
          mimeType: "text/markdown",
          description: description,
        },
        async (uri, params: Record<string, any>) => {
          logger.debug(`Loading dynamic resource: ${uri.toString()}`);
          logger.debug(`Template params:`, params);

          // The full URI string contains all query parameters
          const fullUri = uri.toString();
          logger.debug(`Full URI: ${fullUri}`);

          // Load resource content using the full URI
          // ResourceLoader will parse all query params including optional ones
          const content = await resourceLoader.loadResourceContent(fullUri);

          return {
            contents: [
              {
                uri: fullUri,
                mimeType: "text/markdown",
                text: content,
              },
            ],
          };
        },
      );

      logger.debug(`Registered dynamic resource template: ${templateUri}`);
    }

    // Register global catch-all template for cross-category matching
    const globalTemplateUri = "orchestr8://match{+rest}";
    server.registerResource(
      "global-dynamic",
      new ResourceTemplate(globalTemplateUri, { list: undefined }),
      {
        mimeType: "text/markdown",
        description: "Dynamic resource matching across all categories",
      },
      async (uri, params: Record<string, any>) => {
        logger.debug(`Loading global dynamic resource: ${uri.toString()}`);
        logger.debug(`Template params:`, params);

        // The full URI string contains all query parameters
        const fullUri = uri.toString();
        logger.debug(`Full global URI: ${fullUri}`);

        // Load resource content using the full URI
        // ResourceLoader will parse all query params including optional ones (maxTokens, tags, categories)
        const content = await resourceLoader.loadResourceContent(fullUri);

        return {
          contents: [
            {
              uri: fullUri,
              mimeType: "text/markdown",
              text: content,
            },
          ],
        };
      },
    );
    logger.debug(
      `Registered global dynamic resource template: ${globalTemplateUri}`,
    );

    // Set up hot reload in development
    if (process.env.NODE_ENV !== "production") {
      promptLoader.watchForChanges(() => {
        logger.info("Prompts changed - restart server to reload");
      });
    }

    // Set up stdio transport (communicates via stdin/stdout)
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info("orchestr8 MCP server started successfully");

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("Shutting down orchestr8 MCP server");
      await server.close();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("Shutting down orchestr8 MCP server");
      await server.close();
      process.exit(0);
    });
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
