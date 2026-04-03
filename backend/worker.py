import os
import asyncio
from dotenv import load_dotenv

# Absolute imports from your new folder structure
from backend.database.nosql.mongo_sensor_repository import MongoSensorRepository
from services.mqtt_service import MqttService

load_dotenv()

async def main():

    repo = MongoSensorRepository(
        uri=os.getenv("MONGO_URL"), 
        db_name="smarthome_telemetry"
    )

    config = {
        'host': os.getenv("MQTT_BROKER"),
        'port': int(os.getenv("MQTT_PORT", 8883)),
        'user': os.getenv("MQTT_USER"),
        'pass': os.getenv("MQTT_PASS")
    }


    iot_worker = MqttService(config, repo)
    iot_worker.setup()
    
    print(" [*] MQTT Worker is running")

    iot_worker.start()

if __name__ == "__main__":

    asyncio.run(main())