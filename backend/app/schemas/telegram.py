"""
Pydantic schemas for the Telegram API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TelegramCredentials(BaseModel):
    """Telegram API credentials."""
    api_id: int = Field(description="Telegram API ID")
    api_hash: str = Field(description="Telegram API hash")
    phone: Optional[str] = Field(None, description="Phone number for authentication (if needed)")

class DialogResponse(BaseModel):
    """Dialog information model."""
    id: int
    name: str
    type: str
    entity_id: int
    unread_count: int

class MessageResponse(BaseModel):
    """Message information model."""
    id: int
    text: str
    date: str
    sender_id: Optional[int] = None
    sender: Optional[Dict[str, Any]] = None
    has_media: bool
    views: Optional[int] = None
    forwards: Optional[int] = None
    reply_to_msg_id: Optional[int] = None

class SearchRequest(BaseModel):
    """Message search request model."""
    query: str = Field(description="Text to search for")
    dialog_ids: Optional[List[int]] = Field(None, description="List of dialog IDs to search in (None for all)")
    limit: int = Field(100, description="Maximum number of results to return") 