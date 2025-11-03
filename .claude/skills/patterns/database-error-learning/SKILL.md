---
name: database-error-learning
description: Expertise in logging errors and learning from failures using the orchestr8 intelligence database. Auto-activates when handling errors, debugging issues, or analyzing failure patterns. Enables continuous improvement through error analysis and resolution tracking.
autoActivationContext:
  - error handling
  - debugging
  - failure analysis
  - error logging
  - troubleshooting
---

# Database Error Learning Skill

This skill teaches how to log errors effectively, learn from past failures, and build a knowledge base of solutions.

## How to Log Errors with Proper Categorization

### Error Categories

**Categories:**
- `syntax` - Language syntax errors
- `runtime` - Runtime exceptions and crashes
- `validation` - Input validation failures
- `security` - Security-related errors
- `performance` - Performance issues and timeouts
- `integration` - External API/service failures
- `configuration` - Environment/config errors
- `dependency` - Package/library issues

### Logging Errors Correctly

```bash
# ✅ DO: Log errors with full context
source .claude/lib/db-helpers.sh

error_id=$(db_log_error \
  "TypeError" \
  "Cannot read property 'id' of undefined at line 42 in users.ts" \
  "runtime" \
  "src/api/users.ts" \
  42)

echo "Error logged with ID: $error_id"
```

```bash
# ✅ DO: Include stack trace in error message for complex errors
error_message="JWT verification failed: JsonWebTokenError: invalid signature
    at verify (/app/node_modules/jsonwebtoken/verify.js:58:17)
    at middleware/auth.ts:12:22
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)"

db_log_error \
  "JsonWebTokenError" \
  "$error_message" \
  "security" \
  "src/middleware/auth.ts" \
  12
```

```bash
# ❌ DON'T: Log errors with vague messages
db_log_error \
  "Error" \
  "Something went wrong" \
  "runtime" \
  "" \
  ""
# Problem: No actionable information, can't learn from this
```

```bash
# ❌ DON'T: Use wrong category
db_log_error \
  "SQL syntax error" \
  "SELECT * FORM users" \
  "runtime"
# Problem: Should be 'syntax' category
```

### Category-Specific Logging Examples

```bash
# ✅ Syntax Error
db_log_error \
  "SyntaxError" \
  "Unexpected token '}' at line 156" \
  "syntax" \
  "src/services/payment.ts" \
  156

# ✅ Runtime Error
db_log_error \
  "ReferenceError" \
  "Database connection 'pool' is not defined. Attempted to use before initialization." \
  "runtime" \
  "src/db/index.ts" \
  23

# ✅ Validation Error
db_log_error \
  "ValidationError" \
  "User email 'invalid-email' does not match pattern /^[^@]+@[^@]+\.[^@]+$/" \
  "validation" \
  "src/validators/user.ts" \
  15

# ✅ Security Error
db_log_error \
  "AuthenticationError" \
  "Failed authentication attempt: Invalid credentials for user 'admin' from IP 192.168.1.100" \
  "security" \
  "src/auth/login.ts" \
  45

# ✅ Performance Error
db_log_error \
  "TimeoutError" \
  "Database query timeout after 30000ms: SELECT * FROM orders WHERE created_at > '2024-01-01'" \
  "performance" \
  "src/api/orders.ts" \
  78

# ✅ Integration Error
db_log_error \
  "HTTPError" \
  "Stripe API request failed: 429 Too Many Requests. Rate limit exceeded." \
  "integration" \
  "src/services/payment.ts" \
  92

# ✅ Configuration Error
db_log_error \
  "ConfigurationError" \
  "Missing required environment variable: DATABASE_URL. Check .env file." \
  "configuration" \
  "src/config/database.ts" \
  10

# ✅ Dependency Error
db_log_error \
  "ModuleNotFoundError" \
  "Cannot find module '@stripe/stripe-js'. Did you run 'npm install'?" \
  "dependency" \
  "src/services/payment.ts" \
  1
```

## When to Query Similar Past Errors

### Query before attempting resolution:

```bash
# ✅ DO: Check for similar past errors before debugging
handle_error() {
  local error_message="$1"

  echo "Checking for similar past errors..."
  similar_errors=$(db_find_similar_errors "$error_message" 5)

  if [ -n "$similar_errors" ]; then
    echo "=== Found Similar Past Errors ==="
    echo "$similar_errors" | while IFS='|' read -r id message resolution code confidence; do
      echo ""
      echo "Error ID: $id"
      echo "Message: $message"
      echo "Resolution: $resolution"
      echo "Confidence: $confidence"
      if [ -n "$code" ]; then
        echo "Fix:"
        echo "$code"
      fi
    done

    # Use highest confidence solution
    best_solution=$(echo "$similar_errors" | head -1 | cut -d'|' -f3)
    echo ""
    echo "Recommended solution: $best_solution"
  else
    echo "No similar errors found. This is a new error pattern."
  fi
}

# Example usage
handle_error "Cannot read property 'id' of undefined"
```

### Apply learned solutions:

```bash
# ✅ DO: Try to auto-resolve using past solutions
auto_resolve_error() {
  local error_message="$1"
  local file_path="$2"

  # Find similar resolved errors
  similar=$(db_find_similar_errors "$error_message" 1)

  if [ -n "$similar" ]; then
    resolution_code=$(echo "$similar" | cut -d'|' -f4)
    confidence=$(echo "$similar" | cut -d'|' -f5)

    if (( $(echo "$confidence > 0.9" | bc -l) )); then
      echo "High-confidence solution found (confidence: $confidence)"
      echo "Attempting automatic resolution..."

      # Apply the fix
      if apply_fix "$file_path" "$resolution_code"; then
        echo "✅ Error resolved automatically using past solution"
        return 0
      else
        echo "❌ Automatic resolution failed. Manual intervention required."
        return 1
      fi
    else
      echo "Similar error found but confidence too low ($confidence). Manual review recommended."
      return 1
    fi
  fi

  echo "No similar errors found. Manual debugging required."
  return 1
}
```

## How to Store Resolutions for Future Reference

### Document the resolution with code:

```bash
# ✅ DO: Store resolution with specific fix code
error_id=42

resolution="The error occurred because user object was null when accessing user.id. Added null check before property access."

resolution_code="if (!user) {
  throw new Error('User not found');
}
const userId = user.id;"

db_resolve_error "$error_id" "$resolution" "$resolution_code" 1.0
```

```bash
# ❌ DON'T: Store vague resolutions
db_resolve_error "$error_id" "Fixed it" "" 1.0
# Problem: Future errors won't benefit from this non-explanation
```

### Store resolution with confidence based on testing:

```bash
# ✅ DO: Set confidence based on fix validation
error_id=42
resolution="Added input validation to prevent empty string in email field"
fix_code="if (!email || email.trim() === '') { throw new ValidationError('Email is required'); }"

# Test the fix
if run_tests && deploy_to_staging && validate_fix; then
  # High confidence: thoroughly tested
  db_resolve_error "$error_id" "$resolution" "$fix_code" 1.0
else
  # Lower confidence: not fully validated
  db_resolve_error "$error_id" "$resolution" "$fix_code" 0.7
fi
```

### Complete error handling workflow:

```bash
#!/usr/bin/env bash
# Complete error handling with learning

source .claude/lib/db-helpers.sh

handle_and_learn_from_error() {
  local error_type="$1"
  local error_message="$2"
  local category="$3"
  local file_path="$4"
  local line_number="$5"

  echo "=== Error Encountered ==="
  echo "Type: $error_type"
  echo "Message: $error_message"
  echo "Category: $category"
  echo "Location: $file_path:$line_number"
  echo ""

  # 1. Log the error
  error_id=$(db_log_error "$error_type" "$error_message" "$category" "$file_path" "$line_number")
  echo "Error logged with ID: $error_id"
  echo ""

  # 2. Check for similar past errors
  echo "Searching for similar past errors..."
  similar=$(db_find_similar_errors "$error_message" 5)

  if [ -n "$similar" ]; then
    echo "=== Found $(echo "$similar" | wc -l) Similar Resolved Errors ==="
    echo "$similar" | while IFS='|' read -r id msg res code conf; do
      echo "  - Resolution (confidence $conf): $res"
    done
    echo ""

    # Try highest confidence solution
    best_resolution=$(echo "$similar" | head -1 | cut -d'|' -f3)
    best_code=$(echo "$similar" | head -1 | cut -d'|' -f4)
    best_confidence=$(echo "$similar" | head -1 | cut -d'|' -f5)

    echo "Attempting resolution: $best_resolution"
    echo "Fix code:"
    echo "$best_code"
    echo ""

    # Apply fix (implementation specific)
    if apply_error_fix "$file_path" "$best_code"; then
      echo "✅ Fix applied successfully"

      # Run tests to validate
      if npm test; then
        echo "✅ Tests pass. Resolution confirmed."
        db_resolve_error "$error_id" "$best_resolution" "$best_code" 1.0
        return 0
      else
        echo "❌ Tests failed. Resolution needs adjustment."
        db_resolve_error "$error_id" "$best_resolution (with modifications)" "$best_code" 0.7
        return 1
      fi
    else
      echo "❌ Could not apply fix automatically. Manual intervention required."
      return 1
    fi
  else
    echo "No similar errors found. This requires new debugging."
    echo ""

    # Manual debugging process...
    echo "Analyzing error..."

    # After debugging and fixing:
    resolution="Added null check before accessing user.id property"
    fix_code="const userId = user?.id ?? null;"

    # Validate fix
    if npm test; then
      db_resolve_error "$error_id" "$resolution" "$fix_code" 1.0
      echo "✅ Error resolved and logged for future reference"
    else
      db_resolve_error "$error_id" "$resolution" "$fix_code" 0.6
      echo "⚠️  Partial fix. Needs more work."
    fi
  fi
}

# Example usage
handle_and_learn_from_error \
  "TypeError" \
  "Cannot read property 'id' of undefined" \
  "runtime" \
  "src/api/users.ts" \
  42
```

## Error Pattern Recognition Techniques

### Identify recurring error patterns:

```bash
# ✅ DO: Analyze error statistics to find patterns
echo "=== Error Analysis (Last 30 Days) ==="
db_error_stats 30

# Output example:
# validation|45|38|12.5
# runtime|23|15|45.2
# integration|12|10|8.7

# This shows:
# - 45 validation errors, 38 resolved, avg 12.5 min to resolve
# - 23 runtime errors, 15 resolved, avg 45.2 min to resolve
# - Integration errors resolve fastest (8.7 min)
```

### Track resolution effectiveness:

```bash
# ✅ DO: Identify errors that keep recurring (low resolution rate)
problematic_errors=$(sqlite3 "$DB_PATH" <<EOF
SELECT error_type,
       COUNT(*) as occurrences,
       SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved,
       (SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as resolution_rate
FROM error_history
WHERE occurred_at > datetime('now', '-30 days')
GROUP BY error_type
HAVING COUNT(*) > 3
ORDER BY resolution_rate ASC, occurrences DESC
LIMIT 10;
EOF
)

echo "=== Errors Needing Attention (Low Resolution Rate) ==="
echo "$problematic_errors"
```

### Common error pattern analysis:

```bash
# ✅ DO: Find files/modules with frequent errors
error_hotspots=$(sqlite3 "$DB_PATH" <<EOF
SELECT file_path,
       COUNT(*) as error_count,
       COUNT(DISTINCT error_type) as unique_errors
FROM error_history
WHERE file_path IS NOT NULL
  AND occurred_at > datetime('now', '-30 days')
GROUP BY file_path
ORDER BY error_count DESC
LIMIT 10;
EOF
)

echo "=== Error Hotspots (Files with Most Errors) ==="
echo "$error_hotspots"
echo ""
echo "These files may need refactoring or additional testing."
```

## Best Practices Summary

### DO
- ✅ Log errors immediately when they occur
- ✅ Use specific, accurate error categories
- ✅ Include full context (file, line, stack trace)
- ✅ Query similar errors before debugging
- ✅ Store resolutions with concrete fix code
- ✅ Set confidence based on validation testing
- ✅ Analyze error patterns to prevent recurrence
- ✅ Track resolution times for process improvement

### DON'T
- ❌ Log errors without context
- ❌ Use vague error messages
- ❌ Miscategorize errors
- ❌ Store resolutions without code examples
- ❌ Ignore similar past errors
- ❌ Set high confidence without testing
- ❌ Forget to update error statistics
- ❌ Skip root cause analysis

## Error Learning Metrics

Track learning effectiveness:

```bash
# Time to resolution trend (should decrease over time)
sqlite3 "$DB_PATH" <<EOF
SELECT
  DATE(occurred_at) as date,
  AVG((julianday(resolved_at) - julianday(occurred_at)) * 24 * 60) as avg_resolution_minutes
FROM error_history
WHERE resolved_at IS NOT NULL
  AND occurred_at > datetime('now', '-90 days')
GROUP BY DATE(occurred_at)
ORDER BY date DESC;
EOF
```

As the system learns, resolution times should decrease for similar errors.

## Integration with Agent Knowledge

```bash
# ✅ DO: Convert successful error resolutions to agent knowledge
error_id=42
error_details=$(sqlite3 "$DB_PATH" "SELECT error_type, error_message, resolution, resolution_code FROM error_history WHERE id=$error_id;")

if [ -n "$error_details" ]; then
  error_type=$(echo "$error_details" | cut -d'|' -f1)
  resolution=$(echo "$error_details" | cut -d'|' -f3)
  fix_code=$(echo "$error_details" | cut -d'|' -f4)

  # Store as agent knowledge for future prevention
  db_store_knowledge \
    "backend-developer" \
    "troubleshooting" \
    "$error_type error pattern" \
    "$resolution" \
    "$fix_code"

  echo "Error resolution promoted to agent knowledge"
fi
```

This creates a feedback loop: errors → resolutions → knowledge → prevention.
