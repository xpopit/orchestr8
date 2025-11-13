#!/bin/bash
set -euo pipefail

# Sign the Orchestr8 plugin with GPG
# This script generates checksums and signs them cryptographically

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PLUGIN_DIR"

echo "Generating checksums for plugin files..."

# Create checksums file
CHECKSUMS_FILE="CHECKSUMS.txt"
rm -f "$CHECKSUMS_FILE" "${CHECKSUMS_FILE}.asc"

# Generate SHA256 checksums for all relevant files
find . -type f \
  -not -path "./.git/*" \
  -not -path "./node_modules/*" \
  -not -path "./dist/*" \
  -not -path "./tests/*" \
  -not -path "./test-resources-token/*" \
  -not -path "./.claude-plugin/*" \
  -not -name "CHECKSUMS.txt*" \
  -not -name "ORCHESTR8_PUBLIC_KEY.asc" \
  -not -name "*.log" \
  -not -name ".DS_Store" \
  | sort \
  | xargs shasum -a 256 \
  > "$CHECKSUMS_FILE"

echo "Generated checksums for $(wc -l < "$CHECKSUMS_FILE") files"

# Sign the checksums file
echo "Signing checksums with GPG..."
gpg --armor --detach-sign --default-key security@orchestr8.builders "$CHECKSUMS_FILE"

# Export public key for distribution
echo "Exporting public key..."
gpg --armor --export security@orchestr8.builders > ORCHESTR8_PUBLIC_KEY.asc

echo "✓ Plugin signing complete"
echo "  - Checksums: $CHECKSUMS_FILE"
echo "  - Signature: ${CHECKSUMS_FILE}.asc"
echo "  - Public Key: ORCHESTR8_PUBLIC_KEY.asc"
