from fastapi import APIRouter
from api.v1.endpoints import sensors

api_router = APIRouter()

#api_router.include_router(auth.router, prefix="/auth", tags=["login"])
api_router.include_router(sensors.router, prefix="/sensors", tags=["data"])