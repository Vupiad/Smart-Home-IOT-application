from abc import ABC, abstractmethod
from typing import Optional, List
from models.user import User
from models.mode import Mode
from backend.database.sql.models.device import Device

class IUserRepository(ABC):
    @abstractmethod
    async def create(self, user: User) -> User:
        """Saves a new user to the storage."""
        pass

    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Finds a user by their unique username."""
        pass

    @abstractmethod
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Finds a user by their primary key."""
        pass
class IDeviceRepository(ABC):
    @abstractmethod
    async def create(self, device: Device) -> Device: pass
    
    @abstractmethod
    async def get_by_user(self, user_id: int) -> List[Device]: pass

class IModeRepository(ABC):
    @abstractmethod
    async def create(self, mode: Mode) -> Mode: pass

    @abstractmethod
    async def get_by_user(self, user_id: int) -> List[Mode]: pass