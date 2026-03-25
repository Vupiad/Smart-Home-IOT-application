from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from .nosql_repository import IRepository


class MongoSensorRepository(IRepository):
    def __init__(self, uri: str, db_name: str):
        self.client = AsyncIOMotorClient(uri)
        self.db = self.client[db_name]

    async def save(self, topic: str, payload: str):
        document = {
            "topic": topic,
            "value": float(payload),
            "timestamp": datetime.now()
        }
        await self.db.sensor_logs.insert_one(document)
        print(f"[Storage] Logged {topic} to MongoDB")