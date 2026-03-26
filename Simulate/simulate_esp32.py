import paho.mqtt.client as mqtt
import time
import random
import json
from datetime import datetime

# --- Configuration ---
BROKER = "localhost"
PORT = 1883
TOPICS = {
    "TEMP": "V1",
    "HUMID": "V2",
    "LIGHT": "V3",
    "FAN_STATUS": "V12", # Fan speed/status
    "FACE_AI": "V14"
}

class ESP32Simulator:
    def __init__(self):
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.fan_speed = 0
        self.is_running = True

    def on_connect(self, client, userdata, flags, rc, props):
        if rc == 0:
            print(" [Hrdwr] Simulator Connected to Local Broker!")
            # Subscribe to the Fan topic to receive commands from Backend
            self.client.subscribe(TOPICS["FAN_STATUS"])
        else:
            print(f" [Error] Connection failed: {rc}")

    def on_message(self, client, userdata, msg):
        """Simulates the ESP32 receiving a command (e.g., from the Mobile App)"""
        if msg.topic == TOPICS["FAN_STATUS"]:
            self.fan_speed = int(msg.payload.decode())
            print(f" [Actuator] FAN SPEED CHANGED TO: {self.fan_speed}%")

    def generate_sensor_data(self):
        """Generates realistic sensor fluctuations"""
        return {
            "temp": round(random.uniform(26.0, 31.0), 2),
            "humid": round(random.uniform(50.0, 70.0), 2),
            "light": random.randint(300, 800)
        }

    def start(self):
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.connect(BROKER, PORT)
        self.client.loop_start() # Run network loop in background

        print(" [*] ESP32 Simulator Active. Sending data every 5s...")
        try:
            while self.is_running:
                data = self.generate_sensor_data()
                
                # Publish individual topics to match your current Backend logic
                self.client.publish(TOPICS["TEMP"], data["temp"])
                self.client.publish(TOPICS["HUMID"], data["humid"])
                self.client.publish(TOPICS["LIGHT"], data["light"])
                
                print(f" [Pub] T:{data['temp']}°C | H:{data['humid']}% | L:{data['light']}lx | Fan:{self.fan_speed}%")
                
                time.sleep(5)
        except KeyboardInterrupt:
            print(" [!] Simulator stopping...")
            self.client.loop_stop()
            self.client.disconnect()

if __name__ == "__main__":
    simulator = ESP32Simulator()
    simulator.start()