"""
API endpoints for Telegram operations.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.schemas.telegram import TelegramCredentials, DialogResponse, MessageResponse, SearchRequest
from app.services.telegram_service import TelegramService
from app.services.db_service import DatabaseService
from app.core.database import get_db

# Dictionary to store active client sessions
active_sessions = {}
# Dictionary to store pending verification sessions
pending_verifications = {}

router = APIRouter(prefix="/telegram", tags=["telegram"])

# Additional schema for verification code
class VerificationRequest(BaseModel):
    credentials: TelegramCredentials
    code: str
    password: Optional[str] = None

class VerificationResponse(BaseModel):
    success: bool
    needs_password: bool = False

class ConnectResponse(BaseModel):
    success: bool
    needs_verification: bool = False

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
        # Check if the error indicates verification code is needed
        error_message = str(e)
        if "verification code" in error_message.lower():
            # Store the session for later verification
            pending_verifications[session_id] = service
            raise HTTPException(
                status_code=401,
                detail="Verification code required. Please submit the code sent to your phone."
            )
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

async def cleanup_session(session_id: str) -> None:
    """Clean up a Telegram session."""
    if session_id in active_sessions:
        service = active_sessions[session_id]
        await service.disconnect()
        del active_sessions[session_id]
    
    if session_id in pending_verifications:
        service = pending_verifications[session_id]
        await service.disconnect()
        del pending_verifications[session_id]

# --- API Endpoints ---
@router.post("/connect", response_model=ConnectResponse)
async def connect_to_telegram(
    credentials: TelegramCredentials,
    db: Session = Depends(get_db)
):
    """Connect to Telegram using API credentials."""
    try:
        session_id = f"{credentials.api_id}_{credentials.api_hash}"
        
        # If this session is in pending verifications, return needs_verification
        if session_id in pending_verifications:
            return ConnectResponse(success=True, needs_verification=True)
            
        service = await get_telegram_service(credentials)
        
        # Save the user's API ID to the database
        db_service = DatabaseService(db)
        db_service.create_user_if_not_exists(str(credentials.api_id))
        
        return ConnectResponse(success=True)
    except HTTPException as e:
        if e.status_code == 401 and "verification code" in e.detail.lower():
            return ConnectResponse(success=False, needs_verification=True)
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify_code", response_model=VerificationResponse)
async def verify_code(
    verification_request: VerificationRequest,
    db: Session = Depends(get_db)
):
    """Verify Telegram code sent to the user's phone."""
    credentials = verification_request.credentials
    session_id = f"{credentials.api_id}_{credentials.api_hash}"
    
    try:
        # Get the pending service
        if session_id not in pending_verifications:
            raise HTTPException(status_code=400, detail="No pending verification for these credentials")
        
        service = pending_verifications[session_id]
        
        # Try to sign in with the code
        try:
            if verification_request.password:
                # Sign in with 2FA
                await service.sign_in_with_password(verification_request.code, verification_request.password)
            else:
                # Sign in with code only
                await service.sign_in_with_code(verification_request.code)
                
            # Move the service from pending to active
            active_sessions[session_id] = service
            del pending_verifications[session_id]
            
            # Save the user's API ID to the database
            db_service = DatabaseService(db)
            db_service.create_user_if_not_exists(str(credentials.api_id))
            
            return VerificationResponse(success=True)
        except Exception as e:
            error_message = str(e)
            if "2fa" in error_message.lower() or "two-step verification" in error_message.lower():
                return VerificationResponse(success=False, needs_password=True)
            raise
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Verification failed: {str(e)}")

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