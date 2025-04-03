"""
Database service for interacting with the SQLite database.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from app.models.telegram_data import User

class DatabaseService:
    """
    Service for database operations.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user(self, api_id: str) -> Optional[User]:
        """Get a user by API ID."""
        return self.db.query(User).filter(User.api_id == api_id).first()
        
    def create_user_if_not_exists(self, api_id: str) -> User:
        """Create a new user if it doesn't exist."""
        user = self.get_user(api_id)
        
        if not user:
            # Create new user
            user = User(api_id=api_id)
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            
        return user
    
    def get_all_users(self) -> List[User]:
        """Get all users."""
        return self.db.query(User).all()
        
    def delete_user(self, api_id: str) -> bool:
        """Delete a user by API ID."""
        user = self.get_user(api_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return True
        return False 