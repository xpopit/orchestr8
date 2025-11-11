# Orchestr8 MCP Server - Usage Guide

## Quick Start

### 1. Build the Project

```bash
cd plugins/orchestr8
npm install
npm run build
```

### 2. Install the Command

```bash
# Copy the /now command to Claude Code
mkdir -p ~/.claude/commands
cp commands/now.md ~/.claude/commands/
```

### 3. Configure MCP Server

Ensure your MCP configuration includes Orchestr8:

**~/.mcp.json or claude_desktop_config.json:**
```json
{
  "mcpServers": {
    "orchestr8": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/Projects/orchestr8-mcp/plugins/orchestr8/dist/index.js"],
      "env": {
        "PROMPTS_PATH": "/Users/YOUR_USERNAME/Projects/orchestr8-mcp/plugins/orchestr8/prompts",
        "RESOURCES_PATH": "/Users/YOUR_USERNAME/Projects/orchestr8-mcp/plugins/orchestr8/resources"
      }
    }
  }
}
```

### 4. Use the `/now` Command

In Claude Code:

```bash
/now "build a TypeScript REST API with authentication"
```

## Examples

### Full-Stack Application

```bash
/now "build a full-stack task manager with React frontend, Express backend, and PostgreSQL database"
```

**What happens:**
- Loads TypeScript/React/Express expert agents
- Loads full-stack architecture patterns
- Loads authentication and database skills
- Executes with 3 parallel tracks:
  - Track A: React frontend
  - Track B: Express backend
  - Track C: PostgreSQL database setup

### API Development

```bash
/now "create REST API with JWT authentication, rate limiting, and comprehensive error handling"
```

**What happens:**
- Loads API design agent
- Loads authentication patterns (JWT)
- Loads security patterns (rate limiting)
- Loads error handling skills
- Executes with phased delivery:
  - Phase 1: Basic endpoints
  - Phase 2: Authentication
  - Phase 3: Rate limiting and polish

### Refactoring

```bash
/now "refactor this Express application to use dependency injection and improve testability"
```

**What happens:**
- Loads refactoring agent
- Loads dependency injection patterns
- Loads testing best practices
- Analyzes current code
- Implements refactoring with tests

### Data Pipeline

```bash
/now "build Python data pipeline that reads from Kafka, processes with pandas, and writes to PostgreSQL"
```

**What happens:**
- Loads Python expert agent
- Loads Kafka integration skills
- Loads pandas data processing skills
- Loads PostgreSQL skills
- Executes with error handling and monitoring

## How It Works

### Dynamic Resource Assembly

1. **User Input:**
   ```bash
   /now "build TypeScript REST API"
   ```

2. **Command Loads:**
   ```markdown
   **→ Load Dynamic Expertise:** 
   orchestr8://match?query=build+TypeScript+REST+API&categories=agent,skill,pattern,workflow&maxTokens=4000
   ```

3. **MCP Server Processes:**
   - URIParser extracts: `query="build TypeScript REST API"`
   - FuzzyMatcher scores all resources:
     - `typescript-expert`: score 45 (tags: typescript, node)
     - `api-design-rest`: score 38 (tags: api, rest)
     - `autonomous-parallel`: score 25 (tags: workflow, parallel)
   - Selects top resources within 4000 token budget

4. **Assembled Content:**
   ```markdown
   ## Agent: TypeScript Expert
   **Capabilities:** TypeScript, Node.js, Express...
   
   ## Skill: REST API Design
   **Instructions:** RESTful patterns, routing...
   
   ## Pattern: Autonomous Parallel Workflow
   **Instructions:** Break into tracks, execute concurrently...
   ```

5. **Claude Executes:**
   - Follows assembled workflow
   - Launches parallel subagents if specified
   - Tracks progress with TodoWrite
   - Delivers complete solution

### Token Efficiency

**Traditional approach:**
- Load all agents: 15KB
- Load all skills: 20KB  
- Load all patterns: 10KB
- **Total: 45KB (~11,250 tokens)**

**Orchestr8 approach:**
- Load command: 1KB
- Dynamic assembly: 4KB (only relevant resources)
- **Total: 5KB (~1,250 tokens)**
- **Savings: 89%** ✅

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User: /now "build TypeScript API"                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Command (now.md)                                             │
│ - Substitutes $ARGUMENTS                                     │
│ - Contains: orchestr8://match?query=${ARGUMENTS}...         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Orchestr8 MCP Server                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ URIParser: Parses dynamic URI                           │ │
│ │   - Extracts query: "build TypeScript API"             │ │
│ │   - Extracts params: categories, maxTokens             │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ResourceLoader: Loads resource index                    │ │
│ │   - Scans resources/ directory (parallel)              │ │
│ │   - Extracts metadata from frontmatter                 │ │
│ │   - Builds in-memory index (cached)                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ FuzzyMatcher: Scores and selects resources             │ │
│ │   - Extracts keywords: [build, typescript, api]        │ │
│ │   - Scores all resources by relevance                  │ │
│ │   - Selects top within token budget                    │ │
│ │   - Assembles content with metadata                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Receives Assembled Workflow                           │
│ - TypeScript expert agent                                    │
│ - REST API design skills                                     │
│ - Parallel execution workflow pattern                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Claude Executes Autonomously                                 │
│ - Analyzes requirements                                      │
│ - Breaks into parallel tracks (if applicable)                │
│ - Launches subagents via Task tool                           │
│ - Tracks progress via TodoWrite                              │
│ - Integrates results                                         │
│ - Delivers complete solution                                 │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

### Writing Effective Requests

**Good:**
```bash
/now "build REST API with PostgreSQL and JWT auth"
```
- Clear technologies specified
- Concrete deliverable

**Better:**
```bash
/now "build TypeScript REST API with PostgreSQL database, JWT authentication, rate limiting, input validation, and comprehensive error handling"
```
- Very specific requirements
- Better fuzzy matching
- More relevant resources loaded

**Avoid:**
```bash
/now "make it better"
```
- Too vague
- Won't match specific expertise
- Results may not be relevant

### When to Use `/now`

✅ **Use for:**
- Complex multi-component projects
- Tasks requiring multiple expertise areas
- Work that can be parallelized
- Autonomous execution without micro-management

❌ **Don't use for:**
- Simple single-file edits
- Exploratory coding (use conversation)
- Tasks needing human decisions at each step

## Adding New Resources

### 1. Create Resource File

```bash
# Create new agent
cat > resources/agents/rust-developer.md << 'EOF'
---
id: rust-developer
category: agent
tags: [rust, systems, performance, safety]
capabilities:
  - Rust programming
  - Memory safety
  - Concurrent programming
useWhen:
  - Building systems software
  - Need memory safety without GC
  - High-performance applications
estimatedTokens: 800
---

# Rust Developer Agent

Expert in Rust programming with focus on memory safety...
EOF
```

### 2. Rebuild

```bash
npm run build
```

### 3. Test

```bash
# In Claude Code
/now "build a high-performance web server in Rust"
```

The new resource is automatically indexed and available!

## Performance

- **Fuzzy matching:** < 0.1ms for 100 resources
- **Resource assembly:** < 1ms
- **Token savings:** 91-97% vs. loading everything
- **Cache hit:** < 1ms for repeated queries

## Troubleshooting

### Command Not Found

```bash
# Verify file location
ls -la ~/.claude/commands/now.md

# Verify permissions
chmod 644 ~/.claude/commands/now.md
```

### MCP Server Not Responding

```bash
# Test the server
cd plugins/orchestr8
npm run build
npm test

# Check MCP configuration paths are correct
cat ~/.mcp.json
```

### No Relevant Resources

Add more specific terms to your request:
- Include technology names (TypeScript, Python, React)
- Specify patterns (REST, microservices, JWT)
- Mention requirements (authentication, testing, error handling)

## Next Steps

1. **Try the examples** - Run the `/now` command with different requests
2. **Add resources** - Create agents, skills, and patterns for your domain
3. **Create commands** - Build specialized commands for your workflows
4. **Monitor performance** - Run `npm run benchmark` to see performance metrics

See `CLAUDE.md` for complete architecture documentation.
