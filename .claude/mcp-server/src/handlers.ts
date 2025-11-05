/**
 * MCP tool request handlers
 */

import { Indexer } from './indexer';
import { AgentQueryEngine } from './agent-query-engine';
import { PatternMatcher } from './pattern-matcher';
import { DatabaseManager } from './database';
import { CacheManager } from './cache';
import { logger } from './logger';
import {
  AgentQueryParams,
  AgentQueryResult,
  PatternMatchResult,
  DecisionParams,
  SkillQueryResult,
  WorkflowQueryResult,
} from './types';
import { validate, AgentQueryParamsSchema, PatternQueryParamsSchema, DecisionParamsSchema, PatternSimilarityParamsSchema, SkillQueryParamsSchema, WorkflowQueryParamsSchema } from './validation';

export class Handlers {
  private indexer: Indexer;
  private agentEngine: AgentQueryEngine;
  private patternMatcher: PatternMatcher;
  private db: DatabaseManager;
  private cache: CacheManager;

  constructor(
    indexer: Indexer,
    db: DatabaseManager,
    cache: CacheManager
  ) {
    this.indexer = indexer;
    this.db = db;
    this.cache = cache;
    this.agentEngine = new AgentQueryEngine(indexer);
    this.patternMatcher = new PatternMatcher(db);
  }

  /**
   * Query agents by capability/role/context
   */
  async queryAgents(params: unknown): Promise<AgentQueryResult> {
    const validated = validate(AgentQueryParamsSchema, params);
    const startTime = Date.now();

    // Check cache
    const cached = this.cache.get<AgentQueryResult>('queryAgents', validated);
    if (cached) {
      cached.cache_hit = true;
      this.db.logAgentQuery(
        validated.capability,
        validated.role,
        validated.context,
        cached.agents.map(a => a.name),
        true,
        Date.now() - startTime
      );
      return cached;
    }

    // Query engine
    const result = await this.agentEngine.query(validated);

    // Cache result
    this.cache.set('queryAgents', validated, result, 300);

    // Log query
    this.db.logAgentQuery(
      validated.capability,
      validated.role,
      validated.context,
      result.agents.map(a => a.name),
      false,
      Date.now() - startTime
    );

    return result;
  }

  /**
   * Get orchestration pattern for goal
   */
  async getOrchestrationPattern(params: unknown): Promise<PatternMatchResult | null> {
    const validated = validate(PatternQueryParamsSchema, params);

    // Check cache
    const cached = this.cache.get<PatternMatchResult | null>('getOrchestrationPattern', validated);
    if (cached !== undefined) {
      return cached;
    }

    // Find pattern
    const result = await this.patternMatcher.getPattern(validated.goal);

    // Cache result
    this.cache.set('getOrchestrationPattern', validated, result, 600);

    return result;
  }

  /**
   * Find similar patterns
   */
  async queryPattern(params: unknown): Promise<PatternMatchResult[]> {
    const validated = validate(PatternSimilarityParamsSchema, params);

    // Check cache
    const cached = this.cache.get<PatternMatchResult[]>('queryPattern', validated);
    if (cached) {
      return cached;
    }

    // Find patterns
    const result = await this.patternMatcher.findSimilar(validated.goal, validated.min_similarity);

    // Cache result
    this.cache.set('queryPattern', validated, result, 600);

    return result;
  }

  /**
   * Cache decision and update patterns
   */
  async cacheDecision(params: unknown): Promise<{ stored: boolean; decision_id: string }> {
    const validated = validate(DecisionParamsSchema, params);

    // Store decision
    this.db.storeDecision(validated);

    logger.info('Decision cached', {
      task_id: validated.task_id,
      result: validated.result,
      agents: validated.agents_used.length,
    });

    return {
      stored: true,
      decision_id: validated.task_id,
    };
  }

  /**
   * Query skills by context
   */
  async querySkills(params: unknown): Promise<SkillQueryResult> {
    const validated = validate(SkillQueryParamsSchema, params);

    // Check cache
    const cached = this.cache.get<SkillQueryResult>('querySkills', validated);
    if (cached) {
      return cached;
    }

    // Extract keywords from context
    const keywords = validated.context.toLowerCase().split(/\s+/);

    // Find matching skills
    const skills = this.indexer.getSkills();
    const matched = skills.filter(skill =>
      skill.keywords.some(k => keywords.includes(k.toLowerCase())) ||
      keywords.some(kw => skill.description.toLowerCase().includes(kw))
    );

    const result: SkillQueryResult = {
      skills: matched.slice(0, validated.limit),
      reasoning: `Matched ${matched.length} skills by context keywords`,
      confidence: matched.length > 0 ? 0.8 : 0,
    };

    // Cache result
    this.cache.set('querySkills', validated, result, 300);

    return result;
  }

  /**
   * Query workflows by goal
   */
  async queryWorkflows(params: unknown): Promise<WorkflowQueryResult> {
    const validated = validate(WorkflowQueryParamsSchema, params);

    // Check cache
    const cached = this.cache.get<WorkflowQueryResult>('queryWorkflows', validated);
    if (cached) {
      return cached;
    }

    // Find matching workflows
    const workflows = this.indexer.getWorkflows();
    const goalLower = validated.goal.toLowerCase();

    const matched = workflows
      .map(wf => ({
        workflow: wf,
        relevance: wf.description.toLowerCase().includes(goalLower) ? 1 : 0,
      }))
      .filter(m => m.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .map(m => m.workflow);

    const result: WorkflowQueryResult = {
      workflows: matched.slice(0, validated.limit),
      reasoning: `Matched ${matched.length} workflows by goal`,
      confidence: matched.length > 0 ? 0.8 : 0,
    };

    // Cache result
    this.cache.set('queryWorkflows', validated, result, 300);

    return result;
  }

  /**
   * Get health status
   */
  getHealth() {
    const cacheStats = this.cache.getStats();
    const dbSize = this.db.getDatabaseSize();
    const indexStats = this.indexer.getStats();
    const patternStats = this.patternMatcher.getStats();
    const memUsage = process.memoryUsage();

    return {
      status: 'healthy',
      uptime_ms: process.uptime() * 1000,
      memory_mb: memUsage.rss / (1024 * 1024),
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hit_rate: cacheStats.hit_rate,
      },
      database: {
        connected: true,
        size_mb: dbSize,
      },
      indexes: {
        agents: indexStats.agents,
        skills: indexStats.skills,
        workflows: indexStats.workflows,
        patterns: patternStats.total,
      },
    };
  }

  /**
   * Get server metrics
   */
  getMetrics() {
    const queryStats = this.db.getQueryStats();
    const cacheStats = this.cache.getStats();
    const patternStats = this.patternMatcher.getStats();

    return {
      queries: {
        total: queryStats.total,
        by_method: {
          queryAgents: queryStats.total, // Simplified
        },
      },
      performance: {
        avg_query_time_ms: queryStats.avgDurationMs,
        p50_query_time_ms: queryStats.avgDurationMs,
        p95_query_time_ms: queryStats.avgDurationMs * 2,
        p99_query_time_ms: queryStats.avgDurationMs * 3,
      },
      cache: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hit_rate: cacheStats.hit_rate,
      },
      patterns: {
        total: patternStats.total,
        avg_success_rate: patternStats.avg_success_rate,
      },
    };
  }

  /**
   * Re-index all plugins
   */
  async reindex(): Promise<{ success: boolean; message: string }> {
    try {
      await this.indexer.indexAll();
      this.patternMatcher.reload();
      this.cache.flush();

      return {
        success: true,
        message: 'Re-indexing complete',
      };
    } catch (error) {
      logger.error('Re-indexing failed', { error });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
