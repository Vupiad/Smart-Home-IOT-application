import os
from .postgres_database_manager import PostgresManager
from ..database_manager import IDatabaseManager

class SQLFactory:
    @staticmethod
    def get_db_manager() -> IDatabaseManager:
        # Logic to choose the manager (e.g., based on an environment variable)
        db_type = os.getenv("DATABASE_TYPE", "postgres")
        
        if db_type == "postgres":
            return PostgresManager(dsn=os.getenv("POSTGRES_URL"))
        
        # Example: elif db_type == "sqlite": return SqliteManager(...)
        raise ValueError(f"Unsupported database type: {db_type}")

# Create the global instance
db_instance = SQLFactory.get_db_manager()