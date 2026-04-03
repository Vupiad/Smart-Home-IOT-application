from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from .nosql_repository import IRepository


class MongoSensorRepository(IRepository):
    def __init__(self, db):
        self.db = db
        
    async def save(self, topic: str, payload: str):
        document = {
            "topic": topic,
            "value": float(payload),
            "timestamp": datetime.now()
        }
        await self.db.sensor_logs.insert_one(document)
        print(f"[Storage] Logged {topic} to MongoDB")

    async def get_recent(self, topic: str, limit: int = 20):
        """Fetches the last N readings for a specific sensor topic."""
        cursor = self.db.sensor_logs.find({"topic": topic}) \
                                    .sort("timestamp", -1) \
                                    .limit(limit)
        
        results = []
        async for doc in cursor:
            # Convert MongoDB ObjectId to string for JSON compatibility
            doc["_id"] = str(doc["_id"])
            results.append(doc)
            
        return results