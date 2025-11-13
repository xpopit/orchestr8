import { promises as fs } from "fs";
import { join } from "path";
import { createHash } from "crypto";
import matter from "gray-matter";
import { Logger } from "./logger.js";
const logger = new Logger("IndexBuilder");
export class IndexBuilder {
    resourcesPath;
    constructor(resourcesPath) {
        this.resourcesPath = resourcesPath || join(process.cwd(), "resources");
    }
    async buildIndexes() {
        logger.info("Starting index generation...");
        const fragments = await this.scanAllFragments();
        logger.info(`Scanned ${fragments.length} fragments`);
        const { useWhenIndex, scenarioToFragment } = await this.buildUseWhenIndex(fragments);
        logger.info(`Built useWhen index with ${useWhenIndex.stats.totalScenarios} scenarios`);
        const keywordIndex = this.buildKeywordIndex(useWhenIndex);
        logger.info(`Built keyword index with ${keywordIndex.stats.totalKeywords} keywords`);
        const quickLookup = this.buildQuickLookup(fragments, scenarioToFragment);
        logger.info(`Built quick lookup cache with ${Object.keys(quickLookup.commonQueries).length} queries`);
        return { useWhenIndex, keywordIndex, quickLookup };
    }
    async scanAllFragments() {
        const categories = [
            { dir: "agents", type: "agent" },
            { dir: "skills", type: "skill" },
            { dir: "examples", type: "example" },
            { dir: "patterns", type: "pattern" },
            { dir: "guides", type: "pattern" },
            { dir: "workflows", type: "workflow" },
        ];
        const allFragments = [];
        for (const { dir, type } of categories) {
            const categoryPath = join(this.resourcesPath, dir);
            try {
                await fs.access(categoryPath);
                await this.scanFragmentsDirectory(categoryPath, type, dir, allFragments);
            }
            catch (error) {
                logger.debug(`Category directory not found: ${categoryPath}`);
            }
        }
        return allFragments;
    }
    async scanFragmentsDirectory(dirPath, category, categoryName, fragments) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dirPath, entry.name);
                if (entry.isDirectory()) {
                    await this.scanFragmentsDirectory(fullPath, category, categoryName, fragments);
                }
                else if (entry.name.endsWith(".md")) {
                    try {
                        const content = await fs.readFile(fullPath, "utf-8");
                        const fragment = this.parseResourceFragment(content, category, categoryName, fullPath);
                        fragments.push(fragment);
                    }
                    catch (error) {
                        logger.warn(`Failed to parse fragment: ${fullPath}`, error);
                    }
                }
            }
        }
        catch (error) {
            logger.warn(`Error scanning directory: ${dirPath}`, error);
        }
    }
    parseResourceFragment(content, category, categoryName, filePath) {
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
    async buildUseWhenIndex(fragments) {
        const index = {};
        const scenarioToFragment = new Map();
        let totalScenarios = 0;
        let totalKeywords = 0;
        for (const fragment of fragments) {
            for (const scenario of fragment.useWhen) {
                const hash = this.hashScenario(scenario, fragment.id);
                const keywords = this.extractKeywords(scenario);
                const uri = this.fragmentToURI(fragment);
                index[hash] = {
                    scenario,
                    keywords,
                    uri,
                    category: fragment.category,
                    estimatedTokens: fragment.estimatedTokens,
                    relevance: 100,
                };
                scenarioToFragment.set(hash, fragment);
                totalScenarios++;
                totalKeywords += keywords.length;
            }
        }
        const avgScenariosPerFragment = fragments.length > 0
            ? totalScenarios / fragments.length
            : 0;
        const avgKeywordsPerScenario = totalScenarios > 0
            ? totalKeywords / totalScenarios
            : 0;
        const useWhenIndex = {
            version: "1.0.0",
            generated: new Date().toISOString(),
            totalFragments: fragments.length,
            index,
            stats: {
                totalScenarios,
                avgScenariosPerFragment: Math.round(avgScenariosPerFragment * 10) / 10,
                avgKeywordsPerScenario: Math.round(avgKeywordsPerScenario * 10) / 10,
                indexSizeBytes: 0,
            },
        };
        return { useWhenIndex, scenarioToFragment };
    }
    buildKeywordIndex(useWhenIndex) {
        const keywords = {};
        for (const [hash, entry] of Object.entries(useWhenIndex.index)) {
            if (!Array.isArray(entry.keywords)) {
                logger.warn(`Invalid keywords for entry ${hash}`);
                continue;
            }
            for (const keyword of entry.keywords) {
                const kw = String(keyword);
                if (!keywords[kw]) {
                    keywords[kw] = [];
                }
                if (!Array.isArray(keywords[kw])) {
                    keywords[kw] = [];
                }
                keywords[kw].push(hash);
            }
        }
        const totalKeywords = Object.keys(keywords).length;
        const totalMappings = Object.values(keywords).reduce((sum, hashes) => sum + hashes.length, 0);
        const avgScenariosPerKeyword = totalKeywords > 0
            ? totalMappings / totalKeywords
            : 0;
        return {
            version: "1.0.0",
            keywords,
            stats: {
                totalKeywords,
                avgScenariosPerKeyword: Math.round(avgScenariosPerKeyword * 10) / 10,
            },
        };
    }
    buildQuickLookup(fragments, scenarioToFragment) {
        const commonQueries = {};
        const keywordCounts = new Map();
        for (const fragment of fragments) {
            for (const scenario of fragment.useWhen) {
                const keywords = this.extractKeywords(scenario);
                for (const keyword of keywords) {
                    if (!keywordCounts.has(keyword)) {
                        keywordCounts.set(keyword, new Set());
                    }
                    keywordCounts.get(keyword).add(this.fragmentToURI(fragment));
                }
            }
        }
        const sortedKeywords = Array.from(keywordCounts.entries())
            .sort((a, b) => b[1].size - a[1].size)
            .slice(0, 20);
        for (const [keyword, uriSet] of sortedKeywords) {
            const uris = Array.from(uriSet).slice(0, 5);
            const tokens = uris.reduce((sum, uri) => {
                const fragment = fragments.find(f => this.fragmentToURI(f) === uri);
                return sum + (fragment?.estimatedTokens || 0);
            }, 0);
            commonQueries[keyword] = { uris, tokens };
        }
        return {
            version: "1.0.0",
            commonQueries,
        };
    }
    hashScenario(scenario, fragmentId) {
        const normalized = scenario.toLowerCase().replace(/\s+/g, "-");
        const prefix = normalized.substring(0, 50);
        const hash = createHash("sha256")
            .update(`${fragmentId}:${scenario}`)
            .digest("hex")
            .substring(0, 12);
        return `scenario-${hash}`;
    }
    extractKeywords(text) {
        const normalized = text.toLowerCase().replace(/[^\w\s-]/g, " ");
        const stopWords = new Set([
            "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
            "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
            "been", "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "should", "could", "may", "might", "can", "i", "you", "he",
            "she", "it", "we", "they", "this", "that", "these", "those",
        ]);
        const words = normalized
            .split(/\s+/)
            .filter((word) => word.length > 2 && !stopWords.has(word));
        return Array.from(new Set(words));
    }
    fragmentToURI(fragment) {
        const filename = fragment.id.split('/').pop() || fragment.id;
        const categoryPlural = fragment.category === "agent" ? "agents" :
            fragment.category === "skill" ? "skills" :
                fragment.category === "example" ? "examples" :
                    fragment.category === "pattern" ? "patterns" :
                        "workflows";
        return `orchestr8://${categoryPlural}/${filename}`;
    }
    async writeIndex(index, filePath) {
        const json = JSON.stringify(index, null, 2);
        await fs.writeFile(filePath, json, "utf-8");
        if (index.stats && 'indexSizeBytes' in index.stats) {
            index.stats.indexSizeBytes = Buffer.byteLength(json, "utf-8");
        }
        logger.info(`Wrote index to ${filePath} (${Buffer.byteLength(json, "utf-8")} bytes)`);
    }
}
