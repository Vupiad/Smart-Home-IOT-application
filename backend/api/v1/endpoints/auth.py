"""Authentication endpoints for login and user management."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from database.models.user import User
from api.deps import get_user_repo
from api.security import (
    hash_password,
    verify_password,
    create_access_token,
)
from database.repository import IUserRepository
from typing import Optional

router = APIRouter()

class UserResponse(BaseModel):
    """User response model based on FE requirements."""
    id: int
    email: str
    fullName: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None

class LoginRequest(BaseModel):
    """Login request."""
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    """Login response with token and user info."""
    token: str
    user: UserResponse

class RegisterRequest(BaseModel):
    """Registration request."""
    email: EmailStr
    password: str
    fullName: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Login with email and password.
    """
    user = await user_repo.get_by_email(request.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token({"sub": str(user.id), "email": user.email})
    
    return LoginResponse(
        token=token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            fullName=user.fullName,
            phone=user.phone,
            dateOfBirth=user.dateOfBirth
        )
    )


@router.post("/register", response_model=LoginResponse)
async def register(
    request: RegisterRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Register a new user account.
    """
    existing = await user_repo.get_by_email(request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        fullName=request.fullName,
        phone=request.phone,
        dateOfBirth=request.dateOfBirth
    )
    
    created_user = await user_repo.create(user)
    token = create_access_token({"sub": str(created_user.id), "email": created_user.email})
    
    return LoginResponse(
        token=token,
        user=UserResponse(
            id=created_user.id,
            email=created_user.email,
            fullName=created_user.fullName,
            phone=created_user.phone,
            dateOfBirth=created_user.dateOfBirth
        )
    )
