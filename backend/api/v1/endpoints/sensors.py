from fastapi import APIRouter, HTTPException, Query
from backend.database.nosql.mongo_sensor_repository import MongoSensorRepository
import os

router = APIRouter()

# Initialize the repository (In a real app, use a FastAPI Dependency)
repo = MongoSensorRepository(
    uri=os.getenv("MONGO_URL"), 
    db_name="smarthome_telemetry"
)

@router.get("/{topic}/history")
async def get_history(
    topic: str, 
    limit: int = Query(default=20, le=100)
):
    """
    Returns the most recent readings for a specific topic (e.g., V1, V2).
    """
    try:
        data = await repo.get_recent(topic, limit)
        if not data:
            return {"message": "No data found for this topic", "data": []}
        return {"topic": topic, "count": len(data), "history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))