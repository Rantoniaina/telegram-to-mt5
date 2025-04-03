"""
Database models for Telegram data.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime

from app.core.database import Base

class User(Base):
    """
    Model representing a Telegram API user.
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    api_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(id={self.id}, api_id='{self.api_id}')>" 