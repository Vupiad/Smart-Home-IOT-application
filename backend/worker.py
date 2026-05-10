import os
import asyncio
from dotenv import load_dotenv
load_dotenv()

# Local imports tailored for running inside the backend directory
from database.nosql.nosql_factory import nosql_instance
from database.nosql.mongo_sensor_repository import MongoSensorRepository
from services.mqtt_service import MqttService

async def main():
    print("\n" + "="*50)
    print(" [WORKER] Starting IoT Data Pipeline Worker")
    print("="*50)

    # Step 1: Initialize database connection
    try:
        await nosql_instance.connect()
        db = nosql_instance.get_db()
        if db is None:
            raise ValueError("Failed to obtain database instance from MongoManager.")
        repo = MongoSensorRepository(db)
        print(" [SUCCESS] Connected to MongoDB telemetry store.")
    except Exception as e:
        print(f" [CRITICAL] Could not connect to database: {e}")
        return

    # Step 2: Setup MQTT configuration
    config = {
        'host': os.getenv("MQTT_BROKER", "localhost"),
        'port': int(os.getenv("MQTT_PORT", 1883)),
        'user': os.getenv("MQTT_USER"),
        'pass': os.getenv("MQTT_PASS")
    }

    # Step 3: Initialize and setup MQTT service
    iot_worker = MqttService(config, repo)
    
    # CRITICAL: Assign the current async event loop so callbacks can save to MongoDB!
    loop = asyncio.get_running_loop()
    iot_worker.set_event_loop(loop)
    
    iot_worker.setup()
    iot_worker.start()
    
    print(f" [SUCCESS] MQTT Client connecting to {config['host']}:{config['port']}...")
    print(" [*] Pipeline fully ACTIVE. Waiting for device sensor logs...")
    print("="*50 + "\n")

    # Keep service alive
    try:
        while True:
            await asyncio.sleep(10)
    except asyncio.CancelledError:
        print(" [INFO] Worker cancellation received.")
    finally:
        await iot_worker.stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n [!] Worker explicitly stopped by User. Goodbye!")