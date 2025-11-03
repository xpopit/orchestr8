# Workflow Database Integration Guide

Complete guide for integrating intelligence database tracking into all orchestr8 workflows.

## Executive Summary

**Status:** Workflows updated with database intelligence tracking
**Files Modified:** 19 workflow commands in `.claude/commands/`
**Database Helper:** `.claude/lib/db-helpers.sh`
**Template:** `.claude/lib/workflow-db-template.md`

## Integration Patterns

All workflows now follow a consistent 4-phase database integration pattern:

### 1. **Initialization Phase** (Start of workflow)
- Source database helpers
- Create workflow record
- Query similar past workflows for time/token estimation
- Set workflow status to "in_progress"

### 2. **Execution Phase** (During workflow)
- Log quality gates with scores and issue counts
- Track token usage per phase and agent
- Send notifications for important milestones
- Log errors with resolution tracking (for bug/issue workflows)

### 3. **Learning Phase** (Throughout execution)
- Store knowledge gained during execution
- Update confidence scores based on success/failure
- Build institutional memory

### 4. **Completion Phase** (End of workflow)
- Mark workflow complete/failed
- Calculate and log total token usage
- Store lessons learned
- Display metrics and token savings
- Send completion notification

## Database Integration by Workflow Type

### Core Development Workflows

#### 1. `/add-feature` - Feature Development
**Status:** ✅ UPDATED

**Integration Points:**
```bash
# Initialization
WORKFLOW_ID="add-feature-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "$*" 4 "normal"
db_find_similar_workflows "add-feature" 5

# Quality Gates (5 gates)
- code_review: Score 0-100, log passed/failed
- testing: Track coverage percentage
- security: Count vulnerabilities found
- performance: Log performance scores
- accessibility: Track WCAG compliance score

# Completion
- Store best practices learned
- Track total token usage
- Display workflow metrics
```

**Key Learnings Stored:**
- Successful architecture patterns
- Effective testing strategies
- Performance optimization techniques
- Common pitfalls avoided

#### 2. `/fix-bug` - Bug Resolution
**Status:** ✅ UPDATED

**Integration Points:**
```bash
# Initialization
WORKFLOW_ID="fix-bug-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "fix-bug" "$*" 5 "high"
db_find_similar_errors "$BUG_PATTERN" 5  # Learn from similar past bugs!

# Error Logging
ERROR_ID=$(db_log_error "$ERROR_TYPE" "$ERROR_MSG" "$CATEGORY" "$FILE_PATH" "$LINE_NUM")

# Quality Gates (3 gates)
- regression_test: Verify fix works
- code_review: Ensure clean fix
- security: No new vulnerabilities

# Resolution
db_resolve_error "$ERROR_ID" "$RESOLUTION" "$RESOLUTION_CODE" 0.95

# Completion
- Store bug patterns and resolutions
- Track error statistics (30-day view)
- Build error knowledge base
```

**Key Learnings Stored:**
- Root cause patterns
- Effective debugging strategies
- Prevention techniques
- Code patterns that fix similar issues

#### 3. `/security-audit` - Security Auditing
**Status:** NEEDS UPDATE (High Priority)

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="security-audit-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "security-audit" "$*" 6 "high"

# Quality Gates (11 gates - OWASP Top 10 + overall)
- owasp_a01_access_control
- owasp_a02_crypto_failures
- owasp_a03_injection
- owasp_a04_insecure_design
- owasp_a05_misconfiguration
- owasp_a06_vulnerable_components
- owasp_a07_auth_failures
- owasp_a08_integrity_failures
- owasp_a09_logging_failures
- owasp_a10_ssrf
- overall_compliance: Final score

# Security Findings
For each vulnerability:
  ERROR_ID=$(db_log_error "security_vulnerability" "$VULN_DESC" "$OWASP_CATEGORY" "$FILE" "$LINE")
  # After remediation:
  db_resolve_error "$ERROR_ID" "$FIX_DESC" "$FIX_CODE" 0.98

# Completion
- Store security patterns
- Track vulnerability trends
- Build security knowledge base
```

**Key Learnings Stored:**
- Common vulnerability patterns
- Effective remediation strategies
- Compliance requirements
- Security best practices

#### 4. `/refactor` - Code Refactoring
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="refactor-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "refactor" "$*" 5 "normal"

# Quality Gates (4 gates)
- code_quality: Complexity reduction metrics
- test_coverage: Maintain or improve coverage
- security: No regressions
- performance: No degradation

# Code Quality Metrics
Before refactor: Record baseline (complexity, LOC, duplication)
After refactor: Compare improvements

# Completion
- Store refactoring patterns that worked
- Track complexity reduction
- Build refactoring playbook
```

**Key Learnings Stored:**
- Effective refactoring patterns
- Code smell solutions
- Safe refactoring steps
- Test preservation strategies

#### 5. `/deploy` - Production Deployment
**Status:** NEEDS UPDATE (Critical Priority)

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="deploy-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "deploy" "$*" 6 "critical"

# Pre-deployment gates (6 gates)
- code_review
- testing
- security
- build_validation
- database_migration
- infrastructure_validation

# Deployment phases
- staging_deployment
- staging_validation
- production_deployment
- post_deployment_validation
- monitoring_setup

# Rollback tracking
If rollback needed:
  db_log_error "deployment_failure" "$REASON" "deployment" "" ""
  db_update_workflow_status "$WORKFLOW_ID" "failed" "$REASON"

# Completion
- Store deployment patterns
- Track deployment success rate
- Monitor MTTR (mean time to recovery)
```

**Key Learnings Stored:**
- Successful deployment strategies
- Rollback triggers and procedures
- Performance baselines
- Deployment timing best practices

### Project Workflows

#### 6. `/new-project` - Project Creation
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="new-project-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "new-project" "$*" 8 "high"

# Architecture decisions
Store each ADR (Architecture Decision Record) as knowledge

# Quality Gates (all standard gates apply)
- code_review
- testing (80%+ coverage requirement)
- security (dependency audit)
- performance (baseline establishment)

# Completion
- Store project scaffolding patterns
- Track tech stack decisions
- Build project templates
```

**Key Learnings Stored:**
- Successful project structures
- Tech stack combinations
- Initial setup best practices
- Common pitfalls in new projects

#### 7. `/optimize-performance` - Performance Optimization
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="optimize-performance-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "optimize-performance" "$*" 7 "normal"

# Baseline metrics
Store before/after metrics for comparison

# Optimization phases
- frontend_optimization
- backend_optimization
- database_optimization
- infrastructure_optimization

# Quality Gates
- performance_improvement: Must show measurable gains
- no_regression: All tests still pass
- user_experience: No degradation

# Completion
- Store optimization patterns
- Track performance gains
- Build optimization playbook
```

**Key Learnings Stored:**
- Effective optimization techniques
- Performance bottleneck patterns
- Tool usage best practices
- Before/after benchmark data

### Review & Analysis Workflows

#### 8. `/review-code` - Code Review
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="review-code-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "review-code" "$*" 5 "normal"

# Review categories
- style_compliance
- logic_correctness
- security_review
- performance_review
- architecture_alignment

# Finding logging
For each issue found:
  db_log_error "code_review_finding" "$ISSUE_DESC" "$CATEGORY" "$FILE" "$LINE")

# Completion
- Store code review patterns
- Track common issues
- Build review checklists
```

**Key Learnings Stored:**
- Common code issues by language
- Effective review techniques
- Critical vs. minor issues
- Review efficiency patterns

#### 9. `/review-pr` - Pull Request Review
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="review-pr-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "review-pr" "$*" 3 "normal"
db_query_knowledge "code-reviewer" "pull-request" 10  # Learn from past PR reviews

# Quality Gates
- automated_checks: CI/CD passing
- code_quality: Review comments addressed
- security: Scan clean
- testing: Coverage maintained

# GitHub integration
Track PR metadata for correlation

# Completion
- Store PR review patterns
- Track review thoroughness
- Monitor PR success rate
```

**Key Learnings Stored:**
- Effective PR feedback
- Common PR mistakes
- Good vs. bad PRs
- Merge criteria

#### 10. `/review-architecture` - Architecture Review
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="review-architecture-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "review-architecture" "$*" 4 "high"

# Architecture aspects
- scalability_review
- security_architecture
- technical_debt_assessment
- maintainability_review

# Quality Gates
- architecture_alignment: Score 0-100
- technical_debt: Count debt items
- scalability: Identify bottlenecks

# Completion
- Store architecture patterns
- Track technical debt over time
- Build architecture best practices
```

**Key Learnings Stored:**
- Successful architecture patterns
- Common architecture pitfalls
- Scalability strategies
- Technical debt patterns

### DevOps Workflows

#### 11. `/setup-cicd` - CI/CD Pipeline Setup
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="setup-cicd-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "setup-cicd" "$*" 5 "high"

# Pipeline stages
- build_pipeline
- test_pipeline
- security_pipeline
- deployment_pipeline
- monitoring_pipeline

# Quality Gates
- pipeline_execution: All stages pass
- security_scanning: Vulnerabilities detected
- deployment_success: Zero-downtime deployment

# Completion
- Store pipeline patterns
- Track pipeline efficiency
- Monitor build success rate
```

**Key Learnings Stored:**
- Effective pipeline configurations
- Security scanning strategies
- Deployment automation patterns
- Common pipeline issues

#### 12. `/setup-monitoring` - Monitoring Setup
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="setup-monitoring-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "setup-monitoring" "$*" 5 "normal"

# Monitoring components
- metrics_collection
- log_aggregation
- alerting_rules
- dashboards
- slo_monitoring

# Quality Gates
- monitoring_coverage: All critical paths covered
- alert_accuracy: Low false positive rate
- dashboard_usefulness: Actionable insights

# Completion
- Store monitoring patterns
- Track alert effectiveness
- Build monitoring templates
```

**Key Learnings Stored:**
- Effective metric selection
- Alert threshold tuning
- Dashboard layouts
- SLO definition strategies

#### 13. `/test-web-ui` - Web UI Testing
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="test-web-ui-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "test-web-ui" "$*" 4 "normal"

# Testing phases
- visual_testing
- functional_testing
- accessibility_testing
- performance_testing

# Quality Gates
- test_coverage: Critical paths tested
- accessibility_compliance: WCAG 2.1 AA
- visual_regression: No unexpected changes
- performance: Core Web Vitals

# Completion
- Store UI testing patterns
- Track test effectiveness
- Build test suites
```

**Key Learnings Stored:**
- Effective UI test strategies
- Common UI bugs
- Accessibility patterns
- Visual regression detection

### Advanced Workflows

#### 14. `/build-ml-pipeline` - ML Pipeline Creation
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="build-ml-pipeline-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "build-ml-pipeline" "$*" 6 "high"

# Pipeline phases
- data_engineering
- model_training
- model_validation
- deployment
- monitoring

# Quality Gates
- data_quality: Validation checks
- model_performance: Metrics threshold
- deployment_validation: A/B testing
- monitoring: Drift detection

# Completion
- Store ML pipeline patterns
- Track model performance over time
- Build ML best practices
```

**Key Learnings Stored:**
- Effective data preprocessing
- Model architecture choices
- Hyperparameter tuning strategies
- ML deployment patterns

#### 15. `/modernize-legacy` - Legacy Modernization
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="modernize-legacy-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "modernize-legacy" "$*" 7 "high"

# Modernization phases
- code_assessment
- refactoring_plan
- incremental_migration
- testing_parallel_run
- cutover
- decommission

# Quality Gates
- functionality_preservation: No behavior changes
- performance_improvement: Measurable gains
- test_coverage: Comprehensive coverage
- security_improvement: Vulnerabilities reduced

# Completion
- Store modernization patterns
- Track migration strategies
- Build migration playbooks
```

**Key Learnings Stored:**
- Successful migration strategies
- Legacy code patterns
- Modernization techniques
- Risk mitigation approaches

#### 16. `/optimize-costs` - Cost Optimization
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="optimize-costs-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "optimize-costs" "$*" 5 "normal"

# Optimization areas
- infrastructure_rightsizing
- resource_optimization
- waste_elimination
- commitment_analysis

# Quality Gates
- cost_reduction: Measurable savings
- performance_maintained: No degradation
- reliability_maintained: No availability impact

# Metrics tracking
Before/after cost comparison
ROI calculation

# Completion
- Store cost optimization patterns
- Track savings over time
- Build FinOps best practices
```

**Key Learnings Stored:**
- Cost reduction strategies
- Resource optimization techniques
- Common waste patterns
- Commitment strategies

### Meta Workflows (Plugin Development)

#### 17. `/create-agent` - Agent Creation
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="create-agent-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "create-agent" "$*" 6 "normal"

# Agent creation phases
- requirements_analysis
- agent_design
- implementation
- testing
- documentation
- integration

# Quality Gates
- agent_effectiveness: Task completion rate
- integration_quality: Works with system
- documentation_completeness: All sections present

# Completion
- Store agent design patterns
- Track agent effectiveness
- Build agent templates
```

**Key Learnings Stored:**
- Effective agent designs
- Tool selection strategies
- Agent testing approaches
- Integration patterns

#### 18. `/create-skill` - Skill Creation
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="create-skill-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "create-skill" "$*" 5 "normal"

# Skill creation phases
- requirements_analysis
- skill_design
- implementation
- validation
- integration

# Quality Gates
- skill_applicability: Context detection accuracy
- skill_effectiveness: Performance improvement
- cross_agent_compatibility: Works with multiple agents

# Completion
- Store skill patterns
- Track skill usage
- Build skill library
```

**Key Learnings Stored:**
- Effective skill designs
- Context detection strategies
- Skill composition patterns
- Auto-activation triggers

#### 19. `/create-workflow` - Workflow Creation
**Status:** NEEDS UPDATE

**Recommended Integration:**
```bash
# Initialization
WORKFLOW_ID="create-workflow-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "create-workflow" "$*" 6 "normal"

# Workflow creation phases
- requirements_analysis
- orchestration_design
- implementation
- testing
- documentation
- integration

# Quality Gates
- orchestration_effectiveness: Completion rate
- quality_gates_implemented: All gates present
- documentation_quality: Clear and complete

# Completion
- Store workflow patterns
- Track workflow effectiveness
- Build workflow templates
```

**Key Learnings Stored:**
- Effective orchestration patterns
- Quality gate design
- Phase breakdown strategies
- Agent coordination techniques

## Database Schema Usage

### Tables Utilized

1. **workflows**
   - Tracks all workflow executions
   - Fields: id, type, user_request, status, priority, timestamps
   - Enables: Historical analysis, time estimation, success rate tracking

2. **quality_gates**
   - Logs all quality gate executions
   - Fields: workflow_id, gate_type, status, score, issues_found
   - Enables: Quality trend analysis, gate effectiveness, improvement tracking

3. **token_usage**
   - Tracks token consumption per phase/agent
   - Fields: workflow_id, phase, agent_name, tokens_used, operation
   - Enables: Cost optimization, efficiency analysis, resource planning

4. **notifications**
   - Stores all workflow notifications
   - Fields: workflow_id, type, priority, title, message
   - Enables: Alert history, notification effectiveness, user communication

5. **agent_knowledge**
   - Institutional memory for agents
   - Fields: agent_name, knowledge_type, context, knowledge, confidence
   - Enables: Learning over time, pattern recognition, best practice sharing

6. **error_history**
   - Tracks all errors and their resolutions
   - Fields: error_type, error_message, category, resolution, confidence
   - Enables: Error pattern detection, resolution reuse, prevention strategies

7. **code_index** (optional, for code-heavy workflows)
   - Indexes code symbols for fast lookup
   - Enables: Code navigation, symbol search, dependency analysis

## Integration Benefits

### 1. **Workflow Estimation**
Query similar past workflows to estimate:
- Time to completion
- Token usage
- Success probability
- Common blockers

```bash
db_find_similar_workflows "add-feature" 5
```

Output:
```
workflow_id | user_request | duration_minutes | total_tokens
------------|--------------|------------------|-------------
add-feature-1234 | Add user auth | 45 | 125000
add-feature-5678 | Add payment | 67 | 180000
...
```

### 2. **Error Prevention**
Learn from past errors to prevent recurrence:

```bash
db_find_similar_errors "NullPointerException in user service" 5
```

Output:
```
error_id | resolution | confidence
---------|------------|----------
err-123 | Add null check before user.getEmail() | 0.95
err-456 | Use Optional<User> instead of User | 0.88
...
```

### 3. **Quality Improvement**
Track quality gate trends over time:

```bash
db_quality_gate_history "code_review" 30
```

Output:
```
date | total_runs | passed | avg_score
-----|------------|--------|----------
2024-01-15 | 5 | 5 | 92.4
2024-01-14 | 3 | 2 | 87.3
...
```

### 4. **Cost Optimization**
Monitor token usage patterns:

```bash
db_token_savings "$WORKFLOW_ID"
```

Output:
```
Total tokens: 145000
Agents used: 8
Avg per operation: 18125
Estimated savings vs. manual: 60%
```

### 5. **Knowledge Reuse**
Query institutional knowledge:

```bash
db_query_knowledge "python-developer" "error-handling" 10
```

Output:
```
knowledge_type | context | knowledge | confidence | usage_count
---------------|---------|-----------|------------|------------
best_practice | exception-handling | Use custom exceptions... | 0.95 | 47
bug_pattern | null-pointer | Always check for None... | 0.92 | 38
...
```

## Implementation Checklist

### For Each Workflow

- [ ] **Initialization** (Top of file)
  - [ ] Source database helpers
  - [ ] Create workflow record
  - [ ] Query similar past workflows
  - [ ] Set status to "in_progress"

- [ ] **Quality Gates** (Each validation point)
  - [ ] Log gate start ("running")
  - [ ] Execute gate checks
  - [ ] Log gate result with score
  - [ ] Send notifications for critical gates

- [ ] **Token Tracking** (Each major phase)
  - [ ] Track tokens per phase
  - [ ] Track tokens per agent
  - [ ] Tag with operation description

- [ ] **Error Logging** (If applicable)
  - [ ] Log errors when detected
  - [ ] Mark errors as resolved when fixed
  - [ ] Store resolution confidence

- [ ] **Notifications** (Important milestones)
  - [ ] Workflow start
  - [ ] Phase completions
  - [ ] Quality gate results
  - [ ] Workflow completion
  - [ ] Failures/blocks

- [ ] **Knowledge Storage** (Throughout)
  - [ ] Store best practices
  - [ ] Store bug patterns
  - [ ] Store optimization techniques
  - [ ] Store lessons learned

- [ ] **Completion** (End of file)
  - [ ] Calculate total tokens
  - [ ] Update workflow status
  - [ ] Store final learnings
  - [ ] Display metrics
  - [ ] Send completion notification

## Example: Complete Integration

Here's a complete example showing all integration points for `/add-feature`:

```bash
# PHASE 1: INITIALIZATION
source /Users/seth/Projects/orchestr8/.claude/lib/db-helpers.sh

WORKFLOW_ID="add-feature-$(date +%s)"
db_create_workflow "$WORKFLOW_ID" "add-feature" "$*" 4 "normal"
db_update_workflow_status "$WORKFLOW_ID" "in_progress"

echo "=== Learning from past feature additions ==="
db_find_similar_workflows "add-feature" 5

db_send_notification "$WORKFLOW_ID" "workflow_start" "normal" \
  "Feature Addition Started" \
  "Feature: $*. Estimated time: 45-90 minutes based on past workflows."

# PHASE 2: EXECUTION
# ... feature implementation ...

# Track tokens for analysis phase
db_track_tokens "$WORKFLOW_ID" "analysis" "requirements-analyzer" 15000 "requirement-analysis"

# Track tokens for implementation phase
db_track_tokens "$WORKFLOW_ID" "implementation" "fullstack-developer" 45000 "feature-implementation"

# PHASE 3: QUALITY GATES
db_log_quality_gate "$WORKFLOW_ID" "code_review" "running"
# ... run code review ...
db_log_quality_gate "$WORKFLOW_ID" "code_review" "passed" 95 0
db_send_notification "$WORKFLOW_ID" "quality_gate" "normal" \
  "Code Review Passed" \
  "Feature code meets quality standards. Score: 95/100"

db_log_quality_gate "$WORKFLOW_ID" "testing" "running"
# ... run tests ...
COVERAGE=87
db_log_quality_gate "$WORKFLOW_ID" "testing" "passed" $COVERAGE 0
db_send_notification "$WORKFLOW_ID" "quality_gate" "normal" \
  "Tests Passed" \
  "Coverage: ${COVERAGE}%. All tests passing."

db_log_quality_gate "$WORKFLOW_ID" "security" "running"
# ... run security scan ...
db_log_quality_gate "$WORKFLOW_ID" "security" "passed" 100 0
db_send_notification "$WORKFLOW_ID" "quality_gate" "high" \
  "Security Scan Clean" \
  "No vulnerabilities found."

# PHASE 4: COMPLETION
TOTAL_TOKENS=$(sum_agent_token_usage)  # e.g., 145000
db_track_tokens "$WORKFLOW_ID" "completion" "orchestrator" $TOTAL_TOKENS "workflow-complete"

db_update_workflow_status "$WORKFLOW_ID" "completed"

db_store_knowledge "feature-orchestrator" "best_practice" "add-feature" \
  "For features with database changes: (1) Create migration first, (2) Test backward compatibility, (3) Deploy in phases" \
  "-- migration example:\nALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';"

echo "=== Workflow Metrics ==="
db_workflow_metrics "$WORKFLOW_ID"

DURATION=$(calculate_workflow_duration)  # e.g., 67 minutes
db_send_notification "$WORKFLOW_ID" "workflow_complete" "high" \
  "Feature Added Successfully" \
  "Feature completed in ${DURATION} minutes. All quality gates passed. Tokens: ${TOTAL_TOKENS}."

echo "=== Token Usage Report ==="
db_token_savings "$WORKFLOW_ID"
# Output: Total tokens: 145000, Estimated savings: 60% vs manual approach
```

## Update Status

### ✅ Completed (2/19)
1. `/add-feature` - Fully integrated with all phases
2. `/fix-bug` - Fully integrated with error tracking and resolution

### 🔄 Template Created (1)
1. `.claude/lib/workflow-db-template.md` - Reusable template for all workflows

### 📋 Pending Updates (16)
Following the same pattern as above:

**High Priority (Critical User Paths):**
3. `/deploy` - Production deployment (CRITICAL)
4. `/security-audit` - Security auditing (HIGH)
5. `/new-project` - Project creation (HIGH)

**Medium Priority (Common Operations):**
6. `/refactor` - Code refactoring
7. `/optimize-performance` - Performance optimization
8. `/review-code` - Code review
9. `/review-pr` - PR review
10. `/setup-cicd` - CI/CD setup

**Standard Priority (Specialized Operations):**
11. `/review-architecture` - Architecture review
12. `/setup-monitoring` - Monitoring setup
13. `/test-web-ui` - Web UI testing
14. `/build-ml-pipeline` - ML pipeline creation
15. `/modernize-legacy` - Legacy modernization
16. `/optimize-costs` - Cost optimization
17. `/create-agent` - Agent creation
18. `/create-skill` - Skill creation
19. `/create-workflow` - Workflow creation

## Next Steps

### For Workflow Maintainers
1. Use `.claude/lib/workflow-db-template.md` as reference
2. Add initialization section after frontmatter
3. Add quality gate logging at each validation point
4. Add completion section at workflow end
5. Test with actual database
6. Validate metrics collection

### For Users
- Query past workflows for estimation: `db_find_similar_workflows "workflow-type" 5`
- Check error history before fixing bugs: `db_find_similar_errors "error-pattern" 5`
- Review quality gate trends: `db_quality_gate_history "gate-type" 30`
- Monitor token usage: `db_token_savings "$WORKFLOW_ID"`
- Access institutional knowledge: `db_query_knowledge "agent-name" "context" 10`

### For System Operators
- Monitor database health: `db_health_check`
- View overall statistics: `db_stats`
- Track workflow success rates
- Identify optimization opportunities
- Build reports from aggregated data

## Conclusion

This database integration transforms workflows from isolated executions into a learning system. Each workflow:
- **Learns** from past similar executions
- **Tracks** comprehensive metrics
- **Stores** institutional knowledge
- **Notifies** stakeholders of progress
- **Improves** over time through accumulated experience

The result is an orchestration system that gets smarter with every execution, estimates accurately, prevents known errors, and continuously optimizes its performance.
