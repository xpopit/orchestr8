/**
 * Unit tests for URIParser
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");

// Test the compiled version
const { URIParser } = require("../../dist/utils/uriParser.js");

describe("URIParser", () => {
  let parser;

  // Setup
  const setup = () => {
    parser = new URIParser();
  };

  describe("Static URI Parsing", () => {
    it("should parse simple static URI with category and resource ID", () => {
      setup();
      const uri = "orchestr8://agents/typescript-developer";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.category, "agents");
      assert.strictEqual(result.resourceId, "typescript-developer");
    });

    it("should parse static URI with multi-part resource ID", () => {
      setup();
      const uri = "orchestr8://patterns/rest-api/authentication";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.category, "patterns");
      assert.strictEqual(result.resourceId, "rest-api/authentication");
    });

    it("should parse static URI with different categories", () => {
      setup();
      const categories = ["agents", "skills", "patterns", "examples"];

      categories.forEach((category) => {
        const uri = `orchestr8://${category}/test-resource`;
        const result = parser.parse(uri);

        assert.strictEqual(result.type, "static");
        assert.strictEqual(result.category, category);
        assert.strictEqual(result.resourceId, "test-resource");
      });
    });

    it("should throw error for static URI with missing resource ID", () => {
      setup();
      const uri = "orchestr8://agents/";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid static URI/);
    });

    it("should throw error for static URI with only category", () => {
      setup();
      const uri = "orchestr8://agents";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid static URI format/);
    });
  });

  describe("Dynamic URI Parsing", () => {
    it("should parse dynamic URI with required query parameter", () => {
      setup();
      const uri = "orchestr8://agents/match?query=build+api";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "dynamic");
      assert.strictEqual(result.category, "agents");
      assert.strictEqual(result.matchParams.query, "build api");
      assert.strictEqual(result.matchParams.maxTokens, 3000); // default
    });

    it("should parse dynamic URI with all query parameters", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=typescript+developer&maxTokens=2000&tags=typescript,async&categories=agents,skills";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "dynamic");
      assert.strictEqual(result.category, "agents");
      assert.strictEqual(result.matchParams.query, "typescript developer");
      assert.strictEqual(result.matchParams.maxTokens, 2000);
      assert.deepStrictEqual(result.matchParams.tags, ["typescript", "async"]);
      assert.deepStrictEqual(result.matchParams.categories, [
        "agents",
        "skills",
      ]);
    });

    it("should parse dynamic URI without category prefix", () => {
      setup();
      const uri = "orchestr8://match?query=build+rest+api";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "dynamic");
      assert.strictEqual(result.category, undefined);
      assert.strictEqual(result.matchParams.query, "build rest api");
    });

    it("should decode URL-encoded query string", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=build%20typescript%20REST%20API";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "build typescript REST API");
    });

    it("should handle plus signs as spaces in query", () => {
      setup();
      const uri = "orchestr8://match?query=how+to+build+an+API";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "how to build an API");
    });

    it("should parse tags as comma-separated array", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=test&tags=typescript,nodejs,async,rest-api";
      const result = parser.parse(uri);

      assert.deepStrictEqual(result.matchParams.tags, [
        "typescript",
        "nodejs",
        "async",
        "rest-api",
      ]);
    });

    it("should trim whitespace from tags", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=test&tags=typescript, nodejs , async";
      const result = parser.parse(uri);

      assert.deepStrictEqual(result.matchParams.tags, [
        "typescript",
        "nodejs",
        "async",
      ]);
    });

    it("should filter out empty tags", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=test&tags=typescript,,nodejs,";
      const result = parser.parse(uri);

      assert.deepStrictEqual(result.matchParams.tags, ["typescript", "nodejs"]);
    });

    it("should parse categories as comma-separated array", () => {
      setup();
      const uri =
        "orchestr8://match?query=test&categories=agents,skills,patterns";
      const result = parser.parse(uri);

      assert.deepStrictEqual(result.matchParams.categories, [
        "agents",
        "skills",
        "patterns",
      ]);
    });

    it("should use default maxTokens when not provided", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.maxTokens, 3000);
    });

    it("should parse custom maxTokens", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=5000";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.maxTokens, 5000);
    });

    it("should throw error for missing query parameter", () => {
      setup();
      const uri = "orchestr8://agents/match?maxTokens=2000";

      assert.throws(() => {
        parser.parse(uri);
      }, /"query" parameter is required/);
    });

    it("should throw error for empty query parameter", () => {
      setup();
      const uri = "orchestr8://agents/match?query=";

      assert.throws(() => {
        parser.parse(uri);
      }, /"query" parameter is required/);
    });

    it("should parse URI with /match but no query as static URI", () => {
      setup();
      const uri = "orchestr8://agents/match";

      // Without '?', this is treated as a static URI with resourceId 'match'
      const result = parser.parse(uri);
      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.category, "agents");
      assert.strictEqual(result.resourceId, "match");
    });

    it("should throw error for invalid maxTokens", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=invalid";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid maxTokens parameter/);
    });

    it("should throw error for maxTokens with non-numeric value", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=abc123";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid maxTokens parameter/);
    });
  });

  describe("Invalid URI Handling", () => {
    it("should throw error for invalid protocol", () => {
      setup();
      const uri = "http://agents/typescript-developer";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid URI protocol/);
    });

    it("should throw error for missing protocol", () => {
      setup();
      const uri = "agents/typescript-developer";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid URI protocol/);
    });

    it("should throw error for wrong protocol", () => {
      setup();
      const uri = "orchestr9://agents/test";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid URI protocol/);
    });

    it("should throw error for empty URI after protocol", () => {
      setup();
      const uri = "orchestr8://";

      assert.throws(() => {
        parser.parse(uri);
      }, /Invalid static URI format/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle query with special characters", () => {
      setup();
      const uri = "orchestr8://agents/match?query=build+API+with+C%23+and+.NET";
      const result = parser.parse(uri);

      assert.strictEqual(
        result.matchParams.query,
        "build API with C# and .NET",
      );
    });

    it("should handle resource ID with hyphens and underscores", () => {
      setup();
      const uri = "orchestr8://agents/typescript-rest_api-developer";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.resourceId, "typescript-rest_api-developer");
    });

    it("should handle query with numbers", () => {
      setup();
      const uri = "orchestr8://match?query=nodejs+v18+features";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "nodejs v18 features");
    });

    it("should handle very long query strings", () => {
      setup();
      const longQuery = "word+".repeat(100) + "end";
      const uri = `orchestr8://match?query=${longQuery}`;
      const result = parser.parse(uri);

      assert.ok(result.matchParams.query.length > 100);
      assert.ok(result.matchParams.query.includes("word"));
    });

    it("should handle maxTokens as zero", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=0";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.maxTokens, 0);
    });

    it("should handle single tag", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&tags=typescript";
      const result = parser.parse(uri);

      assert.deepStrictEqual(result.matchParams.tags, ["typescript"]);
    });

    it("should handle undefined tags when not provided", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.tags, undefined);
    });

    it("should handle undefined categories when not provided", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.categories, undefined);
    });

    it("should handle empty tags parameter", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&tags=";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.tags, undefined);
    });

    it("should handle query with multiple consecutive spaces", () => {
      setup();
      const uri = "orchestr8://match?query=build+++++api";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "build     api");
    });
  });

  describe("URI Type Detection", () => {
    it("should detect static URI correctly", () => {
      setup();
      const uri = "orchestr8://agents/typescript-developer";

      assert.strictEqual(parser.isStaticURI(uri), true);
      assert.strictEqual(parser.isDynamicURI(uri), false);
    });

    it("should detect dynamic URI correctly", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test";

      assert.strictEqual(parser.isDynamicURI(uri), true);
      assert.strictEqual(parser.isStaticURI(uri), false);
    });

    it("should detect dynamic URI without category", () => {
      setup();
      const uri = "orchestr8://match?query=test";

      assert.strictEqual(parser.isDynamicURI(uri), true);
      assert.strictEqual(parser.isStaticURI(uri), false);
    });

    it("should handle URI without protocol in detection methods", () => {
      setup();
      const staticPath = "agents/typescript-developer";
      const dynamicPath = "agents/match?query=test";

      assert.strictEqual(parser.isStaticURI(staticPath), true);
      assert.strictEqual(parser.isDynamicURI(dynamicPath), true);
    });
  });

  describe("Query Parameter Edge Cases", () => {
    it("should handle query parameter with ampersand in encoded form", () => {
      setup();
      const uri = "orchestr8://match?query=test%26more";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "test&more");
    });

    it("should handle multiple query parameters in any order", () => {
      setup();
      const uri =
        "orchestr8://match?tags=typescript&query=test&maxTokens=1000&categories=agents";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.query, "test");
      assert.strictEqual(result.matchParams.maxTokens, 1000);
      assert.deepStrictEqual(result.matchParams.tags, ["typescript"]);
      assert.deepStrictEqual(result.matchParams.categories, ["agents"]);
    });

    it("should handle duplicate query parameters (takes first)", () => {
      setup();
      const uri = "orchestr8://match?query=first&query=second";
      const result = parser.parse(uri);

      // URLSearchParams.get() returns the first value
      assert.strictEqual(result.matchParams.query, "first");
    });

    it("should handle maxTokens as string number", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=2500";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.maxTokens, 2500);
      assert.strictEqual(typeof result.matchParams.maxTokens, "number");
    });

    it("should parse large maxTokens value", () => {
      setup();
      const uri = "orchestr8://agents/match?query=test&maxTokens=100000";
      const result = parser.parse(uri);

      assert.strictEqual(result.matchParams.maxTokens, 100000);
    });
  });

  describe("Real-world URI Examples", () => {
    it("should parse typical agent query URI", () => {
      setup();
      const uri =
        "orchestr8://agents/match?query=build+typescript+rest+api&maxTokens=2500&tags=typescript,rest-api";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "dynamic");
      assert.strictEqual(result.category, "agents");
      assert.strictEqual(result.matchParams.query, "build typescript rest api");
      assert.strictEqual(result.matchParams.maxTokens, 2500);
      assert.deepStrictEqual(result.matchParams.tags, [
        "typescript",
        "rest-api",
      ]);
    });

    it("should parse cross-category search URI", () => {
      setup();
      const uri =
        "orchestr8://match?query=authentication+patterns&categories=patterns,examples&maxTokens=4000";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "dynamic");
      assert.strictEqual(result.category, undefined);
      assert.strictEqual(result.matchParams.query, "authentication patterns");
      assert.deepStrictEqual(result.matchParams.categories, [
        "patterns",
        "examples",
      ]);
      assert.strictEqual(result.matchParams.maxTokens, 4000);
    });

    it("should parse skill lookup URI", () => {
      setup();
      const uri = "orchestr8://skills/database-query-optimization";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.category, "skills");
      assert.strictEqual(result.resourceId, "database-query-optimization");
    });

    it("should parse pattern with nested path", () => {
      setup();
      const uri = "orchestr8://patterns/rest-api/authentication/jwt";
      const result = parser.parse(uri);

      assert.strictEqual(result.type, "static");
      assert.strictEqual(result.category, "patterns");
      assert.strictEqual(result.resourceId, "rest-api/authentication/jwt");
    });
  });
});
