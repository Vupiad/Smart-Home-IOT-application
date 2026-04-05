import os
from .postgres_database_manager import PostgresManager
from ..database_manager import IDatabaseManager

class SQLFactory:
    @staticmethod
    def get_db_manager() -> IDatabaseManager:
        """
        Factory method to select and instantiate the appropriate database manager.
        
        Supports multiple backends via DATABASE_TYPE environment variable:
        - "postgres": PostgreSQL with async connection pooling (default)
        - "json": JSON file storage for single-user deployments
        
        Returns:
            IDatabaseManager implementation matching the configured database type
            
        Raises:
            ValueError: If DATABASE_TYPE is not supported
        """
        db_type = os.getenv("DATABASE_TYPE", "postgres")
        
        if db_type == "postgres":
            return PostgresManager(dsn=os.getenv("POSTGRES_URL"))
        
        elif db_type == "json":
            from ..json.json_database_manager import JsonDatabaseManager
            data_file = os.getenv("DATA_FILE_PATH", "backend/data.json")
            return JsonDatabaseManager(file_path=data_file)
        
        raise ValueError(f"Unsupported database type: {db_type}. Supported: postgres, json")

# Create the global instance
db_instance = SQLFactory.get_db_manager()