import paho.mqtt.client as mqtt
from database.nosql_repository import IRepository  # Import the interface for type hinting
class MqttService:
    def __init__(self, broker_config: dict, repository: IRepository):
        self.config = broker_config
        self.repository = repository # Dependency Injection
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        
    def setup(self):
        # Only use TLS if we are connecting to a cloud broker (port 8883)
        if self.config['port'] == 8883:
            self.client.tls_set()
        
        # Only set credentials if they are provided
        if self.config['user'] and self.config['pass']:
            self.client.username_pw_set(self.config['user'], self.config['pass'])
            
        self.client.on_message = self.on_message
        self.client.on_connect = self.on_connect

    def on_connect(self, client, userdata, flags, rc, props):
        print(f"[MQTT] Connected: {rc}")
        self.client.subscribe([("V1", 0), ("V2", 0), ("V3", 0)])

    def on_message(self, client, userdata, msg):
        print(f"[MQTT] Received {msg.topic}: {msg.payload.decode()}")
        import asyncio
        payload = msg.payload.decode()

        asyncio.run_coroutine_threadsafe(
            self.repository.save(msg.topic, payload), 
            asyncio.get_event_loop()
        )

    def start(self):
        self.client.connect(self.config['host'], self.config['port'])
        self.client.loop_forever()