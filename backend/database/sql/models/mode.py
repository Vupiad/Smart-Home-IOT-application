from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class Mode(BaseModel):
    id: Optional[int] = None
    user_id: int
    name: str
    # actions: [{"device_id": 1, "action": "on", "value": true}]
    actions: List[Dict[str, Any]] = [] 
    is_active: bool = False
    created_at: Optional[datetime] = None