#!/bin/bash

echo "Testing agent metadata validation..."
found_count=0
missing_count=0

find plugins/*/agents -name "*.md" 2>/dev/null | head -10 | while read -r file; do
  if grep -q "| name | description | model |" "$file"; then
    echo "  ✓ $file has metadata table"
    found_count=$((found_count + 1))
  else
    echo "  ⚠ $file missing metadata table"
    missing_count=$((missing_count + 1))
  fi
done

echo ""
echo "✓ Metadata validation complete (non-fatal warnings only)"
