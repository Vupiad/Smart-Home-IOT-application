import json
import asyncio
from typing import Dict, Any
from api.deps import _get_db_type
from database.sql.database_factory import db_instance
from database.json.json_device_repository import JsonDeviceRepository
from database.sql.repositories.postgres_device_repository import PostgresDeviceRepository

class SyncService:
    """
    Background service to synchronize device states from MQTT to the Database.
    """
    @staticmethod
    async def get_device_repo():
        """Helper to instantiate the repository outside of FastAPI request scope."""
        conn_generator = db_instance.get_connection()
        try:
            conn = await conn_generator.__anext__()
        except StopAsyncIteration:
            raise Exception("Could not get DB connection")
            
        db_type = _get_db_type()
        if db_type == "json":
            repo = JsonDeviceRepository(conn)
        else:
            repo = PostgresDeviceRepository(conn)
        
        return repo, conn_generator, conn

    @staticmethod
    async def handle_mqtt_ack(msg):
        """
        Parse MQTT payload and update device states in DB.
        """
        try:
            payload_str = msg.payload.decode()
            payload = json.loads(payload_str)
            
            # Extract hardware ID (e.g. yolo_uno_01)
            hardware_id = payload.get("deviceId")
            if not hardware_id:
                parts = msg.topic.split('/')
                if len(parts) >= 3:
                    hardware_id = parts[-2]
            
            if not hardware_id:
                return

            hardware_state = payload.get("state", {})
            if not hardware_state:
                return
            
            # Get DB connection
            repo, conn_gen, conn = await SyncService.get_device_repo()
            
            try:
                # Find all DB devices mapped to this hardware
                all_devices = await repo.list_all()
                for device in all_devices:
                    if hardware_id in device.base_topic:
                        # Map hardware state back to UI state
                        updated_state = dict(device.state) if device.state else {}
                        
                        if device.device_type == "light":
                            updated_state["status"] = "on" if hardware_state.get("ledEnabled", False) else "off"
                            if "ledR" in hardware_state:
                                updated_state["color"] = {
                                    "r": hardware_state.get("ledR", 255),
                                    "g": hardware_state.get("ledG", 255),
                                    "b": hardware_state.get("ledB", 255)
                                }
                        
                        elif device.device_type == "fan":
                            speed = hardware_state.get("fanSpeed", 0)
                            updated_state["status"] = "on" if speed > 0 else "off"
                            updated_state["speed"] = speed
                        
                        elif device.device_type == "door":
                            # doorStatus: "closed" | "opening" | "closing" | "open"
                            status_val = hardware_state.get("doorStatus", "")
                            if status_val == "closed":
                                updated_state["status"] = "locked"
                            else:
                                updated_state["status"] = "unlocked"
                        
                        # Only update if state has actually changed
                        if device.state != updated_state:
                            device.state = updated_state
                            await repo.update(device)
                            print(f" [SYNC] Updated Device {device.id} ({device.name}) to {updated_state}")
                            
            finally:
                # Safely close generator to release connection back to pool
                try:
                    await conn_gen.aclose()
                except AttributeError:
                    pass
                
        except json.JSONDecodeError:
            pass  # Ignore non-JSON payloads
        except Exception as e:
            print(f" [SYNC] Error processing MQTT payload: {e}")

    @staticmethod
    def register_sync_handlers(mqtt_service):
        """Register the topic handlers for syncing state."""
        # Using wildcards to match any device id
        mqtt_service.register_message_handler("yolohome/device/yolo_uno_01/ack", SyncService.handle_mqtt_ack)
        mqtt_service.register_message_handler("yolohome/device/yolo_uno_01/state", SyncService.handle_mqtt_ack)
        print(" [SYNC] MQTT Event Handlers registered")
