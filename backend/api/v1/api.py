from fastapi import APIRouter
from api.v1.endpoints import sensors, auth, devices, modes, device_control

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Device management endpoints
api_router.include_router(devices.router, prefix="/devices", tags=["Devices"])

# Device control endpoints (MQTT-based)
api_router.include_router(device_control.router, tags=["Device Control"])

# Mode/Automation endpoints
api_router.include_router(modes.router, prefix="/modes", tags=["Automation Modes"])

# Sensor data endpoints
api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])