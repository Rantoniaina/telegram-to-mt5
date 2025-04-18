"""
Service for Sync operations.
"""

from datetime import datetime, UTC
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy import select

from app.models.sync import Sync, SyncState
from app.models.telegram_data import User

class SyncService:
    """
    Service for sync operations.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_sync(self, sync_id: int) -> Optional[Sync]:
        """Get a sync by ID."""
        return self.db.get(Sync, sync_id)
    
    def create_sync(self, user_id: int, discussion_name: str, state: SyncState = SyncState.ACTIVE) -> Sync:
        """Create a new sync."""
        sync = Sync(
            user_id=user_id,
            discussion_name=discussion_name,
            state=state
        )
        self.db.add(sync)
        self.db.commit()
        self.db.refresh(sync)
        return sync
    
    def update_sync(self, sync_id: int, **kwargs) -> Tuple[bool, Optional[Sync]]:
        """
        Update a sync by ID.
        
        Args:
            sync_id: The ID of the sync to update
            **kwargs: Fields to update (discussion_name, state)
            
        Returns:
            Tuple of (success, updated_sync)
        """
        sync = self.get_sync(sync_id)
        if not sync:
            return False, None
        
        # Update the provided fields
        for key, value in kwargs.items():
            if hasattr(sync, key) and key not in ['id', 'user_id', 'created_at']:
                setattr(sync, key, value)
        
        self.db.commit()
        self.db.refresh(sync)
        return True, sync
    
    def delete_sync(self, sync_id: int) -> bool:
        """Delete a sync by ID."""
        sync = self.get_sync(sync_id)
        if sync:
            self.db.delete(sync)
            self.db.commit()
            return True
        return False
    
    def get_all_syncs(self) -> List[Sync]:
        """Get all syncs."""
        return self.db.execute(select(Sync)).scalars().all()
    
    def get_user_syncs(self, user_id: int) -> List[Sync]:
        """Get all syncs for a specific user."""
        return self.db.execute(
            select(Sync).where(Sync.user_id == user_id)
        ).scalars().all()
    
    def get_syncs_by_state(self, state: SyncState) -> List[Sync]:
        """Get all syncs with a specific state."""
        return self.db.execute(
            select(Sync).where(Sync.state == state)
        ).scalars().all()
    
    def update_sync_state(self, sync_id: int, state: SyncState) -> Tuple[bool, Optional[Sync]]:
        """
        Update just the state of a sync.
        
        Args:
            sync_id: The ID of the sync to update
            state: The new state
            
        Returns:
            Tuple of (success, updated_sync)
        """
        return self.update_sync(sync_id, state=state)