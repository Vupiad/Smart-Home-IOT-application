import paho.mqtt.client as mqtt
import time
import random
import json
import os
import uuid

# --- Configuration ---
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))

# ============ Identity and Topics ============
DEVICE_ID = "yolo_uno_01"
FW_VERSION = "2026.04"

MQTT_TOPIC_CMD = f"yolohome/device/{DEVICE_ID}/cmd"
MQTT_TOPIC_ACK = f"yolohome/device/{DEVICE_ID}/ack"
MQTT_TOPIC_STATE = f"yolohome/device/{DEVICE_ID}/state"
MQTT_TOPIC_TELEMETRY = f"yolohome/device/{DEVICE_ID}/telemetry"


# ============ Color Parsing Functions ============
def parse_hex_color(color_str):
    """Parse hex color format: #FF0000 or FF0000."""
    if not isinstance(color_str, str):
        return None
    hex_str = color_str.strip()
    if hex_str.startswith('#'):
        hex_str = hex_str[1:]
    if len(hex_str) != 6:
        return None
    try:
        r = int(hex_str[0:2], 16)
        g = int(hex_str[2:4], 16)
        b = int(hex_str[4:6], 16)
        return (r, g, b)
    except ValueError:
        return None


def parse_csv_color(color_str):
    """Parse CSV color format: 255,0,0."""
    if not isinstance(color_str, str):
        return None
    try:
        parts = color_str.split(',')
        if len(parts) != 3:
            return None
        r = int(parts[0].strip())
        g = int(parts[1].strip())
        b = int(parts[2].strip())
        if not (0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255):
            return None
        return (r, g, b)
    except (ValueError, AttributeError):
        return None


def parse_named_color(color_name):
    """Parse named colors: red, blue, green, white, etc."""
    if not isinstance(color_name, str):
        return None
    colors = {
        "red": (255, 0, 0),
        "orange": (255, 127, 0),
        "yellow": (255, 255, 0),
        "green": (0, 255, 0),
        "cyan": (0, 255, 255),
        "blue": (0, 0, 255),
        "purple": (148, 0, 211),
        "white": (255, 255, 255),
        "off": (0, 0, 0)
    }
    return colors.get(color_name.lower())


class ESP32Simulator:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.is_running = True
        self.start_time = time.time()
        
        # ESP32 emulated state
        self.led_enabled = False
        self.led_mode = "manual"
        self.led_r = 0
        self.led_g = 0
        self.led_b = 0
        self.fan_speed = 0
        self.door_state = 0
        self.door_status = "closed"
        
        # Sensor values
        self.temperature = 26.0
        self.humidity = 60.0
        self.light = 500
        self.pir_detected = False

    def get_ts(self):
        """Returns milliseconds since boot (simulator started)."""
        return int((time.time() - self.start_time) * 1000)

    def on_connect(self, client, userdata, flags, rc, props):
        """Handle connection to MQTT broker."""
        if rc == 0:
            print(f" [MQTT] Connected to {BROKER}:{PORT}")
            
            # Subscribe to the CMD topic
            self.client.subscribe(MQTT_TOPIC_CMD, qos=1)
            print(f" [MQTT] Subscribed to: {MQTT_TOPIC_CMD}")
            
            # Publish initial state upon connection
            self.publish_state()
        else:
            print(f" [ERROR] Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        if msg.topic != MQTT_TOPIC_CMD:
            return
            
        payload_str = msg.payload.decode()
        print(f" [MQTT] Received CMD: {payload_str}")
        
        try:
            cmd = json.loads(payload_str)
            command_id = cmd.get("commandId", str(uuid.uuid4()))
            target = cmd.get("target")
            
            success = False
            message = ""
            
            if target == "led":
                success, message = self._handle_led_command(cmd)
            elif target == "fan":
                success, message = self._handle_fan_command(cmd)
            elif target == "door":
                success, message = self._handle_door_command(cmd)
            else:
                success = False
                message = f"unknown_target_{target}"
                
            self.publish_ack(command_id, success, message)
            
            if success:
                self.publish_state()
                
        except json.JSONDecodeError:
            print(f" [ERROR] Invalid JSON payload")
        except Exception as e:
            print(f" [ERROR] Failed to process command: {e}")

    def _handle_led_command(self, cmd):
        action = cmd.get("action")
        if action == "on":
            self.led_enabled = True
            return True, "led_on"
        elif action == "off":
            self.led_enabled = False
            return True, "led_off"
        elif action == "auto":
            self.led_mode = "auto"
            return True, "led_auto"
        elif action == "set":
            self.led_mode = "manual"
            if "r" in cmd and "g" in cmd and "b" in cmd:
                self.led_r = int(cmd["r"])
                self.led_g = int(cmd["g"])
                self.led_b = int(cmd["b"])
                return True, "led_rgb"
            elif "hex" in cmd:
                color = parse_hex_color(cmd["hex"])
                if color:
                    self.led_r, self.led_g, self.led_b = color
                    return True, "led_hex"
            elif "color" in cmd:
                color_val = cmd["color"]
                color = parse_named_color(color_val) or parse_hex_color(color_val) or parse_csv_color(color_val)
                if color:
                    self.led_r, self.led_g, self.led_b = color
                    return True, "led_color"
            return False, "invalid_color_format"
        return False, f"unknown_action_{action}"

    def _handle_fan_command(self, cmd):
        action = cmd.get("action")
        if action == "on":
            self.fan_speed = 100
            return True, "fan_on"
        elif action == "off":
            self.fan_speed = 0
            return True, "fan_off"
        elif action == "set":
            speed = cmd.get("speed", cmd.get("value"))
            if speed is not None:
                self.fan_speed = max(0, min(100, int(speed)))
                return True, "fan_set"
            return False, "missing_speed_value"
        return False, f"unknown_action_{action}"

    def _handle_door_command(self, cmd):
        action = cmd.get("action")
        if action == "open":
            self.door_state = 1 # DOOR_OPENING
            self.door_status = "opening"
            return True, "door_open"
        elif action == "close":
            self.door_state = 2 # DOOR_CLOSING
            self.door_status = "closing"
            return True, "door_close"
        return False, f"unknown_action_{action}"

    def get_state_obj(self):
        """Returns the current state object."""
        return {
            "fanSpeed": self.fan_speed,
            "ledEnabled": self.led_enabled,
            "ledMode": self.led_mode,
            "ledR": self.led_r,
            "ledG": self.led_g,
            "ledB": self.led_b,
            "doorState": self.door_state,
            "doorStatus": self.door_status
        }

    def publish_ack(self, command_id, success, message):
        """Publish command acknowledgment to the ACK topic."""
        payload = {
            "schemaVersion": 1,
            "deviceId": DEVICE_ID,
            "ts": self.get_ts(),
            "commandId": command_id,
            "source": "cmd_topic",
            "success": success,
            "message": message,
            "state": self.get_state_obj()
        }
        self.client.publish(MQTT_TOPIC_ACK, json.dumps(payload), qos=1)
        print(f" [ACK] commandId='{command_id}' success={success} msg='{message}'")

    def publish_state(self):
        """Publish the current device state to the STATE topic."""
        payload = {
            "schemaVersion": 1,
            "deviceId": DEVICE_ID,
            "fwVersion": FW_VERSION,
            "ts": self.get_ts(),
            "mqttConnected": True,
            "wifiRssi": random.randint(-70, -50),
            "state": self.get_state_obj()
        }
        self.client.publish(MQTT_TOPIC_STATE, json.dumps(payload), qos=1, retain=True)
        print(f" [STATE] Published state update")

    def publish_telemetry(self):
        """Publish sensor readings to the TELEMETRY topic."""
        payload = {
            "schemaVersion": 1,
            "deviceId": DEVICE_ID,
            "fwVersion": FW_VERSION,
            "ts": self.get_ts(),
            "temperature": round(self.temperature, 1),
            "humidity": round(self.humidity, 1),
            "light": int(self.light),
            "dhtValid": True,
            "pirDetected": self.pir_detected
        }
        self.client.publish(MQTT_TOPIC_TELEMETRY, json.dumps(payload), qos=0)
        print(f" [TEL] T:{self.temperature:.1f} H:{self.humidity:.1f} L:{int(self.light)} PIR:{self.pir_detected}")

    def update_sensor_values(self):
        """Update sensor readings with realistic fluctuations."""
        # Temperature fluctuation
        self.temperature += random.uniform(-0.5, 0.5)
        self.temperature = max(20.0, min(35.0, self.temperature))
        
        # Humidity fluctuation
        self.humidity += random.uniform(-1.0, 1.0)
        self.humidity = max(30.0, min(80.0, self.humidity))
        
        # Light fluctuation
        self.light += random.uniform(-10.0, 10.0)
        self.light = max(0, min(1000, self.light))
        
        # Optionally simulate PIR detection
        self.pir_detected = random.random() > 0.95

    def start(self):
        """Start the ESP32 simulator."""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        try:
            self.client.connect(BROKER, int(PORT))
            self.client.loop_start()
            
            print(f" [MQTT] Connecting to {BROKER}:{PORT}...")
            print(f" [*] ESP32 Simulator Active (New Protocol)")
            
            connection_count = 0
            while self.is_running:
                # Connection check (timeout after 5 attempts)
                if not self.client.is_connected() and connection_count > 5:
                    print(f" [WARNING] Connection lost. Retrying...")
                    try:
                        self.client.reconnect()
                    except:
                        pass
                
                # Update sensor values and publish telemetry periodically
                self.update_sensor_values()
                self.publish_telemetry()
                
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