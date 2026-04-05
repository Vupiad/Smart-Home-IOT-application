"""REST API endpoints for device control via MQTT."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from api.security import verify_token
from models.device import Device
from backend.database.database_manager import DatabaseManager
from services.device_service import DeviceService
from services.mqtt_service import MqttService

router = APIRouter(prefix="/api/v1/device-control", tags=["device-control"])


# Response Models
class ActionRequest(BaseModel):
    """Model for device action request."""
    action: str = Field(..., description="Action name (e.g., 'turn_on', 'set_brightness')")
    value: Optional[Any] = Field(None, description="Optional action parameter")


class DeviceControlResponse(BaseModel):
    """Response from device control operation."""
    success: bool
    message: str
    device_id: int
    action: str
    value: Optional[Any] = None
    device_state: Dict[str, Any] = {}


class DeviceStatusResponse(BaseModel):
    """Device status response."""
    device_id: int
    is_online: bool
    last_seen: Optional[str] = None
    state: Dict[str, Any]
    supported_actions: list


class SupportedActionsResponse(BaseModel):
    """List of supported actions for device."""
    device_id: int
    device_type: str
    supported_actions: list


# Helper functions
async def get_device_service() -> DeviceService:
    """Get device service instance."""
    device_repo = DatabaseManager.get_instance().get_device_repository()
    mqtt_service = MqttService.get_instance()
    return DeviceService(device_repo, mqtt_service)


async def get_device_repo():
    """Get device repository."""
    return DatabaseManager.get_instance().get_device_repository()


# Endpoints
@router.post("/{device_id}/action", response_model=DeviceControlResponse)
async def execute_device_action(
    device_id: int,
    request: ActionRequest,
    token: str = Query(...)
) -> DeviceControlResponse:
    """
    Execute an action on a device.
    
    Publishes action to MQTT and updates device state.
    
    Args:
        device_id: Target device ID
        request: ActionRequest with action name and optional value
        token: JWT authentication token (query parameter)
        
    Returns:
        DeviceControlResponse with execution result
        
    Raises:
        HTTPException: If device not found, unauthorized, or action invalid
    """
    try:
        # Verify token and get user
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get services
        device_service = await get_device_service()
        device_repo = await get_device_repo()
        
        # Execute action
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            action=request.action,
            value=request.value
        )
        
        # Get updated device
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message=f"Action '{request.action}' executed successfully" if success else "Failed to execute action",
            device_id=device_id,
            action=request.action,
            value=request.value,
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/{device_id}/turn-on", response_model=DeviceControlResponse)
async def turn_on_device(
    device_id: int,
    token: str = Query(...)
) -> DeviceControlResponse:
    """
    Turn on a device.
    
    Args:
        device_id: Target device ID
        token: JWT authentication token
        
    Returns:
        DeviceControlResponse with execution result
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_service = await get_device_service()
        device_repo = await get_device_repo()
        
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            action="turn_on"
        )
        
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message="Device turned on" if success else "Failed to turn on device",
            device_id=device_id,
            action="turn_on",
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/{device_id}/turn-off", response_model=DeviceControlResponse)
async def turn_off_device(
    device_id: int,
    token: str = Query(...)
) -> DeviceControlResponse:
    """
    Turn off a device.
    
    Args:
        device_id: Target device ID
        token: JWT authentication token
        
    Returns:
        DeviceControlResponse with execution result
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_service = await get_device_service()
        device_repo = await get_device_repo()
        
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            action="turn_off"
        )
        
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message="Device turned off" if success else "Failed to turn off device",
            device_id=device_id,
            action="turn_off",
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/{device_id}/set-brightness", response_model=DeviceControlResponse)
async def set_brightness(
    device_id: int,
    brightness: int = Query(..., ge=0, le=100, description="Brightness level 0-100"),
    token: str = Query(...)
) -> DeviceControlResponse:
    """
    Set device brightness.
    
    Args:
        device_id: Target device ID
        brightness: Brightness level (0-100)
        token: JWT authentication token
        
    Returns:
        DeviceControlResponse with execution result
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_service = await get_device_service()
        device_repo = await get_device_repo()
        
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            action="set_brightness",
            value=brightness
        )
        
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message=f"Brightness set to {brightness}%" if success else "Failed to set brightness",
            device_id=device_id,
            action="set_brightness",
            value=brightness,
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.post("/{device_id}/set-color", response_model=DeviceControlResponse)
async def set_color(
    device_id: int,
    color: str = Query(..., description="Color as hex (e.g., FF0000) or name"),
    token: str = Query(...)
) -> DeviceControlResponse:
    """
    Set device color.
    
    Args:
        device_id: Target device ID
        color: Color as hex code (FF0000) or name (red, blue, etc.)
        token: JWT authentication token
        
    Returns:
        DeviceControlResponse with execution result
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_service = await get_device_service()
        device_repo = await get_device_repo()
        
        success = await device_service.control_device(
            user_id=user_id,
            device_id=device_id,
            action="set_color",
            value=color
        )
        
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return DeviceControlResponse(
            success=success,
            message=f"Color set to {color}" if success else "Failed to set color",
            device_id=device_id,
            action="set_color",
            value=color,
            device_state=device.state
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/{device_id}/status", response_model=DeviceStatusResponse)
async def get_device_status(
    device_id: int,
    token: str = Query(...)
) -> DeviceStatusResponse:
    """
    Get device status.
    
    Retrieve current state, connectivity, and supported actions.
    
    Args:
        device_id: Target device ID
        token: JWT authentication token
        
    Returns:
        DeviceStatusResponse with current status
        
    Raises:
        HTTPException: If device not found or unauthorized
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_repo = await get_device_repo()
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Verify ownership
        if device.owner_id != user_id:
            raise HTTPException(status_code=403, detail="You don't have access to this device")
        
        # Get supported actions
        device_service = await get_device_service()
        supported_actions = await device_service.get_supported_actions(device_id)
        
        return DeviceStatusResponse(
            device_id=device_id,
            is_online=device.is_online,
            last_seen=device.last_seen.isoformat() if device.last_seen else None,
            state=device.state,
            supported_actions=supported_actions
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


@router.get("/{device_id}/supported-actions", response_model=SupportedActionsResponse)
async def get_supported_actions(
    device_id: int,
    token: str = Query(...)
) -> SupportedActionsResponse:
    """
    Get list of actions supported by device.
    
    Args:
        device_id: Target device ID
        token: JWT authentication token
        
    Returns:
        SupportedActionsResponse with list of supported actions
        
    Raises:
        HTTPException: If device not found or unauthorized
    """
    try:
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        device_repo = await get_device_repo()
        device = await device_repo.get_by_id(device_id)
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        # Verify ownership
        if device.owner_id != user_id:
            raise HTTPException(status_code=403, detail="You don't have access to this device")
        
        device_service = await get_device_service()
        actions = await device_service.get_supported_actions(device_id)
        
        return SupportedActionsResponse(
            device_id=device_id,
            device_type=device.device_type,
            supported_actions=actions
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
