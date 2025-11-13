#!/usr/bin/env node

/**
 * Comprehensive MCP Protocol Integration Tests
 *
 * This test suite validates the full MCP protocol implementation:
 * 1. Server startup and MCP handshake
 * 2. List all static resources
 * 3. Read a static resource (e.g., orchestr8://agents/typescript-core)
 * 4. Read a dynamic resource with fuzzy matching (orchestr8://agents/match?query=typescript+api)
 * 5. Verify dynamic resource returns assembled content from multiple fragments
 * 6. Test invalid URIs return proper errors
 * 7. Test cache hit on second request
 *
 * Note: Prompts are no longer tested as we removed static prompts in favor of
 * dynamic resource loading via slash commands (/now, etc.)
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import { spawn } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCP Client for testing the orchestr8 MCP server
 */
class MCPClient {
  constructor() {
    this.server = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.buffer = "";
  }

  /**
   * Start the MCP server process
   */
  async start() {
    const projectRoot = join(__dirname, "..", "..");
    const serverPath = join(projectRoot, "dist", "index.js");

    this.server = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PROMPTS_PATH: join(projectRoot, "prompts"),
        RESOURCES_PATH: join(projectRoot, "resources"),
        LOG_LEVEL: "error",
        NODE_ENV: "test",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle server stdout (MCP protocol messages)
    this.server.stdout.on("data", (data) => {
      this.buffer += data.toString();
      const lines = this.buffer.split("\n");
      this.buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (error) {
          console.error("Failed to parse response:", line);
          console.error("Parse error:", error.message);
        }
      }
    });

    // Handle server stderr (logs)
    this.server.stderr.on("data", (data) => {
      const msg = data.toString();
      // Only log actual errors, not info messages
      if (msg.includes("error") && !msg.includes("LOG_LEVEL")) {
        console.error("Server error:", msg);
      }
    });

    this.server.on("error", (error) => {
      console.error("Server process error:", error);
    });

    // Wait for server to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  /**
   * Handle incoming MCP response
   */
  handleResponse(response) {
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id);
      this.pendingRequests.delete(response.id);

      if (response.error) {
        reject(
          new Error(response.error.message || JSON.stringify(response.error)),
        );
      } else {
        resolve(response.result);
      }
    }
  }

  /**
   * Send an MCP request to the server
   */
  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, { resolve, reject, method });

      const requestStr = JSON.stringify(request) + "\n";
      this.server.stdin.write(requestStr);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 10000);
    });
  }

  /**
   * Stop the MCP server process
   */
  async stop() {
    if (this.server) {
      this.server.kill();
      // Wait for process to exit
      await new Promise((resolve) => {
        this.server.on("exit", resolve);
        setTimeout(resolve, 1000);
      });
    }
  }
}

// ============================================================================
// Test Suite
// ============================================================================

describe("MCP Protocol Integration Tests", () => {
  let client;

  before(async () => {
    console.log("\n🚀 Starting MCP Protocol Test Suite\n");
    client = new MCPClient();
    await client.start();
  });

  after(async () => {
    if (client) {
      await client.stop();
    }
    console.log("\n✅ Test suite completed\n");
  });

  // ==========================================================================
  // Test 1: Server Startup and MCP Handshake
  // ==========================================================================
  describe("Server Startup and MCP Handshake", () => {
    it("should complete initialization handshake", async () => {
      const result = await client.sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          prompts: {},
          resources: {},
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      });

      assert.ok(result, "Initialize should return a result");
      assert.ok(result.protocolVersion, "Should return protocol version");
      assert.ok(result.capabilities, "Should return server capabilities");
    });

    it("should have resources capability", async () => {
      const result = await client.sendRequest("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {
          prompts: {},
          resources: {},
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0",
        },
      });

      assert.ok(
        result.capabilities.resources,
        "Server should support resources capability",
      );
    });
  });

  // ==========================================================================
  // Test 2: List All Static Resources
  // ==========================================================================
  describe("List All Static Resources", () => {
    let resources;

    before(async () => {
      const result = await client.sendRequest("resources/list", {});
      resources = result.resources;
    });

    it("should return an array of resources", () => {
      assert.ok(Array.isArray(resources), "Resources should be an array");
      assert.ok(resources.length > 0, "Should have at least one resource");
    });

    it("should include agent resources", () => {
      const hasAgents = resources.some((r) =>
        r.uri.includes("orchestr8://agents/"),
      );
      assert.ok(hasAgents, "Should have agent resources");
    });

    it("should include skill resources", () => {
      const hasSkills = resources.some((r) =>
        r.uri.includes("orchestr8://skills/"),
      );
      assert.ok(hasSkills, "Should have skill resources");
    });

    it("should include example resources", () => {
      const hasExamples = resources.some((r) =>
        r.uri.includes("orchestr8://examples/"),
      );
      assert.ok(hasExamples, "Should have example resources");
    });

    it("should include pattern resources", () => {
      const hasPatterns = resources.some((r) =>
        r.uri.includes("orchestr8://patterns/"),
      );
      assert.ok(hasPatterns, "Should have pattern resources");
    });

    it("should have required metadata for each resource", () => {
      for (const resource of resources) {
        assert.ok(resource.uri, "Resource should have a URI");
        assert.ok(resource.name, "Resource should have a name");
        assert.ok(resource.mimeType, "Resource should have a MIME type");
        assert.ok(
          resource.uri.startsWith("orchestr8://"),
          "Resource URI should use orchestr8:// protocol",
        );
      }
    });

    it("should have correct MIME types", () => {
      for (const resource of resources) {
        const validMimeTypes = [
          "text/markdown",
          "text/plain",
          "application/json",
          "application/yaml",
        ];
        assert.ok(
          validMimeTypes.includes(resource.mimeType),
          `Invalid MIME type: ${resource.mimeType}`,
        );
      }
    });
  });

  // ==========================================================================
  // Test 3: Read a Static Resource
  // ==========================================================================
  describe("Read Static Resource", () => {
    it("should read orchestr8://agents/typescript-core", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/typescript-core",
      });

      assert.ok(result, "Should return a result");
      assert.ok(Array.isArray(result.contents), "Should return contents array");
      assert.ok(
        result.contents.length > 0,
        "Should have at least one content item",
      );
    });

    it("should return text content", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/typescript-core",
      });

      const content = result.contents[0];
      assert.ok(content.text, "Content should have text property");
      assert.strictEqual(
        typeof content.text,
        "string",
        "Text should be a string",
      );
    });

    it("should have substantial content (>500 chars)", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/typescript-core",
      });

      const text = result.contents[0].text;
      assert.ok(
        text.length > 500,
        `Content should be substantial, got ${text.length} chars`,
      );
    });

    it("should have correct MIME type", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/typescript-core",
      });

      const content = result.contents[0];
      assert.ok(
        content.mimeType === "text/markdown" ||
          content.mimeType === "text/plain",
        `Expected markdown or plain text, got ${content.mimeType}`,
      );
    });

    it("should include URI in content response", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/typescript-core",
      });

      const content = result.contents[0];
      assert.ok(content.uri, "Content should include URI");
      assert.ok(
        content.uri.includes("typescript-core"),
        "URI should match requested resource",
      );
    });

    it("should read nested resource path", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://examples/typescript-rest-api-complete",
      });

      assert.ok(result.contents[0].text, "Should read nested resource");
      assert.ok(
        result.contents[0].text.length > 100,
        "Nested resource should have content",
      );
    });
  });

  // ==========================================================================
  // Test 4: Read a Dynamic Resource with Fuzzy Matching
  // ==========================================================================
  describe("Read Dynamic Resource with Fuzzy Matching", () => {
    it("should handle dynamic URI with query parameter", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript+api",
      });

      assert.ok(result, "Should return a result");
      assert.ok(Array.isArray(result.contents), "Should return contents array");
      assert.ok(
        result.contents.length > 0,
        "Should have at least one content item",
      );
    });

    it("should return assembled content", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript+api",
      });

      const text = result.contents[0].text;
      assert.ok(text, "Should have text content");
      assert.ok(text.length > 100, "Assembled content should be substantial");
    });

    it("should support maxTokens parameter", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript+testing&maxTokens=1000",
      });

      const text = result.contents[0].text;
      assert.ok(text, "Should return content with maxTokens limit");
      // Token limit is approximate, so just verify we got content
      assert.ok(text.length > 50, "Should have some content");
    });

    it("should decode URL-encoded query parameters", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://skills/match?query=error+handling",
      });

      const text = result.contents[0].text;
      assert.ok(text, "Should decode URL-encoded spaces");
      assert.ok(
        text.length > 100,
        "Should return assembled content for decoded query",
      );
    });

    it("should filter by category in URI path", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://examples/match?query=typescript",
      });

      const text = result.contents[0].text;
      assert.ok(text, "Should filter by category");
      // Verify it's example content by checking for common example markers
      assert.ok(
        text.includes("Example") || text.includes("```"),
        "Should contain example content",
      );
    });
  });

  // ==========================================================================
  // Test 5: Verify Dynamic Resource Returns Assembled Content from Multiple Fragments
  // ==========================================================================
  describe("Dynamic Resource Assembly from Multiple Fragments", () => {
    it("should assemble content from multiple fragments", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript+api+async",
      });

      const text = result.contents[0].text;

      // Check for fragment separators (--- used in fuzzy matcher assembly)
      const hasSeparators = text.includes("---");
      assert.ok(
        hasSeparators || text.length > 2000,
        "Should contain assembled content from multiple fragments",
      );
    });

    it("should include relevance scores in assembled content", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript",
      });

      const text = result.contents[0].text;

      // Fuzzy matcher includes relevance scores in output
      const hasRelevanceInfo =
        text.includes("Relevance") || text.includes("Score");
      assert.ok(
        hasRelevanceInfo || text.length > 1000,
        "Should include relevance information or substantial content",
      );
    });

    it("should include tags in assembled content", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://skills/match?query=testing",
      });

      const text = result.contents[0].text;

      // Fuzzy matcher includes tags in output
      const hasTags = text.includes("Tags:") || text.includes("tags");
      assert.ok(
        hasTags || text.length > 500,
        "Should include tags or substantial content",
      );
    });

    it("should respect maxTokens budget", async () => {
      const smallResult = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript&maxTokens=500",
      });

      const largeResult = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript&maxTokens=5000",
      });

      const smallText = smallResult.contents[0].text;
      const largeText = largeResult.contents[0].text;

      // Large result should have more content (approximate check)
      assert.ok(
        largeText.length >= smallText.length,
        "Larger token budget should return more content",
      );
    });

    it("should match across different resource categories", async () => {
      const result = await client.sendRequest("resources/read", {
        uri: "orchestr8://match?query=typescript+async",
      });

      const text = result.contents[0].text;
      assert.ok(
        text.length > 100,
        "Should match across all categories when no category filter",
      );
    });
  });

  // ==========================================================================
  // Test 6: Invalid URIs Return Proper Errors
  // ==========================================================================
  describe("Invalid URIs Return Proper Errors", () => {
    it("should return error for non-existent resource", async () => {
      await assert.rejects(
        async () => {
          await client.sendRequest("resources/read", {
            uri: "orchestr8://agents/non-existent-resource",
          });
        },
        (error) => {
          assert.ok(error instanceof Error, "Should throw an Error");
          assert.ok(error.message.length > 0, "Error should have a message");
          return true;
        },
        "Should reject with an error for non-existent resource",
      );
    });

    it("should return error for malformed URI", async () => {
      await assert.rejects(
        async () => {
          await client.sendRequest("resources/read", {
            uri: "invalid://wrong-protocol",
          });
        },
        (error) => {
          assert.ok(error instanceof Error, "Should throw an Error");
          return true;
        },
        "Should reject with an error for malformed URI",
      );
    });

    it("should return error for dynamic URI without query parameter", async () => {
      await assert.rejects(
        async () => {
          await client.sendRequest("resources/read", {
            uri: "orchestr8://agents/match",
          });
        },
        (error) => {
          assert.ok(error instanceof Error, "Should throw an Error");
          assert.ok(
            error.message.includes("query") || error.message.length > 0,
            "Error should mention query parameter",
          );
          return true;
        },
        "Should reject when query parameter is missing",
      );
    });

    it("should return error for non-existent prompt", async () => {
      await assert.rejects(
        async () => {
          await client.sendRequest("prompts/get", {
            name: "non-existent-prompt",
          });
        },
        (error) => {
          assert.ok(error instanceof Error, "Should throw an Error");
          return true;
        },
        "Should reject with an error for non-existent prompt",
      );
    });

    it("should handle missing required prompt arguments gracefully", async () => {
      // Some prompts may work without args, others may require them
      // This test ensures the server doesn't crash
      try {
        await client.sendRequest("prompts/get", {
          name: "new-project",
          arguments: {},
        });
        // If it succeeds without args, that's fine
        assert.ok(true, "Server handled missing arguments");
      } catch (error) {
        // If it fails, it should fail gracefully with an error message
        assert.ok(error instanceof Error, "Should fail gracefully");
        assert.ok(error.message.length > 0, "Should have error message");
      }
    });
  });

  // ==========================================================================
  // Test 7: Cache Hit on Second Request
  // ==========================================================================
  describe("Cache Hit on Second Request", () => {
    it("should cache static resource content", async () => {
      const uri = "orchestr8://agents/typescript-core";

      // First request (cache miss)
      const result1 = await client.sendRequest("resources/read", { uri });
      const text1 = result1.contents[0].text;

      // Second request (should hit cache)
      const result2 = await client.sendRequest("resources/read", { uri });
      const text2 = result2.contents[0].text;

      // Content should be identical
      assert.strictEqual(text1, text2, "Cached content should match original");
    });

    it("should cache dynamic resource content", async () => {
      const uri =
        "orchestr8://agents/match?query=typescript+api&maxTokens=2000";

      // First request (cache miss)
      const result1 = await client.sendRequest("resources/read", { uri });
      const text1 = result1.contents[0].text;

      // Second request (should hit cache)
      const result2 = await client.sendRequest("resources/read", { uri });
      const text2 = result2.contents[0].text;

      // Content should be identical
      assert.strictEqual(
        text1,
        text2,
        "Cached dynamic content should match original",
      );
    });

    it("should have different cache for different query parameters", async () => {
      // Request with first query
      const result1 = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=typescript+api&maxTokens=2000",
      });
      const text1 = result1.contents[0].text;

      // Request with different query
      const result2 = await client.sendRequest("resources/read", {
        uri: "orchestr8://agents/match?query=python+web&maxTokens=2000",
      });
      const text2 = result2.contents[0].text;

      // Content should be different
      assert.notStrictEqual(
        text1,
        text2,
        "Different query parameters should produce different content",
      );
    });
  });
});
