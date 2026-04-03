from abc import ABC, abstractmethod

class IRepository(ABC):
    @abstractmethod
    async def save(self, topic: str, payload: str):
        pass
    
    @abstractmethod
    async def get_recent(self, topic: str, limit: int = 20):
        pass