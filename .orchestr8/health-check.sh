#!/usr/bin/env bash
# Health check for orchestr8 intelligence database

DB_PATH=".orchestr8/intelligence.db"

echo "=== orchestr8 Intelligence Database Health Check ==="
echo ""

# Check database exists
if [ ! -f "$DB_PATH" ]; then
    echo "❌ Database not found at: $DB_PATH"
    exit 1
fi
echo "✅ Database file exists"

# Check database is not corrupted
if ! sqlite3 "$DB_PATH" "PRAGMA integrity_check;" | grep -q "ok"; then
    echo "❌ Database integrity check failed"
    exit 1
fi
echo "✅ Database integrity OK"

# Check tables exist
TABLES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
echo "✅ Tables: $TABLES"

# Check indexes exist
INDEXES=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM sqlite_master WHERE type='index';")
echo "✅ Indexes: $INDEXES"

# Check notifications table
NOTIFICATIONS=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM notifications;")
echo "✅ Notifications: $NOTIFICATIONS"

# Database size
SIZE=$(du -h "$DB_PATH" | awk '{print $1}')
echo "✅ Database size: $SIZE"

echo ""
echo "=== All health checks passed ==="
