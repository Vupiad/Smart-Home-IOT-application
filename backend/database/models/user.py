from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class User(BaseModel):
    id: Optional[int] = None
    username: str
    email: EmailStr
    hashed_password: str
    created_at: Optional[datetime] = None