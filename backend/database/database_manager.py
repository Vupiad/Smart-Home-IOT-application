from abc import ABC, abstractmethod
from typing import AsyncGenerator, Any

class IDatabaseManager(ABC):
    @abstractmethod
    async def connect(self) -> None:
        """Initialize the connection or the pool."""
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        """Close all active connections."""
        pass

    @abstractmethod
    async def get_connection(self) -> AsyncGenerator[Any, None]:
        """Yield a single connection for a request."""
        pass