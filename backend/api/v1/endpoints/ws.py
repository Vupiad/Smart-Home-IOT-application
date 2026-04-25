"""WebSocket endpoint for real-time telemetry and device updates."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.websocket_service import WebSocketManager

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates.
    
    Broadcasts two event types to all connected clients:
    - telemetry_update: sensor data (temperature, humidity, light)
    - device_update: device state changes (on/off, speed, color, etc.)
    """
    manager = WebSocketManager.get_instance()
    await manager.connect(websocket)

    try:
        # Keep the connection alive; listen for client messages (ping/pong)
        while True:
            data = await websocket.receive_text()
            # Clients can send a ping, we respond with pong
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
