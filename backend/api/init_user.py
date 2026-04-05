"""User initialization utilities for creating default accounts."""

from typing import Optional
from models.user import User
from api.security import hash_password
from backend.database.json.json_user_repository import JsonUserRepository
from backend.database.sql.repositories.postgres_user_repository import PostgresUserRepository
from backend.database.json.json_connection import JsonConnection
from psycopg import AsyncConnection
import asyncio
import os


async def create_default_user(user_repo) -> User:
    """
    Create a default user account if it doesn't exist.
    
    Default credentials:
    - username: admin
    - password: admin123
    - email: admin@smarthome.local
    
    Args:
        user_repo: User repository instance (can be JSON or Postgres)
        
    Returns:
        Default user (created or existing)
    """
    username = "admin"
    
    # Check if user already exists
    existing_user = await user_repo.get_by_username(username)
    if existing_user:
        print(f" [AUTH] Default user '{username}' already exists (user_id={existing_user.id})")
        return existing_user
    
    # Create new default user
    default_user = User(
        username=username,
        email="admin@smarthome.local",
        hashed_password=hash_password("admin123")
    )
    
    created_user = await user_repo.create(default_user)
    print(f" [AUTH] Default user '{username}' created (user_id={created_user.id})")
    return created_user


async def initialize_default_user(db_instance) -> Optional[User]:
    """
    Initialize default user using the configured database backend.
    
    Args:
        db_instance: Database manager instance from factory
        
    Returns:
        Default user, or None if initialization failed
    """
    try:
        # Get a connection from the database pool
        async for conn in db_instance.get_connection():
            # Determine which repository to use based on connection type
            db_type = os.getenv("DATABASE_TYPE", "postgres")
            
            if db_type == "json":
                user_repo = JsonUserRepository(conn)
            else:
                user_repo = PostgresUserRepository(conn)
            
            user = await create_default_user(user_repo)
            return user
    except Exception as e:
        print(f" [AUTH] Error creating default user: {str(e)}")
        return None
