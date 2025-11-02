-- orchestr8 Code Intelligence Database Schema
-- PostgreSQL 15+ with pgvector extension
-- Purpose: Multi-project code intelligence + plugin component registry

-- =============================================================================
-- EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For fuzzy text search

-- =============================================================================
-- PROJECTS SCHEMA - Multi-project support
-- =============================================================================

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  path TEXT UNIQUE NOT NULL,  -- Absolute path to project root
  language_primary TEXT,  -- "typescript", "python", "java", etc.
  languages TEXT[],  -- All languages in project
  framework TEXT,  -- "nextjs", "django", "spring-boot", etc.
  description TEXT,
  git_remote TEXT,
  git_branch TEXT DEFAULT 'main',
  total_files INTEGER DEFAULT 0,
  total_lines INTEGER DEFAULT 0,
  total_functions INTEGER DEFAULT 0,
  total_classes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_indexed_at TIMESTAMP,
  indexed_git_hash TEXT,  -- Git hash at last index
  metadata JSONB DEFAULT '{}'::jsonb  -- Flexible metadata storage
);

CREATE INDEX idx_projects_path ON projects(path);
CREATE INDEX idx_projects_name ON projects(name);

-- =============================================================================
-- CODE INTELLIGENCE SCHEMA - Codebase analysis
-- =============================================================================

-- Files
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,  -- Relative to project root
  absolute_path TEXT NOT NULL,
  language TEXT NOT NULL,
  size_bytes INTEGER,
  line_count INTEGER,
  char_count INTEGER,
  is_test_file BOOLEAN DEFAULT FALSE,
  is_config_file BOOLEAN DEFAULT FALSE,
  last_modified TIMESTAMP,
  git_hash TEXT,
  indexed_at TIMESTAMP DEFAULT NOW(),
  content_hash TEXT,  -- For change detection
  UNIQUE(project_id, path)
);

CREATE INDEX idx_files_project ON files(project_id);
CREATE INDEX idx_files_path ON files(path);
CREATE INDEX idx_files_language ON files(language);
CREATE INDEX idx_files_test ON files(is_test_file);

-- Functions/Methods
CREATE TABLE functions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qualified_name TEXT,  -- "ClassName.methodName" or "module.function"
  signature TEXT,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  start_char INTEGER,
  end_char INTEGER,
  parameters JSONB,  -- [{"name": "x", "type": "number", "optional": false}, ...]
  return_type TEXT,
  docstring TEXT,
  is_async BOOLEAN DEFAULT FALSE,
  is_generator BOOLEAN DEFAULT FALSE,
  is_exported BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,
  is_static BOOLEAN DEFAULT FALSE,
  is_abstract BOOLEAN DEFAULT FALSE,
  decorators TEXT[],  -- ["@cached", "@route('/api')"]
  complexity INTEGER,  -- Cyclomatic complexity
  test_coverage FLOAT DEFAULT 0,
  lines_of_code INTEGER,
  parent_class_id UUID REFERENCES classes(id),  -- If this is a method
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_functions_project ON functions(project_id);
CREATE INDEX idx_functions_file ON functions(file_id);
CREATE INDEX idx_functions_name ON functions(name);
CREATE INDEX idx_functions_qualified ON functions(qualified_name);
CREATE INDEX idx_functions_exported ON functions(is_exported);
CREATE INDEX idx_functions_docstring ON functions USING gin(to_tsvector('english', docstring));

-- Classes/Types
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  qualified_name TEXT,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  extends TEXT[],  -- Parent classes
  implements TEXT[],  -- Interfaces/protocols
  properties JSONB,  -- [{"name": "userId", "type": "string", "visibility": "private"}, ...]
  decorators TEXT[],
  is_abstract BOOLEAN DEFAULT FALSE,
  is_interface BOOLEAN DEFAULT FALSE,
  is_exported BOOLEAN DEFAULT FALSE,
  docstring TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_classes_project ON classes(project_id);
CREATE INDEX idx_classes_file ON classes(file_id);
CREATE INDEX idx_classes_name ON classes(name);
CREATE INDEX idx_classes_qualified ON classes(qualified_name);
CREATE INDEX idx_classes_docstring ON classes USING gin(to_tsvector('english', docstring));

-- Variables/Constants
CREATE TABLE variables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  value TEXT,  -- For constants
  line_number INTEGER,
  is_constant BOOLEAN DEFAULT FALSE,
  is_exported BOOLEAN DEFAULT FALSE,
  scope TEXT,  -- "global", "module", "class", "function"
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variables_project ON variables(project_id);
CREATE INDEX idx_variables_file ON variables(file_id);
CREATE INDEX idx_variables_name ON variables(name);

-- Dependencies/Imports
CREATE TABLE dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  import_name TEXT NOT NULL,
  import_from TEXT,  -- Package/module name
  import_path TEXT,  -- For relative imports
  import_type TEXT,  -- "default", "named", "namespace", "side-effect"
  is_external BOOLEAN DEFAULT FALSE,  -- npm/pip package vs local file
  is_dev_dependency BOOLEAN DEFAULT FALSE,
  line_number INTEGER,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dependencies_project ON dependencies(project_id);
CREATE INDEX idx_dependencies_file ON dependencies(file_id);
CREATE INDEX idx_dependencies_external ON dependencies(is_external);
CREATE INDEX idx_dependencies_name ON dependencies(import_name);

-- Function Calls (Call Graph)
CREATE TABLE function_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  caller_function_id UUID REFERENCES functions(id) ON DELETE CASCADE,
  caller_file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  callee_function_id UUID REFERENCES functions(id) ON DELETE CASCADE,
  callee_name TEXT NOT NULL,  -- In case callee not in our DB (external)
  call_type TEXT,  -- "direct", "callback", "promise", "async"
  line_number INTEGER,
  call_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_function_calls_project ON function_calls(project_id);
CREATE INDEX idx_function_calls_caller ON function_calls(caller_function_id);
CREATE INDEX idx_function_calls_callee ON function_calls(callee_function_id);

-- Type Definitions
CREATE TABLE type_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT,  -- "interface", "type", "enum", "union", "intersection"
  definition TEXT,  -- Full type definition
  properties JSONB,
  is_exported BOOLEAN DEFAULT FALSE,
  line_number INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_type_definitions_project ON type_definitions(project_id);
CREATE INDEX idx_type_definitions_name ON type_definitions(name);

-- =============================================================================
-- PLUGIN REGISTRY SCHEMA - Self-aware plugin components
-- =============================================================================

-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,  -- "python-developer"
  category TEXT,  -- "development/languages"
  file_path TEXT NOT NULL,  -- Relative to .claude/
  description TEXT NOT NULL,
  model TEXT NOT NULL,  -- "claude-sonnet-4-5", "claude-opus-4"
  tools TEXT[],  -- ["Read", "Write", "Edit", "Bash", "Glob", "Grep"]
  use_cases TEXT[],  -- Extracted from description
  specializations TEXT[],  -- ["FastAPI", "Django", "asyncio"]
  content TEXT,  -- Full markdown content
  content_hash TEXT,
  token_count INTEGER,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  indexed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_category ON agents(category);
CREATE INDEX idx_agents_model ON agents(model);
CREATE INDEX idx_agents_description ON agents USING gin(to_tsvector('english', description));

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,  -- "test-driven-development"
  category TEXT,  -- "practices"
  directory_path TEXT NOT NULL,  -- Relative to .claude/skills/
  description TEXT NOT NULL,
  activation_triggers TEXT[],  -- Keywords that trigger auto-activation
  related_agents TEXT[],  -- Agents that commonly use this skill
  content TEXT,  -- Full SKILL.md content
  content_hash TEXT,
  token_count INTEGER,
  examples_count INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  indexed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_skills_name ON skills(name);
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_triggers ON skills USING gin(activation_triggers);
CREATE INDEX idx_skills_description ON skills USING gin(to_tsvector('english', description));

-- Workflows (Commands)
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,  -- "add-feature"
  slash_command TEXT UNIQUE NOT NULL,  -- "/add-feature"
  file_path TEXT NOT NULL,  -- Relative to .claude/commands/
  description TEXT NOT NULL,
  argument_hint TEXT,
  phases JSONB,  -- [{"name": "Analysis", "percentage": 20, "steps": [...]}, ...]
  agents_used TEXT[],  -- Agents invoked by this workflow
  quality_gates TEXT[],  -- ["code-review", "testing", "security"]
  success_criteria TEXT[],
  estimated_time_minutes INTEGER,
  content TEXT,  -- Full markdown content
  content_hash TEXT,
  token_count INTEGER,
  version TEXT DEFAULT '1.0.0',
  execution_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  indexed_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_workflows_name ON workflows(name);
CREATE INDEX idx_workflows_command ON workflows(slash_command);
CREATE INDEX idx_workflows_description ON workflows USING gin(to_tsvector('english', description));

-- Hooks (Future support)
CREATE TABLE hooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  hook_type TEXT NOT NULL,  -- "pre-commit", "post-install", "pre-deploy"
  file_path TEXT NOT NULL,
  script_content TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  last_execution_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_hooks_type ON hooks(hook_type);
CREATE INDEX idx_hooks_enabled ON hooks(is_enabled);

-- MCP Servers
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  command TEXT NOT NULL,  -- "node /path/to/server.js"
  args TEXT[],
  env_vars JSONB,  -- {"API_KEY": "xxx"}
  tools_provided TEXT[],  -- ["query_functions", "semantic_search"]
  is_active BOOLEAN DEFAULT TRUE,
  connection_status TEXT DEFAULT 'unknown',  -- "connected", "disconnected", "error"
  last_connected_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX idx_mcp_servers_active ON mcp_servers(is_active);

-- =============================================================================
-- SEMANTIC SEARCH - Vector embeddings
-- =============================================================================

CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,  -- "function", "class", "file", "agent", "skill", "workflow"
  entity_id UUID NOT NULL,  -- References the actual entity
  entity_name TEXT NOT NULL,
  text_content TEXT NOT NULL,  -- The text that was embedded
  embedding VECTOR(1536),  -- OpenAI ada-002 or similar (1536 dimensions)
  model_used TEXT DEFAULT 'text-embedding-ada-002',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_embeddings_type ON embeddings(entity_type);
CREATE INDEX idx_embeddings_entity ON embeddings(entity_id);
CREATE INDEX idx_embeddings_project ON embeddings(project_id);
-- Vector similarity index (requires tuning based on dataset size)
CREATE INDEX idx_embeddings_vector ON embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- =============================================================================
-- EXECUTION HISTORY - Track what runs
-- =============================================================================

CREATE TABLE execution_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id UUID REFERENCES workflows(id),
  workflow_name TEXT,
  user_prompt TEXT,
  status TEXT DEFAULT 'running',  -- "running", "completed", "failed", "cancelled"
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  cost_usd NUMERIC(10, 4) DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_execution_sessions_project ON execution_sessions(project_id);
CREATE INDEX idx_execution_sessions_workflow ON execution_sessions(workflow_id);
CREATE INDEX idx_execution_sessions_status ON execution_sessions(status);
CREATE INDEX idx_execution_sessions_start ON execution_sessions(start_time);

CREATE TABLE execution_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES execution_sessions(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id),
  agent_name TEXT,
  phase_name TEXT,
  step_number INTEGER,
  description TEXT,
  status TEXT DEFAULT 'running',  -- "running", "completed", "failed", "skipped"
  start_time TIMESTAMP DEFAULT NOW(),
  end_time TIMESTAMP,
  duration_seconds INTEGER,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  files_modified TEXT[],
  result_summary TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_execution_steps_session ON execution_steps(session_id);
CREATE INDEX idx_execution_steps_agent ON execution_steps(agent_id);
CREATE INDEX idx_execution_steps_status ON execution_steps(status);

-- =============================================================================
-- CONTEXT CACHE - Frequently used queries
-- =============================================================================

CREATE TABLE context_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,  -- Hash of query
  query_text TEXT NOT NULL,
  result_data JSONB NOT NULL,
  hit_count INTEGER DEFAULT 1,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(project_id, cache_key)
);

CREATE INDEX idx_context_cache_project ON context_cache(project_id);
CREATE INDEX idx_context_cache_key ON context_cache(cache_key);
CREATE INDEX idx_context_cache_expires ON context_cache(expires_at);

-- =============================================================================
-- PLUGIN METADATA - Plugin version and stats
-- =============================================================================

CREATE TABLE plugin_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plugin_name TEXT DEFAULT 'orchestr8',
  version TEXT NOT NULL,
  installed_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW(),
  total_agents INTEGER DEFAULT 0,
  total_skills INTEGER DEFAULT 0,
  total_workflows INTEGER DEFAULT 0,
  total_projects INTEGER DEFAULT 0,
  database_schema_version TEXT DEFAULT '1.0.0',
  configuration JSONB DEFAULT '{}'::jsonb
);

-- Insert initial metadata
INSERT INTO plugin_metadata (plugin_name, version, database_schema_version)
VALUES ('orchestr8', '1.4.0', '1.0.0');

-- =============================================================================
-- VIEWS - Convenient queries
-- =============================================================================

-- Project summary view
CREATE VIEW project_summary AS
SELECT
  p.id,
  p.name,
  p.path,
  p.language_primary,
  COUNT(DISTINCT f.id) as file_count,
  COUNT(DISTINCT fn.id) as function_count,
  COUNT(DISTINCT c.id) as class_count,
  SUM(f.line_count) as total_lines,
  p.last_indexed_at
FROM projects p
LEFT JOIN files f ON f.project_id = p.id
LEFT JOIN functions fn ON fn.project_id = p.id
LEFT JOIN classes c ON c.project_id = p.id
GROUP BY p.id;

-- Agent capabilities view
CREATE VIEW agent_capabilities AS
SELECT
  a.name,
  a.category,
  a.model,
  a.tools,
  a.description,
  COUNT(DISTINCT es.id) as times_used,
  AVG(es.duration_seconds) as avg_duration_seconds,
  SUM(es.tokens_input) as total_tokens_input,
  SUM(es.tokens_output) as total_tokens_output
FROM agents a
LEFT JOIN execution_steps es ON es.agent_name = a.name
GROUP BY a.id;

-- Workflow performance view
CREATE VIEW workflow_performance AS
SELECT
  w.name,
  w.slash_command,
  w.execution_count,
  w.success_count,
  w.failure_count,
  CASE
    WHEN w.execution_count > 0
    THEN ROUND((w.success_count::numeric / w.execution_count * 100), 2)
    ELSE 0
  END as success_rate,
  AVG(esess.duration_seconds) as avg_duration_seconds,
  AVG(esess.tokens_input) as avg_tokens_input,
  AVG(esess.tokens_output) as avg_tokens_output,
  AVG(esess.cost_usd) as avg_cost_usd
FROM workflows w
LEFT JOIN execution_sessions esess ON esess.workflow_name = w.name
GROUP BY w.id;

-- Function complexity view
CREATE VIEW function_complexity AS
SELECT
  p.name as project_name,
  f.path as file_path,
  fn.name as function_name,
  fn.qualified_name,
  fn.complexity,
  fn.lines_of_code,
  fn.test_coverage,
  CASE
    WHEN fn.complexity > 10 THEN 'high'
    WHEN fn.complexity > 5 THEN 'medium'
    ELSE 'low'
  END as complexity_level
FROM functions fn
JOIN files f ON fn.file_id = f.id
JOIN projects p ON fn.project_id = p.id
WHERE fn.complexity IS NOT NULL
ORDER BY fn.complexity DESC;

-- =============================================================================
-- FUNCTIONS - Utility functions
-- =============================================================================

-- Function: Semantic search for code
CREATE OR REPLACE FUNCTION semantic_search_code(
  search_embedding VECTOR(1536),
  search_project_id UUID DEFAULT NULL,
  search_entity_types TEXT[] DEFAULT ARRAY['function', 'class'],
  limit_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  similarity FLOAT,
  text_content TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.entity_type,
    e.entity_id,
    e.entity_name,
    1 - (e.embedding <=> search_embedding) as similarity,
    e.text_content
  FROM embeddings e
  WHERE
    (search_project_id IS NULL OR e.project_id = search_project_id)
    AND e.entity_type = ANY(search_entity_types)
  ORDER BY e.embedding <=> search_embedding
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- Function: Get function call graph
CREATE OR REPLACE FUNCTION get_function_call_graph(
  function_name_or_id TEXT,
  max_depth INTEGER DEFAULT 3
)
RETURNS TABLE (
  depth INTEGER,
  caller_name TEXT,
  callee_name TEXT,
  file_path TEXT,
  line_number INTEGER
) AS $$
WITH RECURSIVE call_tree AS (
  -- Base case: direct calls from the function
  SELECT
    1 as depth,
    f1.name as caller_name,
    f2.name as callee_name,
    fi.path as file_path,
    fc.line_number
  FROM function_calls fc
  JOIN functions f1 ON fc.caller_function_id = f1.id
  LEFT JOIN functions f2 ON fc.callee_function_id = f2.id
  JOIN files fi ON f1.file_id = fi.id
  WHERE f1.name = function_name_or_id
     OR f1.id::TEXT = function_name_or_id

  UNION ALL

  -- Recursive case: calls from called functions
  SELECT
    ct.depth + 1,
    f1.name,
    f2.name,
    fi.path,
    fc.line_number
  FROM call_tree ct
  JOIN functions f1 ON f1.name = ct.callee_name
  JOIN function_calls fc ON fc.caller_function_id = f1.id
  LEFT JOIN functions f2 ON fc.callee_function_id = f2.id
  JOIN files fi ON f1.file_id = fi.id
  WHERE ct.depth < max_depth
)
SELECT * FROM call_tree;
$$ LANGUAGE SQL;

-- Function: Find similar agents
CREATE OR REPLACE FUNCTION find_similar_agents(
  agent_description TEXT,
  limit_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  agent_name TEXT,
  similarity FLOAT,
  agent_description TEXT,
  model TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.name,
    similarity(a.description, agent_description) as sim,
    a.description,
    a.model
  FROM agents a
  WHERE similarity(a.description, agent_description) > 0.3
  ORDER BY sim DESC
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Trigram indexes for fuzzy search
CREATE INDEX idx_agents_name_trgm ON agents USING gin(name gin_trgm_ops);
CREATE INDEX idx_functions_name_trgm ON functions USING gin(name gin_trgm_ops);
CREATE INDEX idx_classes_name_trgm ON classes USING gin(name gin_trgm_ops);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON DATABASE current_database() IS 'orchestr8 Code Intelligence Database - Multi-project code intelligence and plugin component registry';

COMMENT ON TABLE projects IS 'Stores information about each project being analyzed';
COMMENT ON TABLE files IS 'All files in all projects with metadata';
COMMENT ON TABLE functions IS 'Functions/methods extracted from code with signatures and metadata';
COMMENT ON TABLE classes IS 'Classes/types with inheritance and property information';
COMMENT ON TABLE dependencies IS 'Import/dependency tracking for each file';
COMMENT ON TABLE function_calls IS 'Call graph relationships between functions';
COMMENT ON TABLE agents IS 'Registry of all orchestr8 agents with their capabilities';
COMMENT ON TABLE skills IS 'Registry of all skills with activation triggers';
COMMENT ON TABLE workflows IS 'Registry of all workflows/slash commands';
COMMENT ON TABLE embeddings IS 'Vector embeddings for semantic search across code and plugin components';
COMMENT ON TABLE execution_sessions IS 'History of workflow executions';
COMMENT ON TABLE execution_steps IS 'Detailed steps within each workflow execution';
COMMENT ON TABLE context_cache IS 'Cache for frequently accessed query results';

-- Grant permissions (adjust based on your security needs)
-- For development, grant all. For production, use more restrictive permissions.
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO orchestr8_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO orchestr8_user;
