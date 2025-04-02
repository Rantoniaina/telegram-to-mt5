"""
Telegram Discussions Retrieval Service

Provides functionality to connect to Telegram and retrieve discussions, messages, etc.
"""

import os
import sys
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable, Union

from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError
from telethon.tl.types import Channel, Chat, User, Message
from telethon.tl.functions.messages import GetDialogsRequest
from telethon.tl.types import InputPeerEmpty

class TelegramService:
    def __init__(
        self, 
        api_id: int, 
        api_hash: str, 
        phone: Optional[str] = None,
        session_name: str = "telegram_session",
        code_callback: Optional[Callable[[], str]] = None,
        password_callback: Optional[Callable[[], str]] = None
    ):
        """
        Initialize the Telegram service with API credentials.
        
        Args:
            api_id: Telegram API ID from https://my.telegram.org
            api_hash: Telegram API hash from https://my.telegram.org
            phone: Phone number in international format (optional if session exists)
            session_name: Name for the session file
            code_callback: Function to get verification code (for API usage)
            password_callback: Function to get 2FA password (for API usage)
        """
        self.api_id = api_id
        self.api_hash = api_hash
        self.phone = phone
        self.session_name = session_name
        self.code_callback = code_callback
        self.password_callback = password_callback
        self.client = TelegramClient(session_name, api_id, api_hash)
        self.phone_code_hash = None  # Store phone code hash for sign-in
    
    async def connect(self) -> None:
        """Connect to Telegram and handle authentication if needed."""
        # Ensure client is connected
        if not self.client.is_connected():
            await self.client.connect()
        
        if not await self.client.is_user_authorized():
            if not self.phone:
                raise ValueError("Phone number is required for first-time authentication")
            
            # Send code and store the phone_code_hash
            result = await self.client.send_code_request(self.phone)
            self.phone_code_hash = result.phone_code_hash
            
            # For the API to handle, we'll raise an exception to indicate verification is needed
            raise ValueError("Verification code required. Please check your phone.")
    
    async def sign_in_with_code(self, code: str) -> None:
        """
        Sign in with a verification code.
        
        Args:
            code: Verification code received on the phone
        """
        if not self.phone:
            raise ValueError("Phone number is required for authentication")
        
        # Ensure client is connected
        if not self.client.is_connected():
            await self.client.connect()
        
        try:
            await self.client.sign_in(self.phone, code, phone_code_hash=self.phone_code_hash)
        except SessionPasswordNeededError:
            # If 2FA is enabled, we need to handle it differently
            raise ValueError("Two-step verification is enabled. Password is required.")
    
    async def sign_in_with_password(self, code: str, password: str) -> None:
        """
        Sign in with a verification code and 2FA password.
        
        Args:
            code: Verification code received on the phone
            password: Two-step verification password
        """
        if not self.phone:
            raise ValueError("Phone number is required for authentication")
        
        # Ensure client is connected
        if not self.client.is_connected():
            await self.client.connect()
            
        try:
            # First try to sign in with the code
            try:
                await self.client.sign_in(self.phone, code, phone_code_hash=self.phone_code_hash)
            except SessionPasswordNeededError:
                # If 2FA is enabled, use the password
                await self.client.sign_in(password=password)
        except Exception as e:
            raise ValueError(f"Authentication failed: {str(e)}")
    
    async def get_all_dialogs(self) -> List[Dict[str, Any]]:
        """
        Get all dialogs (chats, channels, groups) available to the user.
        
        Returns:
            List of dialog information dictionaries
        """
        result = []
        async for dialog in self.client.iter_dialogs():
            dialog_info = {
                "id": dialog.id,
                "name": dialog.name,
                "unread_count": dialog.unread_count,
                "type": self._get_entity_type(dialog.entity),
                "entity_id": dialog.entity.id
            }
            result.append(dialog_info)
        
        return result
    
    async def get_messages_from_dialog(
        self, 
        dialog_id: int, 
        limit: int = 100, 
        offset_id: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get messages from a specific dialog.
        
        Args:
            dialog_id: The ID of the dialog to get messages from
            limit: Maximum number of messages to retrieve
            offset_id: Message ID to start from (0 means most recent)
            
        Returns:
            List of message information dictionaries
        """
        entity = await self.client.get_entity(dialog_id)
        messages = []
        
        async for message in self.client.iter_messages(
            entity, 
            limit=limit, 
            offset_id=offset_id
        ):
            message_info = {
                "id": message.id,
                "date": message.date.isoformat(),
                "text": message.text,
                "sender_id": message.sender_id,
                "reply_to_msg_id": message.reply_to_msg_id,
                "has_media": bool(message.media),
                "views": getattr(message, "views", None),
                "forwards": getattr(message, "forwards", None)
            }
            
            # Get sender information if available
            if message.sender_id:
                try:
                    sender = await self.client.get_entity(message.sender_id)
                    message_info["sender"] = {
                        "id": sender.id,
                        "first_name": getattr(sender, "first_name", None),
                        "last_name": getattr(sender, "last_name", None),
                        "username": getattr(sender, "username", None),
                        "phone": getattr(sender, "phone", None),
                        "type": self._get_entity_type(sender)
                    }
                except Exception:
                    # Skip if sender can't be retrieved
                    pass
            
            messages.append(message_info)
        
        return messages
    
    async def search_messages(
        self, 
        query: str, 
        dialog_ids: Optional[List[int]] = None, 
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Search for messages containing specific text.
        
        Args:
            query: Text to search for
            dialog_ids: List of dialog IDs to search in (None for all)
            limit: Maximum number of results to return
            
        Returns:
            List of message information dictionaries
        """
        results = []
        
        if dialog_ids:
            for dialog_id in dialog_ids:
                try:
                    entity = await self.client.get_entity(dialog_id)
                    async for message in self.client.iter_messages(
                        entity, 
                        search=query, 
                        limit=limit
                    ):
                        results.append({
                            "dialog_id": dialog_id,
                            "message_id": message.id,
                            "date": message.date.isoformat(),
                            "text": message.text,
                            "sender_id": message.sender_id
                        })
                except Exception as e:
                    print(f"Error searching in dialog {dialog_id}: {e}")
        else:
            # Search globally if no dialog_ids specified
            async for message in self.client.iter_messages(
                None,
                search=query,
                limit=limit
            ):
                results.append({
                    "message_id": message.id,
                    "date": message.date.isoformat(),
                    "text": message.text,
                    "sender_id": message.sender_id
                })
                
        return results
    
    def _get_entity_type(self, entity) -> str:
        """Determine the type of a Telegram entity."""
        if isinstance(entity, Channel):
            return "channel" if entity.broadcast else "supergroup"
        elif isinstance(entity, Chat):
            return "group"
        elif isinstance(entity, User):
            return "user"
        else:
            return "unknown"
    
    async def disconnect(self) -> None:
        """Disconnect from Telegram."""
        await self.client.disconnect() 