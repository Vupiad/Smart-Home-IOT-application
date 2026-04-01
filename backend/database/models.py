from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.sql import func
from .postgres_db import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Device(Base):
    __tablename__ = "devices"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # e.g. "Bedroom Fan"
    device_type = Column(String, nullable=False) # 'fan', 'light', 'door'
    
    # MQTT Addressing
    base_topic = Column(String, unique=True, index=True) # e.g. "home/vũ/fan1"
    
    # Flexible Config (Speed, Brightness, etc.)
    settings = Column(MutableDict.as_mutable(JSONB), default={})
    
    owner_id = Column(Integer, ForeignKey("users.id"))

class Mode(Base):
    __tablename__ = "modes"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False) # e.g. "Sleep Mode"
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # List of device actions: [{"device_id": 1, "value": 0}, ...]
    actions = Column(MutableList.as_mutable(JSONB), default=[])
    is_active = Column(Boolean, default=False)