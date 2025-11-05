/**
 * Agent query engine - intelligent agent matching
 */

import { Indexer } from './indexer';
import { AgentIndex, AgentQueryParams, AgentQueryResult } from './types';
import { logger } from './logger';

/**
 * Calculate Levenshtein distance between two strings
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
 * Calculate string similarity (0-1, higher is more similar)
 */
function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction: lowercase, remove common words, split
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'be', 'been',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word));
}

/**
 * Calculate TF-IDF relevance score
 */
function calculateRelevance(keywords: string[], agent: AgentIndex): number {
  const agentText = [
    agent.name,
    agent.description,
    ...agent.capabilities,
  ].join(' ').toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    if (agentText.includes(keyword)) {
      // Simple TF score (count occurrences)
      const regex = new RegExp(keyword, 'gi');
      const matches = agentText.match(regex);
      score += matches ? matches.length : 0;
    }
  }

  return score;
}

export class AgentQueryEngine {
  private indexer: Indexer;

  constructor(indexer: Indexer) {
    this.indexer = indexer;
  }

  /**
   * Query agents by capability, role, or context
   */
  async query(params: AgentQueryParams): Promise<AgentQueryResult> {
    const startTime = Date.now();
    logger.debug('Agent query', { params });

    let agents: AgentIndex[] = [];
    let reasoning = '';
    let confidence = 0;

    // Strategy 1: Query by role (highest priority)
    if (params.role) {
      const result = this.queryByRole(params.role);
      agents = result.agents;
      reasoning = result.reasoning;
      confidence = result.confidence;
    }
    // Strategy 2: Query by capability
    else if (params.capability) {
      const result = this.queryByCapability(params.capability);
      agents = result.agents;
      reasoning = result.reasoning;
      confidence = result.confidence;
    }
    // Strategy 3: Query by context
    else if (params.context) {
      const result = this.queryByContext(params.context);
      agents = result.agents;
      reasoning = result.reasoning;
      confidence = result.confidence;
    }

    // Apply limit
    const limit = params.limit || 5;
    agents = agents.slice(0, limit);

    const duration = Date.now() - startTime;
    logger.debug('Agent query complete', {
      duration_ms: duration,
      agents_found: agents.length,
      confidence,
    });

    return {
      agents,
      reasoning,
      confidence,
      cache_hit: false, // Cache manager will set this
    };
  }

  /**
   * Query by role from agent registry
   */
  private queryByRole(role: string): {
    agents: AgentIndex[];
    reasoning: string;
    confidence: number;
  } {
    const registry = this.indexer.getAgentRegistry();

    if (!registry) {
      return {
        agents: [],
        reasoning: `No agent registry available`,
        confidence: 0,
      };
    }

    const roleInfo = registry.roles[role];

    if (!roleInfo) {
      // Try fuzzy matching on role names
      const availableRoles = Object.keys(registry.roles);
      const matches = availableRoles
        .map(r => ({ role: r, similarity: stringSimilarity(role, r) }))
        .filter(m => m.similarity > 0.6)
        .sort((a, b) => b.similarity - a.similarity);

      if (matches.length > 0) {
        const bestMatch = matches[0];
        const matchedRoleInfo = registry.roles[bestMatch.role];
        const agents = [matchedRoleInfo.primary, ...matchedRoleInfo.fallbacks]
          .map(name => this.indexer.getAgent(name))
          .filter(a => a !== undefined) as AgentIndex[];

        return {
          agents,
          reasoning: `Role '${role}' not found, matched similar role '${bestMatch.role}' (similarity: ${bestMatch.similarity.toFixed(2)})`,
          confidence: bestMatch.similarity,
        };
      }

      return {
        agents: [],
        reasoning: `Role '${role}' not found in agent registry`,
        confidence: 0,
      };
    }

    // Get primary + fallback agents
    const agents = [roleInfo.primary, ...roleInfo.fallbacks]
      .map(name => this.indexer.getAgent(name))
      .filter(a => a !== undefined) as AgentIndex[];

    return {
      agents,
      reasoning: `Matched role '${role}': primary agent '${roleInfo.primary}' with ${roleInfo.fallbacks.length} fallbacks`,
      confidence: 0.95,
    };
  }

  /**
   * Query by capability tag
   */
  private queryByCapability(capability: string): {
    agents: AgentIndex[];
    reasoning: string;
    confidence: number;
  } {
    const allAgents = this.indexer.getAgents();
    const capabilityLower = capability.toLowerCase();

    // Exact matches first
    const exactMatches = allAgents.filter(agent =>
      agent.capabilities.some(c => c.toLowerCase() === capabilityLower)
    );

    if (exactMatches.length > 0) {
      return {
        agents: exactMatches,
        reasoning: `Found ${exactMatches.length} agents with exact capability match '${capability}'`,
        confidence: 0.9,
      };
    }

    // Fuzzy matches
    const fuzzyMatches = allAgents
      .map(agent => {
        const bestMatch = agent.capabilities
          .map(c => stringSimilarity(capabilityLower, c.toLowerCase()))
          .reduce((max, sim) => Math.max(max, sim), 0);
        return { agent, similarity: bestMatch };
      })
      .filter(m => m.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    if (fuzzyMatches.length > 0) {
      return {
        agents: fuzzyMatches.map(m => m.agent),
        reasoning: `Found ${fuzzyMatches.length} agents with fuzzy capability match (similarity > 0.6)`,
        confidence: fuzzyMatches[0].similarity,
      };
    }

    // Partial matches in description
    const descriptionMatches = allAgents.filter(agent =>
      agent.description.toLowerCase().includes(capabilityLower)
    );

    if (descriptionMatches.length > 0) {
      return {
        agents: descriptionMatches,
        reasoning: `Found ${descriptionMatches.length} agents with capability in description`,
        confidence: 0.5,
      };
    }

    return {
      agents: [],
      reasoning: `No agents found matching capability '${capability}'`,
      confidence: 0,
    };
  }

  /**
   * Query by context text
   */
  private queryByContext(context: string): {
    agents: AgentIndex[];
    reasoning: string;
    confidence: number;
  } {
    const keywords = extractKeywords(context);

    if (keywords.length === 0) {
      return {
        agents: [],
        reasoning: 'No meaningful keywords extracted from context',
        confidence: 0,
      };
    }

    const allAgents = this.indexer.getAgents();

    // Calculate relevance scores
    const scored = allAgents
      .map(agent => ({
        agent,
        score: calculateRelevance(keywords, agent),
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (scored.length === 0) {
      return {
        agents: [],
        reasoning: `No agents matched context keywords: ${keywords.join(', ')}`,
        confidence: 0,
      };
    }

    const maxScore = scored[0].score;
    const normalizedConfidence = Math.min(maxScore / 5, 1); // Normalize to 0-1

    return {
      agents: scored.map(s => s.agent),
      reasoning: `Matched ${scored.length} agents by context relevance (keywords: ${keywords.slice(0, 5).join(', ')})`,
      confidence: normalizedConfidence,
    };
  }
}
