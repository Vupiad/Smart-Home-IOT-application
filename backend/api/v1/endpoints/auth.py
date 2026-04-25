"""Authentication endpoints for login and user management."""

from fastapi import APIRouter, Depends, HTTPException, status, Request
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
    """Login response with user info."""
    user: UserResponse
    message: str = "Login successful"

class RegisterRequest(BaseModel):
    """Registration request."""
    email: EmailStr
    password: str
    fullName: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None

@router.post("/login", response_model=LoginResponse)
async def login(
    request: Request,
    login_req: LoginRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Login with email and password.
    """
    user = await user_repo.get_by_email(login_req.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not verify_password(login_req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Set session variable
    request.session["user_id"] = user.id
    
    return LoginResponse(
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
    request: Request,
    register_req: RegisterRequest,
    user_repo: IUserRepository = Depends(get_user_repo)
) -> LoginResponse:
    """
    Register a new user account.
    """
    existing = await user_repo.get_by_email(register_req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        email=register_req.email,
        hashed_password=hash_password(register_req.password),
        fullName=register_req.fullName,
        phone=register_req.phone,
        dateOfBirth=register_req.dateOfBirth
    )
    
    created_user = await user_repo.create(user)
    
    # Set session variable automatically upon register
    request.session["user_id"] = created_user.id
    return LoginResponse(
        user=UserResponse(
            id=created_user.id,
            email=created_user.email,
            fullName=created_user.fullName,
            phone=created_user.phone,
            dateOfBirth=created_user.dateOfBirth
        )
    )

@router.post("/logout")
async def logout(request: Request):
    """
    Logout the current user.
    """
    request.session.clear()
    return {"message": "Logout successful"}
