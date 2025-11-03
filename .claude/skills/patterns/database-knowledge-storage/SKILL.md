---
name: database-knowledge-storage
description: Expertise in storing and retrieving agent knowledge using the orchestr8 intelligence database. Auto-activates when agents need to learn from experience, store best practices, or query historical knowledge. Enables continuous learning and knowledge accumulation.
autoActivationContext:
  - agent learning
  - knowledge management
  - best practices
  - pattern recognition
  - experience sharing
---

# Database Knowledge Storage Skill

This skill teaches agents how to store, retrieve, and leverage accumulated knowledge for continuous improvement.

## What Knowledge to Store

### Store these types of knowledge:

**1. Successful Patterns**
```bash
# ✅ DO: Store proven implementation patterns
source .claude/lib/db-helpers.sh

db_store_knowledge \
  "backend-developer" \
  "pattern" \
  "REST API authentication with JWT" \
  "Use middleware to verify JWT tokens before route handlers. Extract user ID from token payload and attach to request object." \
  "app.use('/api', verifyJWT); function verifyJWT(req, res, next) { const token = req.headers.authorization?.split(' ')[1]; const decoded = jwt.verify(token, SECRET); req.userId = decoded.userId; next(); }"
```

**2. Anti-Patterns (Things to Avoid)**
```bash
# ✅ DO: Store anti-patterns to prevent repeated mistakes
db_store_knowledge \
  "security-auditor" \
  "anti-pattern" \
  "SQL injection vulnerability" \
  "Never concatenate user input directly into SQL queries. Always use parameterized queries or ORMs." \
  "// BAD: db.query('SELECT * FROM users WHERE id = ' + userId); // GOOD: db.query('SELECT * FROM users WHERE id = ?', [userId]);"
```

**3. Best Practices**
```bash
# ✅ DO: Codify best practices from successful executions
db_store_knowledge \
  "test-engineer" \
  "best-practice" \
  "test organization for REST APIs" \
  "Group tests by endpoint, then by HTTP method, then by scenario (success, validation errors, auth errors). Use descriptive test names." \
  "describe('POST /api/users', () => { describe('success cases', () => { it('should create user with valid data', ...); }); describe('validation errors', () => { it('should reject invalid email', ...); }); });"
```

**4. Performance Optimizations**
```bash
# ✅ DO: Store performance improvements for reuse
db_store_knowledge \
  "performance-analyzer" \
  "optimization" \
  "database query optimization for user listings" \
  "Add compound index on (status, created_at) for user listing queries that filter by status and sort by date. Reduced query time from 2.3s to 45ms." \
  "CREATE INDEX idx_users_status_created ON users(status, created_at DESC);"
```

**5. Troubleshooting Solutions**
```bash
# ✅ DO: Store solutions to common problems
db_store_knowledge \
  "docker-specialist" \
  "troubleshooting" \
  "Docker container cannot connect to host database" \
  "Use host.docker.internal instead of localhost to connect from container to host database on macOS/Windows. On Linux, use --network=host or bridge networking." \
  "DB_HOST=host.docker.internal DB_PORT=5432"
```

### DON'T Store:
```bash
# ❌ DON'T: Store project-specific implementation details
db_store_knowledge \
  "frontend-developer" \
  "pattern" \
  "acme-corp login page styling" \
  "Use #FF5733 for buttons and Roboto font" \
  "..."
# Problem: Too specific, not reusable across projects

# ❌ DON'T: Store obvious/trivial knowledge
db_store_knowledge \
  "fullstack-developer" \
  "pattern" \
  "how to import modules in JavaScript" \
  "Use import statement" \
  "import { foo } from './bar';"
# Problem: Basic language knowledge, clutters database
```

## How to Structure Knowledge for Reusability

### Use Clear, Searchable Contexts

```bash
# ✅ DO: Use technology-specific contexts
db_store_knowledge \
  "backend-developer" \
  "pattern" \
  "Express.js error handling middleware" \
  "Error handling middleware must have 4 parameters (err, req, res, next). Place after all routes." \
  "app.use((err, req, res, next) => { res.status(err.status || 500).json({ error: err.message }); });"

# ✅ DO: Use problem-domain contexts
db_store_knowledge \
  "architect" \
  "pattern" \
  "microservices inter-service communication" \
  "Use async message queues (RabbitMQ/Kafka) for non-critical operations. Use synchronous HTTP/gRPC for critical read operations." \
  "await messageQueue.publish('user.created', { userId: user.id });"
```

```bash
# ❌ DON'T: Use vague contexts
db_store_knowledge \
  "developer" \
  "pattern" \
  "fix the thing" \
  "Do it better" \
  "..."
# Problem: Unsearchable, no context, useless for retrieval
```

### Include Concrete Code Examples

```bash
# ✅ DO: Provide complete, runnable examples
db_store_knowledge \
  "api-designer" \
  "pattern" \
  "GraphQL pagination with cursor-based approach" \
  "Use cursor-based pagination for GraphQL lists. Return pageInfo with hasNextPage and cursor. More efficient than offset pagination." \
  "type Query { users(first: Int!, after: String): UserConnection } type UserConnection { edges: [UserEdge!]! pageInfo: PageInfo! } type PageInfo { hasNextPage: Boolean! endCursor: String }"
```

```bash
# ❌ DON'T: Store knowledge without examples
db_store_knowledge \
  "api-designer" \
  "pattern" \
  "use pagination" \
  "Paginate large result sets" \
  ""
# Problem: No guidance on HOW to implement
```

## When to Update Confidence Scores

### Increment confidence when knowledge helps solve a problem:

```bash
# ✅ DO: Update confidence after successful application
# 1. Query knowledge
knowledge=$(db_query_knowledge "test-engineer" "API testing" 10)

# 2. Extract knowledge ID (first field)
knowledge_id=$(echo "$knowledge" | head -1 | cut -d'|' -f1)

# 3. Apply knowledge to solve problem
# ... (implementation) ...

# 4. If successful, increment confidence
if [ $? -eq 0 ]; then
  db_update_knowledge_confidence "$knowledge_id" 1
  echo "✅ Knowledge applied successfully. Confidence increased."
fi
```

### Decrement confidence when knowledge fails:

```bash
# ✅ DO: Decrease confidence when pattern doesn't work
knowledge_id=42

# Try applying knowledge
apply_pattern_from_knowledge "$knowledge_id"

# If it failed
if [ $? -ne 0 ]; then
  db_update_knowledge_confidence "$knowledge_id" 0
  echo "⚠️  Knowledge did not solve problem. Confidence decreased."

  # Log why it failed for future learning
  db_log_error \
    "pattern-failed" \
    "GraphQL pagination pattern did not work for this use case" \
    "knowledge-application" \
    "api/users.graphql" \
    42
fi
```

### Complete confidence tracking example:

```bash
#!/usr/bin/env bash
# Apply knowledge with confidence tracking

source .claude/lib/db-helpers.sh

apply_knowledge_with_tracking() {
  local agent_name="$1"
  local context_pattern="$2"

  # Query high-confidence knowledge
  knowledge=$(db_query_knowledge "$agent_name" "$context_pattern" 5)

  if [ -z "$knowledge" ]; then
    echo "No relevant knowledge found for: $context_pattern"
    return 1
  fi

  echo "Found relevant knowledge:"
  echo "$knowledge" | while IFS='|' read -r type ctx knowledge_text code confidence usage; do
    echo "  - [$type] $ctx (confidence: $confidence, used: $usage times)"
  done

  # Get highest confidence entry
  best_knowledge=$(echo "$knowledge" | head -1)
  knowledge_id=$(sqlite3 "$DB_PATH" "SELECT id FROM agent_knowledge WHERE agent_name='$agent_name' AND context LIKE '%$context_pattern%' ORDER BY confidence DESC LIMIT 1;")

  # Extract and apply code example
  code_example=$(echo "$best_knowledge" | cut -d'|' -f4)

  echo "Applying knowledge pattern..."
  # ... apply the pattern ...

  # Track success/failure
  if apply_pattern "$code_example"; then
    db_update_knowledge_confidence "$knowledge_id" 1
    echo "✅ Success! Confidence updated."
    return 0
  else
    db_update_knowledge_confidence "$knowledge_id" 0
    echo "❌ Failed. Confidence decreased."
    return 1
  fi
}

apply_knowledge_with_tracking "backend-developer" "JWT authentication"
```

## How to Query Knowledge Effectively

### Query by agent and context:

```bash
# ✅ DO: Query relevant knowledge before implementing
knowledge=$(db_query_knowledge "security-auditor" "input validation" 10)

if [ -n "$knowledge" ]; then
  echo "=== Relevant Security Knowledge ==="
  echo "$knowledge" | while IFS='|' read -r type ctx text code conf usage; do
    echo ""
    echo "Type: $type"
    echo "Context: $ctx"
    echo "Knowledge: $text"
    echo "Confidence: $conf"
    if [ -n "$code" ]; then
      echo "Example:"
      echo "$code"
    fi
  done
fi
```

### Cross-agent knowledge sharing:

```bash
# ✅ DO: Query knowledge from related agents
echo "=== Gathering knowledge from multiple agents ==="

# Backend patterns
backend_knowledge=$(db_query_knowledge "backend-developer" "authentication" 5)

# Security considerations
security_knowledge=$(db_query_knowledge "security-auditor" "authentication" 5)

# Testing strategies
test_knowledge=$(db_query_knowledge "test-engineer" "authentication" 5)

# Synthesize knowledge from all sources
echo "Backend Patterns: $(echo "$backend_knowledge" | wc -l) entries"
echo "Security Considerations: $(echo "$security_knowledge" | wc -l) entries"
echo "Testing Strategies: $(echo "$test_knowledge" | wc -l) entries"
```

### Filter by confidence threshold:

```bash
# ✅ DO: Only use high-confidence knowledge
# db_query_knowledge already filters confidence > 0.7

# For even higher confidence, post-filter:
high_confidence=$(db_query_knowledge "architect" "microservices" 20 | \
  awk -F'|' '$5 > 0.9 { print }')

echo "High-confidence architectural patterns:"
echo "$high_confidence"
```

## Knowledge Evolution Example

```bash
#!/usr/bin/env bash
# Example: Agent learns and improves over time

source .claude/lib/db-helpers.sh

# Initial knowledge storage (first time solving a problem)
db_store_knowledge \
  "database-specialist" \
  "optimization" \
  "PostgreSQL slow queries on large tables" \
  "Add index on frequently filtered columns. Use EXPLAIN ANALYZE to verify." \
  "CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);"

# Later, agent applies this knowledge
knowledge=$(db_query_knowledge "database-specialist" "PostgreSQL slow queries" 1)
knowledge_id=$(sqlite3 "$DB_PATH" "SELECT id FROM agent_knowledge WHERE agent_name='database-specialist' AND context LIKE '%PostgreSQL slow%' LIMIT 1;")

# Success! Update confidence
db_update_knowledge_confidence "$knowledge_id" 1

# Much later, pattern evolves with new learning
db_store_knowledge \
  "database-specialist" \
  "optimization" \
  "PostgreSQL slow queries on large tables" \
  "Add index on filtered columns. For time-based queries, use BRIN indexes for better space efficiency on large tables. Use EXPLAIN ANALYZE to verify." \
  "CREATE INDEX idx_orders_user_created ON orders USING BRIN(created_at); CREATE INDEX idx_orders_user ON orders(user_id);"
# Note: ON CONFLICT clause in db_store_knowledge updates existing entry
```

## Best Practices Summary

### DO
- ✅ Store reusable patterns, not project-specific details
- ✅ Include concrete, runnable code examples
- ✅ Use technology-specific or problem-domain contexts
- ✅ Update confidence scores after applying knowledge
- ✅ Query knowledge before implementing new features
- ✅ Share knowledge across related agents
- ✅ Store anti-patterns to prevent mistakes
- ✅ Document WHY, not just WHAT

### DON'T
- ❌ Store trivial or obvious knowledge
- ❌ Use vague or unsearchable contexts
- ❌ Store knowledge without code examples
- ❌ Forget to update confidence scores
- ❌ Ignore low-confidence knowledge (it indicates uncertainty)
- ❌ Store secrets or credentials as knowledge
- ❌ Duplicate knowledge with slight variations

## Knowledge Quality Metrics

Monitor knowledge effectiveness:

```bash
# Find most useful knowledge
sqlite3 "$DB_PATH" <<EOF
SELECT agent_name,
       context,
       knowledge_type,
       confidence,
       usage_count,
       success_count * 1.0 / NULLIF(usage_count, 0) as success_rate
FROM agent_knowledge
WHERE usage_count > 5
ORDER BY success_rate DESC, usage_count DESC
LIMIT 10;
EOF
```

This helps identify the most valuable knowledge to share and improve.
