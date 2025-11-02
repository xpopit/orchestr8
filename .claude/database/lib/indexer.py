#!/usr/bin/env python3
"""
Orchestr8 Code Indexer

This is the CRITICAL missing piece that actually populates the database.
Without this, the database remains empty and the entire system is useless.

Usage:
    # Initial scan
    python3 indexer.py /path/to/project

    # Watch mode (continuously monitor for changes)
    python3 indexer.py /path/to/project --watch

    # Re-index specific file
    python3 indexer.py /path/to/project --file src/auth.py
"""

import os
import sys
import ast
import re
import json
import hashlib
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch
import argparse

# Supported file extensions
SUPPORTED_EXTENSIONS = {
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
    '.php': 'php'
}

# Directories to skip
SKIP_DIRS = {
    'node_modules', '.git', '__pycache__', '.next', '.cache',
    'dist', 'build', 'target', 'vendor', '.venv', 'venv',
    'coverage', '.pytest_cache', '.mypy_cache', '.tox'
}


def get_db_connection():
    """Get database connection."""
    database_url = os.getenv('DATABASE_URL',
        'postgresql://orchestr8:orchestr8_dev_password@localhost:5433/orchestr8_intelligence')
    return psycopg2.connect(database_url)


def get_git_hash(file_path: str) -> str:
    """Get git hash of file."""
    try:
        result = subprocess.run(
            ['git', 'hash-object', file_path],
            capture_output=True,
            text=True,
            check=True,
            cwd=os.path.dirname(file_path) or '.'
        )
        return result.stdout.strip()
    except:
        # Fallback to file hash
        with open(file_path, 'rb') as f:
            return hashlib.sha1(f.read()).hexdigest()


def should_skip_path(path: Path) -> bool:
    """Check if path should be skipped."""
    parts = path.parts
    return any(skip_dir in parts for skip_dir in SKIP_DIRS)


class PythonParser:
    """Parse Python files."""

    def parse(self, file_path: str, content: str) -> Dict[str, Any]:
        """Parse Python file and extract symbols."""
        try:
            tree = ast.parse(content, filename=file_path)
        except SyntaxError as e:
            print(f"⚠ Syntax error in {file_path}: {e}")
            return {'functions': [], 'classes': [], 'imports': []}

        functions = []
        classes = []
        imports = []

        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append(self._extract_function(node, content))
            elif isinstance(node, ast.ClassDef):
                classes.append(self._extract_class(node, content))
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                imports.extend(self._extract_imports(node))

        return {
            'functions': functions,
            'classes': classes,
            'imports': imports
        }

    def _extract_function(self, node: ast.FunctionDef, content: str) -> Dict[str, Any]:
        """Extract function details."""
        # Get docstring
        docstring = ast.get_docstring(node) or ''

        # Get parameters
        params = [arg.arg for arg in node.args.args]

        # Get return type annotation
        return_type = ''
        if node.returns:
            return_type = ast.unparse(node.returns) if hasattr(ast, 'unparse') else str(node.returns)

        # Get function body
        body_lines = content.split('\n')[node.lineno-1:node.end_lineno]
        body = '\n'.join(body_lines)

        # Calculate complexity (rough estimate)
        complexity = 1  # Base complexity
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.For, ast.While, ast.ExceptHandler)):
                complexity += 1

        return {
            'name': node.name,
            'signature': self._build_signature(node),
            'parameters': params,
            'return_type': return_type,
            'docstring': docstring,
            'body': body,
            'start_line': node.lineno,
            'end_line': node.end_lineno or node.lineno,
            'complexity': complexity
        }

    def _build_signature(self, node: ast.FunctionDef) -> str:
        """Build function signature."""
        params = []
        for arg in node.args.args:
            param = arg.arg
            if arg.annotation:
                param += f": {ast.unparse(arg.annotation) if hasattr(ast, 'unparse') else str(arg.annotation)}"
            params.append(param)

        signature = f"def {node.name}({', '.join(params)})"
        if node.returns:
            signature += f" -> {ast.unparse(node.returns) if hasattr(ast, 'unparse') else str(node.returns)}"

        return signature

    def _extract_class(self, node: ast.ClassDef, content: str) -> Dict[str, Any]:
        """Extract class details."""
        docstring = ast.get_docstring(node) or ''

        # Get base classes
        base_classes = [ast.unparse(base) if hasattr(ast, 'unparse') else str(base)
                       for base in node.bases]

        # Get methods
        methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]

        # Get class body
        body_lines = content.split('\n')[node.lineno-1:node.end_lineno]
        body = '\n'.join(body_lines)

        return {
            'name': node.name,
            'type': 'class',
            'base_classes': base_classes,
            'methods': methods,
            'docstring': docstring,
            'body': body,
            'start_line': node.lineno,
            'end_line': node.end_lineno or node.lineno
        }

    def _extract_imports(self, node) -> List[Dict[str, str]]:
        """Extract import statements."""
        imports = []

        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.append({
                    'module': alias.name,
                    'imported_items': [alias.asname if alias.asname else alias.name],
                    'import_type': 'import'
                })
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ''
            items = [alias.name for alias in node.names]
            imports.append({
                'module': module,
                'imported_items': items,
                'import_type': 'from_import'
            })

        return imports


class TypeScriptParser:
    """Simple TypeScript/JavaScript parser using regex."""

    def parse(self, file_path: str, content: str) -> Dict[str, Any]:
        """Parse TypeScript/JavaScript file."""
        functions = self._extract_functions(content)
        classes = self._extract_classes(content)
        imports = self._extract_imports(content)

        return {
            'functions': functions,
            'classes': classes,
            'imports': imports
        }

    def _extract_functions(self, content: str) -> List[Dict[str, Any]]:
        """Extract functions using regex."""
        functions = []

        # Match function declarations
        # function name(params): returnType { ... }
        # const name = (params): returnType => { ... }
        # async function name(params) { ... }

        patterns = [
            # Regular function
            r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*\{',
            # Arrow function
            r'(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\((.*?)\)(?:\s*:\s*([^=>]+))?\s*=>',
            # Method in class
            r'(?:async\s+)?(\w+)\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*\{'
        ]

        lines = content.split('\n')

        for i, line in enumerate(lines, 1):
            for pattern in patterns:
                match = re.search(pattern, line)
                if match:
                    name = match.group(1)
                    params_str = match.group(2)
                    return_type = match.group(3).strip() if len(match.groups()) > 2 and match.group(3) else ''

                    # Parse parameters
                    params = []
                    if params_str:
                        for param in params_str.split(','):
                            param = param.strip()
                            param_name = param.split(':')[0].strip()
                            if param_name:
                                params.append(param_name)

                    # Estimate end line (look for closing brace)
                    end_line = i
                    brace_count = 1
                    for j in range(i, min(i + 500, len(lines))):  # Max 500 lines
                        end_line = j + 1
                        brace_count += lines[j].count('{') - lines[j].count('}')
                        if brace_count == 0:
                            break

                    # Get body
                    body_lines = lines[i-1:end_line]
                    body = '\n'.join(body_lines[:100])  # Limit to 100 lines

                    functions.append({
                        'name': name,
                        'signature': f"{name}({params_str}): {return_type}",
                        'parameters': params,
                        'return_type': return_type,
                        'docstring': '',
                        'body': body,
                        'start_line': i,
                        'end_line': end_line,
                        'complexity': body.count('if ') + body.count('for ') + body.count('while ')
                    })

        return functions

    def _extract_classes(self, content: str) -> List[Dict[str, Any]]:
        """Extract classes using regex."""
        classes = []

        # Match class declarations
        pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{'

        lines = content.split('\n')

        for i, line in enumerate(lines, 1):
            match = re.search(pattern, line)
            if match:
                name = match.group(1)
                base_class = match.group(2) if len(match.groups()) > 1 else None

                # Find end of class
                end_line = i
                brace_count = 1
                for j in range(i, min(i + 1000, len(lines))):
                    end_line = j + 1
                    brace_count += lines[j].count('{') - lines[j].count('}')
                    if brace_count == 0:
                        break

                # Get body
                body_lines = lines[i-1:end_line]
                body = '\n'.join(body_lines[:200])  # Limit

                # Extract methods (simple regex)
                methods = re.findall(r'(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{', body)

                classes.append({
                    'name': name,
                    'type': 'class',
                    'base_classes': [base_class] if base_class else [],
                    'methods': methods,
                    'docstring': '',
                    'body': body,
                    'start_line': i,
                    'end_line': end_line
                })

        return classes

    def _extract_imports(self, content: str) -> List[Dict[str, str]]:
        """Extract imports."""
        imports = []

        # Match import statements
        patterns = [
            r'import\s+(?:\*\s+as\s+(\w+)|{([^}]+)}|\s*(\w+))\s+from\s+[\'"]([^\'"]+)[\'"]',
            r'import\s+[\'"]([^\'"]+)[\'"]'
        ]

        for line in content.split('\n'):
            for pattern in patterns:
                match = re.search(pattern, line)
                if match:
                    groups = match.groups()
                    if len(groups) >= 4:
                        module = groups[3]
                        items = []
                        if groups[0]:  # * as name
                            items = [groups[0]]
                        elif groups[1]:  # { items }
                            items = [i.strip() for i in groups[1].split(',')]
                        elif groups[2]:  # default import
                            items = [groups[2]]

                        imports.append({
                            'module': module,
                            'imported_items': items,
                            'import_type': 'import'
                        })
                    elif len(groups) >= 1:  # Side-effect import
                        imports.append({
                            'module': groups[0],
                            'imported_items': [],
                            'import_type': 'import'
                        })

        return imports


class CodeIndexer:
    """Main code indexer."""

    def __init__(self, project_path: str):
        self.project_path = Path(project_path).resolve()
        self.conn = None
        self.project_id = None

        # Initialize parsers
        self.parsers = {
            'python': PythonParser(),
            'typescript': TypeScriptParser(),
            'javascript': TypeScriptParser()
        }

    def connect(self):
        """Connect to database."""
        self.conn = get_db_connection()
        self.project_id = self._get_or_create_project()

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

    def _get_or_create_project(self) -> str:
        """Get or create project in database."""
        cur = self.conn.cursor()

        # Check if project exists
        cur.execute("""
            SELECT id FROM projects WHERE path = %s
        """, (str(self.project_path),))

        result = cur.fetchone()
        if result:
            return result[0]

        # Create project
        project_name = self.project_path.name
        cur.execute("""
            INSERT INTO projects (name, path, created_at)
            VALUES (%s, %s, NOW())
            RETURNING id
        """, (project_name, str(self.project_path)))

        self.conn.commit()
        return cur.fetchone()[0]

    def scan_project(self):
        """Scan entire project."""
        print(f"📁 Scanning project: {self.project_path}")

        files_to_index = []

        for file_path in self.project_path.rglob('*'):
            if file_path.is_file() and not should_skip_path(file_path):
                ext = file_path.suffix
                if ext in SUPPORTED_EXTENSIONS:
                    files_to_index.append(file_path)

        print(f"📊 Found {len(files_to_index)} files to index")

        indexed_count = 0
        error_count = 0

        for i, file_path in enumerate(files_to_index, 1):
            try:
                self.index_file(file_path)
                indexed_count += 1

                if i % 10 == 0:
                    print(f"  Progress: {i}/{len(files_to_index)} ({(i/len(files_to_index)*100):.1f}%)")

            except Exception as e:
                print(f"✗ Error indexing {file_path}: {e}")
                error_count += 1

        print(f"\n✓ Indexing complete:")
        print(f"  Indexed: {indexed_count} files")
        print(f"  Errors: {error_count} files")

        # Update project stats
        self._update_project_stats()

    def index_file(self, file_path: Path):
        """Index a single file."""
        relative_path = file_path.relative_to(self.project_path)
        language = SUPPORTED_EXTENSIONS[file_path.suffix]

        # Read file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"⚠ Cannot read {file_path}: {e}")
            return

        # Get git hash
        git_hash = get_git_hash(str(file_path))

        # Check if file needs reindexing
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, git_hash FROM files
            WHERE project_id = %s AND path = %s
        """, (self.project_id, str(relative_path)))

        result = cur.fetchone()
        if result:
            file_id, db_git_hash = result
            if db_git_hash == git_hash:
                # File unchanged, skip
                return
            else:
                # File changed, delete old data
                cur.execute("DELETE FROM functions WHERE file_id = %s", (file_id,))
                cur.execute("DELETE FROM classes WHERE file_id = %s", (file_id,))
                cur.execute("DELETE FROM dependencies WHERE file_id = %s", (file_id,))
                cur.execute("DELETE FROM files WHERE id = %s", (file_id,))
                self.conn.commit()

        # Parse file
        parser = self.parsers.get(language)
        if not parser:
            print(f"⚠ No parser for {language}")
            return

        parsed = parser.parse(str(file_path), content)

        # Insert file record
        cur.execute("""
            INSERT INTO files (
                project_id, path, language, size,
                line_count, git_hash, last_modified, indexed_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """, (
            self.project_id,
            str(relative_path),
            language,
            len(content),
            len(content.split('\n')),
            git_hash,
            datetime.fromtimestamp(file_path.stat().st_mtime)
        ))

        file_id = cur.fetchone()[0]

        # Insert functions
        for func in parsed['functions']:
            cur.execute("""
                INSERT INTO functions (
                    project_id, file_id, name, signature,
                    parameters, return_type, docstring, body,
                    start_line, end_line, complexity
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                self.project_id, file_id, func['name'], func['signature'],
                func['parameters'], func['return_type'], func['docstring'],
                func['body'], func['start_line'], func['end_line'], func['complexity']
            ))

        # Insert classes
        for cls in parsed['classes']:
            cur.execute("""
                INSERT INTO classes (
                    project_id, file_id, name, type,
                    base_classes, methods, docstring, body,
                    start_line, end_line
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                self.project_id, file_id, cls['name'], cls['type'],
                cls['base_classes'], cls['methods'], cls['docstring'],
                cls['body'], cls['start_line'], cls['end_line']
            ))

        # Insert dependencies
        for imp in parsed['imports']:
            cur.execute("""
                INSERT INTO dependencies (
                    project_id, file_id, import_type,
                    module_name, imported_items
                ) VALUES (%s, %s, %s, %s, %s)
            """, (
                self.project_id, file_id, imp['import_type'],
                imp['module'], imp['imported_items']
            ))

        self.conn.commit()

    def _update_project_stats(self):
        """Update project statistics."""
        cur = self.conn.cursor()
        cur.execute("""
            UPDATE projects
            SET total_files = (SELECT COUNT(*) FROM files WHERE project_id = %s),
                total_functions = (SELECT COUNT(*) FROM functions WHERE project_id = %s),
                total_classes = (SELECT COUNT(*) FROM classes WHERE project_id = %s),
                last_indexed_at = NOW()
            WHERE id = %s
        """, (self.project_id, self.project_id, self.project_id, self.project_id))
        self.conn.commit()

    def reconcile(self):
        """Reconcile database with filesystem."""
        print("🔄 Reconciling database with filesystem...")

        # Get all files from database
        cur = self.conn.cursor()
        cur.execute("""
            SELECT id, path, git_hash FROM files WHERE project_id = %s
        """, (self.project_id,))

        db_files = {row[1]: (row[0], row[2]) for row in cur.fetchall()}

        # Scan filesystem
        fs_files = set()
        for file_path in self.project_path.rglob('*'):
            if file_path.is_file() and not should_skip_path(file_path):
                ext = file_path.suffix
                if ext in SUPPORTED_EXTENSIONS:
                    relative_path = str(file_path.relative_to(self.project_path))
                    fs_files.add(relative_path)

        # Find discrepancies
        missing_in_db = fs_files - db_files.keys()
        orphaned_in_db = db_files.keys() - fs_files
        potentially_stale = fs_files & db_files.keys()

        print(f"  Missing in DB: {len(missing_in_db)}")
        print(f"  Orphaned in DB: {len(orphaned_in_db)}")
        print(f"  Checking for stale: {len(potentially_stale)}")

        # Index missing files
        for relative_path in missing_in_db:
            file_path = self.project_path / relative_path
            self.index_file(file_path)

        # Remove orphaned entries
        for relative_path in orphaned_in_db:
            file_id = db_files[relative_path][0]
            cur.execute("DELETE FROM files WHERE id = %s", (file_id,))

        if orphaned_in_db:
            self.conn.commit()

        # Check stale entries
        stale_count = 0
        for relative_path in potentially_stale:
            file_path = self.project_path / relative_path
            current_hash = get_git_hash(str(file_path))
            db_hash = db_files[relative_path][1]

            if current_hash != db_hash:
                self.index_file(file_path)
                stale_count += 1

        print(f"  Stale files re-indexed: {stale_count}")

        self._update_project_stats()
        print("✓ Reconciliation complete")


def main():
    parser = argparse.ArgumentParser(description='Orchestr8 Code Indexer')
    parser.add_argument('project_path', help='Path to project to index')
    parser.add_argument('--file', help='Index specific file only')
    parser.add_argument('--reconcile', action='store_true', help='Reconcile database with filesystem')

    args = parser.parse_args()

    indexer = CodeIndexer(args.project_path)

    try:
        indexer.connect()

        if args.file:
            # Index specific file
            file_path = Path(args.file).resolve()
            print(f"📄 Indexing file: {file_path}")
            indexer.index_file(file_path)
            print("✓ File indexed")

        elif args.reconcile:
            # Reconcile
            indexer.reconcile()

        else:
            # Full scan
            indexer.scan_project()

    except Exception as e:
        print(f"✗ Indexing failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        indexer.close()


if __name__ == '__main__':
    main()
