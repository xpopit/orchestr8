---
id: workflow-discover-patterns
category: pattern
tags: [workflow, pattern-discovery, analysis, abstraction, documentation, knowledge-extraction]
capabilities:
  - Systematic pattern identification methodology
  - Pattern abstraction and generalization
  - Pattern documentation and categorization
useWhen:
  - Codebase pattern discovery requiring code analysis, pattern extraction, documentation, and fragment creation
  - Anti-pattern identification needing code smell detection, refactoring recommendations, and best practice suggestions
estimatedTokens: 520
---

# Pattern Discovery Workflow

**Phases:** Observation (0-30%) → Abstraction (30-70%) → Documentation (70-100%)

Methodology for discovering, abstracting, and documenting reusable patterns from implementations.

## Phase 1: Pattern Observation (0-30%)

**Identify pattern candidates:**

**Sources for pattern discovery:**
```markdown
Code Analysis:
□ Review recent implementations
□ Look for recurring structures
□ Note similar solutions to different problems
□ Identify copy-pasted code blocks

Team Discussions:
□ Listen for "we always do it this way"
□ Note best practices shared in reviews
□ Document tribal knowledge
□ Capture design decisions that worked well

Problem-Solution Pairs:
□ Common problems that recur
□ Solutions that proved effective
□ Approaches that avoided pitfalls
□ Designs that scaled well
```

**Pattern identification triggers:**
```markdown
You've found a pattern when:
✅ Same solution used 3+ times
✅ Solution worked well each time
✅ Problem recurs across projects
✅ Approach has clear structure
✅ Solution is teachable/explainable
✅ Abstraction is possible

Not a pattern if:
❌ Used only once or twice
❌ Highly context-specific
❌ No clear structure
❌ Hard to explain to others
❌ Can't be generalized
```

**Initial pattern capture:**
```markdown
For each candidate pattern:

Pattern Name (tentative):
[Descriptive name - can refine later]

Problem:
[What problem does this solve?]

Solution (sketch):
[How is it typically solved?]

Examples (3+ instances):
1. [Project/File where used]
2. [Another instance]
3. [Third instance]

Common Variations:
[Different forms this takes]
```

## Phase 2: Pattern Abstraction (30-70%)

**Analyze pattern structure:**

**Extract essential elements:**
```markdown
Core components:
□ What parts are always present?
□ What parts are variable?
□ What relationships exist between parts?
□ What are the key constraints?

Pattern anatomy:
- **Intent:** What it accomplishes
- **Structure:** How it's organized
- **Participants:** Key components/roles
- **Collaborations:** How parts interact
- **Consequences:** Benefits and trade-offs
```

**Generalize from specific instances:**
```markdown
For each example instance:

What's common across all instances?
→ These are essential to the pattern

What varies between instances?
→ These are parameters/variants

What context affects the pattern?
→ These are applicability conditions

Example:
Instance 1: UserRepository with findById()
Instance 2: ProductRepository with findById()
Instance 3: OrderRepository with findById()

Pattern: Repository Pattern
- Common: CRUD operations, data access abstraction
- Variable: Entity type, storage backend
- Context: Separating domain from data access layer
```

**Identify pattern variants:**
```markdown
Are there multiple related patterns?

Base pattern:
[Core pattern description]

Variant A: [Name]
- Difference: [What's different]
- When to use: [Conditions for this variant]

Variant B: [Name]
- Difference: [What's different]
- When to use: [Conditions for this variant]

Example:
Base: Repository Pattern
Variant A: Generic Repository (shared base class)
Variant B: Specific Repositories (per-entity customization)
```

**Define applicability:**
```markdown
When to use this pattern:
✅ [Condition 1]
✅ [Condition 2]
✅ [Condition 3]

When NOT to use:
❌ [Anti-condition 1]
❌ [Anti-condition 2]

Example contexts:
- [Scenario 1 where pattern fits well]
- [Scenario 2 where pattern fits well]
```

## Phase 3: Pattern Documentation (70-100%)

**Create comprehensive pattern document:**

```markdown
---
id: [pattern-name-kebab-case]
category: pattern
tags: [domain, technology, problem-type, architecture-level]
capabilities:
  - [What this pattern enables]
  - [Key benefit or capability]
useWhen:
  - [Specific scenario 1]
  - [Specific scenario 2]
estimatedTokens: [500-800]
---

# [Pattern Name]

[One-sentence description of what this pattern does]

## Problem

[Detailed description of the problem this pattern solves]

### Context
[When/where this problem typically occurs]

### Forces
[Competing concerns that make the problem challenging]
- Force 1
- Force 2

## Solution

[Describe the general solution approach]

### Structure

[Describe key components and their relationships - use ASCII diagrams if helpful]

Example structure:
```
Component A
    ↓ delegates to
Component B
    ↓ uses
Component C
```

### Participants

**Component A (Role)**
- Responsibility 1
- Responsibility 2

**Component B (Role)**
- Responsibility 1
- Responsibility 2

### Implementation

[Step-by-step guidance for implementing the pattern]

1. [Step 1 with explanation]
2. [Step 2 with explanation]
3. [Step 3 with explanation]

## Examples

### Example 1: [Context]
```[language]
[Code example showing pattern]
```
[Explanation of how pattern is applied]

### Example 2: [Different Context]
```[language]
[Another code example]
```
[Explanation of variations]

## Consequences

### Benefits
✅ [Benefit 1 with explanation]
✅ [Benefit 2 with explanation]
✅ [Benefit 3 with explanation]

### Trade-offs
⚠️ [Trade-off 1: what you give up]
⚠️ [Trade-off 2: added complexity]
⚠️ [Trade-off 3: constraints introduced]

## Applicability

Use this pattern when:
- [Condition 1]
- [Condition 2]

Avoid this pattern when:
- [Anti-condition 1]
- [Anti-condition 2]

## Variants

### Variant A: [Name]
[Description and when to use]

### Variant B: [Name]
[Description and when to use]

## Related Patterns

- **[Related Pattern 1]:** [Relationship description]
- **[Related Pattern 2]:** [Relationship description]

## Known Uses

- [Project/System 1 that uses this]
- [Project/System 2 that uses this]
- [Project/System 3 that uses this]
```

**Pattern categorization:**

```markdown
Classify by:

Architectural Level:
□ System level (microservices, event-driven)
□ Application level (MVC, layered)
□ Component level (repository, factory)
□ Code level (strategy, observer)

Problem Domain:
□ Structural (how to organize)
□ Behavioral (how to communicate)
□ Creational (how to create objects)
□ Concurrency (how to handle parallelism)

Technology:
□ Language-specific
□ Framework-specific
□ Platform-specific
□ Technology-agnostic
```

**Validate pattern quality:**

```markdown
Quality checklist:
□ Clear, descriptive name?
□ Problem well-defined?
□ Solution explained clearly?
□ 3+ real examples provided?
□ Benefits and trade-offs explicit?
□ Applicability conditions clear?
□ Implementation guidance sufficient?
□ Code examples included?
□ Related patterns linked?
```

## Pattern Documentation Strategies

**Lightweight pattern:**
```markdown
For simple, focused patterns (400-600 tokens):
- Brief problem statement
- Core solution approach
- 1-2 code examples
- Key benefits and trade-offs
- When to use / not use

Good for: Code-level patterns, specific techniques
```

**Comprehensive pattern:**
```markdown
For complex, architectural patterns (600-1000 tokens):
- Detailed problem analysis
- Full structural description
- Multiple example variants
- Extensive consequences analysis
- Related patterns discussion

Good for: Architectural patterns, system design patterns
```

**Pattern catalog:**
```markdown
For collections of related patterns:
- Overview of pattern family
- Relationships between patterns
- How to combine patterns
- Selection guidance

Example: "Database Access Patterns"
- Repository Pattern
- Unit of Work Pattern
- Data Mapper Pattern
- Active Record Pattern
```

## Best Practices

✅ **Observe before documenting** - Need multiple instances
✅ **Name clearly** - Good name makes pattern memorable
✅ **Show, don't just tell** - Include code examples
✅ **Document trade-offs** - No pattern is perfect
✅ **Link related patterns** - Show how patterns work together
✅ **Keep updated** - Revise as understanding improves
✅ **Make discoverable** - Good tags and metadata

❌ **Don't over-pattern** - Not everything needs to be a pattern
❌ **Don't document too early** - Wait for recurrence
❌ **Don't hide costs** - Be honest about trade-offs
❌ **Don't ignore context** - Patterns aren't universal
❌ **Don't write encyclopedias** - Keep patterns focused

## Pattern Discovery in Practice

**Incremental approach:**
```markdown
Week 1: Note potential patterns (observation phase)
Week 2-3: Collect more examples (validation phase)
Week 4: Document if pattern holds (documentation phase)
Week 5+: Refine based on usage (evolution phase)

This ensures patterns are real, not imagined.
```

**Collaborative discovery:**
```markdown
Team pattern review:
1. Present candidate pattern to team
2. Discuss: Is this really a pattern?
3. Gather more examples from team experience
4. Collaboratively refine structure
5. Document together

Benefits: Better quality, team buy-in, shared ownership
```

## Success Criteria

✅ Pattern based on 3+ real instances
✅ Problem clearly defined
✅ Solution abstracted and generalized
✅ Code examples provided
✅ Benefits and trade-offs documented
✅ Applicability conditions clear
✅ Properly tagged and categorized
✅ Integrated into pattern library
