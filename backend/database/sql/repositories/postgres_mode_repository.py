from psycopg import AsyncConnection
from typing import Optional, List
from database.models.mode import Mode
from ...repository import IModeRepository
import json

class PostgresModeRepository(IModeRepository):
    def __init__(self, connection: AsyncConnection):
        self._conn = connection

    async def create(self, mode: Mode) -> Mode:
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO modes (user_id, name, actions)
                VALUES (%s, %s, %s)
                RETURNING id, created_at;
                """,
                (mode.user_id, mode.name, json.dumps(mode.actions))
            )
            res = await cur.fetchone()
            mode.id, mode.created_at = res[0], res[1]
            return mode

    async def get_by_id(self, mode_id: int) -> Optional[Mode]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, name, actions, is_active, created_at FROM modes WHERE id = %s",
                (mode_id,)
            )
            row = await cur.fetchone()
            if not row:
                return None
            return Mode(
                id=row[0], user_id=row[1], name=row[2],
                actions=row[3], is_active=row[4], created_at=row[5]
            )

    async def get_by_user(self, user_id: int) -> List[Mode]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, name, actions, is_active, created_at FROM modes WHERE user_id = %s",
                (user_id,)
            )
            rows = await cur.fetchall()
            return [Mode(
                id=r[0], user_id=r[1], name=r[2],
                actions=r[3], is_active=r[4], created_at=r[5]
            ) for r in rows]

    async def update(self, mode: Mode) -> Mode:
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                UPDATE modes
                SET user_id = %s, name = %s, actions = %s, is_active = %s
                WHERE id = %s
                RETURNING id, user_id, name, actions, is_active, created_at;
                """,
                (mode.user_id, mode.name, json.dumps(mode.actions), mode.is_active, mode.id)
            )
            result = await cur.fetchone()
            if not result:
                raise ValueError(f"Mode with id {mode.id} not found")
            
            mode.id = result[0]
            mode.user_id = result[1]
            mode.name = result[2]
            mode.actions = result[3]
            mode.is_active = result[4]
            mode.created_at = result[5]
            return mode

    async def delete(self, mode_id: int) -> bool:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "DELETE FROM modes WHERE id = %s",
                (mode_id,)
            )
            return cur.rowcount > 0

    async def list_all(self) -> List[Mode]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, user_id, name, actions, is_active, created_at FROM modes"
            )
            rows = await cur.fetchall()
            return [Mode(
                id=r[0], user_id=r[1], name=r[2],
                actions=r[3], is_active=r[4], created_at=r[5]
            ) for r in rows]