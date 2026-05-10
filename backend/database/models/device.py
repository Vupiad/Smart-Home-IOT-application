from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class Device(BaseModel):
    id: Optional[int] = None
    owner_id: int
    name: str
    device_type: str # 'fan', 'light', 'door', 'sensor', etc.
    base_topic: str  # MQTT topic
    last_online: Optional[datetime] = None
    
    # Device state management
    state: Dict[str, Any] = {}      # Current device state with metadata
                                     # Can contain: room, subtitle, status, color, brightness,
                                     # speed, style, temperature, mode, and other device attributes
    is_online: bool = False          # Whether device is currently online
    last_seen: Optional[datetime] = None  # Last time device communicated
    