from psycopg import AsyncConnection
from typing import Optional, List
from database.models.device import Device
from ...repository import IDeviceRepository
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

    async def get_by_id(self, device_id: int) -> Optional[Device]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, owner_id, name, device_type, base_topic, settings, last_online FROM devices WHERE id = %s",
                (device_id,)
            )
            row = await cur.fetchone()
            if not row:
                return None
            return Device(
                id=row[0], owner_id=row[1], name=row[2], device_type=row[3],
                base_topic=row[4], settings=row[5], last_online=row[6]
            )

    async def get_by_user(self, user_id: int) -> List[Device]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, owner_id, name, device_type, base_topic, settings, last_online FROM devices WHERE owner_id = %s",
                (user_id,)
            )
            rows = await cur.fetchall()
            return [Device(
                id=r[0], owner_id=r[1], name=r[2], device_type=r[3],
                base_topic=r[4], settings=r[5], last_online=r[6]
            ) for r in rows]

    async def update(self, device: Device) -> Device:
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                UPDATE devices
                SET owner_id = %s, name = %s, device_type = %s, base_topic = %s, settings = %s
                WHERE id = %s
                RETURNING id, owner_id, name, device_type, base_topic, settings, last_online;
                """,
                (device.owner_id, device.name, device.device_type, device.base_topic,
                 json.dumps(device.settings), device.id)
            )
            result = await cur.fetchone()
            if not result:
                raise ValueError(f"Device with id {device.id} not found")
            
            device.id = result[0]
            device.owner_id = result[1]
            device.name = result[2]
            device.device_type = result[3]
            device.base_topic = result[4]
            device.settings = result[5]
            device.last_online = result[6]
            return device

    async def delete(self, device_id: int) -> bool:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM devices WHERE id = %s",
                (device_id,)
            )
            return cur.rowcount > 0

    async def list_all(self) -> List[Device]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, owner_id, name, device_type, base_topic, settings, last_online FROM devices"
            )
            rows = await cur.fetchall()
            return [Device(
                id=r[0], owner_id=r[1], name=r[2], device_type=r[3],
                base_topic=r[4], settings=r[5], last_online=r[6]
            ) for r in rows]