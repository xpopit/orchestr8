/**
 * Unit tests for PromptLoader
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

// Since we're testing CommonJS and the source is TypeScript/ESM,
// we'll test the compiled version
const { PromptLoader } = require('../../dist/loaders/promptLoader.js');
const { Logger } = require('../../dist/utils/logger.js');

describe('PromptLoader', () => {
  let tempDir;
  let logger;
  let promptLoader;

  before(async () => {
    // Create temporary directory for test prompts
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'prompt-loader-test-'));

    // Create test prompt structure
    await fs.mkdir(path.join(tempDir, 'workflows'), { recursive: true });

    // Create a test prompt file
    const testPrompt = `---
name: test-workflow
title: Test Workflow
description: A test workflow for unit testing
version: 1.0.0
arguments:
  - name: task-description
    description: Description of the task
    required: true
tags: [test]
estimatedTokens: 100
---

# Test Workflow

**Task:** $ARGUMENTS

Execute the following task: \${task-description}

## Steps
1. Step one
2. Step two
`;

    await fs.writeFile(
      path.join(tempDir, 'workflows', 'test-workflow.md'),
      testPrompt
    );

    // Initialize logger and loader
    logger = new Logger('test');
    process.env.PROMPTS_PATH = tempDir;
  });

  after(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should initialize with correct path', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    assert.ok(loader);
  });

  it('should load all prompts from workflows directory', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();

    assert.ok(Array.isArray(prompts));
    assert.strictEqual(prompts.length, 1);
    assert.strictEqual(prompts[0].name, 'test-workflow');
    assert.strictEqual(prompts[0].title, 'Test Workflow');
    assert.strictEqual(prompts[0].category, 'workflow');
  });

  it('should load prompt metadata correctly', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();
    const prompt = prompts[0];

    assert.strictEqual(prompt.description, 'A test workflow for unit testing');
    assert.strictEqual(prompt.version, '1.0.0');
    assert.ok(Array.isArray(prompt.arguments));
    assert.strictEqual(prompt.arguments.length, 1);
    assert.strictEqual(prompt.arguments[0].name, 'task-description');
    assert.strictEqual(prompt.arguments[0].required, true);
    assert.ok(Array.isArray(prompt.tags));
    assert.strictEqual(prompt.estimatedTokens, 100);
  });

  it('should substitute $ARGUMENTS placeholder with first argument', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();
    const prompt = prompts[0];

    const content = await loader.loadPromptContent(prompt, {
      'task-description': 'Build a REST API'
    });

    assert.ok(content.includes('**Task:** Build a REST API'));
  });

  it('should substitute ${argument-name} placeholders', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();
    const prompt = prompts[0];

    const content = await loader.loadPromptContent(prompt, {
      'task-description': 'Build a REST API'
    });

    assert.ok(content.includes('Execute the following task: Build a REST API'));
  });

  it('should cache prompt content', async () => {
    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();
    const prompt = prompts[0];

    const args = { 'task-description': 'Test task' };

    // Load twice - second should hit cache
    const content1 = await loader.loadPromptContent(prompt, args);
    const content2 = await loader.loadPromptContent(prompt, args);

    assert.strictEqual(content1, content2);
  });

  it('should handle missing category directories gracefully', async () => {
    const emptyTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-prompts-'));
    process.env.PROMPTS_PATH = emptyTempDir;

    const loader = new (require('../../dist/loaders/promptLoader.js').PromptLoader)(logger);
    const prompts = await loader.loadAllPrompts();

    assert.ok(Array.isArray(prompts));
    assert.strictEqual(prompts.length, 0);

    await fs.rm(emptyTempDir, { recursive: true, force: true });
  });
});
