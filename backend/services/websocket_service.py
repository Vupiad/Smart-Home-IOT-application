"""WebSocket connection manager for broadcasting real-time events."""

import json
from typing import Dict, Any, List
from fastapi import WebSocket


class WebSocketManager:
    """
    Manages active WebSocket connections and broadcasts events.
    
    Supports broadcasting two event types:
    - telemetry_update: New sensor data (temperature, humidity, light)
    - device_update: Device state changes from MQTT ack/state topics
    """

    _instance: 'WebSocketManager' = None

    def __init__(self):
        self._connections: List[WebSocket] = []

    @classmethod
    def get_instance(cls) -> 'WebSocketManager':
        """Get singleton instance."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def connect(self, websocket: WebSocket):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self._connections.append(websocket)
        print(f" [WS] Client connected. Total: {len(self._connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if websocket in self._connections:
            self._connections.remove(websocket)
        print(f" [WS] Client disconnected. Total: {len(self._connections)}")

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a JSON message to all connected clients."""
        if not self._connections:
            return

        payload = json.dumps(message)
        disconnected: List[WebSocket] = []

        for ws in self._connections:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.append(ws)

        # Clean up broken connections
        for ws in disconnected:
            self.disconnect(ws)

    async def broadcast_telemetry(self, data: Dict[str, Any]):
        """Broadcast a telemetry update event."""
        await self.broadcast({
            "type": "telemetry_update",
            "data": data
        })

    async def broadcast_device_update(self, device_id: int, state: Dict[str, Any]):
        """Broadcast a device state update event."""
        await self.broadcast({
            "type": "device_update",
            "device_id": device_id,
            "state": state
        })
