"""Device management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.models.device import Device
from api.deps import get_device_repo, get_user_repo, get_current_user_id
from database.repository import IDeviceRepository, IUserRepository
from services.timer_service import timer_service

router = APIRouter(tags=["Device Management"])


# Request/Response Models
class DeviceCreateRequest(BaseModel):
    """Request to create a device.
    
    State can contain:
    - room: str - Device room/location (optional)
    - subtitle: str - Device description (optional)
    - status: str - Device status (optional)
    - color: Dict - RGB color for lights (optional)
    - brightness: int - Light brightness 0-100 (optional)
    - speed: int - Fan speed (optional)
    - style: str - Light style: 'bulb', 'pendant', 'lamp' (optional)
    - Any other device-specific attributes
    """
    name: str
    device_type: str  # 'fan', 'light', 'door', 'sensor', etc.
    base_topic: str   # MQTT topic
    state: Dict[str, Any] = {}  # Device state/metadata (room, subtitle, status, etc.)


class DeviceUpdateRequest(BaseModel):
    """Request to update device."""
    name: Optional[str] = None
    device_type: Optional[str] = None
    base_topic: Optional[str] = None
    state: Optional[Dict[str, Any]] = None


class DeviceResponse(BaseModel):
    """Device response model.
    
    State contains:
    - room: str - Device room/location
    - subtitle: str - Device description
    - status: str - Device status (on/off/locked/unlocked)
    - color: Dict - RGB color for lights
    - brightness: int - Light brightness 0-100
    - speed: int - Fan speed
    - style: str - Light style: 'bulb', 'pendant', 'lamp'
    - Any other device-specific attributes
    """
    id: int
    owner_id: int
    name: str
    device_type: str
    base_topic: str
    state: Dict[str, Any]  # Device state/metadata
    last_online: Optional[str] = None


class DeviceTimerRequest(BaseModel):
    """Request to set or update a device timer.
    
    Purpose: Schedule automatic device shutoff at a specific time.
    Example: {"shutoffTime": "10:00"} turns off device at 10:00 AM
    """
    shutoffTime: Optional[str] = None  # Time in HH:MM format (e.g., "10:00", "22:30"), None to remove timer


class DeviceTimerResponse(BaseModel):
    """Response from timer operation."""
    success: bool
    message: str
    device_id: int
    shutoffTime: Optional[str] = None



@router.post(
    "/",
    response_model=DeviceResponse,
    summary="Create a device record",
    description=(
        "Create a new device in the database. Use this for device metadata "
        "such as name, type, MQTT topic, and initial state (room, subtitle, "
        "status, color, brightness, speed, etc.)."
    ),
)
async def create_device(
    request: DeviceCreateRequest,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo),
    user_repo: IUserRepository = Depends(get_user_repo)
) -> DeviceResponse:
    """Create a new device record."""
    # Verify user exists
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create device
    device = Device(
        owner_id=user_id,
        name=request.name,
        device_type=request.device_type,
        base_topic=request.base_topic,
        state=request.state,
        last_online=datetime.now()
    )
    
    created_device = await device_repo.create(device)
    
    return DeviceResponse(
        id=created_device.id,
        owner_id=created_device.owner_id,
        name=created_device.name,
        device_type=created_device.device_type,
        base_topic=created_device.base_topic,
        state=created_device.state,
        last_online=created_device.last_online.isoformat() if created_device.last_online else None
    )


@router.get(
    "/",
    response_model=List[DeviceResponse],
    summary="List devices for the current user",
    description="Return all devices owned by the current user (or the test user fallback).",
)
async def list_devices(
    #user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> List[DeviceResponse]:
    # Bypass auth for testing
    user_id = 1
    devices = await device_repo.get_by_user(user_id)
    
    return [
        DeviceResponse(
            id=d.id,
            owner_id=d.owner_id,
            name=d.name,
            device_type=d.device_type,
            base_topic=d.base_topic,
            state=d.state,
            last_online=d.last_online.isoformat() if d.last_online else None
        )
        for d in devices
    ]


@router.get(
    "/{device_id}",
    response_model=DeviceResponse,
    summary="Get device details",
    description="Get a single device by ID, including its saved state and metadata.",
)
async def get_device(
    device_id: int,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceResponse:
    """Get a specific device by ID."""
    device = await device_repo.get_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Verify ownership
    if device.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this device"
        )
    
    return DeviceResponse(
        id=device.id,
        owner_id=device.owner_id,
        name=device.name,
        device_type=device.device_type,
        base_topic=device.base_topic,
        state=device.state,
        last_online=device.last_online.isoformat() if device.last_online else None
    )


@router.put(
    "/{device_id}",
    response_model=DeviceResponse,
    summary="Update device metadata or saved state",
    description=(
        "Update editable device fields such as name, type, MQTT topic, and "
        "state values like room or subtitle. This does not send realtime MQTT "
        "commands; it only persists data in the database."
    ),
)
async def update_device(
    device_id: int,
    request: DeviceUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceResponse:
    """Update a device."""
    device = await device_repo.get_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Verify ownership
    if device.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this device"
        )
    
    # Update fields if provided
    if request.name is not None:
        device.name = request.name
    if request.device_type is not None:
        device.device_type = request.device_type
    if request.base_topic is not None:
        device.base_topic = request.base_topic
    if request.state is not None:
        device.state = request.state
    
    updated_device = await device_repo.update(device)
    
    return DeviceResponse(
        id=updated_device.id,
        owner_id=updated_device.owner_id,
        name=updated_device.name,
        device_type=updated_device.device_type,
        base_topic=updated_device.base_topic,
        state=updated_device.state,
        last_online=updated_device.last_online.isoformat() if updated_device.last_online else None
    )


@router.delete(
    "/{device_id}",
    summary="Delete a device",
    description="Delete a device record from the database for the current user.",
)
async def delete_device(
    device_id: int,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> dict:
    """Delete a device."""
    device = await device_repo.get_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    # Verify ownership
    if device.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this device"
        )
    
    deleted = await device_repo.delete(device_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete device"
        )
    
    return {"message": "Device deleted successfully", "device_id": device_id}


# ==================== TIMER ENDPOINTS ====================

@router.post(
    "/{device_id}/timer",
    response_model=DeviceTimerResponse,
    summary="Set or update a device auto-shutoff timer",
    description=(
        "Schedule a device to automatically turn off at a specific time. "
        "Example: Set timer to 10:00 AM means the device will turn off at 10:00 AM that day. "
        "Use None/null for shutoffTime to cancel the timer."
    ),
)
async def set_device_timer(
    device_id: int,
    request: DeviceTimerRequest,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceTimerResponse:
    """Set or cancel a device timer."""
    # Verify device exists and user owns it
    device = await device_repo.get_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    if device.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to set timer for this device"
        )
    
    # Validate time format if provided
    if request.shutoffTime is not None:
        try:
            datetime.strptime(request.shutoffTime, "%H:%M")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time format. Use HH:MM format (e.g., '10:00', '22:30')"
            )
    
    # Update device state with timer info
    device.state["shutoffTime"] = request.shutoffTime
    updated_device = await device_repo.update(device)
    
    # Register timer with timer service
    timer_service.set_device_timer(device_id, request.shutoffTime)
    
    return DeviceTimerResponse(
        success=True,
        message=f"Timer {'set' if request.shutoffTime else 'cancelled'} successfully",
        device_id=device_id,
        shutoffTime=request.shutoffTime
    )


@router.get(
    "/{device_id}/timer",
    response_model=DeviceTimerResponse,
    summary="Get device timer status",
    description="Retrieve the current auto-shutoff timer for a device (if any).",
)
async def get_device_timer(
    device_id: int,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceTimerResponse:
    """Get the timer for a device."""
    # Verify device exists and user owns it
    device = await device_repo.get_by_id(device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found"
        )
    
    if device.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this device"
        )
    
    shutoff_time = device.state.get("shutoffTime")
    
    return DeviceTimerResponse(
        success=True,
        message="Timer retrieved successfully",
        device_id=device_id,
        shutoffTime=shutoff_time
    )
