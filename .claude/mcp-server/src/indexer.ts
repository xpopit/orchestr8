/**
 * Index agents, skills, and workflows from plugin directories
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import YAML from 'yaml';
import { logger } from './logger';
import { AgentIndex, AgentRegistry, SkillIndex, WorkflowIndex } from './types';

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    return YAML.parse(match[1]);
  } catch (error) {
    logger.warn('Failed to parse frontmatter', { error });
    return null;
  }
}

export class Indexer {
  private agentIndex: Map<string, AgentIndex> = new Map();
  private skillIndex: Map<string, SkillIndex> = new Map();
  private workflowIndex: Map<string, WorkflowIndex> = new Map();
  private agentRegistry: AgentRegistry | null = null;
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  /**
   * Index all plugins, agents, skills, and workflows
   */
  async indexAll(): Promise<void> {
    logger.info('Starting full index', { root_dir: this.rootDir });
    const startTime = Date.now();

    try {
      await this.loadAgentRegistry();
      await this.indexAgents();
      await this.indexSkills();
      await this.indexWorkflows();

      const duration = Date.now() - startTime;
      logger.info('Indexing complete', {
        duration_ms: duration,
        agents: this.agentIndex.size,
        skills: this.skillIndex.size,
        workflows: this.workflowIndex.size,
      });
    } catch (error) {
      logger.error('Indexing failed', { error });
      throw error;
    }
  }

  /**
   * Load agent registry from YAML file
   */
  private async loadAgentRegistry(): Promise<void> {
    const registryPath = path.join(this.rootDir, '.claude', 'agent-registry.yml');

    if (!fs.existsSync(registryPath)) {
      logger.warn('Agent registry not found', { path: registryPath });
      return;
    }

    try {
      const content = fs.readFileSync(registryPath, 'utf-8');
      this.agentRegistry = YAML.parse(content) as AgentRegistry;
      logger.info('Agent registry loaded', {
        roles: Object.keys(this.agentRegistry?.roles || {}).length,
      });
    } catch (error) {
      logger.error('Failed to load agent registry', { error });
    }
  }

  /**
   * Index all agent definitions
   */
  private async indexAgents(): Promise<void> {
    logger.info('Indexing agents');

    // Find all agent markdown files in plugins
    const pattern = path.join(this.rootDir, 'plugins', '**', 'agents', '*.md');
    const files = await glob(pattern);

    logger.debug('Found agent files', { count: files.length });

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        if (!frontmatter) {
          logger.warn('No frontmatter in agent file', { file });
          continue;
        }

        // Extract plugin name from path
        const pathParts = file.split(path.sep);
        const pluginsIndex = pathParts.indexOf('plugins');
        const plugin = pluginsIndex >= 0 ? pathParts[pluginsIndex + 1] : 'unknown';

        const agent: AgentIndex = {
          name: frontmatter.name || path.basename(file, '.md'),
          description: frontmatter.description || '',
          model: frontmatter.model || 'haiku',
          capabilities: Array.isArray(frontmatter.capabilities)
            ? frontmatter.capabilities
            : [],
          plugin,
        };

        // Add role info from agent registry if available
        if (this.agentRegistry) {
          for (const [role, roleInfo] of Object.entries(this.agentRegistry.roles)) {
            if (roleInfo.primary === agent.name) {
              agent.role = role;
              agent.fallbacks = roleInfo.fallbacks;
              break;
            }
          }
        }

        this.agentIndex.set(agent.name, agent);
        logger.debug('Indexed agent', { name: agent.name, plugin });
      } catch (error) {
        logger.error('Failed to index agent', { file, error });
      }
    }

    logger.info('Agent indexing complete', { count: this.agentIndex.size });
  }

  /**
   * Index all skills
   */
  private async indexSkills(): Promise<void> {
    logger.info('Indexing skills');

    const pattern = path.join(this.rootDir, 'plugins', '**', 'skills', '*.md');
    const files = await glob(pattern);

    logger.debug('Found skill files', { count: files.length });

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        if (!frontmatter) {
          logger.warn('No frontmatter in skill file', { file });
          continue;
        }

        const pathParts = file.split(path.sep);
        const pluginsIndex = pathParts.indexOf('plugins');
        const plugin = pluginsIndex >= 0 ? pathParts[pluginsIndex + 1] : 'unknown';

        const skill: SkillIndex = {
          name: frontmatter.name || path.basename(file, '.md'),
          category: frontmatter.category || 'general',
          keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
          description: frontmatter.description || '',
          plugin,
        };

        this.skillIndex.set(skill.name, skill);
        logger.debug('Indexed skill', { name: skill.name, plugin });
      } catch (error) {
        logger.error('Failed to index skill', { file, error });
      }
    }

    logger.info('Skill indexing complete', { count: this.skillIndex.size });
  }

  /**
   * Index all workflows
   */
  private async indexWorkflows(): Promise<void> {
    logger.info('Indexing workflows');

    const pattern = path.join(this.rootDir, 'plugins', '**', 'commands', '*.md');
    const files = await glob(pattern);

    logger.debug('Found workflow files', { count: files.length });

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf-8');
        const frontmatter = parseFrontmatter(content);

        if (!frontmatter) {
          logger.warn('No frontmatter in workflow file', { file });
          continue;
        }

        const pathParts = file.split(path.sep);
        const pluginsIndex = pathParts.indexOf('plugins');
        const plugin = pluginsIndex >= 0 ? pathParts[pluginsIndex + 1] : 'unknown';

        // Extract workflow steps and agents from content (simple heuristic)
        const steps: string[] = [];
        const agents: string[] = [];
        const lines = content.split('\n');

        for (const line of lines) {
          // Look for numbered lists as steps
          if (/^\d+\.\s/.test(line)) {
            steps.push(line.replace(/^\d+\.\s/, '').trim());
          }
          // Look for agent mentions (agent-name)
          const agentMatches = line.match(/`([a-z-]+(?:-[a-z]+)*-(?:developer|specialist|engineer|architect|analyst|auditor|orchestrator|coordinator|writer|documenter))`/g);
          if (agentMatches) {
            agents.push(...agentMatches.map(m => m.replace(/`/g, '')));
          }
        }

        const workflow: WorkflowIndex = {
          name: path.basename(file, '.md'),
          description: frontmatter.description || '',
          arguments: frontmatter['argument-hint'],
          steps: [...new Set(steps)], // Remove duplicates
          agents: [...new Set(agents)], // Remove duplicates
          plugin,
        };

        this.workflowIndex.set(workflow.name, workflow);
        logger.debug('Indexed workflow', { name: workflow.name, plugin });
      } catch (error) {
        logger.error('Failed to index workflow', { file, error });
      }
    }

    logger.info('Workflow indexing complete', { count: this.workflowIndex.size });
  }

  /**
   * Get all indexed agents
   */
  getAgents(): AgentIndex[] {
    return Array.from(this.agentIndex.values());
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): AgentIndex | undefined {
    return this.agentIndex.get(name);
  }

  /**
   * Get all indexed skills
   */
  getSkills(): SkillIndex[] {
    return Array.from(this.skillIndex.values());
  }

  /**
   * Get skill by name
   */
  getSkill(name: string): SkillIndex | undefined {
    return this.skillIndex.get(name);
  }

  /**
   * Get all indexed workflows
   */
  getWorkflows(): WorkflowIndex[] {
    return Array.from(this.workflowIndex.values());
  }

  /**
   * Get workflow by name
   */
  getWorkflow(name: string): WorkflowIndex | undefined {
    return this.workflowIndex.get(name);
  }

  /**
   * Get agent registry
   */
  getAgentRegistry(): AgentRegistry | null {
    return this.agentRegistry;
  }

  /**
   * Get index statistics
   */
  getStats(): {
    agents: number;
    skills: number;
    workflows: number;
    roles: number;
  } {
    return {
      agents: this.agentIndex.size,
      skills: this.skillIndex.size,
      workflows: this.workflowIndex.size,
      roles: Object.keys(this.agentRegistry?.roles || {}).length,
    };
  }
}

// Singleton instance
let indexerInstance: Indexer | null = null;

export async function getIndexer(rootDir: string): Promise<Indexer> {
  if (!indexerInstance) {
    indexerInstance = new Indexer(rootDir);
    await indexerInstance.indexAll();
  }
  return indexerInstance;
}

export function resetIndexer(): void {
  indexerInstance = null;
}
