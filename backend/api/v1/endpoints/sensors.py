from fastapi import APIRouter, HTTPException, Query, Depends
from backend.database.nosql.mongo_sensor_repository import MongoSensorRepository
from api.deps import get_sensor_repo
import os

router = APIRouter()

# Initialize the repository (In a real app, use a FastAPI Dependency)

@router.get("/{topic}/history")
async def get_history(
    topic: str, 
    limit: int = Query(default=20, le=100),
    repo: MongoSensorRepository = Depends(get_sensor_repo)
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