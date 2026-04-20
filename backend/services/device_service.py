"""Device control service for MQTT-based device management."""

from typing import Optional, Any, Dict
from datetime import datetime
import uuid
from database.models.device import Device
from database.repository import IDeviceRepository
from services.mqtt_service import MqttService


class DeviceService:
    """
    Business logic for device control operations.
    """
    
    def __init__(self, device_repo: IDeviceRepository, mqtt_service: MqttService):
        self._device_repo = device_repo
        self._mqtt_service = mqtt_service
        
    def build_mqtt_cmd(self, device_type: str, state: Dict[str, Any]) -> dict:
        """
        Convert UI state representation to Firmware command.
        """
        cmd_id = f"cmd_{uuid.uuid4().hex[:8]}"
        
        if device_type == "light":
            if "color" in state and state.get("status") == "on":
                return {
                    "commandId": cmd_id,
                    "target": "led",
                    "action": "set",
                    "r": state["color"].get("r", 255),
                    "g": state["color"].get("g", 255),
                    "b": state["color"].get("b", 255)
                }
            if state.get("status") == "on":
                return {"commandId": cmd_id, "target": "led", "action": "on"}
            else:
                return {"commandId": cmd_id, "target": "led", "action": "off"}

        elif device_type == "fan":
            if "speed" in state and state.get("status") == "on":
                return {
                    "commandId": cmd_id,
                    "target": "fan",
                    "action": "set",
                    "speed": state["speed"]
                }
            if state.get("status") == "on":
                return {"commandId": cmd_id, "target": "fan", "action": "on"}
            else:
                return {"commandId": cmd_id, "target": "fan", "action": "off"}

        elif device_type == "door":
            if state.get("status") == "unlocked":
                return {"commandId": cmd_id, "target": "door", "action": "open"}
            else:
                return {"commandId": cmd_id, "target": "door", "action": "close"}
                
        return {}
    
    async def control_device(
        self,
        user_id: int,
        device_id: int,
        state: Dict[str, Any]
    ) -> bool:
        """
        Control a device by mapping UI state to MQTT command.
        """
        # Retrieve device
        device = await self._device_repo.get_by_id(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")
        
        # Verify ownership
        if device.owner_id != user_id:
            raise ValueError(f"Device {device_id} not owned by user {user_id}")
        
        # Base topic needs /cmd appended according to spec
        device_topic = f"{device.base_topic}/cmd" if not device.base_topic.endswith("/cmd") else device.base_topic
        
        # Build MQTT command
        mqtt_cmd = self.build_mqtt_cmd(device.device_type, state)
        if not mqtt_cmd:
            raise ValueError(f"Unsupported device type or state format: {device.device_type}")
        
        # Execute the action (sending as JSON dict)
        success = await self._mqtt_service.publish_to_topic(device_topic, mqtt_cmd)
        
        return success
