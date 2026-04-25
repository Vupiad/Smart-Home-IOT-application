"""Profile and password management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from api.deps import get_user_repo, get_current_user_id
from database.repository import IUserRepository
from api.security import hash_password, verify_password
from api.v1.endpoints.auth import UserResponse
from typing import Optional

router = APIRouter()

class UpdateProfileRequest(BaseModel):
    fullName: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.put("/", response_model=UserResponse)
async def update_profile(
    request: UpdateProfileRequest,
    user_id: int = Depends(get_current_user_id),
    user_repo: IUserRepository = Depends(get_user_repo)
) -> UserResponse:
    """Update user profile information."""
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.fullName = request.fullName
    user.phone = request.phone
    user.dateOfBirth = request.dateOfBirth
    
    updated_user = await user_repo.update(user)
    
    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        fullName=updated_user.fullName,
        phone=updated_user.phone,
        dateOfBirth=updated_user.dateOfBirth
    )

@router.put("/password")
async def change_password(
    request: ChangePasswordRequest,
    user_id: int = Depends(get_current_user_id),
    user_repo: IUserRepository = Depends(get_user_repo)
):
    """Change user password."""
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(request.currentPassword, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.hashed_password = hash_password(request.newPassword)
    await user_repo.update(user)
    
    return {"message": "Password changed successfully"}
