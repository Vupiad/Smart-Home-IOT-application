"""Device control service for MQTT-based device management."""

from typing import Any, Dict, Optional
import uuid

from database.repository import IDeviceRepository
from services.mqtt_service import MqttService


class DeviceService:
    """
    Business logic for device control operations.
    """

    def __init__(self, device_repo: IDeviceRepository, mqtt_service: MqttService):
        self._device_repo = device_repo
        self._mqtt_service = mqtt_service

    @staticmethod
    def _normalize_speed(value: Any) -> int:
        """Normalize speed input from UI (level or percent) to firmware percent."""
        try:
            speed = int(float(value))
        except (TypeError, ValueError):
            return 0

        if speed <= 3:
            level_map = {0: 0, 1: 30, 2: 60, 3: 100}
            return level_map.get(speed, 0)

        return max(0, min(100, speed))

    def build_mqtt_cmd(
        self,
        device_type: str,
        effective_state: Dict[str, Any],
        requested_state: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """
        Convert UI state representation to firmware command.

        Returns:
            - dict command: publish to MQTT
            - {}: no MQTT command required for this state patch
            - None: unsupported device type
        """
        cmd_id = f"cmd_{uuid.uuid4().hex[:8]}"
        requested_keys = set(requested_state.keys())

        if device_type == "light":
            if "color" in requested_keys and effective_state.get("status") == "on":
                color = effective_state.get("color", {})
                if not isinstance(color, dict):
                    color = {}
                return {
                    "commandId": cmd_id,
                    "target": "led",
                    "action": "set",
                    "r": color.get("r", 255),
                    "g": color.get("g", 255),
                    "b": color.get("b", 255),
                }
            if "status" in requested_keys:
                if effective_state.get("status") == "on":
                    return {"commandId": cmd_id, "target": "led", "action": "on"}
                return {"commandId": cmd_id, "target": "led", "action": "off"}
            return {}

        if device_type == "fan":
            if "speed" in requested_keys:
                return {
                    "commandId": cmd_id,
                    "target": "fan",
                    "action": "set",
                    "speed": self._normalize_speed(effective_state.get("speed", 0)),
                }
            if "status" in requested_keys:
                if effective_state.get("status") == "on":
                    return {"commandId": cmd_id, "target": "fan", "action": "on"}
                return {"commandId": cmd_id, "target": "fan", "action": "off"}
            return {}

        if device_type == "door":
            if "status" not in requested_keys:
                return {}
            if effective_state.get("status") == "unlocked":
                return {"commandId": cmd_id, "target": "door", "action": "open"}
            return {"commandId": cmd_id, "target": "door", "action": "close"}

        if device_type == "ac":
            # Current firmware simulator supports fan commands only.
            if "fanSpeed" in requested_keys:
                return {
                    "commandId": cmd_id,
                    "target": "fan",
                    "action": "set",
                    "speed": self._normalize_speed(effective_state.get("fanSpeed", 0)),
                }
            if "status" in requested_keys:
                if effective_state.get("status") == "on":
                    return {"commandId": cmd_id, "target": "fan", "action": "on"}
                return {"commandId": cmd_id, "target": "fan", "action": "off"}
            # mode/temp are persisted for UI but not sent to firmware in current setup.
            return {}

        return None

    async def control_device(
        self,
        user_id: int,
        device_id: int,
        state: Dict[str, Any],
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

        current_state = dict(device.state or {})
        merged_state = {**current_state, **state}

        # Base topic needs /cmd appended according to spec
        device_topic = (
            f"{device.base_topic}/cmd"
            if not device.base_topic.endswith("/cmd")
            else device.base_topic
        )

        # Build MQTT command from merged state and requested patch
        mqtt_cmd = self.build_mqtt_cmd(device.device_type, merged_state, state)
        if mqtt_cmd is None:
            raise ValueError(f"Unsupported device type or state format: {device.device_type}")

        success = True
        if mqtt_cmd:
            # Execute the action (sending as JSON dict)
            success = await self._mqtt_service.publish_to_topic(device_topic, mqtt_cmd)

        if success:
            device.state = merged_state
            await self._device_repo.update(device)

        return success
