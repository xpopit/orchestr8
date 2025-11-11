---
id: fragment-creation-workflow
category: skill
tags: [fragments, workflow, process, creation, optimization, best-practices, meta]
capabilities:
  - Complete fragment creation workflow from ideation to testing
  - Fragment optimization and refinement process
  - Systematic approach to fragment design
  - Quality assurance for fragment library
useWhen:
  - Creating new skill fragments from identified expertise gaps following metadata standards and size guidelines
  - Establishing peer review process for fragment submissions validating technical accuracy and useWhen quality
  - Designing fragment contribution workflow with templates, linting, and automated quality checks
  - Building fragment library governance model balancing rapid growth with quality control and duplication prevention
  - Implementing fragment versioning strategy handling updates while maintaining backward compatibility for workflows
estimatedTokens: 670
---

# Fragment Creation Workflow

Systematic workflow for creating high-quality, discoverable resource fragments from ideation to testing.

## Creating New Fragment

```markdown
1. Define scope and purpose
   - What specific knowledge does this capture?
   - Who needs this and when?

2. Determine category
   - Agent (expertise), Skill (technique), Pattern (architecture), or Example?

3. Size appropriately
   - Target 500-800 tokens
   - Consider splitting if >1000 tokens

4. Write content
   - Clear structure
   - Code examples
   - Pitfalls and best practices

5. Optimize metadata
   - Rich tags (5-8)
   - Specific capabilities (3-5)
   - Concrete useWhen scenarios (3-5)
   - Accurate token estimate

6. Test discoverability
   - Run fuzzy match queries
   - Verify fragment is selected
   - Adjust metadata if needed

7. Save to appropriate _fragments/ directory
```

## Optimizing Existing Fragment

```markdown
1. Measure current size
   - If >1000 tokens, consider splitting

2. Review metadata
   - Tags specific enough?
   - Capabilities concrete?
   - UseWhen scenarios helpful?

3. Test matching
   - Does it appear for expected queries?
   - Is it ranked appropriately?

4. Update content
   - Remove outdated information
   - Add recent best practices (2024-2025)
   - Improve code examples

5. Retest
   - Verify improvements in matching
```

## Quality Checklist

**Before publishing fragment:**
```markdown
□ Content is 500-800 tokens (or justified if outside range)
□ ID follows naming convention (category-topic-specialization)
□ 5-8 specific tags included
□ 3-5 concrete capabilities defined
□ 3-5 specific useWhen scenarios
□ estimatedTokens is accurate
□ Code examples are runnable and well-commented
□ Structure follows standard template
□ Tested with 5+ relevant queries
□ Successfully selected for expected use cases
□ No overlap/duplication with existing fragments
□ Documentation is clear and actionable
```

## Fragment Library Organization

```
resources/
├── agents/_fragments/
│   ├── [language]-core.md (600-700 tokens, always relevant)
│   ├── [language]-[specialization].md (450-600 tokens each)
│   └── ...
├── skills/_fragments/
│   ├── [technique]-[context].md (500-800 tokens)
│   └── ...
├── patterns/_fragments/
│   ├── [architecture]-[approach].md (500-800 tokens)
│   └── ...
└── examples/_fragments/
    ├── [language]-[framework]-[feature].md (400-700 tokens)
    └── ...
```

## Common Fragment Patterns

### Pattern 1: Core + Specializations

```markdown
Core: typescript-core.md (700 tokens)
- Foundational TypeScript knowledge
- Always relevant

Specializations:
- typescript-api-rest.md (550 tokens)
- typescript-async-patterns.md (500 tokens)
- typescript-testing-jest.md (480 tokens)

Loading strategy:
- Core always loads for TypeScript projects
- Specializations load based on specific needs
```

### Pattern 2: Technique Variations

```markdown
Error handling variations:
- error-handling-async.md (500 tokens) - Promise/async patterns
- error-handling-validation.md (450 tokens) - Input validation
- error-handling-api-patterns.md (600 tokens) - REST API errors

Loading strategy:
- Load based on specific error handling context
```

### Pattern 3: Framework-Specific

```markdown
API framework fragments:
- python-api-fastapi.md (650 tokens)
- typescript-api-express.md (600 tokens)
- rust-api-actix.md (700 tokens)

Loading strategy:
- Load based on chosen tech stack
```

## Maintenance Schedule

```markdown
Quarterly review:
□ Update 2024-2025 best practices
□ Refresh code examples
□ Verify metadata accuracy
□ Test fuzzy matching
□ Remove obsolete fragments
□ Identify gaps in coverage

Ad-hoc updates:
□ When technology versions change
□ When new patterns emerge
□ When fragments show poor match rates
```

## Best Practices Summary

✅ **Systematic approach** - Follow creation workflow
✅ **Quality over quantity** - Better to have 10 great fragments than 50 mediocre ones
✅ **Test everything** - Always verify discoverability
✅ **Iterate and improve** - Refine based on usage
✅ **Document decisions** - Keep notes on fragment design choices
✅ **Regular maintenance** - Quarterly reviews minimum

❌ **Don't rush** - Take time to optimize metadata
❌ **Don't duplicate** - Check for existing similar fragments
❌ **Don't skip testing** - Verification is essential
❌ **Don't forget updates** - Keep fragments current
