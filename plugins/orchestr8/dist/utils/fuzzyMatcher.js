import { Logger } from "./logger.js";
import { promises as fs } from "fs";
import { join } from "path";
import matter from "gray-matter";
const logger = new Logger("FuzzyMatcher");
export class FuzzyMatcher {
    resourceIndex = [];
    indexLoaded = false;
    indexLoadPromise = null;
    resourcesPath;
    constructor() {
        this.resourcesPath =
            process.env.RESOURCES_PATH || join(process.cwd(), "resources");
    }
    async match(request) {
        logger.info("Starting fuzzy match", { query: request.query });
        const allResources = await this.loadResourceIndex();
        logger.debug(`Loaded ${allResources.length} resources`);
        const keywords = this.extractKeywords(request.query);
        logger.debug("Extracted keywords", { keywords });
        const scored = allResources.map((resource) => ({
            resource,
            score: this.calculateScore(resource, keywords, request),
        }));
        const minScore = request.minScore ?? 10;
        const validScored = scored.filter((s) => s.score >= minScore);
        logger.debug(`Filtered to ${validScored.length} matches above threshold (${minScore})`);
        validScored.sort((a, b) => b.score - a.score);
        const mode = request.mode || 'catalog';
        const selected = mode === 'catalog'
            ? validScored.slice(0, request.maxResults || 15)
            : this.selectWithinBudget(validScored, request.maxTokens || 3000);
        logger.info(`Selected ${selected.length} resources (mode: ${mode})`, {
            totalTokens: selected.reduce((sum, s) => sum + s.resource.estimatedTokens, 0),
        });
        const assembled = mode === 'minimal' ? this.assembleMinimal(selected) :
            mode === 'catalog' ? this.assembleCatalog(selected) :
                this.assembleContent(selected);
        return {
            fragments: selected.map((s) => s.resource),
            totalTokens: assembled.tokens,
            matchScores: selected.map((s) => s.score),
            assembledContent: assembled.content,
        };
    }
    extractKeywords(query) {
        const normalized = query.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a",
            "an",
            "the",
            "and",
            "or",
            "but",
            "in",
            "on",
            "at",
            "to",
            "for",
            "of",
            "with",
            "by",
            "from",
            "as",
            "is",
            "was",
            "are",
            "were",
            "be",
            "been",
            "being",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "should",
            "could",
            "may",
            "might",
            "can",
            "i",
            "you",
            "he",
            "she",
            "it",
            "we",
            "they",
            "this",
            "that",
            "these",
            "those",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 1 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    calculateScore(resource, keywords, request) {
        if (request.requiredTags && request.requiredTags.length > 0) {
            const hasAll = request.requiredTags.every((tag) => resource.tags.includes(tag));
            if (!hasAll) {
                logger.debug(`Resource ${resource.id} missing required tags`);
                return 0;
            }
        }
        let score = 0;
        const matchesCategory = (request.category && resource.category === request.category) ||
            (request.categories && request.categories.includes(resource.category));
        if (matchesCategory) {
            score += 15;
            logger.debug(`Category match for ${resource.id}`);
        }
        const tagsLower = resource.tags;
        const capabilitiesLower = resource.capabilities.map((c) => c.toLowerCase());
        const useWhenLower = resource.useWhen.map((u) => u.toLowerCase());
        const keywordsWithoutExactMatch = new Set(keywords);
        const queryText = keywords.join(" ");
        for (const keyword of keywords) {
            let foundExact = false;
            for (const tag of tagsLower) {
                if (tag === keyword) {
                    score += 15;
                    foundExact = true;
                    logger.debug(`EXACT tag match for "${keyword}" in ${resource.id}`);
                    break;
                }
                else if (tag.includes(keyword)) {
                    score += 10;
                    foundExact = true;
                    logger.debug(`Substring tag match for "${keyword}" in ${resource.id}`);
                    break;
                }
            }
            for (const cap of capabilitiesLower) {
                if (cap === keyword) {
                    score += 12;
                    foundExact = true;
                    logger.debug(`EXACT capability match for "${keyword}" in ${resource.id}`);
                    break;
                }
                else if (cap.includes(keyword)) {
                    score += 8;
                    foundExact = true;
                    logger.debug(`Substring capability match for "${keyword}" in ${resource.id}`);
                    break;
                }
            }
            for (const useCase of useWhenLower) {
                if (useCase.includes(keyword)) {
                    score += 5;
                    foundExact = true;
                    logger.debug(`Use-when match for "${keyword}" in ${resource.id}`);
                    break;
                }
            }
            if (foundExact) {
                keywordsWithoutExactMatch.delete(keyword);
            }
        }
        if (keywords.length >= 2) {
            const allFields = [...tagsLower, ...capabilitiesLower, ...useWhenLower];
            for (const field of allFields) {
                for (let i = 0; i < keywords.length - 1; i++) {
                    const phrase = `${keywords[i]} ${keywords[i + 1]}`;
                    if (field.includes(phrase)) {
                        score += 20;
                        logger.debug(`Multi-word phrase match: "${phrase}" in ${resource.id}`);
                        break;
                    }
                }
            }
        }
        if (keywordsWithoutExactMatch.size > 0 && keywords.length <= 5) {
            const allFields = [...tagsLower, ...capabilitiesLower];
            for (const keyword of keywordsWithoutExactMatch) {
                let bestFuzzyScore = 0;
                for (const field of allFields) {
                    const fieldWords = field.split(/\s+/);
                    for (const word of fieldWords) {
                        if (word.length > 2 && keyword.length > 2) {
                            const similarity = this.calculateLevenshteinSimilarity(keyword, word);
                            if (similarity > 0.7) {
                                const fuzzyScore = Math.floor(similarity * 8);
                                if (fuzzyScore > bestFuzzyScore) {
                                    bestFuzzyScore = fuzzyScore;
                                }
                            }
                        }
                    }
                }
                if (bestFuzzyScore > 0) {
                    score += bestFuzzyScore;
                    logger.debug(`Fuzzy match for "${keyword}" in ${resource.id}: +${bestFuzzyScore}`);
                }
            }
        }
        if (resource.estimatedTokens < 1000) {
            score += 5;
        }
        logger.debug(`Final score for ${resource.id}: ${score}`);
        return score;
    }
    calculateLevenshteinSimilarity(str1, str2) {
        if (str1 === str2)
            return 1.0;
        if (str1.length === 0 || str2.length === 0)
            return 0.0;
        const lengthDiff = Math.abs(str1.length - str2.length);
        const maxLength = Math.max(str1.length, str2.length);
        if (lengthDiff / maxLength > 0.5)
            return 0.0;
        const distance = this.levenshteinDistance(str1, str2);
        const similarity = 1 - (distance / maxLength);
        return Math.max(0, similarity);
    }
    levenshteinDistance(str1, str2) {
        if (str1.length > str2.length) {
            [str1, str2] = [str2, str1];
        }
        const len1 = str1.length;
        const len2 = str2.length;
        if (len1 === 0)
            return len2;
        if (len2 === 0)
            return len1;
        let prevRow = Array.from({ length: len1 + 1 }, (_, i) => i);
        for (let i = 1; i <= len2; i++) {
            let currentRow = [i];
            for (let j = 1; j <= len1; j++) {
                const insertCost = currentRow[j - 1] + 1;
                const deleteCost = prevRow[j] + 1;
                const substituteCost = prevRow[j - 1] + (str1[j - 1] === str2[i - 1] ? 0 : 1);
                currentRow[j] = Math.min(insertCost, deleteCost, substituteCost);
            }
            prevRow = currentRow;
        }
        return prevRow[len1];
    }
    selectWithinBudget(scored, maxTokens) {
        const selected = [];
        let totalTokens = 0;
        for (const item of scored) {
            const wouldExceedBudget = totalTokens + item.resource.estimatedTokens > maxTokens;
            if (selected.length < 3) {
                selected.push(item);
                totalTokens += item.resource.estimatedTokens;
                continue;
            }
            if (!wouldExceedBudget) {
                selected.push(item);
                totalTokens += item.resource.estimatedTokens;
            }
            if (selected.length >= 3 && totalTokens > maxTokens * 0.8) {
                logger.debug(`Stopping selection at ${selected.length} resources, ${totalTokens} tokens`);
                break;
            }
        }
        return selected;
    }
    assembleContent(fragments) {
        const categoryOrder = {
            agent: 0,
            skill: 1,
            pattern: 2,
            example: 3,
            workflow: 4,
        };
        const ordered = [...fragments].sort((a, b) => {
            return (categoryOrder[a.resource.category] - categoryOrder[b.resource.category]);
        });
        const contentParts = ordered.map(({ resource, score }) => {
            return `
## ${this.categoryLabel(resource.category)}: ${resource.id}
**Relevance Score:** ${score}
**Tags:** ${resource.tags.join(", ")}
**Capabilities:** ${resource.capabilities.join(", ")}

${resource.content}
`;
        });
        const content = contentParts.join("\n---\n");
        const tokens = ordered.reduce((sum, { resource }) => sum + resource.estimatedTokens, 0);
        return { content, tokens };
    }
    assembleCatalog(fragments) {
        const categoryOrder = {
            agent: 0,
            skill: 1,
            pattern: 2,
            example: 3,
            workflow: 4,
        };
        const ordered = [...fragments].sort((a, b) => {
            return (categoryOrder[a.resource.category] - categoryOrder[b.resource.category]);
        });
        const header = `# 📚 Orchestr8 Resource Catalog

**Query Results:** ${ordered.length} matched resources
**Total Tokens Available:** ${ordered.reduce((sum, s) => sum + s.resource.estimatedTokens, 0)}

## How to Use This Catalog

This catalog provides a lightweight index of relevant resources. Each entry includes:
- **Relevance Score** - How well it matches your query (higher = better)
- **Tags** - Keywords for quick identification
- **Capabilities** - What this resource provides
- **Use When** - Specific scenarios where this resource is most valuable
- **Estimated Tokens** - Context cost if you load it
- **MCP URI** - How to load the full content

### Loading Strategy

**IMPORTANT:** Only load a resource when you actually need it for execution. Review the catalog first:

1. **Scan "Use When"** - Identify which resources apply to your specific task
2. **Load selectively** - Fetch only resources needed for current phase
3. **Load JIT** - Get additional resources as you encounter specific needs during execution
4. **Requery as needed** - Search catalog again with refined queries when:
   - Initial results don't have what you need
   - New requirements emerge during execution
   - You need more specific or different expertise

**To load a resource:**
Simply reference it using the \`@orchestr8://\` URI shown in each entry below. Claude will automatically load it via MCP.

Example: @orchestr8://agents/api-designer-rest

**To requery the catalog:**
Reference: @orchestr8://match?query=<refined-search>&categories=<cats>&minScore=15

---

## Matched Resources
`;
        const entries = ordered.map(({ resource, score }, index) => {
            const categoryLabel = this.categoryLabel(resource.category);
            const resourceId = resource.id.split('/').pop();
            const mcpUri = `orchestr8://${resource.category}s/${resourceId}`;
            const useWhenSection = resource.useWhen && resource.useWhen.length > 0
                ? `**Use When:**
${resource.useWhen.slice(0, 4).map(use => `  - ${use}`).join('\n')}${resource.useWhen.length > 4 ? '\n  - ...' : ''}`
                : '';
            return `
### ${index + 1}. ${categoryLabel}: ${resource.id}

**Relevance Score:** ${score}/100
**Tags:** ${resource.tags.slice(0, 8).join(", ")}${resource.tags.length > 8 ? '...' : ''}
**Capabilities:**
${resource.capabilities.slice(0, 4).map(cap => `  - ${cap}`).join('\n')}${resource.capabilities.length > 4 ? '\n  - ...' : ''}
${useWhenSection}
**Estimated Tokens:** ~${resource.estimatedTokens}

**Load this resource:** @orchestr8://${resource.category}s/${resourceId}
`;
        });
        const content = header + entries.join('\n---\n');
        const tokens = Math.ceil(content.length / 4);
        logger.info(`Assembled catalog: ${ordered.length} resources, ~${tokens} tokens`);
        return { content, tokens };
    }
    assembleMinimal(fragments) {
        const results = fragments.map(({ resource, score }) => ({
            uri: `orchestr8://${resource.category}s/${resource.id.split('/').pop()}`,
            category: resource.category,
            score,
            tokens: resource.estimatedTokens,
            tags: resource.tags.slice(0, 5)
        }));
        const output = {
            matches: results.length,
            totalTokens: results.reduce((sum, r) => sum + r.tokens, 0),
            results,
            usage: "Load resources via ReadMcpResourceTool using the uri field"
        };
        const jsonStr = JSON.stringify(output, null, 2);
        logger.info(`Assembled minimal mode: ${results.length} resources, ~${Math.ceil(jsonStr.length / 4)} tokens`);
        return {
            content: jsonStr,
            tokens: Math.ceil(jsonStr.length / 4)
        };
    }
    async loadResourceIndex() {
        if (this.indexLoaded) {
            logger.debug("Returning cached resource index");
            return this.resourceIndex;
        }
        if (this.indexLoadPromise !== null) {
            logger.debug("Waiting for in-progress resource index load");
            return this.indexLoadPromise;
        }
        logger.info("Loading resource index...");
        this.indexLoadPromise = this._loadResourceIndexImpl();
        try {
            this.resourceIndex = await this.indexLoadPromise;
            this.indexLoaded = true;
            logger.info(`Resource index loaded with ${this.resourceIndex.length} fragments`);
            return this.resourceIndex;
        }
        catch (error) {
            logger.error("Error loading resource index:", error);
            throw error;
        }
        finally {
            this.indexLoadPromise = null;
        }
    }
    async _loadResourceIndexImpl() {
        try {
            const categories = [
                { dir: "agents", type: "agent" },
                { dir: "skills", type: "skill" },
                { dir: "examples", type: "example" },
                { dir: "patterns", type: "pattern" },
                { dir: "guides", type: "pattern" },
                { dir: "best-practices", type: "pattern" },
            ];
            const categoryPromises = categories.map(async ({ dir, type }) => {
                const categoryPath = join(this.resourcesPath, dir);
                const categoryFragments = [];
                try {
                    await fs.access(categoryPath);
                    await this._scanFragmentsDirectory(categoryPath, type, dir, categoryFragments);
                }
                catch (error) {
                    logger.debug(`Category directory not found: ${categoryPath}`);
                }
                return categoryFragments;
            });
            const fragmentArrays = await Promise.all(categoryPromises);
            const fragments = fragmentArrays.flat();
            logger.info(`Scanned ${fragments.length} resource fragments`);
            return fragments;
        }
        catch (error) {
            logger.error("Error loading resource index:", error);
            return [];
        }
    }
    async _scanFragmentsDirectory(dirPath, category, categoryName, fragments) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await this._scanFragmentsDirectory(fullPath, category, categoryName, fragments);
                }
                else if (entry.name.endsWith(".md")) {
                    try {
                        const content = await fs.readFile(fullPath, "utf-8");
                        const fragment = this._parseResourceFragment(content, category, categoryName, fullPath);
                        fragments.push(fragment);
                        logger.debug(`Parsed fragment: ${fragment.id}`);
                    }
                    catch (error) {
                        logger.warn(`Failed to parse resource fragment: ${fullPath}`, error);
                    }
                }
            }
        }
        catch (error) {
            logger.warn(`Error scanning directory: ${dirPath}`, error);
        }
    }
    _parseResourceFragment(content, category, categoryName, filePath) {
        const parsed = matter(content);
        const frontmatter = parsed.data;
        const body = parsed.content;
        const pathParts = filePath.split(/[\/\\]/);
        const resourcesIndex = pathParts.findIndex(p => p === 'resources');
        const categoryIndex = resourcesIndex + 1;
        const filenameIndex = pathParts.length - 1;
        const id = frontmatter.id ||
            pathParts.slice(categoryIndex + 1, filenameIndex + 1).join('/')
                .replace(/\.md$/, "") ||
            "unknown";
        const tags = Array.isArray(frontmatter.tags)
            ? frontmatter.tags.map((tag) => String(tag).toLowerCase())
            : [];
        const capabilities = Array.isArray(frontmatter.capabilities)
            ? frontmatter.capabilities.map((cap) => String(cap))
            : [];
        const useWhen = Array.isArray(frontmatter.useWhen)
            ? frontmatter.useWhen.map((use) => String(use))
            : [];
        const estimatedTokens = typeof frontmatter.estimatedTokens === "number"
            ? frontmatter.estimatedTokens
            : Math.ceil(body.length / 4);
        return {
            id: `${categoryName}/${id}`,
            category,
            tags,
            capabilities,
            useWhen,
            estimatedTokens,
            content: body,
        };
    }
    setResourceIndex(resources) {
        this.resourceIndex = resources;
        this.indexLoaded = true;
        logger.info(`Resource index set with ${resources.length} resources`);
    }
    categoryLabel(category) {
        const labels = {
            agent: "Agent",
            skill: "Skill",
            pattern: "Pattern",
            example: "Example",
            workflow: "Workflow",
        };
        return labels[category];
    }
}
