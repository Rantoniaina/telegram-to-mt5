"""
API endpoints for Telegram operations.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.schemas.telegram import TelegramCredentials, DialogResponse, MessageResponse, SearchRequest
from app.services.telegram_service import TelegramService

# Dictionary to store active client sessions
active_sessions = {}

router = APIRouter(prefix="/telegram", tags=["telegram"])

# --- Helper Functions ---
async def get_telegram_service(credentials: TelegramCredentials) -> TelegramService:
    """Create a new TelegramService instance or retrieve an existing one."""
    # Use a combination of api_id and api_hash as a session identifier
    session_id = f"{credentials.api_id}_{credentials.api_hash}"
    
    if session_id in active_sessions:
        return active_sessions[session_id]
    
    # Create a new service
    service = TelegramService(
        api_id=credentials.api_id,
        api_hash=credentials.api_hash,
        phone=credentials.phone,
    )
    
    try:
        # Connect to Telegram
        await service.connect()
        active_sessions[session_id] = service
        return service
    except Exception as e:
        await service.disconnect()
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def cleanup_session(session_id: str) -> None:
    """Clean up a Telegram session."""
    if session_id in active_sessions:
        service = active_sessions[session_id]
        await service.disconnect()
        del active_sessions[session_id]

# --- API Endpoints ---
@router.post("/connect", response_model=Dict[str, bool])
async def connect_to_telegram(credentials: TelegramCredentials):
    """Connect to Telegram using API credentials."""
    try:
        service = await get_telegram_service(credentials)
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/disconnect")
async def disconnect_from_telegram(credentials: TelegramCredentials, background_tasks: BackgroundTasks):
    """Disconnect from Telegram."""
    session_id = f"{credentials.api_id}_{credentials.api_hash}"
    background_tasks.add_task(cleanup_session, session_id)
    return {"success": True}

@router.post("/dialogs", response_model=List[DialogResponse])
async def get_dialogs(credentials: TelegramCredentials):
    """Get all dialogs (chats, channels, groups)."""
    service = await get_telegram_service(credentials)
    try:
        dialogs = await service.get_all_dialogs()
        return dialogs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/messages/{dialog_id}", response_model=List[MessageResponse])
async def get_messages(
    dialog_id: int, 
    credentials: TelegramCredentials, 
    limit: int = 100, 
    offset_id: int = 0
):
    """Get messages from a specific dialog."""
    service = await get_telegram_service(credentials)
    try:
        messages = await service.get_messages_from_dialog(dialog_id, limit, offset_id)
        return messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search", response_model=List[Dict[str, Any]])
async def search_messages(search_request: SearchRequest, credentials: TelegramCredentials):
    """Search for messages containing specific text."""
    service = await get_telegram_service(credentials)
    try:
        results = await service.search_messages(
            search_request.query, 
            search_request.dialog_ids, 
            search_request.limit
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 