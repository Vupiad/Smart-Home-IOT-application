from typing import Optional
from psycopg import AsyncConnection
from models.user import User
from .repository import IUserRepository

class PostgresUserRepository(IUserRepository):
    def __init__(self, connection: AsyncConnection):
        self._conn = connection

    async def create(self, user: User) -> User:
        async with self._conn.cursor() as cur:
            await cur.execute(
                """
                INSERT INTO users (username, email, hashed_password)
                VALUES (%s, %s, %s)
                RETURNING id, created_at;
                """,
                (user.username, user.email, user.hashed_password)
            )
            result = await cur.fetchone()
            user.id = result[0]
            user.created_at = result[1]
            return user

    async def get_by_username(self, username: str) -> Optional[User]:
        async with self._conn.cursor() as cur:
            await cur.execute(
                "SELECT id, username, email, hashed_password, created_at FROM users WHERE username = %s",
                (username,)
            )
            row = await cur.fetchone()
            if not row:
                return None
            
            return User(
                id=row[0],
                username=row[1],
                email=row[2],
                hashed_password=row[3],
                created_at=row[4]
            )

    async def get_by_id(self, user_id: int) -> Optional[User]:
        # Implementation is similar to get_by_username...
        pass