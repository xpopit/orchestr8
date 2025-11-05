/**
 * Type definitions for MCP server
 */

export interface AgentIndex {
  name: string;
  description: string;
  model: 'sonnet' | 'haiku' | 'opus';
  capabilities: string[];
  plugin: string;
  role?: string;
  fallbacks?: string[];
}

export interface AgentQueryParams {
  capability?: string;
  role?: string;
  context?: string;
  limit?: number;
}

export interface AgentQueryResult {
  agents: AgentIndex[];
  reasoning: string;
  confidence: number;
  cache_hit: boolean;
}

export interface OrchestrationPattern {
  id: string;
  goal: string;
  agent_sequence: string[];
  dependencies: Record<string, string[]>;
  parallel_groups: string[][];
  success_count: number;
  failure_count: number;
  avg_duration_ms: number;
  avg_tokens_saved: number;
  created_at: string;
  updated_at: string;
}

export interface PatternMatchResult {
  pattern: OrchestrationPattern;
  success_rate: number;
  similarity: number;
  task_count: number;
}

export interface SkillIndex {
  name: string;
  category: string;
  keywords: string[];
  description: string;
  plugin: string;
}

export interface SkillQueryResult {
  skills: SkillIndex[];
  reasoning: string;
  confidence: number;
}

export interface WorkflowIndex {
  name: string;
  description: string;
  arguments?: string;
  steps: string[];
  agents: string[];
  plugin: string;
}

export interface WorkflowQueryResult {
  workflows: WorkflowIndex[];
  reasoning: string;
  confidence: number;
}

export interface DecisionParams {
  task_id: string;
  task_description: string;
  agents_used: string[];
  result: 'success' | 'failure' | 'partial';
  duration_ms?: number;
  tokens_saved?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime_ms: number;
  memory_mb: number;
  cache: {
    hits: number;
    misses: number;
    hit_rate: number;
  };
  database: {
    connected: boolean;
    size_mb: number;
  };
  indexes: {
    agents: number;
    skills: number;
    workflows: number;
    patterns: number;
  };
}

export interface ServerMetrics {
  queries: {
    total: number;
    by_method: Record<string, number>;
  };
  performance: {
    avg_query_time_ms: number;
    p50_query_time_ms: number;
    p95_query_time_ms: number;
    p99_query_time_ms: number;
  };
  cache: {
    hits: number;
    misses: number;
    hit_rate: number;
  };
  patterns: {
    total: number;
    avg_success_rate: number;
  };
}

export interface ServerConfig {
  port: number;
  dataDir: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheTTL: number;
  autoRestart: boolean;
  watchFiles: boolean;
  maxMemoryMB: number;
}

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: number | string;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number | string;
}

export interface AgentRole {
  primary: string;
  fallbacks: string[];
  capabilities: string[];
  model: 'sonnet' | 'haiku' | 'opus';
  use_when: string;
}

export interface AgentRegistry {
  roles: Record<string, AgentRole>;
}
