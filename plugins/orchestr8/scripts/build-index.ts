#!/usr/bin/env tsx

/**
 * CLI tool to build useWhen indexes from fragment files
 *
 * Generates:
 * - usewhen-index.json (main index)
 * - keyword-index.json (inverted index)
 * - quick-lookup.json (common queries cache)
 */

import { promises as fs } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { IndexBuilder } from "../src/utils/indexBuilder.js";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

async function main() {
  try {
    console.log("🔨 Building useWhen indexes...\n");

    // Initialize builder
    const resourcesPath = join(projectRoot, "resources");
    const builder = new IndexBuilder(resourcesPath);

    // Build all indexes
    console.log("📂 Scanning fragments from:", resourcesPath);
    const { useWhenIndex, keywordIndex, quickLookup } = await builder.buildIndexes();

    // Create .index directory
    const indexDir = join(resourcesPath, ".index");
    await fs.mkdir(indexDir, { recursive: true });
    console.log("📁 Created index directory:", indexDir, "\n");

    // Write indexes to files
    const useWhenPath = join(indexDir, "usewhen-index.json");
    const keywordPath = join(indexDir, "keyword-index.json");
    const quickLookupPath = join(indexDir, "quick-lookup.json");

    console.log("💾 Writing index files...");

    await builder.writeIndex(useWhenIndex, useWhenPath);
    await builder.writeIndex(keywordIndex, keywordPath);
    await builder.writeIndex(quickLookup, quickLookupPath);

    // Display results
    console.log("\n✅ Index generation complete!\n");

    console.log("📊 Statistics:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Total fragments indexed: ${useWhenIndex.totalFragments}`);
    console.log(`   Total useWhen scenarios: ${useWhenIndex.stats.totalScenarios}`);
    console.log(`   Total unique keywords:   ${keywordIndex.stats.totalKeywords}`);
    console.log(`   Common query cache:      ${Object.keys(quickLookup.commonQueries).length} entries`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      `   Avg scenarios/fragment:  ${useWhenIndex.stats.avgScenariosPerFragment.toFixed(1)}`
    );
    console.log(
      `   Avg keywords/scenario:   ${useWhenIndex.stats.avgKeywordsPerScenario.toFixed(1)}`
    );
    console.log(
      `   Avg scenarios/keyword:   ${keywordIndex.stats.avgScenariosPerKeyword.toFixed(1)}`
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📁 Files created:");
    console.log(`   ${useWhenPath}`);
    console.log(
      `      Size: ${(useWhenIndex.stats.indexSizeBytes / 1024).toFixed(1)} KB`
    );
    console.log(`   ${keywordPath}`);
    const keywordSize = Buffer.byteLength(
      JSON.stringify(keywordIndex, null, 2),
      "utf-8"
    );
    console.log(`      Size: ${(keywordSize / 1024).toFixed(1)} KB`);
    console.log(`   ${quickLookupPath}`);
    const quickLookupSize = Buffer.byteLength(
      JSON.stringify(quickLookup, null, 2),
      "utf-8"
    );
    console.log(`      Size: ${(quickLookupSize / 1024).toFixed(1)} KB\n`);

    // Validation
    console.log("✓ Validation:");
    if (useWhenIndex.totalFragments === 221) {
      console.log(`  ✓ All 221 fragments indexed`);
    } else {
      console.warn(
        `  ⚠ Expected 221 fragments, found ${useWhenIndex.totalFragments}`
      );
    }

    if (useWhenIndex.stats.totalScenarios > 0) {
      console.log(`  ✓ ${useWhenIndex.stats.totalScenarios} scenarios extracted`);
    } else {
      console.error("  ✗ No scenarios found!");
      process.exit(1);
    }

    if (keywordIndex.stats.totalKeywords > 0) {
      console.log(`  ✓ ${keywordIndex.stats.totalKeywords} keywords indexed`);
    } else {
      console.error("  ✗ No keywords found!");
      process.exit(1);
    }

    console.log("\n🎉 Index generation successful!");
  } catch (error) {
    console.error("\n❌ Error building index:", error);
    if (error instanceof Error) {
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

main();
