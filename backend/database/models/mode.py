from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from enum import Enum

class DeviceTypeEnum(str, Enum):
    fan = "fan"
    ac = "ac"
    light = "light"
    door = "door"
    door_lock = "door lock"

class ModeDevice(BaseModel):
    id: int
    state: Dict[str, Any]

class Mode(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    isActive: bool = False
    startTime: str
    endTime: str
    devices: List[ModeDevice] = []
    created_at: Optional[datetime] = None