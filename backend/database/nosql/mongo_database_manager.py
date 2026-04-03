import os
from motor.motor_asyncio import AsyncIOMotorClient
from ..database_manager import IDatabaseManager # Reusing your interface!

class MongoManager(IDatabaseManager):
    def __init__(self, uri: str, db_name: str):
        self._uri = uri
        self._db_name = db_name
        self._client = None
        self._db = None

    async def connect(self) -> None:
        self._client = AsyncIOMotorClient(self._uri)
        self._db = self._client[self._db_name]
        print(f" [DB] MongoDB Connected to: {self._db_name}")

    async def disconnect(self) -> None:
        if self._client:
            self._client.close()
            print(" [DB] MongoDB Connection Closed.")

    def get_db(self):
        return self._db

# Create the singleton instance
mongo_instance = MongoManager(
    uri=os.getenv("MONGO_URL", "mongodb://localhost:27017"),
    db_name="smarthome_telemetry"
)