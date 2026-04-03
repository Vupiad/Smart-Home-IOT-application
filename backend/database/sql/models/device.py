from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class Device(BaseModel):
    id: Optional[int] = None
    owner_id: int
    name: str
    device_type: str # 'fan', 'light', 'door', etc.
    base_topic: str
    settings: Dict[str, Any] = {} # This maps to JSONB
    last_online: Optional[datetime] = None