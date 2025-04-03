"""
Pydantic schemas for database operations.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    api_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True 