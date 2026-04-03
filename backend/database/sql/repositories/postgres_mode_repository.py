from psycopg import AsyncConnection
from models.mode import UserMode
from .repository import IModeRepository
import json

class PostgresModeRepository(IModeRepository):
    def __init__(self, connection: AsyncConnection):
        self._conn = connection

    async def create(self, mode: UserMode) -> UserMode:
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

    async def get_by_user(self, user_id: int) -> list[UserMode]:
        async with self._conn.cursor() as cur:
            await cur.execute("SELECT * FROM modes WHERE user_id = %s", (user_id,))
            rows = await cur.fetchall()
            return [UserMode(id=r[0], user_id=r[1], name=r[2], 
                             actions=r[3], is_active=r[4], created_at=r[5]) for r in rows]