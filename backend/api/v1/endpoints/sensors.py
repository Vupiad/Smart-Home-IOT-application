from fastapi import APIRouter, HTTPException, Query, Depends
from database.nosql.mongo_sensor_repository import MongoSensorRepository
from api.deps import get_sensor_repo
import os

router = APIRouter()

@router.get("/current")
async def get_current_telemetry(
    device_id: str = Query(None, description="Optional hardware device ID to filter by"),
    repo: MongoSensorRepository = Depends(get_sensor_repo)
):
    """
    Returns the most recent telemetry readings.
    """
    try:
        data = await repo.get_latest_telemetry(device_id)
        if not data:
            return {"message": "No telemetry data found"}
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{topic:path}/history")
async def get_history(
    topic: str, 
    limit: int = Query(default=20, le=100),
    repo: MongoSensorRepository = Depends(get_sensor_repo)
):
    """
    Returns the most recent readings for a specific topic (e.g., yolohome/device/yolo_uno_01/telemetry).
    """
    try:
        data = await repo.get_recent(topic, limit)
        if not data:
            return {"message": "No data found for this topic", "data": []}
        return {"topic": topic, "count": len(data), "history": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))