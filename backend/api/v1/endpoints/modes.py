"""Mode (automation) management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.models.mode import Mode, ModeDevice
from api.deps import get_mode_repo, get_user_repo, get_mode_service
from database.repository import IModeRepository, IUserRepository
from services.mode_service import ModeService

router = APIRouter()


# Request/Response Models
class ModeCreateRequest(BaseModel):
    """Request to create a mode."""
    name: str
    startTime: str
    endTime: str
    devices: List[ModeDevice] = []
    isActive: bool = False


class ModeUpdateRequest(BaseModel):
    """Request to update a mode."""
    name: Optional[str] = None
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    devices: Optional[List[ModeDevice]] = None
    isActive: Optional[bool] = None


class ModeToggleRequest(BaseModel):
    """Request to toggle mode active state."""
    isActive: bool


class ModeResponse(BaseModel):
    """Mode response model."""
    id: int
    user_id: int
    name: str
    startTime: str
    endTime: str
    devices: List[ModeDevice]
    isActive: bool
    created_at: Optional[str] = None


@router.post("/", response_model=ModeResponse)
async def create_mode(
    request: ModeCreateRequest,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo),
    user_repo: IUserRepository = Depends(get_user_repo)
) -> ModeResponse:
    """
    Create a new automation mode.
    """
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    mode = Mode(
        user_id=user_id,
        name=request.name,
        startTime=request.startTime,
        endTime=request.endTime,
        devices=request.devices,
        isActive=request.isActive,
        created_at=datetime.now()
    )
    
    created_mode = await mode_repo.create(mode)
    
    return ModeResponse(
        id=created_mode.id,
        user_id=created_mode.user_id,
        name=created_mode.name,
        startTime=created_mode.startTime,
        endTime=created_mode.endTime,
        devices=created_mode.devices,
        isActive=created_mode.isActive,
        created_at=created_mode.created_at.isoformat() if created_mode.created_at else None
    )


@router.get("/", response_model=List[ModeResponse])
async def list_modes(
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> List[ModeResponse]:
    """
    List all automation modes created by the current user.
    """
    modes = await mode_repo.get_by_user(user_id)
    
    return [
        ModeResponse(
            id=m.id,
            user_id=m.user_id,
            name=m.name,
            startTime=m.startTime,
            endTime=m.endTime,
            devices=m.devices,
            isActive=m.isActive,
            created_at=m.created_at.isoformat() if m.created_at else None
        )
        for m in modes
    ]


@router.get("/{mode_id}", response_model=ModeResponse)
async def get_mode(
    mode_id: int,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> ModeResponse:
    """
    Get a specific automation mode by ID.
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this mode"
        )
    
    return ModeResponse(
        id=mode.id,
        user_id=mode.user_id,
        name=mode.name,
        startTime=mode.startTime,
        endTime=mode.endTime,
        devices=mode.devices,
        isActive=mode.isActive,
        created_at=mode.created_at.isoformat() if mode.created_at else None
    )


@router.put("/{mode_id}", response_model=ModeResponse)
async def update_mode(
    mode_id: int,
    request: ModeUpdateRequest,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> ModeResponse:
    """
    Update an automation mode.
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this mode"
        )
    
    if request.name is not None:
        mode.name = request.name
    if request.startTime is not None:
        mode.startTime = request.startTime
    if request.endTime is not None:
        mode.endTime = request.endTime
    if request.devices is not None:
        mode.devices = request.devices
    if request.isActive is not None:
        mode.isActive = request.isActive
    
    updated_mode = await mode_repo.update(mode)
    
    return ModeResponse(
        id=updated_mode.id,
        user_id=updated_mode.user_id,
        name=updated_mode.name,
        startTime=updated_mode.startTime,
        endTime=updated_mode.endTime,
        devices=updated_mode.devices,
        isActive=updated_mode.isActive,
        created_at=updated_mode.created_at.isoformat() if updated_mode.created_at else None
    )


@router.delete("/{mode_id}")
async def delete_mode(
    mode_id: int,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> dict:
    """
    Delete an automation mode.
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this mode"
        )
    
    deleted = await mode_repo.delete(mode_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete mode"
        )
    
    return {"message": "Mode deleted successfully", "mode_id": mode_id}


@router.patch("/{mode_id}/toggle")
async def toggle_mode(
    mode_id: int,
    request: ModeToggleRequest,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo),
    mode_service: ModeService = Depends(get_mode_service)
) -> dict:
    """
    Toggle mode active state and execute immediately if within timeframe.
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to control this mode"
        )
    
    mode.isActive = request.isActive
    updated_mode = await mode_repo.update(mode)
    
    if updated_mode.isActive:
        from datetime import datetime
        import asyncio
        now = datetime.now()
        try:
            start_time = datetime.strptime(updated_mode.startTime, "%H:%M").time()
            end_time = datetime.strptime(updated_mode.endTime, "%H:%M").time()
            curr_time = now.time()
            
            is_within = False
            if start_time <= end_time:
                is_within = start_time <= curr_time <= end_time
            else:
                is_within = start_time <= curr_time or curr_time <= end_time
                
            if is_within:
                # Run mode in background
                asyncio.create_task(mode_service.execute_mode(user_id, mode_id, parallel=True))
        except ValueError:
            pass
    
    return {
        "message": "Mode status updated and executed if within timeframe" if updated_mode.isActive else "Mode deactivated",
        "mode_id": updated_mode.id,
        "isActive": updated_mode.isActive
    }
