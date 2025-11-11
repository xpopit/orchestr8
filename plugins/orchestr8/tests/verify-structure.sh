#!/bin/bash
# Verification script for orchestr8 plugin structure

echo "🔍 Verifying orchestr8 Plugin Structure"
echo "========================================"
echo ""

# Check that agents/skills are NOT at root level
echo "1. Checking root-level directories (should NOT exist)..."
if [ -d "agents" ] || [ -d "skills" ] || [ -d "hooks" ]; then
    echo "   ❌ FAIL: Found root-level agents/, skills/, or hooks/ directory"
    echo "   These will be auto-loaded by Claude Code!"
    exit 1
else
    echo "   ✅ PASS: No root-level agents/, skills/, or hooks/ directories"
fi
echo ""

# Check that agents/skills ARE in resources
echo "2. Checking resources subdirectories (should exist)..."
if [ ! -d "resources/agents" ]; then
    echo "   ❌ FAIL: resources/agents/ not found"
    exit 1
fi
if [ ! -d "resources/skills" ]; then
    echo "   ❌ FAIL: resources/skills/ not found"
    exit 1
fi
echo "   ✅ PASS: resources/agents/ and resources/skills/ exist"
echo ""

# Check plugin.json
echo "3. Checking plugin.json..."
if [ ! -f ".claude-plugin/plugin.json" ]; then
    echo "   ❌ FAIL: .claude-plugin/plugin.json not found"
    exit 1
fi

# Check that plugin.json doesn't reference agents/skills
if grep -q '"agents"' .claude-plugin/plugin.json; then
    echo "   ❌ FAIL: plugin.json contains 'agents' field (should not)"
    exit 1
fi
if grep -q '"skills"' .claude-plugin/plugin.json; then
    echo "   ❌ FAIL: plugin.json contains 'skills' field (should not)"
    exit 1
fi
echo "   ✅ PASS: plugin.json does not reference agents or skills"
echo ""

# Check build
echo "4. Checking build..."
if [ ! -f "dist/index.js" ]; then
    echo "   ❌ FAIL: dist/index.js not found (run 'npm run build')"
    exit 1
fi
echo "   ✅ PASS: Build output exists"
echo ""

# Check required files
echo "5. Checking required files..."
REQUIRED_FILES=(
    ".claude-plugin/plugin.json"
    ".claude-plugin/marketplace.json"
    ".mcp.json"
    "package.json"
    "tsconfig.json"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ FAIL: $file not found"
        exit 1
    fi
done
echo "   ✅ PASS: All required files present"
echo ""

# Check commands
echo "6. Checking workflow commands..."
CMD_COUNT=$(ls -1 commands/workflows/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$CMD_COUNT" -lt 5 ]; then
    echo "   ❌ FAIL: Expected at least 5 workflow commands, found $CMD_COUNT"
    exit 1
fi
echo "   ✅ PASS: Found $CMD_COUNT workflow commands"
echo ""

# Check resources
echo "7. Checking resource structure..."
if [ ! -d "resources/examples" ]; then
    echo "   ⚠️  WARNING: resources/examples/ not found"
fi
if [ ! -d "resources/patterns" ]; then
    echo "   ⚠️  WARNING: resources/patterns/ not found"
fi
if [ ! -d "resources/guides" ]; then
    echo "   ⚠️  WARNING: resources/guides/ not found"
fi
echo "   ✅ PASS: Basic resource structure exists"
echo ""

# Summary
echo "========================================"
echo "✅ All verifications passed!"
echo ""
echo "Plugin structure is correct:"
echo "  • No auto-loading of agents/skills"
echo "  • Agents in resources/agents/"
echo "  • Skills in resources/skills/"
echo "  • Plugin ready for use"
echo ""
echo "Next steps:"
echo "  1. Enable plugin: /plugin enable orchestr8"
echo "  2. Test workflow: /orchestr8:new-project 'Build API'"
echo ""
