"""
Database models for Sync operations.
"""

from datetime import datetime, UTC
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.telegram_data import TZDateTime, User


class SyncState(str, Enum):
    """
    Possible states for a sync operation.
    """
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"
    STOPPED = "STOPPED"


class Sync(Base):
    """
    Model representing a sync operation.
    """
    __tablename__ = "syncs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    discussion_name = Column(String(255), nullable=False)
    state = Column(SQLEnum(SyncState), default=SyncState.ACTIVE, nullable=False)
    created_at = Column(TZDateTime, default=lambda: datetime.now(UTC))
    updated_at = Column(TZDateTime, default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC))
    
    # Relationship to User
    user = relationship("User", back_populates="syncs")
    
    def __repr__(self):
        return f"<Sync(id={self.id}, user_id={self.user_id}, discussion_name='{self.discussion_name}', state={self.state})>" 