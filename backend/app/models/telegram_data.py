"""
Database models for Telegram data.
"""

from datetime import datetime, UTC
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship

from app.core.database import Base


class TZDateTime(TypeDecorator):
    """Represents a timezone-aware datetime."""
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        """Convert timezone-aware datetime to UTC for storage."""
        if value is not None and value.tzinfo is not None:
            # Convert to UTC if not already
            value = value.astimezone(UTC)
            # SQLite doesn't store timezone info, so we strip it
            value = value.replace(tzinfo=None)
        return value

    def process_result_value(self, value, dialect):
        """Convert timezone-naive datetime from storage to UTC."""
        if value is not None:
            # Assume UTC and make timezone-aware
            value = value.replace(tzinfo=UTC)
        return value


class User(Base):
    """
    Model representing a Telegram API user.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    api_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(TZDateTime, default=lambda: datetime.now(UTC))
    
    # Relationship to Sync
    syncs = relationship("Sync", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, api_id='{self.api_id}')>" 