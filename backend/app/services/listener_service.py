"""
Telegram Message Listener Service

Provides functionality to continuously listen for new messages in specific Telegram channels.
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any, Set, Union

from telethon import TelegramClient, events
from telethon.tl.types import Channel, Chat, User, Message, PeerChannel, PeerChat, PeerUser

from app.models.sync import SyncState
from app.services.telegram_service import TelegramService

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TelegramListenerService:
    """
    Service for listening to new messages in Telegram channels/chats.
    """
    def __init__(self, telegram_service: TelegramService):
        """
        Initialize the listener service with an existing TelegramService.
        
        Args:
            telegram_service: An initialized and connected TelegramService instance
        """
        self.telegram_service = telegram_service
        self.client = telegram_service.client
        self._active_listeners: Dict[int, asyncio.Task] = {}  # dialog_id -> task
        self._message_handlers: Dict[int, List[Callable[[Message], Any]]] = {}  # dialog_id -> list of handlers
        self._stop_events: Dict[int, asyncio.Event] = {}  # dialog_id -> stop event
        
    async def connect_with_credentials(self, api_id: int, api_hash: str, phone: Optional[str] = None) -> bool:
        """
        Connect to Telegram using provided credentials.
        
        Args:
            api_id: Telegram API ID
            api_hash: Telegram API hash
            phone: Phone number (optional if session exists)
            
        Returns:
            True if connected and authorized, False if verification needed
        """
        return await self.telegram_service.connect_with_credentials(api_id, api_hash, phone)
        
    async def start_listening(self, dialog_id: int, handler: Callable[[Message], Any]) -> bool:
        """
        Start listening to new messages in a specific dialog.
        
        Args:
            dialog_id: ID of the dialog to listen to
            handler: Callback function that will be called for each new message
            
        Returns:
            True if listening started successfully, False otherwise
        """
        # Check if we're already listening to this dialog
        if dialog_id in self._active_listeners and not self._active_listeners[dialog_id].done():
            # Just add the handler without starting a new listener
            if dialog_id not in self._message_handlers:
                self._message_handlers[dialog_id] = []
            self._message_handlers[dialog_id].append(handler)
            return True
            
        # Make sure we're connected
        if not self.client.is_connected():
            await self.telegram_service.connect()
            
        try:
            # Get the entity for this dialog
            entity = await self.client.get_entity(dialog_id)
            
            # Initialize handlers list for this dialog
            if dialog_id not in self._message_handlers:
                self._message_handlers[dialog_id] = []
            self._message_handlers[dialog_id].append(handler)
            
            # Create a stop event for this listener
            stop_event = asyncio.Event()
            self._stop_events[dialog_id] = stop_event
            
            # Start the listener task
            task = asyncio.create_task(self._listen_to_dialog(dialog_id, entity, stop_event))
            self._active_listeners[dialog_id] = task
            
            logger.info(f"Started listening to dialog: {getattr(entity, 'title', dialog_id)}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting listener for dialog {dialog_id}: {e}")
            return False
    
    async def stop_listening(self, dialog_id: int) -> bool:
        """
        Stop listening to a specific dialog.
        
        Args:
            dialog_id: ID of the dialog to stop listening to
            
        Returns:
            True if stopped successfully, False if not found or already stopped
        """
        if dialog_id not in self._active_listeners or self._active_listeners[dialog_id].done():
            return False
            
        # Signal the listener to stop
        self._stop_events[dialog_id].set()
        
        # Wait for the task to finish
        try:
            await asyncio.wait_for(self._active_listeners[dialog_id], timeout=5.0)
        except asyncio.TimeoutError:
            # Force cancel if it doesn't stop gracefully
            self._active_listeners[dialog_id].cancel()
            
        # Clean up
        del self._active_listeners[dialog_id]
        del self._message_handlers[dialog_id]
        del self._stop_events[dialog_id]
        
        logger.info(f"Stopped listening to dialog: {dialog_id}")
        return True
    
    async def stop_all_listeners(self) -> None:
        """Stop all active dialog listeners."""
        dialog_ids = list(self._active_listeners.keys())
        for dialog_id in dialog_ids:
            await self.stop_listening(dialog_id)
            
    async def _listen_to_dialog(self, dialog_id: int, entity: Union[Channel, Chat, User], stop_event: asyncio.Event) -> None:
        """
        Internal method that listens to new messages in a dialog.
        
        Args:
            dialog_id: ID of the dialog
            entity: Telegram entity (Channel, Chat, or User)
            stop_event: Event to signal when to stop listening
        """
        # Get the most recent message to use as a starting point
        messages = await self.telegram_service.get_messages_from_dialog(dialog_id, limit=1)
        last_message_id = messages[0]["id"] if messages else 0
        
        logger.info(f"Starting to listen from message ID {last_message_id} in dialog {dialog_id}")
        
        # Use event handler to listen for new messages
        @self.client.on(events.NewMessage(chats=[entity]))
        async def new_message_handler(event):
            # Only process messages newer than our starting point
            if event.message.id > last_message_id:
                # Call all registered handlers for this dialog
                for handler in self._message_handlers.get(dialog_id, []):
                    try:
                        await handler(event.message) if asyncio.iscoroutinefunction(handler) else handler(event.message)
                    except Exception as e:
                        logger.error(f"Error in message handler: {e}")
        
        try:
            # Keep the listener running until stopped
            while not stop_event.is_set():
                await asyncio.sleep(1)
        finally:
            # Remove the event handler when stopping
            self.client.remove_event_handler(new_message_handler)
    
    def is_listening(self, dialog_id: int) -> bool:
        """
        Check if we're currently listening to a specific dialog.
        
        Args:
            dialog_id: ID of the dialog to check
            
        Returns:
            True if listening, False otherwise
        """
        return (
            dialog_id in self._active_listeners and 
            not self._active_listeners[dialog_id].done()
        )
    
    def get_active_listeners(self) -> List[int]:
        """
        Get a list of all dialog IDs that are currently being listened to.
        
        Returns:
            List of dialog IDs
        """
        return [
            dialog_id for dialog_id, task in self._active_listeners.items()
            if not task.done()
        ] 