"""
API endpoints for sync operations.
"""

from typing import List
from fastapi import APIRouter, Depends, Body, HTTPException, Path
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.sync import Sync, SyncState
from app.services.sync_service import SyncService
from app.schemas.db import SyncResponse, SyncCreate, SyncUpdate

router = APIRouter(prefix="/sync", tags=["sync"])

# Helper function to get sync service
def get_sync_service(db: Session = Depends(get_db)) -> SyncService:
    return SyncService(db)

@router.get("/", response_model=List[SyncResponse])
async def get_all_syncs(
    db_service: SyncService = Depends(get_sync_service)
):
    """Get all syncs stored in the database."""
    return db_service.get_all_syncs()

@router.get("/user/{user_id}", response_model=List[SyncResponse])
async def get_user_syncs(
    user_id: int = Path(..., description="The ID of the user"),
    db_service: SyncService = Depends(get_sync_service)
):
    """Get all syncs for a specific user."""
    return db_service.get_user_syncs(user_id)

@router.get("/state/{state}", response_model=List[SyncResponse])
async def get_syncs_by_state(
    state: str, 
    db_service: SyncService = Depends(get_sync_service)
):
    """
    Get all syncs with a specific state.
    """
    # Convert string to enum
    try:
        state_enum = SyncState(state)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state value. Must be one of: {', '.join([s.value for s in SyncState])}"
        )
    
    syncs = db_service.get_syncs_by_state(state_enum)
    return syncs

@router.get("/{sync_id}", response_model=SyncResponse)
async def get_sync(
    sync_id: int = Path(..., description="The ID of the sync to get"),
    db_service: SyncService = Depends(get_sync_service)
):
    """Get a specific sync by ID."""
    sync = db_service.get_sync(sync_id)
    if not sync:
        raise HTTPException(status_code=404, detail="Sync not found")
    return sync

@router.post("/", response_model=SyncResponse)
async def create_sync(
    sync_data: SyncCreate,
    db_service: SyncService = Depends(get_sync_service)
):
    """Create a new sync."""
    return db_service.create_sync(
        user_id=sync_data.user_id,
        discussion_name=sync_data.discussion_name,
        state=sync_data.state
    )

@router.put("/{sync_id}", response_model=SyncResponse)
async def update_sync(
    sync_id: int = Path(..., description="The ID of the sync to update"),
    sync_data: SyncUpdate = Body(...),
    db_service: SyncService = Depends(get_sync_service)
):
    """Update a sync by ID."""
    # Filter out None values to only update provided fields
    update_data = {k: v for k, v in sync_data.model_dump().items() if v is not None}
    
    success, sync = db_service.update_sync(sync_id, **update_data)
    if not success:
        raise HTTPException(status_code=404, detail="Sync not found")
    return sync

@router.put("/{sync_id}/state/{state}", response_model=SyncResponse)
async def update_sync_state(
    sync_id: int, 
    state: str, 
    db_service: SyncService = Depends(get_sync_service)
):
    """
    Update the state of a sync.
    """
    # Convert string to enum
    try:
        state_enum = SyncState(state)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid state value. Must be one of: {', '.join([s.value for s in SyncState])}"
        )
    
    success, sync = db_service.update_sync_state(sync_id, state_enum)
    
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Sync not found"
        )
    
    return sync

@router.delete("/{sync_id}")
async def delete_sync(
    sync_id: int = Path(..., description="The ID of the sync to delete"),
    db_service: SyncService = Depends(get_sync_service)
):
    """Delete a sync by ID."""
    success = db_service.delete_sync(sync_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sync not found")
    return {"detail": "Sync deleted successfully"} 