import os
from fastapi import Depends, Request, HTTPException, status
from database.sql.database_factory import db_instance
from database.nosql.nosql_factory import nosql_instance
from database.sql.repositories.postgres_user_repository import PostgresUserRepository
from database.sql.repositories.postgres_device_repository import PostgresDeviceRepository
from database.sql.repositories.postgres_mode_repository import PostgresModeRepository
from database.json.json_user_repository import JsonUserRepository
from database.json.json_device_repository import JsonDeviceRepository
from database.json.json_mode_repository import JsonModeRepository
from database.nosql.mongo_sensor_repository import MongoSensorRepository
from services.device_service import DeviceService
from services.mode_service import ModeService
from services.mqtt_service import MqttService
def _get_db_type() -> str:
    """Get configured database type from environment."""
    return os.getenv("DATABASE_TYPE", "postgres")

def get_current_user_id(request: Request) -> int:
    """Dependency to get the current authenticated user's ID from session."""
    user_id = request.session.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user_id

async def get_user_repo(conn = Depends(db_instance.get_connection)):
    """
    Dependency to inject user repository.
    
    Automatically selects between JSON or PostgreSQL implementation
    based on DATABASE_TYPE environment variable.
    """
    db_type = _get_db_type()
    
    if db_type == "json":
        return JsonUserRepository(conn)
    else:  # postgres (default)
        return PostgresUserRepository(conn)


async def get_device_repo(conn = Depends(db_instance.get_connection)):
    """
    Dependency to inject device repository.
    
    Automatically selects between JSON or PostgreSQL implementation
    based on DATABASE_TYPE environment variable.
    """
    db_type = _get_db_type()
    
    if db_type == "json":
        return JsonDeviceRepository(conn)
    else:  # postgres (default)
        return PostgresDeviceRepository(conn)


async def get_mode_repo(conn = Depends(db_instance.get_connection)):
    """
    Dependency to inject mode repository.
    
    Automatically selects between JSON or PostgreSQL implementation
    based on DATABASE_TYPE environment variable.
    """
    db_type = _get_db_type()
    
    if db_type == "json":
        return JsonModeRepository(conn)
    else:  # postgres (default)
        return PostgresModeRepository(conn)


async def get_sensor_repo(db = Depends(nosql_instance.get_db)):
    """Dependency to inject sensor repository (MongoDB)."""
    return MongoSensorRepository(db)


async def get_device_service(device_repo = Depends(get_device_repo)) -> DeviceService:
    mqtt_service = MqttService.get_instance()
    return DeviceService(device_repo, mqtt_service)

async def get_mode_service(
    mode_repo = Depends(get_mode_repo),
    device_repo = Depends(get_device_repo),
    device_service = Depends(get_device_service)
) -> ModeService:
    return ModeService(mode_repo, device_repo, device_service)
