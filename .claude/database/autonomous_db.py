#!/usr/bin/env python3
"""
Orchestr8 Autonomous Code Intelligence Database

This is the CORRECT implementation:
- Fully autonomous (zero manual steps)
- Language-agnostic (stores lines, no parsing)
- Global database (~/.claude/orchestr8.db)
- Auto-initializing (creates on first use)
- Self-updating (hooks on file operations)

Usage (automatic via hooks):
    # Hooks call this automatically
    from autonomous_db import auto_index_file, query_lines, search_files

    # On file write/edit
    auto_index_file('/path/to/file.py')

    # On query
    lines = query_lines('/path/to/file.py', 42, 67)
"""

import os
import sqlite3
import hashlib
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

# Global database location
DB_PATH = Path.home() / '.claude' / 'orchestr8.db'
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# Global connection
_conn = None


def get_connection():
    """Get or create database connection."""
    global _conn

    if _conn is None:
        _conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        _conn.row_factory = sqlite3.Row
        _initialize_database()

    return _conn


def _initialize_database():
    """Initialize database schema (automatic on first use)."""
    conn = get_connection()

    # Create tables
    conn.executescript("""
        -- Files table: stores all indexed files
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT UNIQUE NOT NULL,
            content_hash TEXT NOT NULL,
            line_count INTEGER NOT NULL,
            size INTEGER NOT NULL,
            last_modified REAL NOT NULL,
            indexed_at REAL NOT NULL,
            project_root TEXT,
            language TEXT
        );

        -- Lines table: stores individual lines for fast lookup
        CREATE TABLE IF NOT EXISTS lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL,
            line_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE,
            UNIQUE (file_id, line_number)
        );

        -- File search index
        CREATE INDEX IF NOT EXISTS idx_files_path ON files(path);
        CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_root);
        CREATE INDEX IF NOT EXISTS idx_lines_file_line ON lines(file_id, line_number);

        -- Full text search
        CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
            path, content, tokenize='porter'
        );

        -- Metadata table
        CREATE TABLE IF NOT EXISTS metadata (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        -- Track stats
        INSERT OR IGNORE INTO metadata (key, value) VALUES
            ('version', '2.0.0'),
            ('created_at', datetime('now')),
            ('total_files', '0'),
            ('total_lines', '0');
    """)

    conn.commit()


def get_file_hash(file_path: str) -> str:
    """Get content hash of file."""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    except:
        return ''


def get_project_root(file_path: str) -> Optional[str]:
    """Find project root (git root or parent directory)."""
    path = Path(file_path).parent

    # Try to find git root
    try:
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            cwd=str(path),
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except:
        # Use current directory as project root
        return str(Path(file_path).parent)


def detect_language(file_path: str) -> str:
    """Detect language from file extension."""
    ext = Path(file_path).suffix.lower()

    lang_map = {
        '.py': 'python',
        '.js': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.jsx': 'javascript',
        '.java': 'java',
        '.go': 'go',
        '.rs': 'rust',
        '.cpp': 'cpp',
        '.c': 'c',
        '.h': 'c',
        '.hpp': 'cpp',
        '.rb': 'ruby',
        '.php': 'php',
        '.cs': 'csharp',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
        '.r': 'r',
        '.m': 'objective-c',
        '.sh': 'bash',
        '.sql': 'sql',
        '.html': 'html',
        '.css': 'css',
        '.json': 'json',
        '.yaml': 'yaml',
        '.yml': 'yaml',
        '.xml': 'xml',
        '.md': 'markdown'
    }

    return lang_map.get(ext, 'text')


def auto_index_file(file_path: str, force: bool = False) -> bool:
    """
    Automatically index a file.

    This is called by hooks on Read/Write/Edit operations.
    Returns True if indexed, False if skipped (unchanged).
    """
    file_path = str(Path(file_path).resolve())

    # Skip if file doesn't exist
    if not os.path.exists(file_path):
        return False

    # Get file info
    content_hash = get_file_hash(file_path)
    if not content_hash:
        return False

    conn = get_connection()

    # Check if file already indexed with same hash
    if not force:
        cursor = conn.execute(
            "SELECT id, content_hash FROM files WHERE path = ?",
            (file_path,)
        )
        row = cursor.fetchone()

        if row and row['content_hash'] == content_hash:
            # File unchanged, skip
            return False

    # Read file
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"⚠ Cannot read {file_path}: {e}")
        return False

    lines = content.split('\n')
    line_count = len(lines)
    size = len(content)
    last_modified = os.path.getmtime(file_path)
    project_root = get_project_root(file_path)
    language = detect_language(file_path)

    # Begin transaction
    cursor = conn.cursor()

    # Delete old data if exists
    cursor.execute("DELETE FROM files WHERE path = ?", (file_path,))

    # Insert file record
    cursor.execute("""
        INSERT INTO files (
            path, content_hash, line_count, size,
            last_modified, indexed_at, project_root, language
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        file_path, content_hash, line_count, size,
        last_modified, datetime.now().timestamp(),
        project_root, language
    ))

    file_id = cursor.lastrowid

    # Insert lines
    line_data = [(file_id, i + 1, line) for i, line in enumerate(lines)]
    cursor.executemany(
        "INSERT INTO lines (file_id, line_number, content) VALUES (?, ?, ?)",
        line_data
    )

    # Update FTS
    cursor.execute("""
        INSERT INTO files_fts (rowid, path, content)
        VALUES (?, ?, ?)
    """, (file_id, file_path, content))

    conn.commit()

    # Update stats
    _update_stats(conn)

    return True


def _update_stats(conn):
    """Update database statistics."""
    cursor = conn.execute("SELECT COUNT(*) as count FROM files")
    total_files = cursor.fetchone()['count']

    cursor = conn.execute("SELECT COUNT(*) as count FROM lines")
    total_lines = cursor.fetchone()['count']

    conn.execute("UPDATE metadata SET value = ? WHERE key = 'total_files'", (str(total_files),))
    conn.execute("UPDATE metadata SET value = ? WHERE key = 'total_lines'", (str(total_lines),))
    conn.commit()


def query_lines(file_path: str, start_line: int, end_line: int) -> Optional[str]:
    """
    Query specific lines from a file.

    This is FAST - no file I/O, just database lookup.
    Automatically indexes if file not in database or changed.
    """
    file_path = str(Path(file_path).resolve())

    conn = get_connection()

    # Check if file indexed
    cursor = conn.execute(
        "SELECT id, content_hash FROM files WHERE path = ?",
        (file_path,)
    )
    row = cursor.fetchone()

    if not row:
        # File not indexed, index it now
        print(f"📊 Auto-indexing {file_path}...")
        auto_index_file(file_path)

        cursor = conn.execute(
            "SELECT id FROM files WHERE path = ?",
            (file_path,)
        )
        row = cursor.fetchone()

        if not row:
            return None

    file_id = row['id']

    # Validate with file system
    current_hash = get_file_hash(file_path)
    if current_hash and current_hash != row['content_hash']:
        # File changed, reindex
        print(f"🔄 File changed, re-indexing {file_path}...")
        auto_index_file(file_path, force=True)

    # Query lines
    cursor = conn.execute("""
        SELECT content FROM lines
        WHERE file_id = ? AND line_number BETWEEN ? AND ?
        ORDER BY line_number
    """, (file_id, start_line, end_line))

    lines = [row['content'] for row in cursor.fetchall()]

    if lines:
        result = '\n'.join(lines)
        tokens = len(result) // 4
        print(f"✓ Loaded {file_path} lines {start_line}-{end_line} ({tokens} tokens)")
        return result

    return None


def search_files(query: str, project_root: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search files by content (full-text search).

    Language-agnostic: searches actual text content.
    """
    conn = get_connection()

    # Build FTS query
    if project_root:
        cursor = conn.execute("""
            SELECT
                f.path,
                f.line_count,
                f.language,
                f.project_root,
                snippet(files_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
            FROM files_fts
            JOIN files f ON files_fts.rowid = f.id
            WHERE files_fts MATCH ? AND f.project_root = ?
            LIMIT ?
        """, (query, project_root, limit))
    else:
        cursor = conn.execute("""
            SELECT
                f.path,
                f.line_count,
                f.language,
                f.project_root,
                snippet(files_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
            FROM files_fts
            JOIN files f ON files_fts.rowid = f.id
            WHERE files_fts MATCH ?
            LIMIT ?
        """, (query, limit))

    results = []
    for row in cursor.fetchall():
        results.append({
            'path': row['path'],
            'line_count': row['line_count'],
            'language': row['language'],
            'project_root': row['project_root'],
            'snippet': row['snippet']
        })

    print(f"✓ Found {len(results)} files matching '{query}'")
    return results


def find_file(filename: str, project_root: Optional[str] = None) -> List[str]:
    """Find files by name."""
    conn = get_connection()

    pattern = f"%{filename}%"

    if project_root:
        cursor = conn.execute("""
            SELECT path FROM files
            WHERE path LIKE ? AND project_root = ?
            ORDER BY path
        """, (pattern, project_root))
    else:
        cursor = conn.execute("""
            SELECT path FROM files
            WHERE path LIKE ?
            ORDER BY path
        """, (pattern,))

    return [row['path'] for row in cursor.fetchall()]


def get_file_info(file_path: str) -> Optional[Dict[str, Any]]:
    """Get file metadata."""
    file_path = str(Path(file_path).resolve())

    conn = get_connection()
    cursor = conn.execute("""
        SELECT * FROM files WHERE path = ?
    """, (file_path,))

    row = cursor.fetchone()
    if row:
        return dict(row)

    return None


def get_database_stats() -> Dict[str, Any]:
    """Get database statistics."""
    conn = get_connection()

    # Get metadata
    cursor = conn.execute("SELECT key, value FROM metadata")
    meta = {row['key']: row['value'] for row in cursor.fetchall()}

    # Get language breakdown
    cursor = conn.execute("""
        SELECT language, COUNT(*) as count
        FROM files
        GROUP BY language
        ORDER BY count DESC
    """)
    languages = {row['language']: row['count'] for row in cursor.fetchall()}

    # Get project breakdown
    cursor = conn.execute("""
        SELECT project_root, COUNT(*) as count
        FROM files
        GROUP BY project_root
        ORDER BY count DESC
        LIMIT 10
    """)
    projects = {row['project_root']: row['count'] for row in cursor.fetchall()}

    return {
        'database_path': str(DB_PATH),
        'database_size_mb': DB_PATH.stat().st_size / (1024 * 1024) if DB_PATH.exists() else 0,
        'total_files': int(meta.get('total_files', 0)),
        'total_lines': int(meta.get('total_lines', 0)),
        'created_at': meta.get('created_at'),
        'version': meta.get('version'),
        'languages': languages,
        'top_projects': projects
    }


def reconcile_project(project_root: str, auto_index: bool = True) -> Dict[str, int]:
    """
    Reconcile database with project directory.

    Finds files in project that aren't indexed, and removes deleted files.
    """
    project_root = str(Path(project_root).resolve())

    print(f"🔄 Reconciling {project_root}...")

    conn = get_connection()

    # Get indexed files for this project
    cursor = conn.execute("""
        SELECT path FROM files WHERE project_root = ?
    """, (project_root,))

    indexed_files = {row['path'] for row in cursor.fetchall()}

    # Scan project directory
    found_files = set()
    skip_dirs = {'node_modules', '.git', '__pycache__', '.next', 'dist', 'build', 'target', 'vendor', '.venv', 'venv'}

    for root, dirs, files in os.walk(project_root):
        # Skip directories
        dirs[:] = [d for d in dirs if d not in skip_dirs]

        for file in files:
            file_path = os.path.join(root, file)
            found_files.add(file_path)

    # Find new files
    new_files = found_files - indexed_files

    # Find deleted files
    deleted_files = indexed_files - found_files

    # Remove deleted
    deleted_count = 0
    for file_path in deleted_files:
        conn.execute("DELETE FROM files WHERE path = ?", (file_path,))
        deleted_count += 1

    if deleted_count > 0:
        conn.commit()
        print(f"  🗑️  Removed {deleted_count} deleted files")

    # Index new files
    indexed_count = 0
    if auto_index:
        for file_path in new_files:
            if auto_index_file(file_path):
                indexed_count += 1

        if indexed_count > 0:
            print(f"  📝 Indexed {indexed_count} new files")

    # Check for changed files
    changed_count = 0
    for file_path in (indexed_files & found_files):
        cursor = conn.execute(
            "SELECT content_hash FROM files WHERE path = ?",
            (file_path,)
        )
        row = cursor.fetchone()

        if row:
            current_hash = get_file_hash(file_path)
            if current_hash and current_hash != row['content_hash']:
                if auto_index_file(file_path, force=True):
                    changed_count += 1

    if changed_count > 0:
        print(f"  🔄 Re-indexed {changed_count} changed files")

    _update_stats(conn)

    print(f"✓ Reconciliation complete")

    return {
        'new_files': len(new_files),
        'deleted_files': deleted_count,
        'changed_files': changed_count,
        'indexed_count': indexed_count
    }


# CLI interface
if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Orchestr8 Autonomous Database')
    parser.add_argument('--stats', action='store_true', help='Show database statistics')
    parser.add_argument('--reconcile', metavar='PATH', help='Reconcile project directory')
    parser.add_argument('--query-lines', nargs=3, metavar=('FILE', 'START', 'END'), help='Query lines from file')
    parser.add_argument('--search', metavar='QUERY', help='Search files')
    parser.add_argument('--find', metavar='FILENAME', help='Find files by name')
    parser.add_argument('--index', metavar='FILE', help='Index specific file')

    args = parser.parse_args()

    if args.stats:
        stats = get_database_stats()
        print(json.dumps(stats, indent=2))

    elif args.reconcile:
        result = reconcile_project(args.reconcile)
        print(json.dumps(result, indent=2))

    elif args.query_lines:
        file_path, start, end = args.query_lines
        lines = query_lines(file_path, int(start), int(end))
        if lines:
            print(lines)
        else:
            print(f"No lines found for {file_path}")

    elif args.search:
        results = search_files(args.search)
        print(json.dumps(results, indent=2))

    elif args.find:
        results = find_file(args.find)
        for path in results:
            print(path)

    elif args.index:
        success = auto_index_file(args.index, force=True)
        if success:
            print(f"✓ Indexed {args.index}")
        else:
            print(f"✗ Failed to index {args.index}")

    else:
        parser.print_help()
