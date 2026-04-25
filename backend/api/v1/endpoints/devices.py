"""Device management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.models.device import Device
from api.deps import get_device_repo, get_user_repo, get_current_user_id
from database.repository import IDeviceRepository, IUserRepository

router = APIRouter()


# Request/Response Models
class DeviceCreateRequest(BaseModel):
    """Request to create a device."""
    name: str
    device_type: str  # 'fan', 'light', 'door', 'sensor', etc.
    base_topic: str   # MQTT topic
    state: Dict[str, Any] = {}


class DeviceUpdateRequest(BaseModel):
    """Request to update device."""
    name: Optional[str] = None
    device_type: Optional[str] = None
    base_topic: Optional[str] = None
    state: Optional[Dict[str, Any]] = None


class DeviceResponse(BaseModel):
    """Device response model."""
    id: int
    owner_id: int
    name: str
    device_type: str
    base_topic: str
    state: Dict[str, Any]
    last_online: Optional[str] = None



@router.post("/", response_model=DeviceResponse)
async def create_device(
    request: DeviceCreateRequest,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo),
    user_repo: IUserRepository = Depends(get_user_repo)
) -> DeviceResponse:
    """
    Create a new device.
    
    Query Parameters:
        - user_id: User ID
    """
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


@router.get("/", response_model=List[DeviceResponse])
async def list_devices(
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> List[DeviceResponse]:

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


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: int,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceResponse:
    """
    Get a specific device by ID.
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - device_id: Device ID
    """
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


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: int,
    request: DeviceUpdateRequest,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> DeviceResponse:
    """
    Update a device.
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - device_id: Device ID
    """
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


@router.delete("/{device_id}")
async def delete_device(
    device_id: int,
    user_id: int = Depends(get_current_user_id),
    device_repo: IDeviceRepository = Depends(get_device_repo)
) -> dict:
    """
    Delete a device.
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - device_id: Device ID
    """
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
