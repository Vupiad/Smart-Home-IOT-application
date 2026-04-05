"""JSON-based User Repository implementation."""

from typing import Optional, List
from models.user import User
from backend.database.sql.repositories.repository import IUserRepository
from .json_connection import JsonConnection


class JsonUserRepository(IUserRepository):
    """
    User repository backed by JSON file storage.
    
    Implements IUserRepository interface to provide seamless substitution
    for PostgresUserRepository. All operations work on in-memory data
    structures that are persisted to JSON file.
    
    ID Assignment: Uses auto-incrementing counter stored in _meta.next_user_id
    """

    def __init__(self, connection: JsonConnection):
        """
        Initialize repository with JSON connection.
        
        Args:
            connection: JsonConnection instance providing access to in-memory data
        """
        self._conn = connection

    async def create(self, user: User) -> User:
        """
        Create a new user.
        
        Auto-generates ID from counter and persists to JSON file.
        
        Args:
            user: User instance (without ID)
            
        Returns:
            User with generated ID
        """
        data = self._conn.get_data()
        
        # Generate next user ID
        meta = data.get("_meta", {})
        user_id = meta.get("next_user_id", 1)
        meta["next_user_id"] = user_id + 1
        data["_meta"] = meta
        
        # Create user document
        user_doc = {
            "id": user_id,
            "username": user.username,
            "email": user.email,
            "hashed_password": user.hashed_password,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        
        # Add to users list
        if "users" not in data:
            data["users"] = []
        data["users"].append(user_doc)
        
        # Persist changes
        self._conn.set_data(data)
        await self._conn.save()
        
        # Update and return user with generated ID
        user.id = user_id
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """
        Find a user by ID.
        
        Args:
            user_id: User's primary key
            
        Returns:
            User if found, None otherwise
        """
        data = self._conn.get_data()
        
        for user_doc in data.get("users", []):
            if user_doc.get("id") == user_id:
                return self._doc_to_user(user_doc)
        
        return None

    async def get_by_username(self, username: str) -> Optional[User]:
        """
        Find a user by username.
        
        Args:
            username: User's unique username
            
        Returns:
            User if found, None otherwise
        """
        data = self._conn.get_data()
        
        for user_doc in data.get("users", []):
            if user_doc.get("username") == username:
                return self._doc_to_user(user_doc)
        
        return None

    async def update(self, user: User) -> User:
        """
        Update an existing user.
        
        Args:
            user: User instance with ID and updated fields
            
        Returns:
            Updated user
            
        Raises:
            ValueError: If user not found
        """
        data = self._conn.get_data()
        users = data.get("users", [])
        
        for i, user_doc in enumerate(users):
            if user_doc.get("id") == user.id:
                # Update fields
                user_doc["username"] = user.username
                user_doc["email"] = user.email
                user_doc["hashed_password"] = user.hashed_password
                # created_at is immutable, don't update
                
                users[i] = user_doc
                data["users"] = users
                self._conn.set_data(data)
                await self._conn.save()
                return user
        
        raise ValueError(f"User with id {user.id} not found")

    async def delete(self, user_id: int) -> bool:
        """
        Delete a user by ID.
        
        Args:
            user_id: User's primary key
            
        Returns:
            True if deleted, False if not found
        """
        data = self._conn.get_data()
        users = data.get("users", [])
        
        for i, user_doc in enumerate(users):
            if user_doc.get("id") == user_id:
                users.pop(i)
                data["users"] = users
                self._conn.set_data(data)
                await self._conn.save()
                return True
        
        return False

    async def list_all(self) -> List[User]:
        """
        Get all users.
        
        Returns:
            List of all users
        """
        data = self._conn.get_data()
        users = data.get("users", [])
        
        return [self._doc_to_user(user_doc) for user_doc in users]

    @staticmethod
    def _doc_to_user(doc: dict) -> User:
        """
        Convert JSON document to User model.
        
        Args:
            doc: Raw dictionary from JSON
            
        Returns:
            Pydantic User instance
        """
        from datetime import datetime
        
        created_at = doc.get("created_at")
        if created_at and isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        return User(
            id=doc.get("id"),
            username=doc.get("username"),
            email=doc.get("email"),
            hashed_password=doc.get("hashed_password"),
            created_at=created_at
        )
