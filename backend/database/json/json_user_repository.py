"""JSON-based User Repository implementation."""

from typing import Optional, List
from database.models.user import User
from database.repository import IUserRepository
from .json_connection import JsonConnection


class JsonUserRepository(IUserRepository):
    """
    User repository backed by JSON file storage.
    """

    def __init__(self, connection: JsonConnection):
        self._conn = connection

    async def create(self, user: User) -> User:
        data = self._conn.get_data()
        
        meta = data.get("_meta", {})
        user_id = meta.get("next_user_id", 1)
        meta["next_user_id"] = user_id + 1
        data["_meta"] = meta
        
        user_doc = {
            "id": user_id,
            "email": user.email,
            "hashed_password": user.hashed_password,
            "fullName": user.fullName,
            "phone": user.phone,
            "dateOfBirth": user.dateOfBirth,
            "created_at": user.created_at.isoformat() if user.created_at else None,
        }
        
        if "users" not in data:
            data["users"] = []
        data["users"].append(user_doc)
        
        self._conn.set_data(data)
        await self._conn.save()
        
        user.id = user_id
        return user

    async def get_by_id(self, user_id: int) -> Optional[User]:
        data = self._conn.get_data()
        for user_doc in data.get("users", []):
            if user_doc.get("id") == user_id:
                return self._doc_to_user(user_doc)
        return None

    async def get_by_email(self, email: str) -> Optional[User]:
        data = self._conn.get_data()
        for user_doc in data.get("users", []):
            if user_doc.get("email") == email:
                return self._doc_to_user(user_doc)
        return None

    async def update(self, user: User) -> User:
        data = self._conn.get_data()
        users = data.get("users", [])
        
        for i, user_doc in enumerate(users):
            if user_doc.get("id") == user.id:
                user_doc["email"] = user.email
                user_doc["hashed_password"] = user.hashed_password
                user_doc["fullName"] = user.fullName
                user_doc["phone"] = user.phone
                user_doc["dateOfBirth"] = user.dateOfBirth
                
                users[i] = user_doc
                data["users"] = users
                self._conn.set_data(data)
                await self._conn.save()
                return user
        
        raise ValueError(f"User with id {user.id} not found")

    async def delete(self, user_id: int) -> bool:
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
        data = self._conn.get_data()
        users = data.get("users", [])
        return [self._doc_to_user(user_doc) for user_doc in users]

    @staticmethod
    def _doc_to_user(doc: dict) -> User:
        from datetime import datetime
        
        created_at = doc.get("created_at")
        if created_at and isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        return User(
            id=doc.get("id"),
            email=doc.get("email"),
            hashed_password=doc.get("hashed_password"),
            fullName=doc.get("fullName", "Unknown"),
            phone=doc.get("phone"),
            dateOfBirth=doc.get("dateOfBirth"),
            created_at=created_at
        )
