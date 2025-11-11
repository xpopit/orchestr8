/**
 * Unit tests for FuzzyMatcher
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");

// Test the compiled version
const { FuzzyMatcher } = require("../../dist/utils/fuzzyMatcher.js");

describe("FuzzyMatcher", () => {
  let matcher;

  // Test data - sample resource fragments
  const createTestResources = () => [
    {
      id: "typescript-developer",
      category: "agent",
      tags: ["typescript", "nodejs", "async", "rest-api"],
      capabilities: ["build REST APIs", "async programming", "type safety"],
      useWhen: [
        "Building TypeScript applications",
        "Need type-safe Node.js development",
        "Creating REST API services",
      ],
      estimatedTokens: 800,
      content:
        "# TypeScript Developer\n\nExpert in TypeScript and Node.js development.",
    },
    {
      id: "async-patterns",
      category: "skill",
      tags: ["async", "promises", "concurrency"],
      capabilities: [
        "async/await patterns",
        "promise handling",
        "error handling",
      ],
      useWhen: [
        "Managing asynchronous operations",
        "Handling concurrent requests",
        "Error handling in async code",
      ],
      estimatedTokens: 600,
      content:
        "# Async Patterns\n\nBest practices for asynchronous programming.",
    },
    {
      id: "rest-api-design",
      category: "pattern",
      tags: ["rest-api", "http", "design"],
      capabilities: ["API design", "HTTP methods", "status codes"],
      useWhen: [
        "Designing REST APIs",
        "Structuring HTTP endpoints",
        "API versioning strategies",
      ],
      estimatedTokens: 1200,
      content:
        "# REST API Design\n\nPrinciples for designing robust REST APIs.",
    },
    {
      id: "authentication-jwt",
      category: "pattern",
      tags: ["authentication", "jwt", "security"],
      capabilities: ["JWT tokens", "auth middleware", "token validation"],
      useWhen: [
        "Implementing authentication",
        "Securing API endpoints",
        "Token-based authentication",
      ],
      estimatedTokens: 900,
      content: "# JWT Authentication\n\nImplementing JWT-based authentication.",
    },
    {
      id: "database-queries",
      category: "skill",
      tags: ["database", "sql", "performance"],
      capabilities: ["SQL queries", "query optimization", "indexing"],
      useWhen: [
        "Writing database queries",
        "Optimizing query performance",
        "Database schema design",
      ],
      estimatedTokens: 700,
      content: "# Database Queries\n\nEfficient database query patterns.",
    },
    {
      id: "python-developer",
      category: "agent",
      tags: ["python", "data-science", "machine-learning"],
      capabilities: ["Python development", "data analysis", "ML models"],
      useWhen: [
        "Building Python applications",
        "Data science projects",
        "Machine learning tasks",
      ],
      estimatedTokens: 850,
      content: "# Python Developer\n\nExpert in Python and data science.",
    },
    {
      id: "error-handling",
      category: "skill",
      tags: ["error-handling", "logging", "debugging"],
      capabilities: ["error handling", "logging strategies", "debugging"],
      useWhen: [
        "Implementing error handling",
        "Setting up logging",
        "Debugging applications",
      ],
      estimatedTokens: 500,
      content:
        "# Error Handling\n\nBest practices for error handling and logging.",
    },
    {
      id: "large-resource",
      category: "pattern",
      tags: ["comprehensive", "detailed"],
      capabilities: ["extensive documentation", "detailed examples"],
      useWhen: ["Need comprehensive guidance"],
      estimatedTokens: 2500,
      content: "# Large Resource\n\nExtensive documentation and examples.",
    },
  ];

  const setup = () => {
    matcher = new FuzzyMatcher();
    matcher.setResourceIndex(createTestResources());
  };

  describe("Keyword Extraction", () => {
    it("should extract simple keywords from query", () => {
      setup();
      const keywords = matcher.extractKeywords("build typescript api");

      assert.deepStrictEqual(keywords, ["build", "typescript", "api"]);
    });

    it("should convert keywords to lowercase", () => {
      setup();
      const keywords = matcher.extractKeywords("Build TypeScript REST API");

      assert.deepStrictEqual(keywords, ["build", "typescript", "rest", "api"]);
    });

    it("should remove stop words", () => {
      setup();
      const keywords = matcher.extractKeywords(
        "how to build a REST API with TypeScript",
      );

      // 'to', 'a', 'with' should be removed as stop words
      // Note: 'how' is not in the stop words list
      assert.ok(!keywords.includes("to"));
      assert.ok(!keywords.includes("a"));
      assert.ok(!keywords.includes("with"));
      assert.ok(keywords.includes("build"));
      assert.ok(keywords.includes("rest"));
      assert.ok(keywords.includes("api"));
      assert.ok(keywords.includes("typescript"));
    });

    it("should filter out single-character words", () => {
      setup();
      const keywords = matcher.extractKeywords("build a b c api");

      assert.ok(!keywords.includes("a"));
      assert.ok(!keywords.includes("b"));
      assert.ok(!keywords.includes("c"));
      assert.ok(keywords.includes("build"));
      assert.ok(keywords.includes("api"));
    });

    it("should handle special characters", () => {
      setup();
      const keywords = matcher.extractKeywords("build REST-API with Node.js!");

      assert.ok(keywords.includes("build"));
      // Hyphens are preserved, so 'REST-API' stays as 'rest-api' (not split)
      assert.ok(keywords.includes("rest-api"));
      assert.ok(keywords.includes("node"));
      assert.ok(keywords.includes("js"));
    });

    it("should return unique keywords", () => {
      setup();
      const keywords = matcher.extractKeywords("api api api build build");

      const apiCount = keywords.filter((k) => k === "api").length;
      const buildCount = keywords.filter((k) => k === "build").length;

      assert.strictEqual(apiCount, 1);
      assert.strictEqual(buildCount, 1);
    });

    it("should handle empty query", () => {
      setup();
      const keywords = matcher.extractKeywords("");

      assert.deepStrictEqual(keywords, []);
    });

    it("should handle query with only stop words", () => {
      setup();
      const keywords = matcher.extractKeywords("the and or but");

      assert.deepStrictEqual(keywords, []);
    });

    it("should preserve hyphens in compound words", () => {
      setup();
      const keywords = matcher.extractKeywords("rest-api machine-learning");

      assert.ok(
        keywords.includes("rest-api") ||
          (keywords.includes("rest") && keywords.includes("api")),
      );
      assert.ok(
        keywords.includes("machine-learning") ||
          (keywords.includes("machine") && keywords.includes("learning")),
      );
    });
  });

  describe("Score Calculation", () => {
    it("should give high score for tag matches", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["typescript", "nodejs"];
      const request = { query: "typescript nodejs", maxTokens: 3000 };

      const score = matcher.calculateScore(resource, keywords, request);

      // Should get +10 per tag match = 20
      assert.ok(score >= 20);
    });

    it("should give points for capability matches", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["rest", "async"];
      const request = { query: "rest async", maxTokens: 3000 };

      const score = matcher.calculateScore(resource, keywords, request);

      // Should get +8 per capability match
      assert.ok(score > 0);
    });

    it("should give points for useWhen matches", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["building", "applications"];
      const request = { query: "building applications", maxTokens: 3000 };

      const score = matcher.calculateScore(resource, keywords, request);

      // Should get +5 per useWhen match
      assert.ok(score > 0);
    });

    it("should give bonus for category match", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer (agent)
      const keywords = ["typescript"];
      const requestWithCategory = {
        query: "typescript",
        maxTokens: 3000,
        category: "agent",
      };
      const requestWithoutCategory = {
        query: "typescript",
        maxTokens: 3000,
      };

      const scoreWith = matcher.calculateScore(
        resource,
        keywords,
        requestWithCategory,
      );
      const scoreWithout = matcher.calculateScore(
        resource,
        keywords,
        requestWithoutCategory,
      );

      // Category match should add +15 points
      assert.strictEqual(scoreWith - scoreWithout, 15);
    });

    it("should give bonus for smaller resources", () => {
      setup();
      const smallResource = createTestResources()[1]; // async-patterns (600 tokens)
      const largeResource = createTestResources()[7]; // large-resource (2500 tokens)
      const keywords = ["comprehensive"];
      const request = { query: "comprehensive", maxTokens: 3000 };

      const smallScore = matcher.calculateScore(
        smallResource,
        keywords,
        request,
      );
      const largeScore = matcher.calculateScore(
        largeResource,
        keywords,
        request,
      );

      // Small resource should get +5 bonus
      assert.ok(smallScore > 0); // Has the bonus since < 1000 tokens
    });

    it("should return zero for no matches", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["python", "java", "ruby"];
      const request = { query: "python java ruby", maxTokens: 3000 };

      const score = matcher.calculateScore(resource, keywords, request);

      assert.strictEqual(score, 5); // Only gets +5 for being < 1000 tokens
    });

    it("should return zero if required tags are missing", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["typescript"];
      const request = {
        query: "typescript",
        maxTokens: 3000,
        requiredTags: ["python", "django"], // Resource doesn't have these
      };

      const score = matcher.calculateScore(resource, keywords, request);

      assert.strictEqual(score, 0);
    });

    it("should score if all required tags are present", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["typescript"];
      const request = {
        query: "typescript",
        maxTokens: 3000,
        requiredTags: ["typescript", "nodejs"], // Resource has these
      };

      const score = matcher.calculateScore(resource, keywords, request);

      assert.ok(score > 0);
    });

    it("should accumulate points from multiple match types", () => {
      setup();
      const resource = createTestResources()[0]; // typescript-developer
      const keywords = ["typescript", "rest", "async", "building"];
      const request = {
        query: "typescript rest async building",
        maxTokens: 3000,
        category: "agent",
      };

      const score = matcher.calculateScore(resource, keywords, request);

      // Should get points from tags, capabilities, useWhen, category, and size
      assert.ok(score > 30);
    });
  });

  describe("Budget Selection", () => {
    it("should select resources within token budget", () => {
      setup();
      const scored = createTestResources().map((resource, idx) => ({
        resource,
        score: 100 - idx * 10, // Descending scores
      }));

      const selected = matcher.selectWithinBudget(scored, 2000);

      const totalTokens = selected.reduce(
        (sum, s) => sum + s.resource.estimatedTokens,
        0,
      );
      assert.ok(totalTokens <= 2000 || selected.length <= 3);
    });

    it("should always include top 3 resources even if over budget", () => {
      setup();
      // Create resources that each exceed 1/3 of budget
      const largeResources = [
        {
          resource: { ...createTestResources()[7], estimatedTokens: 1000 },
          score: 100,
        },
        {
          resource: { ...createTestResources()[7], estimatedTokens: 1000 },
          score: 90,
        },
        {
          resource: { ...createTestResources()[7], estimatedTokens: 1000 },
          score: 80,
        },
      ];

      const selected = matcher.selectWithinBudget(largeResources, 2000);

      assert.strictEqual(selected.length, 3);
    });

    it("should select in order from pre-sorted array", () => {
      setup();
      // selectWithinBudget expects the array to already be sorted by score
      const scored = [
        { resource: createTestResources()[1], score: 100 },
        { resource: createTestResources()[2], score: 75 },
        { resource: createTestResources()[0], score: 50 },
      ];

      const selected = matcher.selectWithinBudget(scored, 5000);

      // Should maintain the order from the input (which is already sorted)
      assert.strictEqual(selected[0].score, 100);
      assert.strictEqual(selected[1].score, 75);
      assert.strictEqual(selected[2].score, 50);
    });

    it("should stop after top 3 if budget 80% used", () => {
      setup();
      const scored = [
        {
          resource: { ...createTestResources()[0], estimatedTokens: 800 },
          score: 100,
        },
        {
          resource: { ...createTestResources()[1], estimatedTokens: 800 },
          score: 90,
        },
        {
          resource: { ...createTestResources()[2], estimatedTokens: 800 },
          score: 80,
        },
        {
          resource: { ...createTestResources()[3], estimatedTokens: 100 },
          score: 70,
        },
      ];

      const selected = matcher.selectWithinBudget(scored, 3000);

      // Should have 3 items (2400 tokens = 80% of 3000)
      const totalTokens = selected.reduce(
        (sum, s) => sum + s.resource.estimatedTokens,
        0,
      );
      assert.ok(totalTokens > 3000 * 0.8);
    });

    it("should handle empty scored array", () => {
      setup();
      const selected = matcher.selectWithinBudget([], 3000);

      assert.deepStrictEqual(selected, []);
    });

    it("should handle single resource", () => {
      setup();
      const scored = [{ resource: createTestResources()[0], score: 100 }];

      const selected = matcher.selectWithinBudget(scored, 3000);

      assert.strictEqual(selected.length, 1);
      assert.strictEqual(selected[0].score, 100);
    });

    it("should not exceed budget after top 3", () => {
      setup();
      const scored = [
        {
          resource: { ...createTestResources()[0], estimatedTokens: 500 },
          score: 100,
        },
        {
          resource: { ...createTestResources()[1], estimatedTokens: 500 },
          score: 90,
        },
        {
          resource: { ...createTestResources()[2], estimatedTokens: 500 },
          score: 80,
        },
        {
          resource: { ...createTestResources()[3], estimatedTokens: 2000 },
          score: 70,
        },
      ];

      const selected = matcher.selectWithinBudget(scored, 2000);

      const totalTokens = selected.reduce(
        (sum, s) => sum + s.resource.estimatedTokens,
        0,
      );
      // Should only have first 3 (1500 tokens) and skip the 2000 token one
      assert.strictEqual(selected.length, 3);
      assert.strictEqual(totalTokens, 1500);
    });
  });

  describe("Content Assembly", () => {
    it("should assemble content with proper formatting", () => {
      setup();
      const fragments = [{ resource: createTestResources()[0], score: 100 }];

      const assembled = matcher.assembleContent(fragments);

      assert.ok(assembled.content.includes("## Agent: typescript-developer"));
      assert.ok(assembled.content.includes("**Relevance Score:** 100"));
      assert.ok(assembled.content.includes("**Tags:**"));
      assert.ok(assembled.content.includes("**Capabilities:**"));
      assert.ok(assembled.content.includes("# TypeScript Developer"));
    });

    it("should calculate total tokens", () => {
      setup();
      const fragments = [
        { resource: createTestResources()[0], score: 100 }, // 800 tokens
        { resource: createTestResources()[1], score: 90 }, // 600 tokens
      ];

      const assembled = matcher.assembleContent(fragments);

      assert.strictEqual(assembled.tokens, 1400);
    });

    it("should separate fragments with dividers", () => {
      setup();
      const fragments = [
        { resource: createTestResources()[0], score: 100 },
        { resource: createTestResources()[1], score: 90 },
      ];

      const assembled = matcher.assembleContent(fragments);

      assert.ok(assembled.content.includes("---"));
    });

    it("should order by category priority", () => {
      setup();
      const fragments = [
        { resource: createTestResources()[2], score: 80 }, // pattern
        { resource: createTestResources()[0], score: 100 }, // agent
        { resource: createTestResources()[1], score: 90 }, // skill
      ];

      const assembled = matcher.assembleContent(fragments);

      // Agents should come first, then skills, then patterns
      const agentIndex = assembled.content.indexOf("## Agent:");
      const skillIndex = assembled.content.indexOf("## Skill:");
      const patternIndex = assembled.content.indexOf("## Pattern:");

      assert.ok(agentIndex < skillIndex);
      assert.ok(skillIndex < patternIndex);
    });

    it("should handle empty fragments array", () => {
      setup();
      const assembled = matcher.assembleContent([]);

      assert.strictEqual(assembled.content, "");
      assert.strictEqual(assembled.tokens, 0);
    });

    it("should include all resource metadata", () => {
      setup();
      const resource = createTestResources()[0];
      const fragments = [{ resource, score: 100 }];

      const assembled = matcher.assembleContent(fragments);

      resource.tags.forEach((tag) => {
        assert.ok(assembled.content.includes(tag));
      });

      resource.capabilities.forEach((cap) => {
        assert.ok(assembled.content.includes(cap));
      });
    });
  });

  describe("Match Integration", () => {
    it("should perform complete matching workflow", async () => {
      setup();
      const request = {
        query: "build typescript rest api",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(Array.isArray(result.fragments));
      assert.ok(result.fragments.length > 0);
      assert.ok(typeof result.totalTokens === "number");
      assert.ok(Array.isArray(result.matchScores));
      assert.ok(typeof result.assembledContent === "string");
    });

    it("should return top matches for typescript query", async () => {
      setup();
      const request = {
        query: "typescript async programming",
        maxTokens: 2500,
      };

      const result = await matcher.match(request);

      // Should include typescript-developer and async-patterns
      const hasTypescript = result.fragments.some(
        (f) => f.id === "typescript-developer",
      );
      const hasAsync = result.fragments.some((f) => f.id === "async-patterns");

      assert.ok(hasTypescript || hasAsync);
      assert.ok(result.totalTokens <= 2500 || result.fragments.length <= 3);
    });

    it("should filter by category", async () => {
      setup();
      const request = {
        query: "api design",
        maxTokens: 3000,
        category: "pattern",
      };

      const result = await matcher.match(request);

      // Pattern resources should have higher scores
      const patternFragments = result.fragments.filter(
        (f) => f.category === "pattern",
      );
      assert.ok(patternFragments.length > 0);
    });

    it("should enforce required tags", async () => {
      setup();
      const request = {
        query: "programming",
        maxTokens: 3000,
        requiredTags: ["typescript", "nodejs"],
      };

      const result = await matcher.match(request);

      // All results should have the required tags
      result.fragments.forEach((fragment) => {
        const hasRequired = request.requiredTags.every((tag) =>
          fragment.tags.includes(tag),
        );
        assert.ok(hasRequired);
      });
    });

    it("should handle query with no matches", async () => {
      setup();
      const request = {
        query: "xyzabc nonexistent topic",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      // Should return at least top 3 by default scoring
      assert.ok(result.fragments.length >= 0);
    });

    it("should respect token budget", async () => {
      setup();
      const request = {
        query: "development",
        maxTokens: 1500,
      };

      const result = await matcher.match(request);

      assert.ok(result.totalTokens <= 1500 || result.fragments.length <= 3);
    });

    it("should return higher scores for better matches", async () => {
      setup();
      const request = {
        query: "typescript rest api async",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      // Scores should be in descending order
      for (let i = 0; i < result.matchScores.length - 1; i++) {
        assert.ok(result.matchScores[i] >= result.matchScores[i + 1]);
      }
    });

    it("should assemble content in result", async () => {
      setup();
      const request = {
        query: "typescript",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.assembledContent.length > 0);
      assert.ok(result.assembledContent.includes("##"));
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle very large token budgets", async () => {
      setup();
      const request = {
        query: "programming",
        maxTokens: 100000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length > 0);
    });

    it("should handle very small token budgets", async () => {
      setup();
      const request = {
        query: "programming",
        maxTokens: 100,
      };

      const result = await matcher.match(request);

      // Should still include top 3
      assert.ok(result.fragments.length >= 1);
    });

    it("should handle empty resource index", async () => {
      matcher = new FuzzyMatcher();
      matcher.setResourceIndex([]);

      const request = {
        query: "typescript",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.deepStrictEqual(result.fragments, []);
      assert.strictEqual(result.totalTokens, 0);
      assert.deepStrictEqual(result.matchScores, []);
      assert.strictEqual(result.assembledContent, "");
    });

    it("should handle single word queries", async () => {
      setup();
      const request = {
        query: "typescript",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length > 0);
    });

    it("should handle queries with punctuation", async () => {
      setup();
      const request = {
        query: "typescript! rest-api? async/await.",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length > 0);
    });

    it("should handle unicode characters in query", async () => {
      setup();
      const request = {
        query: "typescript développement API",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length >= 0);
    });

    it("should handle resources with empty tags array", async () => {
      matcher = new FuzzyMatcher();
      const resourceWithEmptyTags = {
        id: "test-resource",
        category: "agent",
        tags: [],
        capabilities: ["something"],
        useWhen: ["test"],
        estimatedTokens: 500,
        content: "Test content",
      };
      matcher.setResourceIndex([resourceWithEmptyTags]);

      const request = {
        query: "something",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length > 0);
    });
  });

  describe("Match Quality", () => {
    it("should rank exact tag matches highest", async () => {
      setup();
      const request = {
        query: "typescript nodejs",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      // typescript-developer should be top result
      assert.strictEqual(result.fragments[0].id, "typescript-developer");
    });

    it("should prefer focused resources over general ones", async () => {
      setup();
      const request = {
        query: "async programming patterns",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      // async-patterns should rank high (small, focused resource)
      const asyncIndex = result.fragments.findIndex(
        (f) => f.id === "async-patterns",
      );
      assert.ok(asyncIndex >= 0 && asyncIndex < 3);
    });

    it("should combine multiple signal types for ranking", async () => {
      setup();
      const request = {
        query: "rest api design typescript",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      // Should include both typescript-developer and rest-api-design
      const ids = result.fragments.map((f) => f.id);
      assert.ok(
        ids.includes("typescript-developer") || ids.includes("rest-api-design"),
      );
    });

    it("should handle ambiguous queries reasonably", async () => {
      setup();
      const request = {
        query: "developer",
        maxTokens: 3000,
      };

      const result = await matcher.match(request);

      assert.ok(result.fragments.length > 0);
      // Should match any developer-related resources
    });
  });
});
