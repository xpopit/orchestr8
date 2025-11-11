---
id: workflow-create-plugin
category: pattern
tags: [workflow, plugin-creation, claude-code, mcp, orchestr8, meta, development, autonomous]
capabilities:
  - Complete Claude Code plugin creation with MCP integration
  - Plugin architecture design and implementation
  - Command and resource system setup
useWhen:
  - Claude Code plugin development requiring MCP protocol implementation, tool registration, and plugin manifest configuration
  - Plugin architecture design needing tool definition, resource exposure, and integration with Claude Code CLI
estimatedTokens: 550
---

# Create Claude Code Plugin Pattern

**Phases:** Design (0-20%) → Setup (20-35%) → Implementation (35-80%) → Testing (80-100%)

## Phase 1: Plugin Design (0-20%)
- Define plugin purpose, workflows, and resources
- Design command interface (slash commands)
- Plan MCP integration (prompts vs resources)
- Document plugin architecture (loader pattern, JIT vs upfront)
- **Checkpoint:** Architecture documented, approach approved

## Phase 2: Project Setup (20-35%)
**Parallel tracks:**
- **Structure:** `.claude-plugin/plugin.json`, `.mcp.json`, TypeScript config, directory structure
- **Build:** Package.json scripts (build, test, dev, verify), TypeScript compiler, test framework
- **MCP Server:** Entry point (stdio transport), logger (stderr only), graceful shutdown
- **Checkpoint:** `npm install && npm run build` succeeds

## Phase 3: Core Implementation (35-80%)
**Parallel tracks:**
- **Loaders:** PromptLoader (workflows/agents/skills), ResourceLoader (JIT resources), caching (LRU + TTL)
- **Commands:** Slash commands in `commands/`, argument substitution, JIT resource URIs
- **Resources:** Static resources, fragment system (`_fragments/`), metadata (YAML frontmatter)
- **MCP Integration:** Register prompts/resources, handle requests, protocol compliance
- **Checkpoint:** Plugin loads, commands work, resources accessible

## Phase 4: Testing & Polish (80-100%)
**Parallel tracks:**
- **Testing:** Unit tests (loaders, utils), integration tests (MCP protocol), structure verification
- **Docs:** README, CLAUDE.md (project instructions), command docs, architecture docs
- **Quality:** Error handling, logging (debug mode), cache validation, edge cases
- **Deployment:** Installation instructions, example usage, troubleshooting guide
- **Checkpoint:** Tests pass, docs complete, plugin ready for use

## Parallelism
- **Independent:** Structure + Build + MCP Server (Phase 2), Loaders + Commands + Resources (Phase 3), Testing + Docs + Quality (Phase 4)
- **Dependencies:** Commands need loaders, integration tests need implementation, docs need working plugin

## Key Patterns
- **Stdio compliance:** All logging to stderr, stdout reserved for MCP protocol
- **JIT loading:** Small prompts upfront (2KB), large resources on-demand (50KB+)
- **Caching:** LRU with TTL (prompts 1h, resources 4h)
- **Fragment system:** Small, focused pieces (500-800 tokens) with rich metadata
