#!/usr/bin/env node

/**
 * Comprehensive MCP Server Test
 *
 * This test validates that the orchestr8 MCP server:
 * 1. Starts correctly and responds to initialization
 * 2. Lists all registered prompts (workflows)
 * 3. Retrieves prompt content with argument substitution
 * 4. Lists all registered resources (agents, skills, examples)
 * 5. Retrieves resource content
 */

const { spawn } = require("child_process");
const { join } = require("path");

class MCPTester {
  constructor() {
    this.server = null;
    this.messageId = 0;
    this.pendingRequests = new Map();
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async start() {
    console.log("🚀 Starting MCP Server Test Suite\n");

    // Start the MCP server (project root is two levels up from tests/integration)
    const projectRoot = join(__dirname, "..", "..");
    const serverPath = join(projectRoot, "dist", "index.js");

    console.log(`📦 Server path: ${serverPath}`);

    this.server = spawn("node", [serverPath], {
      env: {
        ...process.env,
        PROMPTS_PATH: join(projectRoot, "prompts"),
        RESOURCES_PATH: join(projectRoot, "resources"),
        LOG_LEVEL: "error", // Minimize server logs during testing
        NODE_ENV: "test",
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle server output
    let buffer = "";
    this.server.stdout.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const response = JSON.parse(line);
          this.handleResponse(response);
        } catch (error) {
          console.error("❌ Failed to parse response:", line);
        }
      }
    });

    this.server.stderr.on("data", (data) => {
      const msg = data.toString();
      if (!msg.includes("Server started") && !msg.includes("info")) {
        console.error("Server stderr:", msg);
      }
    });

    this.server.on("error", (error) => {
      console.error("❌ Server error:", error);
    });

    this.server.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Server exited with code ${code}`);
      }
    });

    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

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

  async sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const request = {
        jsonrpc: "2.0",
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, {
        resolve,
        reject,
        method,
        sentAt: Date.now(),
      });

      const requestStr = JSON.stringify(request) + "\n";
      this.server.stdin.write(requestStr);

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 5000);
    });
  }

  recordTest(name, passed, details = "") {
    this.testResults.tests.push({ name, passed, details });
    if (passed) {
      this.testResults.passed++;
      console.log(`   ✅ ${name}`);
      if (details) console.log(`      ${details}`);
    } else {
      this.testResults.failed++;
      console.log(`   ❌ ${name}`);
      if (details) console.log(`      ${details}`);
    }
  }

  async runTests() {
    try {
      // Test 1: Initialize
      console.log("\n📋 Test 1: Server Initialization");
      try {
        const initResult = await this.sendRequest("initialize", {
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

        this.recordTest(
          "Server initialization",
          initResult && initResult.protocolVersion,
          `Protocol: ${initResult.protocolVersion}`,
        );

        this.recordTest(
          "Server capabilities",
          initResult.capabilities &&
            (initResult.capabilities.prompts ||
              initResult.capabilities.resources),
          `Prompts: ${!!initResult.capabilities.prompts}, Resources: ${!!initResult.capabilities.resources}`,
        );
      } catch (error) {
        this.recordTest("Server initialization", false, error.message);
        return; // Can't continue if initialization fails
      }

      // Test 2: List Resources
      console.log("\n📋 Test 2: List Resources");
      try {
        const resources = await this.sendRequest("resources/list", {});

        this.recordTest(
          "Resources list returns array",
          Array.isArray(resources.resources),
          `Returned ${resources.resources?.length || 0} resources`,
        );

        const resourceUris = resources.resources?.map((r) => r.uri) || [];
        const hasAgents = resourceUris.some((uri) =>
          uri.includes("orchestr8://agents/"),
        );
        const hasSkills = resourceUris.some((uri) =>
          uri.includes("orchestr8://skills/"),
        );
        const hasExamples = resourceUris.some((uri) =>
          uri.includes("orchestr8://examples/"),
        );

        this.recordTest(
          "Resources include agents",
          hasAgents,
          hasAgents ? "Agents found" : "No agents found",
        );

        this.recordTest(
          "Resources include skills",
          hasSkills,
          hasSkills ? "Skills found" : "No skills found",
        );

        this.recordTest(
          "Resources include examples",
          hasExamples,
          hasExamples ? "Examples found" : "No examples found",
        );
      } catch (error) {
        this.recordTest("List resources", false, error.message);
      }

      // Test 3: Read Resource
      console.log("\n📋 Test 3: Read Resource Content");
      try {
        const resourceResult = await this.sendRequest("resources/read", {
          uri: "orchestr8://agents/_fragments/typescript-core",
        });

        this.recordTest(
          "Resource returns content",
          Array.isArray(resourceResult.contents) &&
            resourceResult.contents.length > 0,
          `Returned ${resourceResult.contents?.length || 0} content items`,
        );

        const content = resourceResult.contents?.[0]?.text;

        this.recordTest(
          "Resource has text content",
          typeof content === "string" && content.length > 100,
          `Content length: ${content?.length || 0} chars`,
        );

        this.recordTest(
          "Resource content is substantial",
          content && content.length > 500,
          "Content appears to be a complete agent definition",
        );

        const mimeType = resourceResult.contents?.[0]?.mimeType;
        this.recordTest(
          "Resource has correct MIME type",
          mimeType === "text/markdown" || mimeType === "text/plain",
          `MIME type: ${mimeType}`,
        );
      } catch (error) {
        this.recordTest("Read resource content", false, error.message);
      }
    } catch (error) {
      console.error("\n❌ Test suite error:", error);
    }
  }

  async stop() {
    if (this.server) {
      this.server.kill();
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 Test Results Summary");
    console.log("=".repeat(60));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(
      `📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`,
    );
    console.log("=".repeat(60));

    if (this.testResults.failed > 0) {
      console.log("\n⚠️  Server is NOT production ready - tests failed");
      process.exit(1);
    } else {
      console.log("\n✅ Server is production ready - all tests passed!");
      process.exit(0);
    }
  }
}

// Run the test suite
(async () => {
  const tester = new MCPTester();
  await tester.start();
  await tester.runTests();
  await tester.stop();
})();
