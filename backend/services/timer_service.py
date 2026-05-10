"""Device timer service for managing per-device auto-shutoff timers."""

import asyncio
from datetime import datetime
from typing import Dict, Optional, List
from database.repository import IDeviceRepository
from services.device_service import DeviceService
import logging

logger = logging.getLogger(__name__)


class TimerService:
    """
    Manages per-device timers for automatic shutoff at specific times.
    
    A timer represents: "Turn off this device at HH:MM"
    Example: Device ID 5 should turn off at 10:00 AM
    """
    
    def __init__(self):
        self.active_timers: Dict[int, Optional[str]] = {}  # device_id -> target_time (HH:MM format)
        self.last_checked: Optional[str] = None
    
    def set_device_timer(self, device_id: int, target_time: Optional[str]) -> None:
        """
        Set or update a device timer.
        
        Args:
            device_id: ID of the device
            target_time: Shutoff time in HH:MM format (e.g., "10:00", "22:30")
                        None to remove timer
        
        Example:
            timer_service.set_device_timer(5, "10:00")  # Turn off device 5 at 10:00 AM
            timer_service.set_device_timer(5, None)      # Cancel timer for device 5
        """
        if target_time is not None:
            # Validate format
            try:
                datetime.strptime(target_time, "%H:%M")
                self.active_timers[device_id] = target_time
                logger.info(f"✓ Timer set for device {device_id}: shutoff at {target_time}")
            except ValueError:
                logger.error(f"Invalid time format: {target_time}. Use HH:MM format")
        else:
            # Remove timer
            if device_id in self.active_timers:
                del self.active_timers[device_id]
                logger.info(f"✓ Timer removed for device {device_id}")
    
    def get_device_timer(self, device_id: int) -> Optional[str]:
        """Get the timer for a specific device."""
        return self.active_timers.get(device_id)
    
    def get_all_timers(self) -> Dict[int, Optional[str]]:
        """Get all active timers."""
        return self.active_timers.copy()

    def _is_device_on(self, device_state: Dict) -> bool:
        """Return True when the saved device state indicates the device is on."""
        status = str(device_state.get("status", "")).lower()
        is_on = device_state.get("isOn")
        power = device_state.get("power")

        return status == "on" or is_on is True or power is True

    def _build_turn_off_state(self, device) -> Dict[str, object]:
        """Build a device-type-appropriate state payload that means off."""
        device_kind = (device.device_type or "").lower()

        if device_kind in {"light", "lamp", "pendant", "bulb", "light_bulb"}:
            return {"status": "off"}
        if device_kind == "fan":
            return {"status": "off"}
        if device_kind in {"ac", "air_conditioner", "air-conditioner"}:
            return {"status": "off"}
        if device_kind == "door":
            return {"status": "locked"}

        return {"status": "off"}
    
    async def check_and_execute_timers(
        self, 
        device_repo: IDeviceRepository, 
        device_service: DeviceService
    ) -> None:
        """
        Check all active timers and turn off devices whose time has arrived.
        Called every minute by the scheduler.
        
        Args:
            device_repo: Device repository for fetching device data
            device_service: Device service for sending shutoff commands
        """
        current_time_str = datetime.now().strftime("%H:%M")
        
        # Skip if we already checked this minute
        if self.last_checked == current_time_str:
            return
        
        self.last_checked = current_time_str
        devices_to_remove = []
        
        for device_id, target_time in self.active_timers.items():
            if target_time == current_time_str:
                try:
                    # Fetch device to get current state
                    device = await device_repo.get_by_id(device_id)
                    if not device:
                        logger.warning(f"Device {device_id} not found, skipping timer")
                        devices_to_remove.append(device_id)
                        continue
                    
                    # Check if device is currently ON using either saved schema.
                    if self._is_device_on(device.state or {}):
                        # Turn off the device using the same UI state format that the FE expects.
                        off_state = self._build_turn_off_state(device)
                        success = await device_service.control_device(
                            user_id=device.owner_id,
                            device_id=device_id,
                            state=off_state
                        )
                        if success:
                            logger.info(
                                f"✓ Device {device_id} turned off by timer (was set for {target_time})"
                            )
                            # Timer executed successfully, remove it.
                            devices_to_remove.append(device_id)
                        else:
                            logger.warning(
                                f"Timer for device {device_id} fired at {target_time} but MQTT publish failed; will retry next minute"
                            )
                        continue
                    
                    # Device is already off, so the timer can be removed safely.
                    devices_to_remove.append(device_id)
                    
                except Exception as e:
                    logger.error(f"Error executing timer for device {device_id}: {e}")
                    # Don't remove the timer on error, let it retry next minute
        
        # Clean up executed timers
        for device_id in devices_to_remove:
            del self.active_timers[device_id]
    
    def load_timers_from_devices(self, devices: List) -> None:
        """
        Load timers from device state (used on startup to restore timers from DB).
        Looks for 'timerMinutes' or 'shutoffTime' in device state.
        
        Args:
            devices: List of device objects with state containing timer info
        """
        for device in devices:
            # Check different timer field names
            target_time = (
                device.state.get("shutoffTime") or 
                device.state.get("timerTime") or
                device.state.get("autoShutoffTime")
            )
            
            if target_time:
                self.set_device_timer(device.id, target_time)
                logger.info(f"Loaded timer for device {device.id}: {target_time}")


# Global singleton instance
timer_service = TimerService()
