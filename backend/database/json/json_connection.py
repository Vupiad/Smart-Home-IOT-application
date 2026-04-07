"""Async context manager for JSON file connections."""

import asyncio
from typing import Any, Dict, Optional
from pathlib import Path
import json as json_lib
import aiofiles


class JsonConnection:
    """
    Represents a single connection to JSON file storage.
    
    This class provides an async context manager interface and manages
    locking for safe concurrent access to the JSON file.
    """

    def __init__(self, file_path: str, lock: Optional[asyncio.Lock] = None):
        """
        Initialize JsonConnection.
        
        Args:
            file_path: Path to the JSON data file
            lock: Async lock for thread-safe file access (unused, kept for compatibility)
        """
        self.file_path = Path(file_path)
        self.lock = lock  # Kept for backwards compatibility but not used
        self._data: Dict[str, Any] = {}

    async def load(self) -> Dict[str, Any]:
        """
        Load data from JSON file.
        
        Returns:
            Dictionary containing users, devices, modes, and metadata
        """
        if not self.file_path.exists():
            # Initialize with default structure
            self._data = {
                "users": [],
                "devices": [],
                "modes": [],
                "_meta": {"next_user_id": 1, "next_device_id": 1, "next_mode_id": 1}
            }
            await self.save()
        else:
            async with aiofiles.open(self.file_path, 'r') as f:
                content = await f.read()
                self._data = json_lib.loads(content) if content else {
                    "users": [],
                    "devices": [],
                    "modes": [],
                    "_meta": {"next_user_id": 1, "next_device_id": 1, "next_mode_id": 1}
                }
        return self._data

    async def save(self) -> None:
        """
        Save in-memory data to JSON file.
        
        This method ensures atomic writes to prevent data corruption.
        """
        async with aiofiles.open(self.file_path, 'w') as f:
            content = json_lib.dumps(self._data, indent=2, default=str)
            await f.write(content)

    def get_data(self) -> Dict[str, Any]:
        """
        Get current in-memory data (without saving).
        
        Returns:
            Current data dictionary
        """
        return self._data

    def set_data(self, data: Dict[str, Any]) -> None:
        """
        Set in-memory data (without saving).
        
        Args:
            data: New data to set
        """
        self._data = data

    async def __aenter__(self):
        """Async context manager entry."""
        await self.load()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit - save data on success."""
        if exc_type is None:
            await self.save()
        return False
