import paho.mqtt.client as mqtt
import time
import random

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
client.connect("localhost", 1883)

print("Publishing fake sensor data... Press Ctrl+C to stop.")

try:
    while True:
        temp = round(random.uniform(25.0, 32.0), 2)
        client.publish("V1", temp)
        print(f"Sent Temp: {temp} to V1")
        time.sleep(5) 
except KeyboardInterrupt:
    print("Stopped simulation.")