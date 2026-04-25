from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from api.v1.endpoints import sensors, auth, devices, modes, device_control, profile, ws

from services.mqtt_service import MqttService

from dotenv import load_dotenv

import os

load_dotenv()

from database.sql.database_factory import db_instance
from database.nosql.nosql_factory import nosql_instance
from database.nosql.mongo_sensor_repository import MongoSensorRepository

app = FastAPI(
    title="Vũ's Smart Home API",
    description="IoT Smart Home Control System with JSON/PostgreSQL support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8081", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://127.0.0.1:8081"],
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Session middleware
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SESSION_SECRET", "super-secret-session-key-for-dev"),
    session_cookie="session",
    max_age=24 * 60 * 60
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(profile.router, prefix="/api/v1/profile", tags=["Profile"])
app.include_router(devices.router, prefix="/api/v1/devices", tags=["Devices"])
app.include_router(device_control.router, tags=["Device Control"])
app.include_router(modes.router, prefix="/api/v1/modes", tags=["Automation Modes"])
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Sensors"])
app.include_router(ws.router, tags=["WebSocket"])


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
            
        # Initialize NoSQL Database (MongoDB) for Telemetry
        await nosql_instance.connect()
        print(f" [SUCCESS] NoSQL Database connected")

        # Initialize MQTT service
        mqtt_broker = os.getenv("MQTT_BROKER", "localhost")
        mqtt_port = int(os.getenv("MQTT_PORT", "1883"))
        print(f" [CONFIG] MQTT Broker: {mqtt_broker}:{mqtt_port}")
        
        import asyncio
        mqtt_service = MqttService.get_instance()
        mqtt_service.set_repository(MongoSensorRepository(nosql_instance.get_db()))
        mqtt_service.set_event_loop(asyncio.get_running_loop())
        mqtt_service.start()
        print(f" [SUCCESS] MQTT Service connected")
        
        # Register sync handlers
        from services.sync_service import SyncService
        SyncService.register_sync_handlers(mqtt_service)
        
        # Start Scheduler
        from services.scheduler_service import scheduler_service
        scheduler_service.start()
        
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
    
    try:
        from services.scheduler_service import scheduler_service
        scheduler_service.stop()
    except Exception as e:
        print(f"[SHUTDOWN] Error stopping scheduler: {e}")
        
    mqtt_service = MqttService.get_instance()
    await mqtt_service.stop()
    print("[SHUTDOWN] MQTT Service stopped")
    
    db_type = os.getenv("DATABASE_TYPE", "postgres")
    if db_type == "postgres":
        await db_instance.disconnect()
        print("[SHUTDOWN] Database disconnected")
        
    await nosql_instance.disconnect()
    print("[SHUTDOWN] NoSQL Database disconnected")
    
    print("[SHUTDOWN] Goodbye!\n")
