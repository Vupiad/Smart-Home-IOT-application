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
        
    def _mqtt_device_kind(self, device_type: str) -> str:
        """Map DB device_type → logic kind (pendant/lamp/bulb dùng chung như light)."""
        t = (device_type or "").lower()
        if t in ("lamp", "pendant", "light_bulb", "bulb"):
            return "light"
        if t in ("air_conditioner", "air-conditioner"):
            return "ac"
        return t

    def build_mqtt_cmd(self, device_type: str, state: Dict[str, Any]) -> dict:
        """
        Convert UI state representation to Firmware command.
        """
        cmd_id = f"cmd_{uuid.uuid4().hex[:8]}"
        kind = self._mqtt_device_kind(device_type)
        status = str(state.get("status", "")).lower()

        if kind == "light":
            if "color" in state and status == "on":
                return {
                    "commandId": cmd_id,
                    "target": "led",
                    "action": "set",
                    "r": state["color"].get("r", 255),
                    "g": state["color"].get("g", 255),
                    "b": state["color"].get("b", 255)
                }
            if status == "on":
                return {"commandId": cmd_id, "target": "led", "action": "on"}
            else:
                return {"commandId": cmd_id, "target": "led", "action": "off"}

        elif kind == "fan":
            if "speed" in state and status == "on":
                return {
                    "commandId": cmd_id,
                    "target": "fan",
                    "action": "set",
                    "speed": state["speed"]
                }
            if status == "on":
                return {"commandId": cmd_id, "target": "fan", "action": "on"}
            else:
                return {"commandId": cmd_id, "target": "fan", "action": "off"}

        elif kind == "door":
            if status == "unlocked":
                return {"commandId": cmd_id, "target": "door", "action": "open"}
            else:
                return {"commandId": cmd_id, "target": "door", "action": "close"}

        elif kind == "ac":
            if status == "off":
                return {"commandId": cmd_id, "target": "ac", "action": "off"}

            mqtt_cmd = {"commandId": cmd_id, "target": "ac"}
            has_set_fields = False

            if "temperature" in state:
                try:
                    temp = int(state["temperature"])
                except (TypeError, ValueError):
                    temp = 24
                mqtt_cmd["temperature"] = max(16, min(30, temp))
                has_set_fields = True

            if "mode" in state:
                mqtt_cmd["mode"] = str(state["mode"]).lower()
                has_set_fields = True

            if "fanSpeed" in state:
                try:
                    fan_speed = int(state["fanSpeed"])
                except (TypeError, ValueError):
                    fan_speed = 1
                fan_speed = max(1, min(3, fan_speed))
                mqtt_cmd["fanSpeed"] = fan_speed
                # Keep a compatibility alias in case firmware expects `speed`
                mqtt_cmd["speed"] = fan_speed
                has_set_fields = True

            if has_set_fields:
                mqtt_cmd["action"] = "set"
                return mqtt_cmd

            if status == "on":
                return {"commandId": cmd_id, "target": "ac", "action": "on"}

            return {}
                
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
            raise ValueError(
                f"Unsupported device type or state format: {device.device_type} "
                f"(kind={self._mqtt_device_kind(device.device_type)})"
            )
        
        # Execute the action (sending as JSON dict)
        success = await self._mqtt_service.publish_to_topic(device_topic, mqtt_cmd)

        # Persist merged state so FE and BE stay in sync even without a second PUT /devices call.
        if success:
            current_state = device.state or {}
            device.state = {**current_state, **state}
            device.last_online = datetime.now()
            await self._device_repo.update(device)
        
        return success
