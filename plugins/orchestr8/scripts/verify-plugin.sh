#!/bin/bash
set -euo pipefail

# Verify the Orchestr8 plugin signature
# This script verifies GPG signatures and checksums

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PLUGIN_DIR"

CHECKSUMS_FILE="CHECKSUMS.txt"
SIGNATURE_FILE="${CHECKSUMS_FILE}.asc"
PUBLIC_KEY_FILE="ORCHESTR8_PUBLIC_KEY.asc"

# Check required files exist
if [[ ! -f "$CHECKSUMS_FILE" ]]; then
  echo "ERROR: $CHECKSUMS_FILE not found"
  exit 1
fi

if [[ ! -f "$SIGNATURE_FILE" ]]; then
  echo "ERROR: $SIGNATURE_FILE not found"
  exit 1
fi

if [[ ! -f "$PUBLIC_KEY_FILE" ]]; then
  echo "ERROR: $PUBLIC_KEY_FILE not found"
  exit 1
fi

# Import public key (if not already imported)
echo "Importing public key..."
gpg --import "$PUBLIC_KEY_FILE" 2>/dev/null || true

# Verify the signature
echo "Verifying GPG signature..."
if gpg --verify "$SIGNATURE_FILE" "$CHECKSUMS_FILE" 2>&1; then
  echo "✓ GPG signature is valid"
else
  echo "✗ GPG signature verification FAILED"
  exit 1
fi

# Verify checksums
echo "Verifying file checksums..."
FAILED_CHECKS=0

while IFS= read -r line; do
  expected_hash=$(echo "$line" | awk '{print $1}')
  filepath=$(echo "$line" | awk '{print $2}')

  # Skip if file doesn't exist (might be generated or excluded)
  if [[ ! -f "$filepath" ]]; then
    continue
  fi

  actual_hash=$(shasum -a 256 "$filepath" | awk '{print $1}')

  if [[ "$expected_hash" != "$actual_hash" ]]; then
    echo "✗ Checksum mismatch: $filepath"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
done < "$CHECKSUMS_FILE"

if [[ $FAILED_CHECKS -gt 0 ]]; then
  echo "✗ $FAILED_CHECKS file(s) failed checksum verification"
  exit 1
fi

echo "✓ All checksums verified"
echo ""
echo "Plugin signature verification PASSED"
