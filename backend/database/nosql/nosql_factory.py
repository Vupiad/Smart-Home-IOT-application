import os
from .mongo_database_manager import MongoManager
from database.database_manager import IDatabaseManager

class NoSQLFactory:
    @staticmethod
    def get_manager() -> IDatabaseManager:
        # We can toggle this via .env for local testing without Docker
        db_type = os.getenv("NOSQL_TYPE", "mongo")
        
        if db_type == "mongo":
            return MongoManager(
                uri=os.getenv("MONGO_URL"),
                db_name="smarthome_telemetry"
            )
        
        # If you ever want to use a Mock for unit tests:
        # elif db_type == "mock": return MockNoSQLManager()
        
        raise ValueError(f"Unsupported NoSQL type: {db_type}")

# Create the global instance
nosql_instance = NoSQLFactory.get_manager()