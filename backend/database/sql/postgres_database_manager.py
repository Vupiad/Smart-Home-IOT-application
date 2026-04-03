import os
from typing import AsyncGenerator
from psycopg_pool import AsyncConnectionPool
from psycopg import AsyncConnection
from ..database_manager import IDatabaseManager

class PostgresManager(IDatabaseManager):
    def __init__(self, dsn: str):
        self.dsn = dsn
        self.pool = AsyncConnectionPool(
            conninfo=self.dsn,
            min_size=2,
            max_size=10,
            open=False,
            name="SmartHomePostgresPool"
        )

    async def connect(self) -> None:
        await self.pool.open()
        print(" [DB] PostgreSQL connection pool established.")

    async def disconnect(self) -> None:
        await self.pool.close()
        print(" [DB] PostgreSQL connection pool closed.")

    async def get_connection(self) -> AsyncGenerator[AsyncConnection, None]:
        async with self.pool.connection() as conn:
            yield conn