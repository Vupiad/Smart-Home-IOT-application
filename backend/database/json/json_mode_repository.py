"""JSON-based Mode Repository implementation."""

from typing import Optional, List
from database.models.mode import Mode
from database.repository import IModeRepository
from .json_connection import JsonConnection


class JsonModeRepository(IModeRepository):
    """
    Mode repository backed by JSON file storage.
    
    Implements IModeRepository interface for seamless substitution
    with PostgresModeRepository. Stores automation modes with
    flexible action definitions.
    
    ID Assignment: Uses auto-incrementing counter stored in _meta.next_mode_id
    """

    def __init__(self, connection: JsonConnection):
        """
        Initialize repository with JSON connection.
        
        Args:
            connection: JsonConnection instance
        """
        self._conn = connection

    async def create(self, mode: Mode) -> Mode:
        """
        Create a new automation mode.
        
        Auto-generates ID from counter.
        
        Args:
            mode: Mode instance (without ID)
            
        Returns:
            Mode with generated ID
        """
        data = self._conn.get_data()
        
        # Generate next mode ID
        meta = data.get("_meta", {})
        mode_id = meta.get("next_mode_id", 1)
        meta["next_mode_id"] = mode_id + 1
        data["_meta"] = meta
        
        # Create mode document
        mode_doc = {
            "id": mode_id,
            "user_id": mode.user_id,
            "name": mode.name,
            "actions": mode.actions,
            "is_active": mode.is_active,
            "created_at": mode.created_at.isoformat() if mode.created_at else None,
        }
        
        # Add to modes list
        if "modes" not in data:
            data["modes"] = []
        data["modes"].append(mode_doc)
        
        # Persist changes
        self._conn.set_data(data)
        await self._conn.save()
        
        mode.id = mode_id
        return mode

    async def get_by_id(self, mode_id: int) -> Optional[Mode]:
        """
        Find a mode by ID.
        
        Args:
            mode_id: Mode's primary key
            
        Returns:
            Mode if found, None otherwise
        """
        data = self._conn.get_data()
        
        for mode_doc in data.get("modes", []):
            if mode_doc.get("id") == mode_id:
                return self._doc_to_mode(mode_doc)
        
        return None

    async def get_by_user(self, user_id: int) -> List[Mode]:
        """
        Find all modes created by a user.
        
        Args:
            user_id: Creator's user ID
            
        Returns:
            List of modes (empty list if none found)
        """
        data = self._conn.get_data()
        modes = []
        
        for mode_doc in data.get("modes", []):
            if mode_doc.get("user_id") == user_id:
                modes.append(self._doc_to_mode(mode_doc))
        
        return modes

    async def update(self, mode: Mode) -> Mode:
        """
        Update an existing mode.
        
        Args:
            mode: Mode with ID and updated fields
            
        Returns:
            Updated mode
            
        Raises:
            ValueError: If mode not found
        """
        data = self._conn.get_data()
        modes = data.get("modes", [])
        
        for i, mode_doc in enumerate(modes):
            if mode_doc.get("id") == mode.id:
                # Update fields
                mode_doc["user_id"] = mode.user_id
                mode_doc["name"] = mode.name
                mode_doc["actions"] = mode.actions
                mode_doc["is_active"] = mode.is_active
                # created_at is immutable, don't update
                
                modes[i] = mode_doc
                data["modes"] = modes
                self._conn.set_data(data)
                await self._conn.save()
                return mode
        
        raise ValueError(f"Mode with id {mode.id} not found")

    async def delete(self, mode_id: int) -> bool:
        """
        Delete a mode by ID.
        
        Args:
            mode_id: Mode's primary key
            
        Returns:
            True if deleted, False if not found
        """
        data = self._conn.get_data()
        modes = data.get("modes", [])
        
        for i, mode_doc in enumerate(modes):
            if mode_doc.get("id") == mode_id:
                modes.pop(i)
                data["modes"] = modes
                self._conn.set_data(data)
                await self._conn.save()
                return True
        
        return False

    async def list_all(self) -> List[Mode]:
        """
        Get all modes.
        
        Returns:
            List of all modes
        """
        data = self._conn.get_data()
        modes = data.get("modes", [])
        
        return [self._doc_to_mode(mode_doc) for mode_doc in modes]

    @staticmethod
    def _doc_to_mode(doc: dict) -> Mode:
        """
        Convert JSON document to Mode model.
        
        Args:
            doc: Raw dictionary from JSON
            
        Returns:
            Pydantic Mode instance
        """
        from datetime import datetime
        
        created_at = doc.get("created_at")
        if created_at and isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        return Mode(
            id=doc.get("id"),
            user_id=doc.get("user_id"),
            name=doc.get("name"),
            actions=doc.get("actions", []),
            is_active=doc.get("is_active", False),
            created_at=created_at
        )
