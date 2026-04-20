from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class User(BaseModel):
    id: Optional[int] = None
    email: EmailStr
    hashed_password: str
    fullName: str
    phone: Optional[str] = None
    dateOfBirth: Optional[str] = None
    created_at: Optional[datetime] = None