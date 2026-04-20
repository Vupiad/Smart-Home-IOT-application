import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from .nosql_repository import IRepository


class MongoSensorRepository(IRepository):
    def __init__(self, db):
        self.db = db
        
    async def save(self, topic: str, payload: str):
        try:
            data = json.loads(payload)
            document = {
                "topic": topic,
                "deviceId": data.get("deviceId", "unknown"),
                "temperature": data.get("temperature"),
                "humidity": data.get("humidity"),
                "light": data.get("light"),
                "timestamp": datetime.now()
            }
            await self.db.sensor_logs.insert_one(document)
            print(f"[Storage] Logged telemetry to MongoDB from {topic}")
        except json.JSONDecodeError:
            print(f"[Storage] Failed to decode JSON telemetry payload: {payload}")
        except Exception as e:
            print(f"[Storage] Error logging telemetry: {e}")

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

    async def get_latest_telemetry(self, device_id: str = None):
        """Fetches the most recent telemetry reading."""
        query = {}
        if device_id:
            query = {"deviceId": device_id}
            
        doc = await self.db.sensor_logs.find_one(query, sort=[("timestamp", -1)])
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc