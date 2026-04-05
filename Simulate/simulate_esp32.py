import paho.mqtt.client as mqtt
import time
import random
import json
from datetime import datetime
import os

# --- Configuration ---
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))

# Legacy topics for sensor data
LEGACY_TOPICS = {
    "TEMP": "V1",
    "HUMID": "V2",
    "LIGHT": "V3",
    "FAN_STATUS": "V12",
    "FACE_AI": "V14"
}

# Virtual devices for MQTT control
# Format: device_id -> device_config
VIRTUAL_DEVICES = {
    1: {
        "name": "Living Room Light",
        "type": "LIGHT",
        "user_id": 1,
        "state": {
            "power": False,
            "brightness": 0,
            "color": "white"
        }
    },
    2: {
        "name": "Bedroom Fan",
        "type": "FAN",
        "user_id": 1,
        "state": {
            "power": False,
            "speed": 0
        }
    },
    3: {
        "name": "Front Door Lock",
        "type": "DOOR_LOCK",
        "user_id": 1,
        "state": {
            "locked": True,
            "open": False
        }
    },
    4: {
        "name": "AC Unit",
        "type": "AC",
        "user_id": 1,
        "state": {
            "power": False,
            "temperature": 22,
            "mode": "cool"
        }
    }
}


class ESP32Simulator:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.is_running = True
        self.devices = VIRTUAL_DEVICES.copy()

    def on_connect(self, client, userdata, flags, rc, props):
        """Handle connection to MQTT broker."""
        if rc == 0:
            print(f" [MQTT] Connected to {BROKER}:{PORT}")
            
            # Subscribe to device command topics for all devices
            for user_id in set(d["user_id"] for d in self.devices.values()):
                # Subscribe to all devices for this user
                command_topic = f"home/{user_id}/+/command"
                self.client.subscribe(command_topic, qos=1)
                print(f" [MQTT] Subscribed to: {command_topic}")
            
            # Subscribe to legacy sensor topics
            self.client.subscribe(LEGACY_TOPICS["FAN_STATUS"], qos=0)
            print(f" [MQTT] Subscribed to legacy: {LEGACY_TOPICS['FAN_STATUS']}")
        else:
            print(f" [ERROR] Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        payload = msg.payload.decode()
        
        # Check if it's a device command (new protocol)
        if msg.topic.startswith("home/") and msg.topic.endswith("/command"):
            self._handle_device_command(msg.topic, payload)
        # Legacy fan speed command
        elif msg.topic == LEGACY_TOPICS["FAN_STATUS"]:
            print(f" [LEGACY] Fan speed set to: {payload}%")

    def _handle_device_command(self, topic: str, payload: str) -> None:
        """
        Handle device control command from MQTT.
        
        Topic format: home/{user_id}/{device_id}/command
        Payload: {"action": "turn_on", "value": null, "timestamp": "..."}
        """
        try:
            # Parse topic
            parts = topic.split("/")
            if len(parts) != 4:
                print(f" [ERROR] Invalid topic format: {topic}")
                return
            
            user_id = int(parts[1])
            device_id = int(parts[2])
            
            # Parse command
            command = json.loads(payload)
            action = command.get("action")
            value = command.get("value")
            
            # Find and execute action on device
            if device_id not in self.devices:
                print(f" [ERROR] Device {device_id} not found")
                return
            
            device_config = self.devices[device_id]
            
            # Execute action
            print(f" [CMD] Device {device_id} ({device_config['name']}): {action}={value}")
            self._execute_action(device_id, action, value)
            
            # Publish status update
            self._publish_device_status(user_id, device_id, device_config)
            
        except json.JSONDecodeError:
            print(f" [ERROR] Invalid JSON payload: {payload}")
        except Exception as e:
            print(f" [ERROR] Error handling command: {e}")

    def _execute_action(self, device_id: int, action: str, value) -> None:
        """Execute action on device and update state."""
        device_config = self.devices[device_id]
        state = device_config["state"]
        device_type = device_config["type"]
        
        # Light actions
        if device_type == "LIGHT":
            if action == "turn_on":
                state["power"] = True
            elif action == "turn_off":
                state["power"] = False
            elif action == "toggle":
                state["power"] = not state["power"]
            elif action == "set_brightness":
                state["brightness"] = max(0, min(100, int(value)))
            elif action == "set_color":
                state["color"] = value
        
        # Fan actions
        elif device_type == "FAN":
            if action == "turn_on":
                state["power"] = True
            elif action == "turn_off":
                state["power"] = False
            elif action == "set_speed":
                state["speed"] = max(0, min(100, int(value)))
        
        # Door lock actions
        elif device_type == "DOOR_LOCK":
            if action == "lock":
                state["locked"] = True
            elif action == "unlock":
                state["locked"] = False
        
        # AC actions
        elif device_type == "AC":
            if action == "turn_on":
                state["power"] = True
            elif action == "turn_off":
                state["power"] = False
            elif action == "set_temperature":
                state["temperature"] = max(16, min(30, int(value)))
            elif action == "set_mode":
                state["mode"] = value

    def _publish_device_status(self, user_id: int, device_id: int, device_config: dict) -> None:
        """Publish device status to MQTT."""
        status_topic = f"home/{user_id}/{device_id}/status"
        status_payload = {
            "device_id": device_id,
            "device_name": device_config["name"],
            "state": device_config["state"],
            "is_online": True,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        result = self.client.publish(
            status_topic,
            json.dumps(status_payload),
            qos=1,
            retain=False
        )
        
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f" [STATUS] Published to {status_topic}: {device_config['state']}")
        else:
            print(f" [ERROR] Failed to publish status: rc={result.rc}")

    def generate_sensor_data(self):
        """Generates realistic sensor fluctuations."""
        return {
            "temp": round(random.uniform(26.0, 31.0), 2),
            "humid": round(random.uniform(50.0, 70.0), 2),
            "light": random.randint(300, 800)
        }

    def start(self):
        """Start the ESP32 simulator."""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        try:
            self.client.connect(BROKER, int(PORT))
            self.client.loop_start()
            
            print(f" [MQTT] Connecting to {BROKER}:{PORT}...")
            print(f" [*] ESP32 Simulator Active")
            print(f" [*] Virtual Devices: {len(self.devices)}")
            print(f" [*] Sending sensor data every 5s...")
            
            connection_count = 0
            while self.is_running:
                # Connection check (timeout after 5 attempts)
                if not self.client.is_connected() and connection_count > 5:
                    print(f" [WARNING] Connection lost. Retrying...")
                    try:
                        self.client.reconnect()
                    except:
                        pass
                
                # Publish sensor data
                data = self.generate_sensor_data()
                self.client.publish(LEGACY_TOPICS["TEMP"], data["temp"], qos=0)
                self.client.publish(LEGACY_TOPICS["HUMID"], data["humid"], qos=0)
                self.client.publish(LEGACY_TOPICS["LIGHT"], data["light"], qos=0)
                
                # Print device states
                device_states = ", ".join([
                    f"{d['name']}=" + (
                        "ON" if d['state'].get('power', False) else "OFF"
                    )
                    for d in self.devices.values()
                ])
                
                print(f" [SEN] T:{data['temp']}°C | H:{data['humid']}% | L:{data['light']}lx | {device_states}")
                
                time.sleep(5)
                connection_count += 1
                
        except KeyboardInterrupt:
            print("\n [!] Simulator stopping...")
            self.is_running = False
        except Exception as e:
            print(f" [ERROR] {e}")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            print(" [*] Simulator stopped")


if __name__ == "__main__":
    simulator = ESP32Simulator()
    simulator.start()