"""Mode (automation) management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from database.models.mode import Mode
from api.deps import get_mode_repo, get_user_repo
from database.repository import IModeRepository, IUserRepository

router = APIRouter()


# Request/Response Models
class ModeCreateRequest(BaseModel):
    """Request to create a mode."""
    name: str
    actions: List[Dict[str, Any]] = []  # [{"device_id": 1, "action": "on", "value": true}]
    is_active: bool = False


class ModeUpdateRequest(BaseModel):
    """Request to update a mode."""
    name: Optional[str] = None
    actions: Optional[List[Dict[str, Any]]] = None
    is_active: Optional[bool] = None


class ModeResponse(BaseModel):
    """Mode response model."""
    id: int
    user_id: int
    name: str
    actions: List[Dict[str, Any]]
    is_active: bool
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
    
    Query Parameters:
        - user_id: User ID
    
    Body:
        - name: Mode name
        - actions: List of actions to perform
        - is_active: Whether the mode is currently active
    
    Example action:
        {"device_id": 1, "action": "toggle", "value": true}
    """
    # Verify user exists
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create mode
    mode = Mode(
        user_id=user_id,
        name=request.name,
        actions=request.actions,
        is_active=request.is_active,
        created_at=datetime.now()
    )
    
    created_mode = await mode_repo.create(mode)
    
    return ModeResponse(
        id=created_mode.id,
        user_id=created_mode.user_id,
        name=created_mode.name,
        actions=created_mode.actions,
        is_active=created_mode.is_active,
        created_at=created_mode.created_at.isoformat() if created_mode.created_at else None
    )


@router.get("/", response_model=List[ModeResponse])
async def list_modes(
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> List[ModeResponse]:
    """
    List all automation modes created by the current user.
    
    Query Parameters:
        - user_id: User ID
    """
    modes = await mode_repo.get_by_user(user_id)
    
    return [
        ModeResponse(
            id=m.id,
            user_id=m.user_id,
            name=m.name,
            actions=m.actions,
            is_active=m.is_active,
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
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - mode_id: Mode ID
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    # Verify ownership
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this mode"
        )
    
    return ModeResponse(
        id=mode.id,
        user_id=mode.user_id,
        name=mode.name,
        actions=mode.actions,
        is_active=mode.is_active,
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
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - mode_id: Mode ID
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    # Verify ownership
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this mode"
        )
    
    # Update fields if provided
    if request.name is not None:
        mode.name = request.name
    if request.actions is not None:
        mode.actions = request.actions
    if request.is_active is not None:
        mode.is_active = request.is_active
    
    updated_mode = await mode_repo.update(mode)
    
    return ModeResponse(
        id=updated_mode.id,
        user_id=updated_mode.user_id,
        name=updated_mode.name,
        actions=updated_mode.actions,
        is_active=updated_mode.is_active,
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
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - mode_id: Mode ID
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    # Verify ownership
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


@router.post("/{mode_id}/activate")
async def activate_mode(
    mode_id: int,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> dict:
    """
    Activate an automation mode.
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - mode_id: Mode ID
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    # Verify ownership
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to control this mode"
        )
    
    mode.is_active = True
    updated_mode = await mode_repo.update(mode)
    
    return {
        "message": "Mode activated",
        "mode_id": updated_mode.id,
        "is_active": updated_mode.is_active
    }


@router.post("/{mode_id}/deactivate")
async def deactivate_mode(
    mode_id: int,
    user_id: int = Query(...),
    mode_repo: IModeRepository = Depends(get_mode_repo)
) -> dict:
    """
    Deactivate an automation mode.
    
    Query Parameters:
        - user_id: User ID
    
    Path Parameters:
        - mode_id: Mode ID
    """
    mode = await mode_repo.get_by_id(mode_id)
    if not mode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mode not found"
        )
    
    # Verify ownership
    if mode.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to control this mode"
        )
    
    mode.is_active = False
    updated_mode = await mode_repo.update(mode)
    
    return {
        "message": "Mode deactivated",
        "mode_id": updated_mode.id,
        "is_active": updated_mode.is_active
    }
