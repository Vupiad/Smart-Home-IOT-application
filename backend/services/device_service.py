"""Device control service for MQTT-based device management."""

from typing import Optional, Any
from datetime import datetime
from models.device import Device
from models.device_actions import ActionValidator, ActionType, DeviceType
from backend.database.sql.repositories.repository import IDeviceRepository
from services.mqtt_service import MqttService
from config.mqtt_topics import TopicBuilder


class DeviceService:
    """
    Business logic for device control operations.
    
    Handles:
    - Device action validation
    - MQTT command publishing
    - Device state management
    - Device connectivity tracking
    """
    
    def __init__(self, device_repo: IDeviceRepository, mqtt_service: MqttService):
        """
        Initialize device service.
        
        Args:
            device_repo: Device repository for persistence
            mqtt_service: MQTT service for publishing commands
        """
        self._device_repo = device_repo
        self._mqtt_service = mqtt_service
        self._action_validator = ActionValidator()
    
    async def control_device(
        self,
        user_id: int,
        device_id: int,
        action: str,
        value: Optional[Any] = None
    ) -> bool:
        """
        Control a device by publishing MQTT command.
        
        Validates:
        - Device exists and is owned by user
        - Action is supported by device type
        - Value is within valid ranges
        
        Args:
            user_id: Owner's user ID
            device_id: Target device ID
            action: Action name (e.g., 'turn_on', 'set_brightness')
            value: Optional action parameter (brightness, temperature, etc.)
            
        Returns:
            True if command published successfully, False otherwise
            
        Raises:
            ValueError: If device not found, not owned by user, or action invalid
        """
        # Retrieve device
        device = await self._device_repo.get_by_id(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")
        
        # Verify ownership
        if device.owner_id != user_id:
            raise ValueError(f"Device {device_id} not owned by user {user_id}")
        
        # Validate action
        device_type = DeviceType(device.device_type)
        if not self._action_validator.is_action_supported(device_type, action):
            raise ValueError(f"Action '{action}' not supported by {device_type.value}")
        
        # Validate value if provided
        if value is not None:
            is_valid, error_msg = self._action_validator.validate_value(action, value)
            if not is_valid:
                raise ValueError(f"Invalid value for '{action}': {error_msg}")
        
        # Execute the action
        success = await self.execute_action(device, action, value)
        
        if success:
            # Update device state
            await self.update_device_state(device_id, action, value)
            device.is_online = True
            device.last_seen = datetime.now()
            await self._device_repo.update(device)
        
        return success
    
    async def execute_action(
        self,
        device: Device,
        action_name: str,
        action_value: Optional[Any] = None
    ) -> bool:
        """
        Execute action on device via MQTT.
        
        Publishes action command to device's topic.
        
        Args:
            device: Target Device instance
            action_name: Action type (e.g., 'turn_on')
            action_value: Optional action parameter
            
        Returns:
            True if published successfully, False otherwise
        """
        # Publish command to device
        success = self._mqtt_service.publish_command(
            device_id=device.id,
            user_id=device.owner_id,
            action=action_name,
            value=action_value,
            qos=1  # At least once delivery
        )
        
        return success
    
    async def update_device_state(
        self,
        device_id: int,
        action: str,
        value: Optional[Any] = None
    ) -> None:
        """
        Update device state based on executed action.
        
        Applies optimistic state changes locally. Actual state
        confirmation comes from device status messages.
        
        Args:
            device_id: Target device ID
            action: Action executed (determines state change)
            value: Action parameter (e.g., brightness value)
        """
        device = await self._device_repo.get_by_id(device_id)
        if not device:
            return
        
        # Initialize state if empty
        if not device.state:
            device.state = {}
        
        # Update state based on action
        if action == ActionType.TURN_ON.value:
            device.state["power"] = True
        elif action == ActionType.TURN_OFF.value:
            device.state["power"] = False
        elif action == ActionType.TOGGLE.value:
            device.state["power"] = not device.state.get("power", False)
        elif action == ActionType.SET_BRIGHTNESS.value:
            if value is not None:
                device.state["brightness"] = int(value)
        elif action == ActionType.SET_COLOR.value:
            if value is not None:
                device.state["color"] = value
        elif action == ActionType.SET_TEMPERATURE.value:
            if value is not None:
                device.state["temperature"] = float(value)
        elif action == ActionType.SET_COLOR_TEMPERATURE.value:
            if value is not None:
                device.state["color_temperature"] = int(value)
        elif action == ActionType.LOCK.value:
            device.state["locked"] = True
        elif action == ActionType.UNLOCK.value:
            device.state["locked"] = False
        elif action == ActionType.OPEN.value:
            device.state["open"] = True
        elif action == ActionType.CLOSE.value:
            device.state["open"] = False
        elif action == ActionType.SET_SPEED.value:
            if value is not None:
                device.state["speed"] = int(value)
        elif action == ActionType.SET_POSITION.value:
            if value is not None:
                device.state["position"] = int(value)
        elif action == ActionType.SET_MODE.value:
            if value is not None:
                device.state["mode"] = value
        
        # Persist state
        await self._device_repo.update(device)
    
    async def get_device_topic(self, device_id: int, user_id: int) -> str:
        """
        Get MQTT command topic for device.
        
        Args:
            device_id: Target device ID
            user_id: Owner's user ID
            
        Returns:
            MQTT topic path for device commands
        """
        return TopicBuilder.device_command(user_id, device_id)
    
    async def get_device_status_topic(self, device_id: int, user_id: int) -> str:
        """
        Get MQTT status topic for device.
        
        Args:
            device_id: Target device ID
            user_id: Owner's user ID
            
        Returns:
            MQTT topic path for device status
        """
        return TopicBuilder.device_status(user_id, device_id)
    
    async def handle_device_status(
        self,
        device_id: int,
        status: dict
    ) -> None:
        """
        Process device status update from MQTT.
        
        Called when device publishes status to home/{user_id}/{device_id}/status
        Updates local device state and connectivity info.
        
        Args:
            device_id: Device ID
            status: Status dict with state updates
        """
        device = await self._device_repo.get_by_id(device_id)
        if not device:
            return
        
        # Update device state from status
        if "state" in status:
            device.state = status["state"]
        
        # Update connectivity info
        device.is_online = status.get("is_online", True)
        device.last_seen = datetime.now()
        
        # Persist changes
        await self._device_repo.update(device)
    
    async def get_supported_actions(self, device_id: int) -> list:
        """
        Get list of actions supported by device.
        
        Args:
            device_id: Target device ID
            
        Returns:
            List of supported action names
            
        Raises:
            ValueError: If device not found
        """
        device = await self._device_repo.get_by_id(device_id)
        if not device:
            raise ValueError(f"Device {device_id} not found")
        
        device_type = DeviceType(device.device_type)
        return self._action_validator.get_supported_actions(device_type)
    
    async def set_device_offline(self, device_id: int) -> None:
        """
        Mark device as offline.
        
        Called when device fails to respond to commands.
        
        Args:
            device_id: Target device ID
        """
        device = await self._device_repo.get_by_id(device_id)
        if device:
            device.is_online = False
            device.last_seen = datetime.now()
            await self._device_repo.update(device)
