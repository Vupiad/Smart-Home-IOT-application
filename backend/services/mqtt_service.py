"""MQTT Service for IoT device communication."""

import paho.mqtt.client as mqtt
import asyncio
import json
import os
from typing import Any, Callable, Dict, Optional
from database.nosql.nosql_repository import IRepository


class MqttService:
    """
    MQTT client service for publishing and subscribing to device topics.
    
    Handles:
    - Connection to MQTT broker
    - Publishing device commands
    - Subscribing to sensor data
    - Managing device status updates
    """
    
    _instance: Optional['MqttService'] = None
    
    def __init__(self, broker_config: dict, repository: Optional[IRepository] = None):
        """
        Initialize MQTT service.
        
        Args:
            broker_config: Dict with 'host', 'port', 'user', 'pass'
            repository: Optional sensor data repository for MongoDB storage
        """
        self.config = broker_config
        self.repository = repository
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self._is_connected = False
        self._event_loop: Optional[asyncio.AbstractEventLoop] = None
        
        # Message handlers for different topics
        self._message_handlers: Dict[str, Callable] = {}
        
    @classmethod
    def get_instance(cls) -> 'MqttService':
        """Get singleton instance of MqttService."""
        if cls._instance is None:
            # Create default config from environment
            broker_config = {
                'host': os.getenv('MQTT_BROKER', 'localhost'),
                'port': int(os.getenv('MQTT_PORT', '1883')),
                'user': os.getenv('MQTT_USER'),
                'pass': os.getenv('MQTT_PASS')
            }
            cls._instance = cls(broker_config)
            cls._instance.setup()
        return cls._instance
        
    def setup(self):
        """Configure MQTT client with callbacks and TLS."""
        # Only use TLS if we are connecting to a cloud broker (port 8883)
        if self.config['port'] == 8883:
            self.client.tls_set()
        
        # Only set credentials if they are provided
        if self.config.get('user') and self.config.get('pass'):
            self.client.username_pw_set(self.config['user'], self.config['pass'])
            
        self.client.on_message = self._on_message
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
    def set_repository(self, repository: IRepository):
        """Set the repository for storing telemetry data."""
        self.repository = repository

    def _on_connect(self, client, userdata, flags, reason_code, properties):
        """Callback for when MQTT client connects."""
        if reason_code == 0:
            self._is_connected = True
            print(f" [MQTT] Connected to broker at {self.config['host']}:{self.config['port']}")
            # Subscribe to sensor and feedback topics
            self.client.subscribe([("yolohome/device/yolo_uno_01/telemetry", 0), ("yolohome/device/yolo_uno_01/ack", 1), ("yolohome/device/yolo_uno_01/state", 1)])
        else:
            print(f" [MQTT] Connection failed with code {reason_code}")

    def _on_disconnect(self, client, userdata, disconnect_flags, reason_code, properties):
        """Callback for when MQTT client disconnects."""
        self._is_connected = False
        if reason_code != 0:
            print(f" [MQTT] Unexpected disconnection: {reason_code}")

    def _on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages."""
        print(f" [MQTT] Received {msg.topic}: {msg.payload.decode()}")
        
        # Store sensor data if repository is available
        if self.repository and mqtt.topic_matches_sub("yolohome/device/yolo_uno_01/telemetry", msg.topic):

            try:
                payload = msg.payload.decode()
                
                # Run async function in event loop if available
                if self._event_loop:
                   
                    asyncio.run_coroutine_threadsafe(
                        self.repository.save(msg.topic, payload),
                        self._event_loop
                    )
               
            except Exception as e:
                print(f" [MQTT] Error saving telemetry data: {e}")
        
        # Call registered message handler if exists
        for registered_topic, handler in self._message_handlers.items():
            if mqtt.topic_matches_sub(registered_topic, msg.topic):
                try:
                    if self._event_loop:
                        asyncio.run_coroutine_threadsafe(handler(msg), self._event_loop)
                    else:
                        asyncio.run(handler(msg))
                except Exception as e:
                    print(f" [MQTT] Error in message handler for {msg.topic}: {e}")

    def start(self):
        """Start the MQTT client connection loop."""
        try:
            self.client.connect(self.config['host'], self.config['port'])
            self.client.loop_start()
            print(f" [MQTT] Client loop started")
        except Exception as e:
            print(f" [MQTT] Failed to start: {e}")

    async def stop(self) -> None:
        """Stop the MQTT client connection."""
        try:
            self.client.loop_stop()
            self.client.disconnect()
            self._is_connected = False
            print(" [MQTT] Client stopped")
        except Exception as e:
            print(f" [MQTT] Error stopping client: {e}")

 
    async def publish_to_topic(
        self,
        topic: str,
        payload: Any,
        qos: int = 1,
        retain: bool = False
    ) -> bool:
        """
        Publish message to arbitrary topic.
        
        Args:
            topic: MQTT topic path
            payload: Message to publish (dict or string)
            qos: Quality of Service level
            retain: Whether to retain the message
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Convert dict to JSON
            if isinstance(payload, dict):
                message = json.dumps(payload)
            else:
                message = str(payload)
            
            result = self.client.publish(topic, message, qos=qos, retain=retain)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                print(f" [MQTT] Published to {topic}: {message}")
                return True
            else:
                print(f" [MQTT] Publish failed: rc={result.rc}")
                return False
                
        except Exception as e:
            print(f" [MQTT] Error publishing to {topic}: {e}")
            return False

    def subscribe(self, topic: str, qos: int = 0) -> bool:
        """
        Subscribe to an MQTT topic.
        
        Args:
            topic: Topic pattern to subscribe to
            qos: Quality of Service level
            
        Returns:
            True if subscription successful
        """
        try:
            self.client.subscribe(topic, qos=qos)
            print(f" [MQTT] Subscribed to {topic}")
            return True
        except Exception as e:
            print(f" [MQTT] Error subscribing to {topic}: {e}")
            return False

    def register_message_handler(
        self,
        topic: str,
        handler: Callable
    ) -> None:
        """
        Register a handler for messages received on a topic.
        
        Args:
            topic: MQTT topic to register handler for
            handler: Async function that receives mqtt.MQTTMessage
        """
        self._message_handlers[topic] = handler
        print(f" [MQTT] Registered message handler for {topic}")

    def is_connected(self) -> bool:
        """Check if MQTT client is connected."""
        return self._is_connected

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Set the event loop for async operations."""
        self._event_loop = loop

    def get_client(self) -> mqtt.Client:
        """Get the underlying MQTT client."""
        return self.client

    @staticmethod
    def _get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat()
