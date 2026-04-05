"""Device action definitions and validation."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ActionType(str, Enum):
    """Standard action types for IoT devices."""
    
    # Power control
    TURN_ON = "turn_on"
    TURN_OFF = "turn_off"
    TOGGLE = "toggle"
    
    # Lighting
    SET_BRIGHTNESS = "set_brightness"  # value: 0-100
    SET_COLOR = "set_color"            # value: {r, g, b} or hex color
    SET_COLOR_TEMP = "set_color_temp"  # value: kelvin
    
    # Climate
    SET_TEMPERATURE = "set_temperature"  # value: celsius
    SET_SPEED = "set_speed"             # value: 0-100 (fan speed)
    SET_MODE = "set_mode"               # value: "heat", "cool", "auto", etc.
    
    # Door/Lock
    LOCK = "lock"
    UNLOCK = "unlock"
    
    # Generic
    SET_STATE = "set_state"  # value: any JSON-serializable object
    GET_STATE = "get_state"
    

class DeviceType(str, Enum):
    """Supported device types in smart home system."""
    
    LIGHT = "light"
    FAN = "fan"
    AC = "ac"
    DOOR_LOCK = "door_lock"
    DOOR_SENSOR = "door_sensor"
    MOTION_SENSOR = "motion_sensor"
    TEMPERATURE_SENSOR = "temperature_sensor"
    PLUG = "plug"
    SWITCH = "switch"
    CAMERA = "camera"
    BLINDS = "blinds"
    OTHER = "other"


# Device type to supported actions mapping
DEVICE_ACTION_MAP: Dict[DeviceType, List[ActionType]] = {
    DeviceType.LIGHT: [
        ActionType.TURN_ON,
        ActionType.TURN_OFF,
        ActionType.TOGGLE,
        ActionType.SET_BRIGHTNESS,
        ActionType.SET_COLOR,
        ActionType.SET_COLOR_TEMP,
    ],
    DeviceType.FAN: [
        ActionType.TURN_ON,
        ActionType.TURN_OFF,
        ActionType.TOGGLE,
        ActionType.SET_SPEED,
    ],
    DeviceType.AC: [
        ActionType.TURN_ON,
        ActionType.TURN_OFF,
        ActionType.TOGGLE,
        ActionType.SET_TEMPERATURE,
        ActionType.SET_MODE,
        ActionType.SET_SPEED,
    ],
    DeviceType.DOOR_LOCK: [
        ActionType.LOCK,
        ActionType.UNLOCK,
        ActionType.TOGGLE,
    ],
    DeviceType.DOOR_SENSOR: [
        ActionType.GET_STATE,
    ],
    DeviceType.MOTION_SENSOR: [
        ActionType.GET_STATE,
    ],
    DeviceType.TEMPERATURE_SENSOR: [
        ActionType.GET_STATE,
    ],
    DeviceType.PLUG: [
        ActionType.TURN_ON,
        ActionType.TURN_OFF,
        ActionType.TOGGLE,
    ],
    DeviceType.SWITCH: [
        ActionType.TURN_ON,
        ActionType.TURN_OFF,
        ActionType.TOGGLE,
    ],
    DeviceType.CAMERA: [
        ActionType.TOGGLE,  # Start/stop recording
    ],
    DeviceType.BLINDS: [
        ActionType.SET_STATE,  # position: 0-100
    ],
    DeviceType.OTHER: [
        ActionType.SET_STATE,
        ActionType.GET_STATE,
    ],
}


class DeviceAction(BaseModel):
    """Represents a single device action."""
    
    action: ActionType = Field(..., description="Action to execute")
    value: Optional[Any] = Field(None, description="Action parameter (optional)")
    metadata: Optional[Dict[str, Any]] = Field(
        None, description="Additional metadata"
    )
    
    class Config:
        use_enum_values = False


class ActionValidator:
    """Validates device actions against device type capabilities."""
    
    @staticmethod
    def is_action_supported(device_type: str, action: str) -> bool:
        """
        Check if an action is supported by a device type.
        
        Args:
            device_type: Device type (e.g., "light", "fan")
            action: Action name (e.g., "turn_on")
            
        Returns:
            True if action is supported, False otherwise
        """
        try:
            dev_type = DeviceType(device_type)
            action_type = ActionType(action)
            return action_type in DEVICE_ACTION_MAP.get(dev_type, [])
        except ValueError:
            return False
    
    @staticmethod
    def get_supported_actions(device_type: str) -> List[str]:
        """
        Get list of supported actions for a device type.
        
        Args:
            device_type: Device type
            
        Returns:
            List of supported action names
        """
        try:
            dev_type = DeviceType(device_type)
            return [a.value for a in DEVICE_ACTION_MAP.get(dev_type, [])]
        except ValueError:
            return []
    
    @staticmethod
    def validate_value(action: str, value: Any) -> tuple[bool, Optional[str]]:
        """
        Validate action value is appropriate for the action type.
        
        Args:
            action: Action name
            value: Value to validate
            
        Returns:
            (is_valid, error_message)
        """
        try:
            action_type = ActionType(action)
        except ValueError:
            return False, f"Unknown action: {action}"
        
        # Brightness must be 0-100
        if action_type == ActionType.SET_BRIGHTNESS:
            if not isinstance(value, (int, float)):
                return False, "Brightness must be a number"
            if not (0 <= value <= 100):
                return False, "Brightness must be between 0 and 100"
        
        # Speed must be 0-100
        elif action_type == ActionType.SET_SPEED:
            if not isinstance(value, (int, float)):
                return False, "Speed must be a number"
            if not (0 <= value <= 100):
                return False, "Speed must be between 0 and 100"
        
        # Color can be RGB dict or hex string
        elif action_type == ActionType.SET_COLOR:
            if isinstance(value, dict):
                required_keys = {"r", "g", "b"}
                if not required_keys.issubset(value.keys()):
                    return False, "Color dict must have r, g, b keys"
                for key in ["r", "g", "b"]:
                    if not isinstance(value[key], int) or not (0 <= value[key] <= 255):
                        return False, f"Color value {key} must be 0-255"
            elif isinstance(value, str):
                if not (value.startswith("#") and len(value) == 7):
                    return False, "Hex color must be format #RRGGBB"
            else:
                return False, "Color must be dict {r,g,b} or hex string"
        
        # Temperature should be numeric
        elif action_type == ActionType.SET_TEMPERATURE:
            if not isinstance(value, (int, float)):
                return False, "Temperature must be a number"
            if not (-50 <= value <= 50):
                return False, "Temperature should be between -50 and 50°C"
        
        # Color temperature should be numeric (kelvin)
        elif action_type == ActionType.SET_COLOR_TEMP:
            if not isinstance(value, (int, float)):
                return False, "Color temperature must be a number"
            if not (2700 <= value <= 6500):
                return False, "Color temperature should be between 2700-6500K"
        
        # Mode should be a string
        elif action_type == ActionType.SET_MODE:
            if not isinstance(value, str):
                return False, "Mode must be a string"
        
        return True, None
