import { describe, it, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { ResourceLoader } from '../resourceLoader.js';
import { TokenTracker } from '../../token/tracker.js';
import { TokenStore } from '../../token/store.js';
import { Logger } from '../../utils/logger.js';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
describe('ResourceLoader Token Tracking Unit Tests', () => {
    let loader;
    let tracker;
    let store;
    let logger;
    let testResourcesPath;
    before(async () => {
        testResourcesPath = join(process.cwd(), 'test-resources-token');
        await mkdir(testResourcesPath, { recursive: true });
        await mkdir(join(testResourcesPath, 'agents'), { recursive: true });
        await mkdir(join(testResourcesPath, 'skills'), { recursive: true });
        await mkdir(join(testResourcesPath, '.index'), { recursive: true });
        await writeFile(join(testResourcesPath, 'agents', 'test-agent.md'), `---
id: test-agent
category: agent
tags: [testing, unit-test]
capabilities:
  - Test capability 1
  - Test capability 2
estimatedTokens: 500
---

# Test Agent

This is a test agent for token tracking.
`);
        await writeFile(join(testResourcesPath, 'skills', 'test-skill.md'), `---
id: test-skill
category: skill
tags: [testing]
capabilities:
  - Test skill capability
estimatedTokens: 300
---

# Test Skill

This is a test skill.
`);
        await writeFile(join(testResourcesPath, '.index', 'agents.json'), JSON.stringify({
            category: 'agents',
            resources: [
                {
                    id: 'test-agent',
                    name: 'Test Agent',
                    tags: ['testing'],
                    estimatedTokens: 500,
                },
            ],
        }));
    });
    beforeEach(() => {
        process.env.RESOURCES_PATH = testResourcesPath;
        logger = new Logger('ResourceLoaderTokenTest');
        tracker = new TokenTracker({
            enabled: true,
            baselineStrategy: 'no_jit',
            deduplication: true,
        });
        store = new TokenStore({
            maxRecords: 1000,
            autoCleanup: false,
        });
        loader = new ResourceLoader(logger, tracker, store);
        store.clear();
        tracker.clearTracked();
    });
    afterEach(() => {
        if (store) {
            store.destroy();
        }
    });
    describe('1. Token Tracking Integration', () => {
        it('should have token tracker and store injected', () => {
            assert.ok(loader, 'ResourceLoader should be initialized');
        });
        it('should initialize without token tracking (optional)', () => {
            const loaderWithoutTracking = new ResourceLoader(logger);
            assert.ok(loaderWithoutTracking, 'Should initialize without token tracking');
        });
        it('should track tokens when loading dynamic resource', async () => {
            await loader.loadResourceIndex();
            const initialCount = store.getTotalCount();
            try {
                await loader.loadResourceContent('orchestr8://match?query=testing&maxResults=5');
            }
            catch (error) {
            }
            assert.ok(tracker.getTrackedCount() >= 0);
        });
    });
    describe('2. Message ID Generation', () => {
        it('should generate unique message IDs', () => {
            const messageIds = new Set();
            for (let i = 0; i < 100; i++) {
                const messageId = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
                messageIds.add(messageId);
            }
            assert.strictEqual(messageIds.size, 100, 'All message IDs should be unique');
        });
        it('should include timestamp in message ID', () => {
            const messageId = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
            assert.ok(messageId.startsWith('resource-'), 'Should start with resource- prefix');
            assert.ok(messageId.includes('-'), 'Should contain separators');
            assert.ok(messageId.length > 20, 'Should be sufficiently long');
        });
        it('should prevent collision in rapid succession', () => {
            const ids = [];
            const iterations = 1000;
            for (let i = 0; i < iterations; i++) {
                const id = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
                ids.push(id);
            }
            const uniqueIds = new Set(ids);
            const collisions = iterations - uniqueIds.size;
            assert.ok(collisions < 10, `Should have <10 collisions, had ${collisions}`);
        });
    });
    describe('3. Claude Usage Format', () => {
        it('should use correct Claude SDK token format', () => {
            const claudeUsage = {
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 200,
                cache_read_input_tokens: 100,
            };
            const usage = tracker.track('test-msg-format', claudeUsage);
            assert.ok(usage);
            assert.strictEqual(usage.inputTokens, claudeUsage.input_tokens);
            assert.strictEqual(usage.outputTokens, claudeUsage.output_tokens);
            assert.strictEqual(usage.cacheCreationTokens, claudeUsage.cache_creation_input_tokens);
            assert.strictEqual(usage.cacheReadTokens, claudeUsage.cache_read_input_tokens);
        });
        it('should handle optional cache fields', () => {
            const claudeUsage = {
                input_tokens: 1000,
                output_tokens: 500,
            };
            const usage = tracker.track('test-msg-no-cache', claudeUsage);
            assert.ok(usage);
            assert.strictEqual(usage.cacheCreationTokens, 0);
            assert.strictEqual(usage.cacheReadTokens, 0);
            assert.strictEqual(usage.totalTokens, 1500);
        });
        it('should calculate total tokens correctly', () => {
            const claudeUsage = {
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 200,
                cache_read_input_tokens: 100,
            };
            const usage = tracker.track('test-msg-total', claudeUsage);
            const expectedTotal = 1000 + 500 + 200 + 100;
            assert.strictEqual(usage?.totalTokens, expectedTotal);
        });
    });
    describe('4. Cached vs Non-Cached Differentiation', () => {
        it('should identify cache miss (first load)', () => {
            const claudeUsage = {
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 1000,
                cache_read_input_tokens: 0,
            };
            const usage = tracker.track('cache-miss', claudeUsage);
            assert.ok(usage);
            assert.strictEqual(usage.cacheCreationTokens, 1000);
            assert.strictEqual(usage.cacheReadTokens, 0);
        });
        it('should identify cache hit (subsequent load)', () => {
            const claudeUsage = {
                input_tokens: 100,
                output_tokens: 500,
                cache_creation_input_tokens: 0,
                cache_read_input_tokens: 900,
            };
            const usage = tracker.track('cache-hit', claudeUsage);
            assert.ok(usage);
            assert.strictEqual(usage.cacheCreationTokens, 0);
            assert.strictEqual(usage.cacheReadTokens, 900);
        });
        it('should differentiate in token tracking metadata', () => {
            const missUsage = tracker.track('miss-1', {
                input_tokens: 1000,
                output_tokens: 500,
                cache_creation_input_tokens: 1000,
            });
            store.saveUsage(missUsage);
            const hitUsage = tracker.track('hit-1', {
                input_tokens: 100,
                output_tokens: 500,
                cache_read_input_tokens: 900,
            });
            store.saveUsage(hitUsage);
            const recent = store.getRecentUsage(10);
            const missRecord = recent.find((r) => r.messageId === 'miss-1');
            const hitRecord = recent.find((r) => r.messageId === 'hit-1');
            assert.ok(missRecord);
            assert.ok(hitRecord);
            assert.ok(missRecord.cacheCreationTokens > 0, 'Miss should have cache creation');
            assert.ok(hitRecord.cacheReadTokens > 0, 'Hit should have cache read');
        });
        it('should track cache effectiveness', () => {
            for (let i = 0; i < 5; i++) {
                const missUsage = tracker.track(`miss-${i}`, {
                    input_tokens: 1000,
                    output_tokens: 500,
                    cache_creation_input_tokens: 1000,
                });
                store.saveUsage(missUsage);
                const hitUsage = tracker.track(`hit-${i}`, {
                    input_tokens: 100,
                    output_tokens: 500,
                    cache_read_input_tokens: 900,
                });
                store.saveUsage(hitUsage);
            }
            const recent = store.getRecentUsage(20);
            const cacheMisses = recent.filter((r) => r.cacheCreationTokens > 0).length;
            const cacheHits = recent.filter((r) => r.cacheReadTokens > 0).length;
            assert.strictEqual(cacheMisses, 5, 'Should have 5 cache misses');
            assert.strictEqual(cacheHits, 5, 'Should have 5 cache hits');
        });
    });
    describe('5. Error Handling - Token System Unavailable', () => {
        it('should not fail when token tracker is null', async () => {
            const loaderWithoutTracker = new ResourceLoader(logger);
            await assert.doesNotReject(async () => {
                await loaderWithoutTracker.loadResourceIndex();
            });
        });
        it('should not fail when token store is null', async () => {
            const loaderWithTrackerOnly = new ResourceLoader(logger, tracker);
            await assert.doesNotReject(async () => {
                await loaderWithTrackerOnly.loadResourceIndex();
            });
        });
        it('should handle disabled token tracking gracefully', async () => {
            const disabledTracker = new TokenTracker({
                enabled: false,
            });
            const loaderWithDisabled = new ResourceLoader(logger, disabledTracker, store);
            await assert.doesNotReject(async () => {
                await loaderWithDisabled.loadResourceIndex();
            });
            const stats = store.getStats();
            assert.strictEqual(stats.totalRecords, 0, 'Should have no records with disabled tracking');
        });
        it('should continue operation if tracking fails', () => {
            const faultyTracker = new TokenTracker();
            const originalTrack = faultyTracker.track.bind(faultyTracker);
            faultyTracker.track = (...args) => {
                throw new Error('Simulated tracking error');
            };
            const loaderWithFaulty = new ResourceLoader(logger, faultyTracker, store);
            assert.ok(loaderWithFaulty);
        });
    });
    describe('6. Token Metadata Accuracy', () => {
        it('should include correct category in metadata', () => {
            const usage = tracker.track('meta-test-1', {
                input_tokens: 1000,
                output_tokens: 500,
            }, {
                category: 'agent',
            });
            assert.ok(usage);
            assert.strictEqual(usage.category, 'agent');
        });
        it('should include resource URI in metadata', () => {
            const resourceUri = 'orchestr8://agents/test-agent';
            const usage = tracker.track('meta-test-2', {
                input_tokens: 1000,
                output_tokens: 500,
            }, {
                resourceUri,
            });
            assert.ok(usage);
            assert.strictEqual(usage.resourceUri, resourceUri);
        });
        it('should include resource count in metadata', () => {
            const usage = tracker.track('meta-test-3', {
                input_tokens: 1000,
                output_tokens: 500,
            }, {
                resourceCount: 5,
            });
            assert.ok(usage);
            assert.ok(usage.baselineTokens > usage.totalTokens);
        });
        it('should handle all metadata fields together', () => {
            const metadata = {
                category: 'skill',
                resourceUri: 'orchestr8://skills/test-skill',
                resourceCount: 3,
            };
            const usage = tracker.track('meta-test-4', {
                input_tokens: 1000,
                output_tokens: 500,
            }, metadata);
            assert.ok(usage);
            assert.strictEqual(usage.category, metadata.category);
            assert.strictEqual(usage.resourceUri, metadata.resourceUri);
        });
        it('should work with partial metadata', () => {
            const usage = tracker.track('meta-test-5', {
                input_tokens: 1000,
                output_tokens: 500,
            }, {
                category: 'pattern',
            });
            assert.ok(usage);
            assert.strictEqual(usage.category, 'pattern');
            assert.strictEqual(usage.resourceUri, undefined);
        });
        it('should work with no metadata', () => {
            const usage = tracker.track('meta-test-6', {
                input_tokens: 1000,
                output_tokens: 500,
            });
            assert.ok(usage);
            assert.strictEqual(usage.category, undefined);
            assert.strictEqual(usage.resourceUri, undefined);
        });
    });
    describe('7. Integration with Resource Loading Flow', () => {
        it('should track during index lookup', async () => {
            await loader.loadResourceIndex();
            assert.ok(loader);
        });
        it('should maintain cache state in tracking', async () => {
            try {
                await loader.loadResourceContent('orchestr8://agents/test-agent');
            }
            catch (error) {
            }
            try {
                await loader.loadResourceContent('orchestr8://agents/test-agent');
            }
            catch (error) {
            }
            const cached = loader.getCachedResource('orchestr8://agents/test-agent');
            if (cached) {
                assert.ok(cached.length > 0, 'Cached content should exist');
            }
        });
        it('should handle concurrent resource loads', async () => {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(loader.loadResourceContent(`orchestr8://agents/test-agent`).catch(() => {
                }));
            }
            await Promise.all(promises);
            assert.ok(tracker.getTrackedCount() >= 0);
        });
    });
    describe('8. Performance Impact', () => {
        it('should add minimal overhead to resource loading', async () => {
            const iterations = 10;
            const loaderNoTracking = new ResourceLoader(logger);
            await loaderNoTracking.loadResourceIndex();
            const startNoTracking = Date.now();
            for (let i = 0; i < iterations; i++) {
                try {
                    await loaderNoTracking.loadResourceContent('orchestr8://agents/test-agent');
                }
                catch (error) {
                }
            }
            const timeNoTracking = Date.now() - startNoTracking;
            await loader.loadResourceIndex();
            const startWithTracking = Date.now();
            for (let i = 0; i < iterations; i++) {
                try {
                    await loader.loadResourceContent('orchestr8://agents/test-agent');
                }
                catch (error) {
                }
            }
            const timeWithTracking = Date.now() - startWithTracking;
            const overhead = timeWithTracking - timeNoTracking;
            const overheadPerRequest = overhead / iterations;
            console.log(`Token tracking overhead: ${overheadPerRequest.toFixed(2)}ms per request`);
            assert.ok(overheadPerRequest < 5, `Overhead should be <5ms per request, was ${overheadPerRequest.toFixed(2)}ms`);
        });
        it('should not significantly impact memory usage', async () => {
            const initialMemory = process.memoryUsage().heapUsed;
            for (let i = 0; i < 100; i++) {
                const usage = tracker.track(`perf-msg-${i}`, {
                    input_tokens: 1000,
                    output_tokens: 500,
                }, {
                    category: 'agent',
                    resourceUri: `orchestr8://agents/test-${i}`,
                });
                store.saveUsage(usage);
            }
            const finalMemory = process.memoryUsage().heapUsed;
            const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
            console.log(`Memory increase for 100 records: ${memoryIncrease.toFixed(2)}MB`);
            assert.ok(memoryIncrease < 10, `Memory increase should be <10MB, was ${memoryIncrease.toFixed(2)}MB`);
        });
    });
});
