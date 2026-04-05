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
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Finds a user by their primary key."""
        pass

    @abstractmethod
    async def get_by_username(self, username: str) -> Optional[User]:
        """Finds a user by their unique username."""
        pass

    @abstractmethod
    async def update(self, user: User) -> User:
        """Updates an existing user."""
        pass

    @abstractmethod
    async def delete(self, user_id: int) -> bool:
        """Deletes a user by ID. Returns True if deleted, False if not found."""
        pass

    @abstractmethod
    async def list_all(self) -> List[User]:
        """Returns all users in storage."""
        pass


class IDeviceRepository(ABC):
    @abstractmethod
    async def create(self, device: Device) -> Device:
        """Saves a new device to the storage."""
        pass

    @abstractmethod
    async def get_by_id(self, device_id: int) -> Optional[Device]:
        """Finds a device by its primary key."""
        pass

    @abstractmethod
    async def get_by_user(self, user_id: int) -> List[Device]:
        """Finds all devices owned by a specific user."""
        pass

    @abstractmethod
    async def update(self, device: Device) -> Device:
        """Updates an existing device."""
        pass

    @abstractmethod
    async def delete(self, device_id: int) -> bool:
        """Deletes a device by ID. Returns True if deleted, False if not found."""
        pass

    @abstractmethod
    async def list_all(self) -> List[Device]:
        """Returns all devices in storage."""
        pass


class IModeRepository(ABC):
    @abstractmethod
    async def create(self, mode: Mode) -> Mode:
        """Saves a new mode to the storage."""
        pass

    @abstractmethod
    async def get_by_id(self, mode_id: int) -> Optional[Mode]:
        """Finds a mode by its primary key."""
        pass

    @abstractmethod
    async def get_by_user(self, user_id: int) -> List[Mode]:
        """Finds all modes created by a specific user."""
        pass

    @abstractmethod
    async def update(self, mode: Mode) -> Mode:
        """Updates an existing mode."""
        pass

    @abstractmethod
    async def delete(self, mode_id: int) -> bool:
        """Deletes a mode by ID. Returns True if deleted, False if not found."""
        pass

    @abstractmethod
    async def list_all(self) -> List[Mode]:
        """Returns all modes in storage."""
        pass