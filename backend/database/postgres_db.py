import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

# We use the 'postgresql+psycopg' dialect for Async compatibility
# Ensure your .env has: POSTGRES_URL=postgresql://user:pass@localhost:5432/dbname
DATABASE_URL = os.getenv("POSTGRES_URL", "").replace("postgresql://", "postgresql+psycopg://")

engine = create_async_engine(DATABASE_URL, echo=True) # echo=True shows SQL logs for debugging
SessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# Dependency to get DB session in FastAPI
async def get_db():
    async with SessionLocal() as session:
        yield session