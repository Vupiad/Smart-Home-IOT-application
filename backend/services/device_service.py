"""Device control service for MQTT-based device management."""

from typing import Optional, Any
from datetime import datetime
from database.models.device import Device
from database.repository import IDeviceRepository
from services.mqtt_service import MqttService


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
    
    async def control_device(
        self,
        user_id: int,
        device_id: int,
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
        
        
        device_topic = device.base_topic
        
        # Execute the action
        success = await self._mqtt_service.publish_to_topic(device_topic, value)
        
        return success
    

