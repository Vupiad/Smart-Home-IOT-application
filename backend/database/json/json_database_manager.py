"""JSON Database Manager implementing IDatabaseManager interface."""

import asyncio
from typing import AsyncGenerator, Optional
from pathlib import Path
from database.database_manager import IDatabaseManager
from .json_connection import JsonConnection


class JsonDatabaseManager(IDatabaseManager):
    """
    Manages JSON file-based storage for single-user Smart Home IoT application.
    
    This implementation maintains the IDatabaseManager interface, allowing
    seamless substitution for PostgreSQL or other database backends via
    the factory pattern.
    
    For a single-user application, JSON file storage avoids the complexity
    of relational databases while maintaining full ACID-like behavior through
    atomic file operations.
    """

    def __init__(self, file_path: str = "data.json"):
        """
        Initialize JsonDatabaseManager.
        
        Args:
            file_path: Path to JSON data file (default: backend/data.json)
        """
        self.file_path = Path(file_path)
        self._initialized = False

    async def connect(self) -> None:
        """
        Initialize the JSON database.
        
        Creates the file with default structure if it doesn't exist.
        Loads existing data from file if present.
        """
        if not self._initialized:
            # Load or initialize the JSON file
            conn = JsonConnection(str(self.file_path), None)
            await conn.load()
            self._initialized = True
            print(f" [DB] JSON database initialized at {self.file_path}")

    async def disconnect(self) -> None:
        """
        Prepare for shutdown.
        
        In JSON mode, no active connections need cleanup. All data
        is persisted after each operation.
        """
        self._initialized = False
        print(f" [DB] JSON database connection closed")

    async def get_connection(self) -> AsyncGenerator[JsonConnection, None]:
        """
        Yield a JSON connection for a single request.
        
        This generator pattern matches the PostgreSQL connection pool interface,
        allowing seamless substitution. Each request gets its own JsonConnection
        instance.
        
        For single-user JSON storage, we don't need distributed locking.
        
        Yields:
            JsonConnection instance with data loaded from file
        """
        conn = JsonConnection(str(self.file_path), None)
        await conn.load()
        try:
            yield conn
        finally:
            # Data is persisted on successful context exit
            # (only if no exceptions occurred in the endpoint)
            pass
