from fastapi import Depends
from database.sql.database_factory import db_instance
from database.nosql.nosql_factory import nosql_instance
from database.sql.repositories.postgres_user_repository import PostgresUserRepository
from database.sql.repositories.postgres_device_repository import PostgresDeviceRepository
from database.sql.repositories.postgres_mode_repository import PostgresModeRepository
from database.nosql.mongo_sensor_repository import MongoSensorRepository

async def get_user_repo(conn = Depends(db_instance.get_connection)):
    return PostgresUserRepository(conn)

async def get_device_repo(conn = Depends(db_instance.get_connection)):
    return PostgresDeviceRepository(conn)

async def get_mode_repo(conn = Depends(db_instance.get_connection)):
    return PostgresModeRepository(conn)

async def get_sensor_repo(db = Depends(nosql_instance.get_db)):
    return MongoSensorRepository(db)
    