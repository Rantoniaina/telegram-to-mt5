"""
Pydantic schemas for database operations.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.models.sync import SyncState

class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    api_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class SyncBase(BaseModel):
    """Base schema for sync operations."""
    discussion_name: str
    state: SyncState = SyncState.ACTIVE

class SyncCreate(SyncBase):
    """Schema for creating a sync."""
    user_id: int

class SyncUpdate(BaseModel):
    """Schema for updating a sync."""
    discussion_name: Optional[str] = None
    state: Optional[SyncState] = None

class SyncResponse(SyncBase):
    """Schema for sync response."""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 