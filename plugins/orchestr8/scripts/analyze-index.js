const fs = require('fs');
const path = require('path');

// Load indexes
const indexDir = process.argv[2] || path.join(process.cwd(), 'resources/.index');
const useWhenIndex = JSON.parse(fs.readFileSync(path.join(indexDir, 'usewhen-index.json'), 'utf-8'));
const keywordIndex = JSON.parse(fs.readFileSync(path.join(indexDir, 'keyword-index.json'), 'utf-8'));
const quickLookup = JSON.parse(fs.readFileSync(path.join(indexDir, 'quick-lookup.json'), 'utf-8'));

// Analyze useWhen index
const scenarios = Object.values(useWhenIndex.index);
const categories = {};
const tokenDistribution = { '<500': 0, '500-700': 0, '700-1000': 0, '>1000': 0 };
const keywordCounts = [];

scenarios.forEach(scenario => {
  // Count by category
  categories[scenario.category] = (categories[scenario.category] || 0) + 1;

  // Token distribution
  const tokens = scenario.estimatedTokens;
  if (tokens < 500) tokenDistribution['<500']++;
  else if (tokens <= 700) tokenDistribution['500-700']++;
  else if (tokens <= 1000) tokenDistribution['700-1000']++;
  else tokenDistribution['>1000']++;

  // Keyword counts
  keywordCounts.push(scenario.keywords.length);
});

// Calculate keyword distribution
const keywordDistribution = {};
Object.values(keywordIndex.keywords).forEach(hashes => {
  const count = hashes.length;
  const bucket = count <= 2 ? '1-2' :
                 count <= 5 ? '3-5' :
                 count <= 10 ? '6-10' :
                 count <= 20 ? '11-20' : '>20';
  keywordDistribution[bucket] = (keywordDistribution[bucket] || 0) + 1;
});

// Top keywords
const topKeywords = Object.entries(keywordIndex.keywords)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 20)
  .map(([kw, hashes]) => ({ keyword: kw, scenarios: hashes.length }));

// Generate report
console.log('═══════════════════════════════════════════════════════════════');
console.log('           USEWHEN INDEX STATISTICS REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log('📦 INDEX OVERVIEW');
console.log('─────────────────────────────────────────────────────────────');
console.log(`   Generated: ${new Date(useWhenIndex.generated).toLocaleString()}`);
console.log(`   Version: ${useWhenIndex.version}`);
console.log(`   Total Fragments: ${useWhenIndex.totalFragments}`);
console.log(`   Total Scenarios: ${useWhenIndex.stats.totalScenarios}`);
console.log(`   Total Keywords: ${keywordIndex.stats.totalKeywords}`);
console.log(`   Quick Lookup Entries: ${Object.keys(quickLookup.commonQueries).length}\n`);

console.log('📊 SCENARIO STATISTICS');
console.log('─────────────────────────────────────────────────────────────');
console.log(`   Avg scenarios per fragment: ${useWhenIndex.stats.avgScenariosPerFragment.toFixed(1)}`);
console.log(`   Avg keywords per scenario: ${useWhenIndex.stats.avgKeywordsPerScenario.toFixed(1)}`);
console.log(`   Avg scenarios per keyword: ${keywordIndex.stats.avgScenariosPerKeyword.toFixed(1)}`);
console.log(`   Min keywords in scenario: ${Math.min(...keywordCounts)}`);
console.log(`   Max keywords in scenario: ${Math.max(...keywordCounts)}`);
console.log(`   Median keywords in scenario: ${keywordCounts.sort((a,b) => a-b)[Math.floor(keywordCounts.length/2)]}\n`);

console.log('📂 CATEGORY DISTRIBUTION');
console.log('─────────────────────────────────────────────────────────────');
Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const pct = ((count / useWhenIndex.stats.totalScenarios) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 20));
    console.log(`   ${cat.padEnd(10)} ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  });

console.log('\n🔢 TOKEN DISTRIBUTION');
console.log('─────────────────────────────────────────────────────────────');
Object.entries(tokenDistribution).forEach(([range, count]) => {
  const pct = ((count / scenarios.length) * 100).toFixed(1);
  const bar = '█'.repeat(Math.round(count / 20));
  console.log(`   ${range.padEnd(12)} ${count.toString().padStart(4)} (${pct.padStart(5)}%) ${bar}`);
});

console.log('\n🔤 KEYWORD DISTRIBUTION');
console.log('─────────────────────────────────────────────────────────────');
console.log('   Scenarios per keyword:');
Object.entries(keywordDistribution)
  .sort((a, b) => {
    const order = {'1-2': 1, '3-5': 2, '6-10': 3, '11-20': 4, '>20': 5};
    return order[a[0]] - order[b[0]];
  })
  .forEach(([range, count]) => {
    const pct = ((count / keywordIndex.stats.totalKeywords) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 50));
    console.log(`   ${range.padEnd(8)} ${count.toString().padStart(4)} keywords (${pct.padStart(5)}%) ${bar}`);
  });

console.log('\n🏆 TOP 20 MOST COMMON KEYWORDS');
console.log('─────────────────────────────────────────────────────────────');
topKeywords.forEach((item, idx) => {
  console.log(`   ${(idx+1).toString().padStart(2)}. ${item.keyword.padEnd(20)} ${item.scenarios.toString().padStart(3)} scenarios`);
});

console.log('\n💾 FILE SIZES');
console.log('─────────────────────────────────────────────────────────────');
const files = [
  { name: 'usewhen-index.json', size: useWhenIndex.stats.indexSizeBytes },
  { name: 'keyword-index.json', size: fs.statSync(path.join(indexDir, 'keyword-index.json')).size },
  { name: 'quick-lookup.json', size: fs.statSync(path.join(indexDir, 'quick-lookup.json')).size }
];
let totalSize = 0;
files.forEach(file => {
  totalSize += file.size;
  console.log(`   ${file.name.padEnd(25)} ${(file.size / 1024).toFixed(1).padStart(8)} KB`);
});
console.log(`   ${'TOTAL'.padEnd(25)} ${(totalSize / 1024).toFixed(1).padStart(8)} KB`);

console.log('\n✅ VALIDATION CHECKS');
console.log('─────────────────────────────────────────────────────────────');
const checks = [
  { name: 'All 221 fragments indexed', pass: useWhenIndex.totalFragments === 221 },
  { name: 'At least 1000 scenarios', pass: useWhenIndex.stats.totalScenarios >= 1000 },
  { name: 'At least 3000 keywords', pass: keywordIndex.stats.totalKeywords >= 3000 },
  { name: 'All scenarios have keywords', pass: scenarios.every(s => s.keywords.length > 0) },
  { name: 'All scenarios have URIs', pass: scenarios.every(s => s.uri) },
  { name: 'Index size < 1 MB', pass: useWhenIndex.stats.indexSizeBytes < 1024 * 1024 },
];

checks.forEach(check => {
  const icon = check.pass ? '✓' : '✗';
  const status = check.pass ? 'PASS' : 'FAIL';
  console.log(`   ${icon} ${check.name.padEnd(35)} [${status}]`);
});

const allPassed = checks.every(c => c.pass);
console.log(`\n   Overall: ${allPassed ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED'}`);

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                    END OF REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

process.exit(allPassed ? 0 : 1);
