/**
 * SQLite database management
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';
import { logger } from './logger';
import { OrchestrationPattern, DecisionParams } from './types';

export class DatabaseManager {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Ensure data directory exists
    if (!fs.existsSync(config.dataDir)) {
      fs.mkdirSync(config.dataDir, { recursive: true });
    }

    this.dbPath = path.join(config.dataDir, 'mcp.db');
    this.db = new Database(this.dbPath);
    this.initialize();
  }

  private initialize(): void {
    logger.info('Initializing database', { path: this.dbPath });

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('temp_store = MEMORY');

    // Create tables
    this.createTables();

    logger.info('Database initialized successfully');
  }

  private createTables(): void {
    // Agent queries log
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_queries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        capability TEXT,
        role TEXT,
        context TEXT,
        agents_returned TEXT,
        cache_hit INTEGER,
        duration_ms INTEGER
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_agent_queries_timestamp
      ON agent_queries(timestamp);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_agent_queries_capability
      ON agent_queries(capability);
    `);

    // Orchestration patterns
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orchestration_patterns (
        id TEXT PRIMARY KEY,
        goal TEXT NOT NULL,
        agent_sequence TEXT NOT NULL,
        dependencies TEXT,
        parallel_groups TEXT,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        avg_duration_ms INTEGER DEFAULT 0,
        avg_tokens_saved INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_patterns_goal
      ON orchestration_patterns(goal);
    `);

    // Decision history
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS decision_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT UNIQUE NOT NULL,
        task_description TEXT NOT NULL,
        agents_used TEXT NOT NULL,
        result TEXT NOT NULL,
        duration_ms INTEGER,
        tokens_saved INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_decision_history_timestamp
      ON decision_history(timestamp);
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_decision_history_result
      ON decision_history(result);
    `);
  }

  /**
   * Log agent query
   */
  logAgentQuery(
    capability: string | undefined,
    role: string | undefined,
    context: string | undefined,
    agents: string[],
    cacheHit: boolean,
    durationMs: number
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO agent_queries
        (capability, role, context, agents_returned, cache_hit, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      capability || null,
      role || null,
      context || null,
      JSON.stringify(agents),
      cacheHit ? 1 : 0,
      durationMs
    );
  }

  /**
   * Store or update orchestration pattern
   */
  upsertPattern(pattern: OrchestrationPattern): void {
    const stmt = this.db.prepare(`
      INSERT INTO orchestration_patterns
        (id, goal, agent_sequence, dependencies, parallel_groups,
         success_count, failure_count, avg_duration_ms, avg_tokens_saved, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        success_count = ?,
        failure_count = ?,
        avg_duration_ms = ?,
        avg_tokens_saved = ?,
        updated_at = ?
    `);

    const now = new Date().toISOString();
    stmt.run(
      pattern.id,
      pattern.goal,
      JSON.stringify(pattern.agent_sequence),
      JSON.stringify(pattern.dependencies),
      JSON.stringify(pattern.parallel_groups),
      pattern.success_count,
      pattern.failure_count,
      pattern.avg_duration_ms,
      pattern.avg_tokens_saved,
      pattern.created_at || now,
      now,
      // UPDATE values
      pattern.success_count,
      pattern.failure_count,
      pattern.avg_duration_ms,
      pattern.avg_tokens_saved,
      now
    );
  }

  /**
   * Get all orchestration patterns
   */
  getAllPatterns(): OrchestrationPattern[] {
    const stmt = this.db.prepare('SELECT * FROM orchestration_patterns');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      id: row.id,
      goal: row.goal,
      agent_sequence: JSON.parse(row.agent_sequence),
      dependencies: JSON.parse(row.dependencies || '{}'),
      parallel_groups: JSON.parse(row.parallel_groups || '[]'),
      success_count: row.success_count,
      failure_count: row.failure_count,
      avg_duration_ms: row.avg_duration_ms,
      avg_tokens_saved: row.avg_tokens_saved,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  /**
   * Get pattern by ID
   */
  getPattern(id: string): OrchestrationPattern | null {
    const stmt = this.db.prepare('SELECT * FROM orchestration_patterns WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      goal: row.goal,
      agent_sequence: JSON.parse(row.agent_sequence),
      dependencies: JSON.parse(row.dependencies || '{}'),
      parallel_groups: JSON.parse(row.parallel_groups || '[]'),
      success_count: row.success_count,
      failure_count: row.failure_count,
      avg_duration_ms: row.avg_duration_ms,
      avg_tokens_saved: row.avg_tokens_saved,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Store decision
   */
  storeDecision(decision: DecisionParams): void {
    const stmt = this.db.prepare(`
      INSERT INTO decision_history
        (task_id, task_description, agents_used, result, duration_ms, tokens_saved)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(task_id) DO UPDATE SET
        result = ?,
        duration_ms = ?,
        tokens_saved = ?,
        timestamp = CURRENT_TIMESTAMP
    `);

    stmt.run(
      decision.task_id,
      decision.task_description,
      JSON.stringify(decision.agents_used),
      decision.result,
      decision.duration_ms || null,
      decision.tokens_saved || null,
      // UPDATE values
      decision.result,
      decision.duration_ms || null,
      decision.tokens_saved || null
    );
  }

  /**
   * Get query statistics
   */
  getQueryStats(): {
    total: number;
    cacheHits: number;
    cacheMisses: number;
    avgDurationMs: number;
  } {
    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(cache_hit) as cache_hits,
        SUM(CASE WHEN cache_hit = 0 THEN 1 ELSE 0 END) as cache_misses,
        AVG(duration_ms) as avg_duration_ms
      FROM agent_queries
    `);

    const result = stmt.get() as any;

    return {
      total: result.total || 0,
      cacheHits: result.cache_hits || 0,
      cacheMisses: result.cache_misses || 0,
      avgDurationMs: result.avg_duration_ms || 0,
    };
  }

  /**
   * Get database size in MB
   */
  getDatabaseSize(): number {
    const stats = fs.statSync(this.dbPath);
    return stats.size / (1024 * 1024);
  }

  /**
   * Close database connection
   */
  close(): void {
    logger.info('Closing database connection');
    this.db.close();
  }

  /**
   * Get database instance (for testing)
   */
  getDatabase(): Database.Database {
    return this.db;
  }
}

// Singleton instance
let dbInstance: DatabaseManager | null = null;

export function getDatabase(): DatabaseManager {
  if (!dbInstance) {
    dbInstance = new DatabaseManager();
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
