"""JSON-based Device Repository implementation."""

from typing import Optional, List
from database.models.device import Device
from database.repository import IDeviceRepository
from .json_connection import JsonConnection


class JsonDeviceRepository(IDeviceRepository):
    """
    Device repository backed by JSON file storage.
    
    Implements IDeviceRepository interface for seamless substitution
    with PostgresDeviceRepository. Stores device configurations with
    flexible JSON settings.
    
    ID Assignment: Uses auto-incrementing counter stored in _meta.next_device_id
    """

    def __init__(self, connection: JsonConnection):
        """
        Initialize repository with JSON connection.
        
        Args:
            connection: JsonConnection instance
        """
        self._conn = connection

    async def create(self, device: Device) -> Device:
        """
        Create a new device.
        
        Auto-generates ID from counter.
        
        Args:
            device: Device instance (without ID)
            
        Returns:
            Device with generated ID
        """
        data = self._conn.get_data()
        
        # Generate next device ID
        meta = data.get("_meta", {})
        device_id = meta.get("next_device_id", 1)
        meta["next_device_id"] = device_id + 1
        data["_meta"] = meta
        
        # Create device document
        device_doc = {
            "id": device_id,
            "owner_id": device.owner_id,
            "name": device.name,
            "device_type": device.device_type,
            "base_topic": device.base_topic,
            "last_online": device.last_online.isoformat() if device.last_online else None,
            "state": device.state,
            "is_online": device.is_online,
            "last_seen": device.last_seen.isoformat() if device.last_seen else None,
        }
        
        # Add to devices list
        if "devices" not in data:
            data["devices"] = []
        data["devices"].append(device_doc)
        
        # Persist changes
        self._conn.set_data(data)
        await self._conn.save()
        
        device.id = device_id
        return device

    async def get_by_id(self, device_id: int) -> Optional[Device]:
        """
        Find a device by ID.
        
        Args:
            device_id: Device's primary key
            
        Returns:
            Device if found, None otherwise
        """
        data = self._conn.get_data()
        
        for device_doc in data.get("devices", []):
            if device_doc.get("id") == device_id:
                return self._doc_to_device(device_doc)
        
        return None

    async def get_by_user(self, user_id: int) -> List[Device]:
        """
        Find all devices owned by a user.
        
        Args:
            user_id: Owner's user ID
            
        Returns:
            List of devices (empty list if none found)
        """
        data = self._conn.get_data()
        devices = []
        
        for device_doc in data.get("devices", []):
            if device_doc.get("owner_id") == user_id:
                devices.append(self._doc_to_device(device_doc))
        
        return devices

    async def update(self, device: Device) -> Device:
        """
        Update an existing device.
        
        Args:
            device: Device with ID and updated fields
            
        Returns:
            Updated device
            
        Raises:
            ValueError: If device not found
        """
        data = self._conn.get_data()
        devices = data.get("devices", [])
        
        for i, device_doc in enumerate(devices):
            if device_doc.get("id") == device.id:
                # Update fields
                device_doc["owner_id"] = device.owner_id
                device_doc["name"] = device.name
                device_doc["device_type"] = device.device_type
                device_doc["base_topic"] = device.base_topic
                device_doc["last_online"] = device.last_online.isoformat() if device.last_online else None
                device_doc["state"] = device.state
                device_doc["is_online"] = device.is_online
                device_doc["last_seen"] = device.last_seen.isoformat() if device.last_seen else None
                
                devices[i] = device_doc
                data["devices"] = devices
                self._conn.set_data(data)
                await self._conn.save()
                return device
        
        raise ValueError(f"Device with id {device.id} not found")

    async def delete(self, device_id: int) -> bool:
        """
        Delete a device by ID.
        
        Args:
            device_id: Device's primary key
            
        Returns:
            True if deleted, False if not found
        """
        data = self._conn.get_data()
        devices = data.get("devices", [])
        
        for i, device_doc in enumerate(devices):
            if device_doc.get("id") == device_id:
                devices.pop(i)
                data["devices"] = devices
                self._conn.set_data(data)
                await self._conn.save()
                return True
        
        return False

    async def list_all(self) -> List[Device]:
        """
        Get all devices.
        
        Returns:
            List of all devices
        """
        data = self._conn.get_data()
        devices = data.get("devices", [])
        
        return [self._doc_to_device(device_doc) for device_doc in devices]

    @staticmethod
    def _doc_to_device(doc: dict) -> Device:
        """
        Convert JSON document to Device model.
        
        Args:
            doc: Raw dictionary from JSON
            
        Returns:
            Pydantic Device instance
        """
        from datetime import datetime
        
        last_online = doc.get("last_online")
        if last_online and isinstance(last_online, str):
            last_online = datetime.fromisoformat(last_online)
        
        last_seen = doc.get("last_seen")
        if last_seen and isinstance(last_seen, str):
            last_seen = datetime.fromisoformat(last_seen)
        
        return Device(
            id=doc.get("id"),
            owner_id=doc.get("owner_id"),
            name=doc.get("name"),
            device_type=doc.get("device_type"),
            base_topic=doc.get("base_topic"),
            last_online=last_online,
            state=doc.get("state", {}),
            is_online=doc.get("is_online", False),
            last_seen=last_seen
        )
