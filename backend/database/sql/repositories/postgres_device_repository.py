from psycopg import AsyncConnection
from models.device import Device
from .repository import IDeviceRepository
import json

class PostgresDeviceRepository(IDeviceRepository):
    def __init__(self, connection: AsyncConnection):
        self._conn = connection

    async def create(self, device: Device) -> Device:
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO devices (owner_id, name, device_type, base_topic, settings)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, last_online;
                """,
                (device.owner_id, device.name, device.device_type, 
                 device.base_topic, json.dumps(device.settings))
            )
            res = await cur.fetchone()
            device.id, device.last_online = res[0], res[1]
            return device

    async def get_by_user(self, user_id: int) -> list[Device]:
        async with self._conn.cursor() as cur:
            await cur.execute("SELECT * FROM devices WHERE owner_id = %s", (user_id,))
            rows = await cur.fetchall()
            return [Device(id=r[0], owner_id=r[1], name=r[2], device_type=r[3], 
                           base_topic=r[4], settings=r[5], last_online=r[6]) for r in rows]