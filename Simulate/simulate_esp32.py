import paho.mqtt.client as mqtt
import time
import random
import json
from datetime import datetime
import os

# --- Configuration ---
BROKER = os.getenv("MQTT_BROKER", "localhost")
PORT = int(os.getenv("MQTT_PORT", 1883))

# ============ ESP32 V-Channel Topics (yolohome/V*) ============
MQTT_TOPIC_V1 = "yolohome/V1"    # Temperature sensor
MQTT_TOPIC_V2 = "yolohome/V2"    # Humidity sensor
MQTT_TOPIC_V3 = "yolohome/V3"    # Light sensor
MQTT_TOPIC_V10 = "yolohome/V10"  # LED on/off ("1" or "0")
MQTT_TOPIC_V11 = "yolohome/V11"  # LED color (hex, csv, json, or named color)
MQTT_TOPIC_V12 = "yolohome/V12"  # Fan speed (0-100)
MQTT_TOPIC_V13 = "yolohome/V13"  # Feedback messages
#MQTT_TOPIC_V14 = "yolohome/V14"  # FaceAI result

# ============ Feedback Messages ============
MSG_LED_ON = "LED turned on"
MSG_LED_OFF = "LED turned off"
MSG_RGB_AUTO = "LED set to auto mode"
MSG_RGB_CHANGED = "LED color changed"
MSG_RGB_INVALID = "Invalid color format"
MSG_FAN_SPEED_TEMPLATE = "Fan speed set to %d%%"
MSG_DOOR_OPEN_SUCCESS = "Door opened successfully"
MSG_DOOR_GUEST = "Guest detected"

# ============ Color Parsing Functions ============
def parse_hex_color(color_str):
    """Parse hex color format: #FF0000 or FF0000."""
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


def parse_json_color(color_str):
    """Parse JSON color format: {"r": 255, "g": 0, "b": 0} or {"hex": "FF0000"}."""
    try:
        data = json.loads(color_str)
        if "r" in data and "g" in data and "b" in data:
            r = int(data["r"])
            g = int(data["g"])
            b = int(data["b"])
            if 0 <= r <= 255 and 0 <= g <= 255 and 0 <= b <= 255:
                return (r, g, b)
        elif "hex" in data:
            return parse_hex_color(data["hex"])
    except (json.JSONDecodeError, ValueError, TypeError):
        pass
    return None


def parse_named_color(color_name):
    """Parse named colors: red, blue, green, white, etc."""
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


def parse_color(color_str):
    """Try parsing color in multiple formats."""
    if not color_str:
        return None
    
    # Try named color first
    result = parse_named_color(color_str)
    if result:
        return result
    
    # Try hex format
    result = parse_hex_color(color_str)
    if result:
        return result
    
    # Try CSV format
    result = parse_csv_color(color_str)
    if result:
        return result
    
    # Try JSON format
    result = parse_json_color(color_str)
    if result:
        return result
    
    return None


class ESP32Simulator:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.is_running = True
        
        # ESP32 emulated state
        self.led_state = False           # LED on/off
        self.led_r = 255                # LED RGB values
        self.led_g = 255
        self.led_b = 255
        self.led_auto = False           # LED auto color mode
        self.fan_speed = 0              # Fan speed 0-100
        self.door_state = "closed"      # Door state
        self.face_ai_result = None      # Last FaceAI result
        
        # Sensor values
        self.temperature = 26.0
        self.humidity = 60.0
        self.light = 500

    def on_connect(self, client, userdata, flags, rc, props):
        """Handle connection to MQTT broker."""
        if rc == 0:
            print(f" [MQTT] Connected to {BROKER}:{PORT}")
            
            # Subscribe to device control topics (V-topics)
            self.client.subscribe(MQTT_TOPIC_V10, qos=1)
            self.client.subscribe(MQTT_TOPIC_V11, qos=1)
            self.client.subscribe(MQTT_TOPIC_V12, qos=1)
            #self.client.subscribe(MQTT_TOPIC_V14, qos=1)
            print(f" [MQTT] Subscribed to: V10, V11, V12")
            
        else:
            print(f" [ERROR] Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages (V-topic protocol)."""
        payload = msg.payload.decode()
        print(f" [MQTT] Received {msg.topic}: {payload}")
        
        # Handle device control topics
        if msg.topic == MQTT_TOPIC_V10:
            self._handle_v10_led_onoff(payload)
        elif msg.topic == MQTT_TOPIC_V11:
            self._handle_v11_led_color(payload)
        elif msg.topic == MQTT_TOPIC_V12:
            self._handle_v12_fan_speed(payload)
        # elif msg.topic == MQTT_TOPIC_V14:
        #     self._handle_v14_faceai(payload)
    
    def _handle_v10_led_onoff(self, payload):
        """Handle LED on/off command (V10: "1" or "0")."""
        if payload == "1":
            self.led_state = True
            self.publish_feedback(MSG_LED_ON)
            print(f" [LED] Turned ON")
        elif payload == "0":
            self.led_state = False
            self.publish_feedback(MSG_LED_OFF)
            print(f" [LED] Turned OFF")
        else:
            print(f" [ERROR] Invalid V10 payload: {payload}")
    
    def _handle_v11_led_color(self, payload):
        """Handle LED color command (V11: hex, csv, json, or named color)."""
        payload = payload.strip()
        
        # Check for auto mode
        if payload.lower() == "auto":
            self.led_auto = True
            self.publish_feedback(MSG_RGB_AUTO)
            print(f" [LED] Auto color mode enabled")
            return
        
        self.led_auto = False
        
        # Try parsing color in multiple formats
        color = parse_color(payload)
        if color:
            self.led_r, self.led_g, self.led_b = color
            if self.led_state:
                print(f" [LED] Color set to RGB({self.led_r}, {self.led_g}, {self.led_b})")
            self.publish_feedback(MSG_RGB_CHANGED)
        else:
            self.publish_feedback(MSG_RGB_INVALID)
            print(f" [ERROR] Invalid color format: {payload}")
    
    def _handle_v12_fan_speed(self, payload):
        """Handle fan speed command (V12: 0-100)."""
        try:
            speed = int(payload)
            speed = max(0, min(100, speed))  # Constrain to 0-100
            self.fan_speed = speed
            feedback = f"Fan speed set to {speed}%"
            self.publish_feedback(feedback)
            print(f" [FAN] Speed set to {speed}% from payload: {payload}")
        except ValueError:
            print(f" [ERROR] Invalid V12 fan speed: {payload}")
    
    
    def publish_feedback(self, message):
        """Publish feedback message to V13."""
        result = self.client.publish(MQTT_TOPIC_V13, message, qos=1, retain=False)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f" [V13] Feedback: {message}")
        else:
            print(f" [ERROR] Failed to publish feedback: rc={result.rc}")
    
    def publish_sensor_data(self):
        """Publish sensor data to V1, V2, V3."""
        self.client.publish(MQTT_TOPIC_V1, f"{self.temperature:.1f}", qos=0)
        self.client.publish(MQTT_TOPIC_V2, f"{self.humidity:.1f}", qos=0)
        self.client.publish(MQTT_TOPIC_V3, f"{self.light}", qos=0)
        
        print(f" [SEN] V1={self.temperature:.1f}°C | V2={self.humidity:.1f}% | V3={self.light}lx", end="")
        print(f" | LED={'ON' if self.led_state else 'OFF'}(RGB={self.led_r},{self.led_g},{self.led_b}) | FAN={self.fan_speed}%")
    
    def update_sensor_values(self):
        """Update sensor readings with realistic fluctuations."""
        # Temperature fluctuation
        self.temperature += random.uniform(-0.5, 0.5)
        self.temperature = max(20.0, min(35.0, self.temperature))
        
        # Humidity fluctuation
        self.humidity += random.uniform(-1.0, 1.0)
        self.humidity = max(30.0, min(80.0, self.humidity))
        
        # Light (more random)
        self.light = random.randint(300, 800)

    def start(self):
        """Start the ESP32 simulator."""
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        
        try:
            self.client.connect(BROKER, int(PORT))
            self.client.loop_start()
            
            print(f" [MQTT] Connecting to {BROKER}:{PORT}...")
            print(f" [*] ESP32 Simulator Active")
            print(f" [*] Sensors: Temp, Humidity, Light")
            print(f" [*] Controls: LED (on/off, color), Fan (speed 0-100)")
            print(f" [*] Publishing sensor data every 5s...")
            
            connection_count = 0
            while self.is_running:
                # Connection check (timeout after 5 attempts)
                if not self.client.is_connected() and connection_count > 5:
                    print(f" [WARNING] Connection lost. Retrying...")
                    try:
                        self.client.reconnect()
                    except:
                        pass
                
                # Update sensor values and publish
                self.update_sensor_values()
                self.publish_sensor_data()
                
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