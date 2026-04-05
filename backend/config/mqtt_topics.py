"""MQTT topic configuration and utilities."""

from typing import Dict


class MqttTopics:
    """MQTT topic path definitions."""
    
    # Device command topics (Backend → Device)
    DEVICE_COMMAND = "home/{user_id}/{device_id}/command"
    
    # Device status topics (Device → Backend)
    DEVICE_STATUS = "home/{user_id}/{device_id}/status"
    
    # Sensor data topics (Device → Backend)
    DEVICE_DATA = "home/{user_id}/{device_id}/data"
    
    # Wildcard subscriptions
    DEVICE_COMMANDS_ALL = "home/{user_id}/+/command"      # All devices for a user
    DEVICE_STATUS_ALL = "home/{user_id}/+/status"          # All device status
    DEVICE_DATA_ALL = "home/{user_id}/+/data"              # All device data


class TopicBuilder:
    """Utility class to build MQTT topic paths."""
    
    @staticmethod
    def device_command(user_id: int, device_id: int) -> str:
        """
        Build device command topic.
        
        Args:
            user_id: User ID
            device_id: Device ID
            
        Returns:
            Topic path: home/{user_id}/{device_id}/command
        """
        return f"home/{user_id}/{device_id}/command"
    
    @staticmethod
    def device_status(user_id: int, device_id: int) -> str:
        """
        Build device status topic.
        
        Args:
            user_id: User ID
            device_id: Device ID
            
        Returns:
            Topic path: home/{user_id}/{device_id}/status
        """
        return f"home/{user_id}/{device_id}/status"
    
    @staticmethod
    def device_data(user_id: int, device_id: int) -> str:
        """
        Build device data topic.
        
        Args:
            user_id: User ID
            device_id: Device ID
            
        Returns:
            Topic path: home/{user_id}/{device_id}/data
        """
        return f"home/{user_id}/{device_id}/data"
    
    @staticmethod
    def device_commands_all(user_id: int) -> str:
        """
        Build wildcard pattern for all device commands from a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Topic pattern: home/{user_id}/+/command
        """
        return f"home/{user_id}/+/command"
    
    @staticmethod
    def device_status_all(user_id: int) -> str:
        """
        Build wildcard pattern for all device status from a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Topic pattern: home/{user_id}/+/status
        """
        return f"home/{user_id}/+/status"
    
    @staticmethod
    def device_data_all(user_id: int) -> str:
        """
        Build wildcard pattern for all device data from a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Topic pattern: home/{user_id}/+/data
        """
        return f"home/{user_id}/+/data"
    
    @staticmethod
    def extract_device_id(topic: str) -> int:
        """
        Extract device ID from a topic path.
        
        Args:
            topic: Full topic path (e.g., home/1/42/command)
            
        Returns:
            Device ID from the topic
            
        Raises:
            ValueError: If topic format is invalid
        """
        parts = topic.split("/")
        if len(parts) < 3:
            raise ValueError(f"Invalid topic format: {topic}")
        
        try:
            return int(parts[2])
        except (IndexError, ValueError):
            raise ValueError(f"Cannot extract device ID from topic: {topic}")
    
    @staticmethod
    def extract_user_id(topic: str) -> int:
        """
        Extract user ID from a topic path.
        
        Args:
            topic: Full topic path (e.g., home/1/42/command)
            
        Returns:
            User ID from the topic
            
        Raises:
            ValueError: If topic format is invalid
        """
        parts = topic.split("/")
        if len(parts) < 2:
            raise ValueError(f"Invalid topic format: {topic}")
        
        try:
            return int(parts[1])
        except (IndexError, ValueError):
            raise ValueError(f"Cannot extract user ID from topic: {topic}")
    
    @staticmethod
    def is_command_topic(topic: str) -> bool:
        """Check if topic is a device command topic."""
        return "/command" in topic
    
    @staticmethod
    def is_status_topic(topic: str) -> bool:
        """Check if topic is a device status topic."""
        return "/status" in topic
    
    @staticmethod
    def is_data_topic(topic: str) -> bool:
        """Check if topic is a device data topic."""
        return "/data" in topic
