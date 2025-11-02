"""
Database connection and utility functions.
"""
import sqlite3
import os
from typing import Optional, Tuple
from contextlib import contextmanager


class Database:
    """Database connection manager."""
    
    def __init__(self, db_path: str = None):
        """
        Initialize database connection.
        
        Args:
            db_path: Path to SQLite database file. Defaults to backend/database/football_edu.db
        """
        if db_path is None:
            # Get the directory of this file
            current_dir = os.path.dirname(os.path.abspath(__file__))
            db_path = os.path.join(current_dir, 'football_edu.db')
        
        self.db_path = db_path
        self._ensure_database_directory()
    
    def _ensure_database_directory(self):
        """Ensure the database directory exists."""
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
    
    @contextmanager
    def get_connection(self):
        """
        Get a database connection with context manager.
        
        Usage:
            with db.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute(...)
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def execute(self, query: str, params: Tuple = ()):
        """
        Execute a query and return results.
        
        Args:
            query: SQL query string
            params: Query parameters
        
        Returns:
            List of rows (as dictionaries)
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return [dict(row) for row in cursor.fetchall()]
    
    def execute_one(self, query: str, params: Tuple = ()):
        """
        Execute a query and return first result.
        
        Args:
            query: SQL query string
            params: Query parameters
        
        Returns:
            Dictionary representing the first row, or None
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            row = cursor.fetchone()
            return dict(row) if row else None
    
    def execute_update(self, query: str, params: Tuple = ()):
        """
        Execute an update/insert/delete query.
        
        Args:
            query: SQL query string
            params: Query parameters
        
        Returns:
            Number of affected rows
        """
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.rowcount


# Singleton instance
_db_instance: Optional[Database] = None


def get_db() -> Database:
    """Get singleton database instance."""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
    return _db_instance


def init_database():
    """Initialize database schema from schema.sql."""
    db = get_db()
    schema_file = os.path.join(os.path.dirname(__file__), 'schema.sql')
    
    if not os.path.exists(schema_file):
        raise FileNotFoundError(f"Schema file not found: {schema_file}")
    
    with open(schema_file, 'r', encoding='utf-8') as f:
        schema_sql = f.read()
    
    with db.get_connection() as conn:
        conn.executescript(schema_sql)
