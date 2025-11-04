#!/bin/bash

echo "Finding agent files without frontmatter..."
find plugins/*/agents -name "*.md" 2>/dev/null | while read -r file; do
  if ! head -n 1 "$file" | grep -q "^---$"; then
    echo "$file"
  fi
done

echo ""
echo "Finding workflow files without frontmatter..."
find plugins/*/commands -name "*.md" 2>/dev/null | while read -r file; do
  if ! head -n 1 "$file" | grep -q "^---$"; then
    echo "$file"
  fi
done
