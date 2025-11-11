/**
 * Unit tests for ResourceLoader
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const { ResourceLoader } = require('../../dist/loaders/resourceLoader.js');
const { Logger } = require('../../dist/utils/logger.js');

describe('ResourceLoader', () => {
  let tempDir;
  let logger;

  before(async () => {
    // Create temporary directory for test resources
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resource-loader-test-'));

    // Create test resource structure
    await fs.mkdir(path.join(tempDir, 'agents'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'skills'), { recursive: true });
    await fs.mkdir(path.join(tempDir, 'examples'), { recursive: true });

    // Create test resource files
    await fs.writeFile(
      path.join(tempDir, 'agents', 'test-agent.md'),
      '# Test Agent\n\nThis is a test agent for unit testing.\n\n## Capabilities\n- Capability 1\n- Capability 2'
    );

    await fs.writeFile(
      path.join(tempDir, 'skills', 'test-skill.md'),
      '# Test Skill\n\nThis is a test skill for unit testing.'
    );

    await fs.writeFile(
      path.join(tempDir, 'examples', 'test-example.md'),
      '# Test Example\n\n```javascript\nconsole.log("test");\n```'
    );

    // Initialize logger
    logger = new Logger('test');
    process.env.RESOURCES_PATH = tempDir;
  });

  after(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should initialize with correct path', () => {
    const loader = new ResourceLoader(logger);
    assert.ok(loader);
  });

  it('should load all resources from all categories', async () => {
    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    assert.ok(Array.isArray(resources));
    assert.strictEqual(resources.length, 3);
  });

  it('should load agent resources with correct URIs', async () => {
    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    const agent = resources.find(r => r.uri.includes('orchestr8://agents/'));
    assert.ok(agent);
    assert.strictEqual(agent.uri, 'orchestr8://agents/test-agent');
    assert.strictEqual(agent.name, 'test-agent');
    assert.strictEqual(agent.mimeType, 'text/markdown');
    assert.strictEqual(agent.category, 'agents');
  });

  it('should load skill resources with correct URIs', async () => {
    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    const skill = resources.find(r => r.uri.includes('orchestr8://skills/'));
    assert.ok(skill);
    assert.strictEqual(skill.uri, 'orchestr8://skills/test-skill');
    assert.strictEqual(skill.category, 'skills');
  });

  it('should load example resources with correct URIs', async () => {
    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    const example = resources.find(r => r.uri.includes('orchestr8://examples/'));
    assert.ok(example);
    assert.strictEqual(example.uri, 'orchestr8://examples/test-example');
    assert.strictEqual(example.category, 'examples');
  });

  it('should load resource content correctly', async () => {
    const loader = new ResourceLoader(logger);
    const content = await loader.loadResourceContent('orchestr8://agents/test-agent');

    assert.ok(typeof content === 'string');
    assert.ok(content.includes('# Test Agent'));
    assert.ok(content.includes('Capability 1'));
    assert.ok(content.length > 50);
  });

  it('should cache resource content', async () => {
    const loader = new ResourceLoader(logger);

    // Load twice - second should hit cache
    const content1 = await loader.loadResourceContent('orchestr8://agents/test-agent');
    const content2 = await loader.loadResourceContent('orchestr8://agents/test-agent');

    assert.strictEqual(content1, content2);
  });

  it('should throw error for non-existent resource', async () => {
    const loader = new ResourceLoader(logger);

    await assert.rejects(
      async () => await loader.loadResourceContent('orchestr8://agents/non-existent'),
      /ENOENT|no such file/
    );
  });

  it('should handle empty resource directories', async () => {
    const emptyTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-resources-'));
    process.env.RESOURCES_PATH = emptyTempDir;

    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    assert.ok(Array.isArray(resources));
    assert.strictEqual(resources.length, 0);

    await fs.rm(emptyTempDir, { recursive: true, force: true });
  });

  it('should generate correct MIME types for markdown files', async () => {
    const loader = new ResourceLoader(logger);
    const resources = await loader.loadAllResources();

    resources.forEach(resource => {
      assert.strictEqual(resource.mimeType, 'text/markdown');
    });
  });
});
