# Orchestr8 MCP Server

> **Autonomous software development workflows with dynamic resource matching via Model Context Protocol**

Orchestr8 is a Claude Code plugin that provides just-in-time (JIT) loading of development workflows, AI agents, and reusable patterns through the Model Context Protocol (MCP). This architecture minimizes token usage by loading only what's needed, when it's needed, with intelligent fuzzy matching for dynamic resource discovery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![MCP Protocol](https://img.shields.io/badge/MCP-2024--11--05-blue)](https://modelcontextprotocol.io)

## Features

- **Dynamic Resource Matching**: Fuzzy matching system finds relevant resources based on semantic queries
- **Minimal Token Usage**: Workflows load ~2,000 tokens upfront, reference 50,000+ tokens of resources on-demand
- **Expert AI Agents**: Specialized agents for TypeScript, Python, Go, Rust loaded via dynamic matching
- **Reusable Patterns**: Security, performance, architecture patterns assembled automatically
- **Resource Fragments**: Composable, focused knowledge pieces with metadata for intelligent matching
- **Smart Caching**: LRU caching for frequently accessed resources with 4-hour TTL
- **Hot Reload**: Development mode with automatic reload on file changes

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Code                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Workflows (Auto-loaded, ~2KB each)                  │   │
│  │  - /new-project                                      │   │
│  │  - /add-feature                                      │   │
│  │  - /fix-bug                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                          ├─ Static Reference ──────────┐     │
│                          ├─ Dynamic Matching ──────────┤     │
│                          │                             │     │
│  ┌───────────────────────▼──────────────┐  ┌──────────▼────┐│
│  │    MCP Server (stdio transport)     │  │  Resources     ││
│  │  ┌────────────────────────────────┐ │  │  (On-Demand)   ││
│  │  │  Prompt Loader                 │ │  │                ││
│  │  │  - Workflows from prompts/     │ │  │  Agents        ││
│  │  │  - Argument substitution       │ │  │  Skills        ││
│  │  │  - LRU cache (1hr TTL)         │ │  │  Patterns      ││
│  │  └────────────────────────────────┘ │  │  Examples      ││
│  │  ┌────────────────────────────────┐ │  │  Guides        ││
│  │  │  Resource Loader               │ │  │                ││
│  │  │  - Static URI resolution       │ │  │  _fragments/   ││
│  │  │  - Dynamic fuzzy matching      │ │  │  (Composable)  ││
│  │  │  - Fragment assembly           │ │  │                ││
│  │  │  - LRU cache (4hr TTL)         │ │  └────────────────┘│
│  │  └────────────────────────────────┘ │                     │
│  │  ┌────────────────────────────────┐ │                     │
│  │  │  URI Parser                    │ │                     │
│  │  │  - Static: category/resource   │ │                     │
│  │  │  - Dynamic: match?query=...    │ │                     │
│  │  └────────────────────────────────┘ │                     │
│  │  ┌────────────────────────────────┐ │                     │
│  │  │  Fuzzy Matcher                 │ │                     │
│  │  │  - Keyword extraction          │ │                     │
│  │  │  - Semantic scoring            │ │                     │
│  │  │  - Token budget management     │ │                     │
│  │  │  - Fragment assembly           │ │                     │
│  │  └────────────────────────────────┘ │                     │
│  └──────────────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

**Token Optimization:**
- **Upfront**: 9 workflows × 2KB = 18KB loaded at startup
- **On-Demand**: 200KB+ of resources loaded only when referenced
- **Dynamic Assembly**: 2-5 fragments assembled per query (~2-3KB total)
- **Reduction**: 91-97% reduction in initial context usage

## Dynamic Resource Matching with Fuzzy Matching

### Overview

Orchestr8 uses intelligent fuzzy matching to dynamically discover and assemble relevant resources based on semantic queries. Instead of hard-coding resource references, workflows can request expertise on-demand.

### How It Works

1. **Query Parsing**: Extract keywords from natural language queries
2. **Semantic Scoring**: Match against resource metadata (tags, capabilities, use-cases)
3. **Fragment Selection**: Choose top resources within token budget
4. **Content Assembly**: Combine fragments with clear separators and metadata

### Dynamic URI Format

```
orchestr8://match?query=<search-query>&maxTokens=<budget>&tags=<required-tags>&categories=<filter>
```

**Parameters:**
- `query` (required): Natural language search query
- `maxTokens` (optional, default 3000): Maximum tokens to include in response
- `tags` (optional): Comma-separated required tags
- `categories` (optional): Filter to specific categories (agent, skill, example, pattern)

### Examples

**Find TypeScript API expertise:**
```
orchestr8://match?query=typescript+rest+api+authentication&maxTokens=2500&categories=example,skill
```

**Discover Python async patterns:**
```
orchestr8://match?query=python+async+error+handling&tags=async&maxTokens=2000
```

**Get security best practices:**
```
orchestr8://match?query=authentication+jwt+security+validation&categories=pattern&maxTokens=1500
```

**Find agent for task:**
```
orchestr8://agents/match?query=build+graphql+api+typescript
```

### Scoring Algorithm

Resources are scored based on:
- **Tag matches**: +10 per keyword match in tags
- **Capability matches**: +8 per keyword match in capabilities
- **Use-case matches**: +5 per keyword match in use-when scenarios
- **Category filter**: +15 if matches requested category
- **Size preference**: +5 for focused resources (<1000 tokens)
- **Required tags**: Must have all required tags or score = 0

### Token Budget Management

The fuzzy matcher ensures assembled content stays within budget:
1. Always includes top 3 resources (even if exceeding budget)
2. Adds additional resources only if within budget
3. Stops when using 80%+ of budget after top 3
4. Prioritizes highest-scoring resources first

## Resource Fragments

Resources can be composed of **fragments** - small, focused pieces of knowledge stored in `_fragments/` subdirectories. Fragments enable fine-grained reusability and precise token budgeting.

### Fragment Structure

```
resources/
├── agents/
│   ├── typescript-developer.md       # Main resource
│   └── _fragments/
│       ├── typescript-core.md        # Type system expertise (~650 tokens)
│       ├── typescript-async-patterns.md  # Async patterns (~800 tokens)
│       ├── typescript-testing.md     # Testing patterns (~700 tokens)
│       └── typescript-api-development.md # API patterns (~900 tokens)
```

### Fragment Metadata

Each fragment includes frontmatter for matching:

```yaml
---
id: typescript-core
category: agent
tags: [typescript, types, generics, type-inference]
capabilities:
  - Complex type system design
  - Generic type constraints and inference
  - Conditional and mapped types
use-when:
  - Designing type-safe APIs or libraries
  - Need advanced TypeScript patterns
  - Complex type transformations required
estimated-tokens: 650
---
```

### Fragment Usage

Fragments are automatically discovered and included in fuzzy matching results. The system assembles relevant fragments based on query context, creating customized expertise for each request.

**Example:** Requesting `orchestr8://match?query=typescript+generics+api` might assemble:
1. `typescript-core.md` (type system)
2. `typescript-api-development.md` (API patterns)
3. Total: ~1550 tokens of precisely relevant content

## Installation

### As a Claude Code Plugin

1. Clone or download this repository
2. Open Claude Code settings
3. Navigate to Plugins → Install from Directory
4. Select the `orchestr8` directory

The plugin will automatically:
- Register the MCP server
- Load workflow prompts
- Configure on-demand resource access

### Manual Setup

```bash
# Clone the repository
git clone <repository-url>
cd orchestr8

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Quick Start

### Using Workflows

Workflows are slash commands available in Claude Code:

```bash
# Create a new project with dynamic resource matching
/orchestr8:new-project Build a REST API with authentication and PostgreSQL

# Add a feature
/orchestr8:add-feature Add user profile management with avatar upload

# Fix a bug
/orchestr8:fix-bug Users can't login after password reset

# Refactor code
/orchestr8:refactor Improve error handling in authentication service

# Review code
/orchestr8:review-code Review the entire authentication module

# Security audit
/orchestr8:security-audit Audit the API endpoints for vulnerabilities

# Optimize performance
/orchestr8:optimize-performance Database queries are slow

# Deploy
/orchestr8:deploy Deploy to production with zero downtime

# Setup CI/CD
/orchestr8:setup-cicd Setup GitHub Actions for automated testing
```

### Workflow with Dynamic Resources

When you run a workflow, it can dynamically load relevant expertise:

```markdown
**Task:** Build a TypeScript REST API

**Dynamic Resource Request:**
orchestr8://match?query=typescript+rest+api+authentication&maxTokens=2500

**Result:** System assembles relevant fragments:
- typescript-core.md (type system expertise)
- typescript-api-development.md (API patterns)
- security-authentication.md (auth patterns)
Total: ~2400 tokens of precisely relevant guidance
```

## Project Structure

```
orchestr8/
├── .claude-plugin/          # Plugin metadata
│   └── plugin.json          # Plugin configuration
├── .mcp.json               # MCP server configuration
├── prompts/                # Workflow prompts
│   └── workflows/          # Organized workflows
│       ├── new-project.md
│       ├── add-feature.md
│       ├── fix-bug.md
│       ├── refactor.md
│       ├── review-code.md
│       ├── security-audit.md
│       ├── optimize-performance.md
│       ├── deploy.md
│       └── setup-cicd.md
├── resources/              # On-demand resources
│   ├── agents/            # AI agent definitions
│   │   ├── typescript-developer.md
│   │   └── _fragments/    # Agent knowledge fragments
│   │       ├── typescript-core.md
│   │       ├── typescript-async-patterns.md
│   │       ├── typescript-testing.md
│   │       └── typescript-api-development.md
│   ├── skills/            # Reusable skills
│   │   ├── error-handling.md
│   │   └── _fragments/    # Skill fragments
│   │       ├── error-handling-async.md
│   │       ├── error-handling-validation.md
│   │       ├── api-design-rest.md
│   │       ├── testing-unit.md
│   │       └── testing-integration.md
│   ├── examples/          # Code examples
│   │   ├── typescript/
│   │   │   ├── api-rest.md
│   │   │   └── (subdirectories)
│   │   ├── python/
│   │   ├── go/
│   │   ├── rust/
│   │   └── _fragments/    # Example code fragments
│   │       ├── typescript-express-minimal.md
│   │       ├── typescript-async-patterns.md
│   │       ├── python-fastapi-minimal.md
│   │       └── python-testing-pytest.md
│   ├── patterns/          # Design patterns
│   │   ├── security/
│   │   │   └── authentication.md
│   │   ├── performance/
│   │   ├── deployment/
│   │   └── _fragments/    # Pattern fragments
│   │       ├── architecture-microservices.md
│   │       ├── security-auth-jwt.md
│   │       ├── security-input-validation.md
│   │       ├── performance-caching.md
│   │       └── performance-database.md
│   ├── guides/            # Setup and configuration guides
│   │   ├── architecture/
│   │   │   └── system-design.md
│   │   ├── cicd/
│   │   └── tech-stacks/
│   └── best-practices/    # Code style & standards
│       ├── code-style/
│       └── security/
├── src/                   # Source code
│   ├── index.ts          # MCP server entry point
│   ├── loaders/          # Prompt and resource loaders
│   │   ├── promptLoader.ts
│   │   └── resourceLoader.ts
│   ├── utils/            # Utilities
│   │   ├── logger.ts
│   │   ├── uriParser.ts      # URI parsing (static/dynamic)
│   │   └── fuzzyMatcher.ts   # Dynamic resource matching
│   └── types.ts          # Type definitions
├── tests/                 # Test suites
│   ├── unit/
│   ├── integration/
│   └── verify-structure.sh
├── docs/                  # Documentation
│   ├── architecture/
│   │   └── ARCHITECTURE.md
│   └── guides/
└── dist/                  # Compiled JavaScript (generated)
```

## Development

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- TypeScript >= 5.0.0

### Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch

# Run in development mode with hot reload
npm run dev

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode for tests
npm run test:watch

# Verify project structure
npm run verify

# Clean build artifacts
npm run clean
```

### Adding New Resources

#### 1. Add a Fragment

Create `resources/agents/_fragments/my-fragment.md`:

```markdown
---
id: my-fragment
category: agent
tags: [typescript, advanced, patterns]
capabilities:
  - Advanced TypeScript patterns
  - Generic type design
use-when:
  - Building type-safe libraries
  - Complex type transformations needed
estimated-tokens: 800
---

# My Fragment Content

Detailed content here...
```

#### 2. Add a Full Resource

Create `resources/agents/my-agent.md`:

```markdown
# My Agent Name

Expert in [domain] specializing in [specifics]...

## Core Capabilities
- Capability 1
- Capability 2

## References
**→ Fragment:** Uses knowledge from `_fragments/my-fragment.md`
```

#### 3. Use in Workflow (Static Reference)

```markdown
**→ Reference:** `orchestr8://agents/my-agent`
```

#### 4. Use in Workflow (Dynamic Matching)

```markdown
**→ Dynamic Resource:** `orchestr8://match?query=typescript+advanced+patterns&maxTokens=2000`
```

The system automatically discovers and indexes new resources on startup.

## Configuration

### Environment Variables

```bash
# Path to prompts directory (default: ./prompts)
PROMPTS_PATH=./prompts

# Path to resources directory (default: ./resources)
RESOURCES_PATH=./resources

# LRU cache size (default: 200)
CACHE_SIZE=200

# Log level: debug, info, warn, error (default: info)
LOG_LEVEL=info

# Environment: development, production, test
NODE_ENV=production
```

### MCP Server Configuration

The MCP server is configured in `.mcp.json`:

```json
{
  "orchestr8-resources": {
    "command": "node",
    "args": ["${CLAUDE_PLUGIN_ROOT}/dist/index.js"],
    "env": {
      "PROMPTS_PATH": "${CLAUDE_PLUGIN_ROOT}/prompts",
      "RESOURCES_PATH": "${CLAUDE_PLUGIN_ROOT}/resources",
      "LOG_LEVEL": "info"
    }
  }
}
```

## Performance

### Caching Strategy

- **Prompt Cache**: LRU, 1 hour TTL, 100 items
- **Resource Cache**: LRU, 4 hour TTL, 200 items
- **Index Cache**: In-memory, loaded once at startup
- **Cache Keys**: Include arguments to support variations

### Benchmarks

| Operation | Time | Cache Hit |
|-----------|------|-----------|
| Prompt load (cold) | ~5ms | No |
| Prompt load (cached) | <1ms | Yes |
| Resource load (cold) | ~8ms | No |
| Resource load (cached) | <1ms | Yes |
| Dynamic matching (cold) | ~15ms | No |
| Dynamic matching (cached) | <1ms | Yes |
| Server initialization | ~50ms | N/A |
| Index loading | ~100ms | Once |

### Fuzzy Matching Performance

- **Index Size**: 200+ fragments (~50KB metadata)
- **Query Processing**: <5ms (keyword extraction + scoring)
- **Fragment Assembly**: <10ms (selection + composition)
- **Total**: ~15ms for dynamic resource discovery

## Troubleshooting

### Server won't start

```bash
# Check that TypeScript is compiled
npm run build

# Verify structure
npm run verify

# Check logs
LOG_LEVEL=debug node dist/index.js
```

### Prompts not appearing

1. Ensure prompts are in `prompts/workflows/` directory
2. Check frontmatter format (YAML)
3. Rebuild: `npm run build`
4. Restart Claude Code

### Resources not loading

1. Verify resources are in `resources/{category}/` directories
2. Check URI format: `orchestr8://agents/agent-name`
3. Ensure files have `.md` extension
4. Check server logs

### Dynamic matching returns no results

1. Check query keywords - try broader terms
2. Verify resource fragments have proper metadata (tags, capabilities)
3. Check category filter - might be too restrictive
4. Increase maxTokens budget
5. Enable debug logging: `LOG_LEVEL=debug`

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for:
- Code style guidelines
- Pull request process
- Development workflow
- Testing requirements

## Documentation

- [Architecture Overview](docs/architecture/ARCHITECTURE.md) - Deep dive into design and implementation
- [Installation Guide](docs/guides/installation.md) - Detailed setup instructions
- [Quick Start Guide](docs/guides/quickstart.md) - Get up and running fast
- [Testing Guide](docs/guides/testing.md) - Comprehensive testing documentation

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built on [Model Context Protocol](https://modelcontextprotocol.io)
- Powered by [Claude Code](https://docs.claude.com/en/docs/claude-code)
- Uses [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

---

**Questions?** Open an issue or check the [documentation](docs/).
