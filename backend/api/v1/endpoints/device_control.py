"""REST API endpoints for device control via MQTT."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from database.models.device import Device
from database.database_manager import IDatabaseManager
from services.device_service import DeviceService
from services.mqtt_service import MqttService
from database.repository import IDeviceRepository
from api.deps import get_device_repo
router = APIRouter(prefix="/api/v1/device-control", tags=["device-control"])


# Response Models
class ActionRequest(BaseModel):
    """Model for device action request."""
    command: Optional[Any] = Field(None, description="Optional action parameter")


class DeviceControlResponse(BaseModel):
    """Response from device control operation."""
    success: bool
    message: str
    device_id: int
    device_state: Dict[str, Any] = {}

# Helper functions
async def get_device_service(device_repo: IDeviceRepository) -> DeviceService:
    """Get device service instance."""
    mqtt_service = MqttService.get_instance()
    return DeviceService(device_repo, mqtt_service)

# Endpoints
@router.post("/{device_id}/action", response_model=DeviceControlResponse)
async def execute_device_action(
    device_id: int,
    request: ActionRequest,
    user_id: int = Query(...),
    device_repo: IDeviceRepository = Depends(get_device_repo),
) -> DeviceControlResponse:
    """
    Execute an action on a device.
    
    Publishes action to MQTT and updates device state.
    
    Args:
        device_id: Target device ID
        request: ActionRequest with action name and optional value
        user_id: User ID (query parameter)
        
    Returns:
        DeviceControlResponse with execution result
        
    Raises:
        HTTPException: If device not found or action invalid
    """
    try:
        # Get services
        device_service = await get_device_service(device_repo)     
        # Execute action
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            value=request.command
        )
        
        # Get updated device
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message=f"Action executed successfully" if success else "Failed to execute action",
            device_id=device_id,
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error hihi: {str(e)}")
