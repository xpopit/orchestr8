/**
 * Orchestration pattern matching engine
 */

import crypto from 'crypto';
import { DatabaseManager } from './database';
import { OrchestrationPattern, PatternMatchResult } from './types';
import { logger } from './logger';

/**
 * Calculate cosine similarity between two text strings using simple word vectors
 */
function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Build vocabulary
  const vocab = new Set([...words1, ...words2]);

  // Create vectors
  const vec1: number[] = [];
  const vec2: number[] = [];

  for (const word of vocab) {
    vec1.push(words1.filter(w => w === word).length);
    vec2.push(words2.filter(w => w === word).length);
  }

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) return 0;

  return dotProduct / (mag1 * mag2);
}

/**
 * Extract keywords from goal text
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
    'add', 'create', 'build', 'implement', 'update', 'fix', 'remove',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

/**
 * Calculate Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate string similarity
 */
function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Calculate keyword overlap
 */
function keywordOverlap(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  let intersection = 0;
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;

  return union > 0 ? intersection / union : 0;
}

export class PatternMatcher {
  private db: DatabaseManager;
  private patterns: Map<string, OrchestrationPattern> = new Map();

  constructor(db: DatabaseManager) {
    this.db = db;
    this.loadPatterns();
  }

  /**
   * Load patterns from database
   */
  private loadPatterns(): void {
    const patterns = this.db.getAllPatterns();
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);
    }
    logger.info('Patterns loaded', { count: this.patterns.size });
  }

  /**
   * Get best matching pattern for a goal
   */
  async getPattern(goal: string): Promise<PatternMatchResult | null> {
    logger.debug('Getting pattern for goal', { goal });

    const matches = await this.findSimilar(goal, 0.7);

    if (matches.length === 0) {
      return null;
    }

    // Return best match
    return matches[0];
  }

  /**
   * Find similar patterns
   */
  async findSimilar(goal: string, minSimilarity: number = 0.7): Promise<PatternMatchResult[]> {
    const startTime = Date.now();

    const goalKeywords = extractKeywords(goal);

    const matches: PatternMatchResult[] = [];

    for (const pattern of this.patterns.values()) {
      const similarity = this.calculateSimilarity(goal, goalKeywords, pattern);

      if (similarity >= minSimilarity) {
        const taskCount = pattern.success_count + pattern.failure_count;
        const successRate = taskCount > 0 ? pattern.success_count / taskCount : 0;

        matches.push({
          pattern,
          success_rate: successRate,
          similarity,
          task_count: taskCount,
        });
      }
    }

    // Sort by combined score: similarity * success_rate
    matches.sort((a, b) => {
      const scoreA = a.similarity * (a.success_rate * 0.5 + 0.5); // Weight success rate
      const scoreB = b.similarity * (b.success_rate * 0.5 + 0.5);
      return scoreB - scoreA;
    });

    const duration = Date.now() - startTime;
    logger.debug('Pattern matching complete', {
      duration_ms: duration,
      matches_found: matches.length,
    });

    return matches;
  }

  /**
   * Calculate similarity between goal and pattern
   */
  private calculateSimilarity(
    goal: string,
    goalKeywords: string[],
    pattern: OrchestrationPattern
  ): number {
    const patternKeywords = extractKeywords(pattern.goal);

    // Calculate component similarities
    const cosineSim = cosineSimilarity(goal, pattern.goal);
    const keywordSim = keywordOverlap(goalKeywords, patternKeywords);
    const stringSim = stringSimilarity(goal, pattern.goal);

    // Weighted combination
    const similarity = 0.5 * cosineSim + 0.3 * keywordSim + 0.2 * stringSim;

    return similarity;
  }

  /**
   * Store new pattern
   */
  async storePattern(
    goal: string,
    agentSequence: string[],
    dependencies: Record<string, string[]> = {},
    parallelGroups: string[][] = []
  ): Promise<string> {
    // Generate pattern ID
    const id = crypto.createHash('sha256')
      .update(goal)
      .digest('hex')
      .substring(0, 16);

    const pattern: OrchestrationPattern = {
      id,
      goal,
      agent_sequence: agentSequence,
      dependencies,
      parallel_groups: parallelGroups,
      success_count: 0,
      failure_count: 0,
      avg_duration_ms: 0,
      avg_tokens_saved: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.db.upsertPattern(pattern);
    this.patterns.set(id, pattern);

    logger.info('Pattern stored', { id, goal });

    return id;
  }

  /**
   * Update pattern with outcome
   */
  async updatePattern(
    patternId: string,
    success: boolean,
    durationMs?: number,
    tokensSaved?: number
  ): Promise<void> {
    const pattern = this.patterns.get(patternId);

    if (!pattern) {
      logger.warn('Pattern not found for update', { pattern_id: patternId });
      return;
    }

    // Update counts
    if (success) {
      pattern.success_count++;
    } else {
      pattern.failure_count++;
    }

    // Update averages
    const taskCount = pattern.success_count + pattern.failure_count;

    if (durationMs !== undefined) {
      pattern.avg_duration_ms = Math.round(
        (pattern.avg_duration_ms * (taskCount - 1) + durationMs) / taskCount
      );
    }

    if (tokensSaved !== undefined) {
      pattern.avg_tokens_saved = Math.round(
        (pattern.avg_tokens_saved * (taskCount - 1) + tokensSaved) / taskCount
      );
    }

    pattern.updated_at = new Date().toISOString();

    this.db.upsertPattern(pattern);
    this.patterns.set(pattern.id, pattern);

    logger.info('Pattern updated', {
      id: patternId,
      success,
      success_rate: pattern.success_count / taskCount,
    });
  }

  /**
   * Get all patterns
   */
  getAllPatterns(): OrchestrationPattern[] {
    return Array.from(this.patterns.values());
  }

  /**
   * Get pattern statistics
   */
  getStats(): {
    total: number;
    avg_success_rate: number;
  } {
    const patterns = Array.from(this.patterns.values());
    const total = patterns.length;

    if (total === 0) {
      return { total: 0, avg_success_rate: 0 };
    }

    const totalSuccessRate = patterns.reduce((sum, pattern) => {
      const taskCount = pattern.success_count + pattern.failure_count;
      const successRate = taskCount > 0 ? pattern.success_count / taskCount : 0;
      return sum + successRate;
    }, 0);

    return {
      total,
      avg_success_rate: totalSuccessRate / total,
    };
  }

  /**
   * Reload patterns from database
   */
  reload(): void {
    this.patterns.clear();
    this.loadPatterns();
  }
}
