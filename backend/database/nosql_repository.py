from abc import ABC, abstractmethod

class IRepository(ABC):
    @abstractmethod
    async def save(self, topic: str, payload: str):
        pass