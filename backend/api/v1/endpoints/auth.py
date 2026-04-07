"""Authentication endpoints for login and user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from database.models.user import User
from api.deps import get_user_repo
from api.security import (
    hash_password,
    verify_password
)
from database.repository import IUserRepository
from typing import Optional

router = APIRouter()


# Request/Response Models
class LoginRequest(BaseModel):
    """Login request with username and password."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response with user information."""
    user: User


class RegisterRequest(BaseModel):
    """Registration request."""
    username: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response (without password hash)."""
    id: int
    username: str
    email: str
    created_at: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Login with username and password.
    
    Returns:
        - user: User information
    """
    print(f"[LOGIN] Attempting login for username: {request.username}")
    # Find user by username
    user = await user_repo.get_by_username(request.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    return LoginResponse(
        user=user
    )


@router.post("/register", response_model=LoginResponse)
async def register(
    request: RegisterRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Register a new user account.
    
    Note: In single-user mode, only one user (admin) should be created via default initialization.
    """
    print(f"[REGISTER] Attempting registration for username: {request.username}")
    # Check if user already exists
    existing = await user_repo.get_by_username(request.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    user = User(
        username=request.username,
        email=request.email,
        hashed_password=hash_password(request.password)
    )
    
    created_user = await user_repo.create(user)
    
    return LoginResponse(
        user=created_user
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    user_id: int = None,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> UserResponse:
    """
    Get user info by ID.
    
    Note: Requires user_id as query parameter.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing user_id parameter"
        )
    
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at.isoformat() if user.created_at else None
    )
