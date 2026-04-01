from fastapi import FastAPI
from api.v1.endpoints import sensors
from dotenv import load_dotenv
from database.postgres_db import engine, Base

load_dotenv()

app = FastAPI(title="Vũ's Smart Home API")

# Include the sensor routes under the /api/v1/sensors prefix
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Sensors"])

@app.get("/")
def read_root():
    return {"status": "Online", "owner": "Vũ"}




@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        # This creates all tables defined in models.py if they don't exist
        await conn.run_sync(Base.metadata.create_all)
    print(" [DB] PostgreSQL Tables Created/Verified.")