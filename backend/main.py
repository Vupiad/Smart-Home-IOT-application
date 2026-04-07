from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from api.v1.endpoints import sensors, auth, devices, modes, device_control

from services.mqtt_service import MqttService

from dotenv import load_dotenv

import os

load_dotenv()

from database.sql.database_factory import db_instance

app = FastAPI(
    title="Vũ's Smart Home API",
    description="IoT Smart Home Control System with JSON/PostgreSQL support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["Devices"])
app.include_router(device_control.router, tags=["Device Control"])
app.include_router(modes.router, prefix="/api/v1/modes", tags=["Automation Modes"])
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Sensors"])


@app.get("/")
def read_root():
    """Health check endpoint."""
    db_type = os.getenv("DATABASE_TYPE", "postgres")
    return {
        "status": "Online",
        "owner": "Vũ",
        "database": db_type,
        "message": "Smart Home IoT API is running"
    }


@app.get("/health")
async def health_check():
    """Health check with database initialization status."""
    return {
        "status": "healthy",
        "database": os.getenv("DATABASE_TYPE", "postgres"),
        "environment": os.getenv("ENVIRONMENT", "development")
    }


@app.on_event("startup")
async def startup_event():
    """Initialize database, MQTT service, and create default user."""
    print("\n" + "="*60)
    print(" [STARTUP] Smart Home IoT Application Starting")
    print("="*60)
    
    db_type = os.getenv("DATABASE_TYPE", "postgres")
    print(f" [CONFIG] Database Type: {db_type}")
    
    try:
        # Initialize database
        if db_type == "postgres":
            await db_instance.connect()
            print(f" [SUCCESS] Database connection pool initialized")

        # Initialize MQTT service
        mqtt_broker = os.getenv("MQTT_BROKER", "localhost")
        mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
        print(f" [CONFIG] MQTT Broker: {mqtt_broker}:{mqtt_port}")
        
        mqtt_service = MqttService.get_instance()
        mqtt_service.start()
        print(f" [SUCCESS] MQTT Service connected")
        
  
        print(" [STARTUP] All systems initialized")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f" [ERROR] Startup failed: {str(e)}")
        print("="*60 + "\n")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on application shutdown."""
    print("\n[SHUTDOWN] Closing connections...")
    mqtt_service = MqttService.get_instance()
    await mqtt_service.stop()
    print("[SHUTDOWN] MQTT Service stopped")
    
    db_type = os.getenv("DATABASE_TYPE", "postgres")
    if db_type == "postgres":
        await db_instance.disconnect()
        print("[SHUTDOWN] Database disconnected")
    
    print("[SHUTDOWN] Goodbye!\n")
