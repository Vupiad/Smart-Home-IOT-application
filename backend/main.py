from fastapi import FastAPI
from api.v1.endpoints import sensors
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Vũ's Smart Home API")

# Include the sensor routes under the /api/v1/sensors prefix
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Sensors"])

@app.get("/")
def read_root():
    return {"status": "Online", "owner": "Vũ"}