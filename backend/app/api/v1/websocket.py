"""
WebSocket API endpoints for real-time updates.
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from uuid import uuid4
from datetime import datetime
import base64

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException, status
from telethon.tl.types import Message
from pydantic import BaseModel

from app.services import TelegramService, TelegramListenerService
from app.api.v1.telegram import get_telegram_service, active_sessions
from app.schemas.telegram import TelegramCredentials

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/ws", tags=["websocket"])

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # client_id -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
        # dialog_id -> List[client_id]
        self.dialog_subscribers: Dict[int, List[str]] = {}
        # client_id -> List[dialog_id]
        self.client_subscriptions: Dict[str, List[int]] = {}
        # Global TelegramListenerService instance
        self.listener_service: Optional[TelegramListenerService] = None
        # Store client credentials
        self.client_credentials: Dict[str, TelegramCredentials] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Register new WebSocket connection."""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.client_subscriptions[client_id] = []
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str) -> None:
        """Remove WebSocket connection."""
        # Clean up subscriptions
        if client_id in self.client_subscriptions:
            for dialog_id in self.client_subscriptions[client_id]:
                if dialog_id in self.dialog_subscribers:
                    if client_id in self.dialog_subscribers[dialog_id]:
                        self.dialog_subscribers[dialog_id].remove(client_id)
                    # Clean up empty lists
                    if not self.dialog_subscribers[dialog_id]:
                        del self.dialog_subscribers[dialog_id]
            del self.client_subscriptions[client_id]
        
        # Remove connection
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        logger.info(f"Client {client_id} disconnected")
    
    async def subscribe_to_dialog(self, client_id: str, dialog_id: int) -> bool:
        """Subscribe client to dialog updates."""
        # Initialize listener service if needed
        if not self.listener_service or not hasattr(self.listener_service, 'telegram_service'):
            logger.error("Listener service not initialized")
            return False
        
        # Register client as subscriber for this dialog
        if dialog_id not in self.dialog_subscribers:
            self.dialog_subscribers[dialog_id] = []
        
        if client_id not in self.dialog_subscribers[dialog_id]:
            self.dialog_subscribers[dialog_id].append(client_id)
        
        # Track subscriptions for this client
        if client_id not in self.client_subscriptions:
            self.client_subscriptions[client_id] = []
        
        if dialog_id not in self.client_subscriptions[client_id]:
            self.client_subscriptions[client_id].append(dialog_id)
        
        # Start listening to dialog if not already
        if not self.listener_service.is_listening(dialog_id):
            success = await self.listener_service.start_listening(
                dialog_id, self.message_handler
            )
            if not success:
                logger.error(f"Failed to start listening to dialog {dialog_id}")
                return False
        
        logger.info(f"Client {client_id} subscribed to dialog {dialog_id}")
        return True
    
    async def subscribe_to_dialog_by_name(self, client_id: str, dialog_name: str) -> dict:
        """
        Subscribe client to dialog updates using dialog name instead of ID.
        
        Args:
            client_id: ID of the client
            dialog_name: Name of the dialog to subscribe to
            
        Returns:
            Dictionary with success status and dialog information if found
        """
        # Initialize listener service if needed
        if not self.listener_service or not hasattr(self.listener_service, 'telegram_service'):
            logger.error("Listener service not initialized")
            return {"success": False, "error": "Listener service not initialized"}
        
        # Find dialog by name
        try:
            dialog = await self.listener_service.telegram_service.get_dialog_by_name(dialog_name)
            if not dialog:
                logger.error(f"Dialog not found: {dialog_name}")
                return {"success": False, "error": f"Dialog not found: {dialog_name}"}
            
            dialog_id = dialog["id"]
            
            # Subscribe to the dialog
            success = await self.subscribe_to_dialog(client_id, dialog_id)
            if success:
                return {"success": True, "dialog": dialog}
            else:
                return {"success": False, "error": f"Failed to subscribe to dialog: {dialog_name}"}
        except Exception as e:
            logger.error(f"Error subscribing to dialog by name: {e}")
            return {"success": False, "error": str(e)}
    
    async def unsubscribe_from_dialog(self, client_id: str, dialog_id: int) -> bool:
        """Unsubscribe client from dialog updates."""
        if dialog_id in self.dialog_subscribers and client_id in self.dialog_subscribers[dialog_id]:
            self.dialog_subscribers[dialog_id].remove(client_id)
            
            # Remove dialog from client subscriptions
            if client_id in self.client_subscriptions and dialog_id in self.client_subscriptions[client_id]:
                self.client_subscriptions[client_id].remove(dialog_id)
            
            # If no subscribers left, stop listening
            if not self.dialog_subscribers[dialog_id] and self.listener_service:
                await self.listener_service.stop_listening(dialog_id)
                del self.dialog_subscribers[dialog_id]
            
            logger.info(f"Client {client_id} unsubscribed from dialog {dialog_id}")
            return True
        
        return False
    
    async def broadcast_to_dialog_subscribers(self, dialog_id: int, message: Dict[str, Any]) -> None:
        """Send message to all subscribers of a dialog."""
        if dialog_id not in self.dialog_subscribers:
            return
        
        disconnect_list = []
        for client_id in self.dialog_subscribers[dialog_id]:
            if client_id in self.active_connections:
                try:
                    await self.active_connections[client_id].send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to client {client_id}: {e}")
                    disconnect_list.append(client_id)
            else:
                disconnect_list.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnect_list:
            self.disconnect(client_id)
    
    async def message_handler(self, message: Message) -> None:
        """Process new Telegram messages and broadcast to subscribers."""
        if not hasattr(message, 'chat_id'):
            return
        
        dialog_id = message.chat_id
        
        # Convert message to dict for JSON serialization
        sender = await message.get_sender()
        
        message_data = {
            "event": "new_message",
            "dialog_id": dialog_id,
            "message": {
                "id": message.id,
                "text": message.text,
                "date": message.date.isoformat(),
                "sender": {
                    "id": sender.id if sender else None,
                    "first_name": getattr(sender, "first_name", None),
                    "last_name": getattr(sender, "last_name", None),
                    "username": getattr(sender, "username", None)
                },
                "has_media": bool(message.media)
            }
        }
        
        # Send to all subscribers
        await self.broadcast_to_dialog_subscribers(dialog_id, message_data)

    # Add a method to create and initialize a listener service with credentials
    async def initialize_listener_service(self, client_id: str, credentials: TelegramCredentials) -> Dict[str, Any]:
        """Initialize the listener service with provided credentials."""
        # Check if we already have a listener service
        if self.listener_service:
            # Try to connect with credentials
            try:
                success = await self.listener_service.connect_with_credentials(
                    credentials.api_id, 
                    credentials.api_hash, 
                    credentials.phone
                )
                return {
                    "success": success,
                    "needs_verification": not success and credentials.phone is not None
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": str(e)
                }
        else:
            # Create new telegram service with provided credentials
            telegram_service = TelegramService(
                api_id=credentials.api_id,
                api_hash=credentials.api_hash,
                phone=credentials.phone
            )
            
            try:
                # Try to connect
                await telegram_service.connect()
                
                # Connection successful, initialize listener
                self.listener_service = TelegramListenerService(telegram_service)
                # Store the credentials for this client
                self.client_credentials[client_id] = credentials
                
                return {
                    "success": True,
                    "needs_verification": False
                }
            except Exception as e:
                # Check if verification needed
                error_message = str(e)
                if "verification code" in error_message.lower():
                    # Store service for later use
                    self.listener_service = TelegramListenerService(telegram_service)
                    # Store the credentials for this client
                    self.client_credentials[client_id] = credentials
                    
                    return {
                        "success": False,
                        "needs_verification": True,
                        "error": "Verification code required"
                    }
                else:
                    # Other error
                    await telegram_service.disconnect()
                    return {
                        "success": False,
                        "error": error_message
                    }

# Create global connection manager
manager = ConnectionManager()

@router.websocket("/messages")
async def websocket_messages(
    websocket: WebSocket,
    client_id: Optional[str] = Query(None),
    api_id: Optional[int] = Query(None),
    api_hash: Optional[str] = Query(None),
    phone: Optional[str] = Query(None)
):
    """
    WebSocket endpoint for real-time message updates.
    
    Connect to this endpoint to receive real-time updates for Telegram messages.
    Authentication is handled through URL parameters:
    
    ```
    /v1/ws/messages?client_id=1234&api_id=12345&api_hash=abcdef&phone=+123456789
    ```
    
    After connecting, you can subscribe to dialogs:
    
    ```json
    {
        "action": "subscribe",
        "dialog_id": 123456789
    }
    ```
    
    To subscribe using dialog name instead of ID:
    ```json
    {
        "action": "subscribe_by_name",
        "dialog_name": "Dialog Name"
    }
    ```
    
    To unsubscribe:
    ```json
    {
        "action": "unsubscribe",
        "dialog_id": 123456789
    }
    ```
    
    If verification is needed:
    ```json
    {
        "action": "verify",
        "code": "12345",
        "password": "optional_2fa_password"
    }
    ```
    
    You will receive messages in this format:
    ```json
    {
        "event": "new_message",
        "dialog_id": 123456789,
        "message": {
            "id": 123,
            "text": "Message content",
            "date": "2023-07-01T12:34:56+00:00",
            "sender": {
                "id": 987654321,
                "first_name": "John",
                "last_name": "Doe",
                "username": "johndoe"
            },
            "has_media": false
        }
    }
    ```
    """
    # Generate client ID if not provided
    if not client_id:
        client_id = str(uuid4())
    
    try:
        # Accept connection and register it (accepts the connection inside the connect method)
        await manager.connect(websocket, client_id)
        
        # Send connection info
        await websocket.send_json({
            "event": "connected",
            "client_id": client_id
        })
        
        # Check if credentials were provided as URL parameters
        if api_id and api_hash:
            # Create credentials object
            credentials = TelegramCredentials(
                api_id=api_id,
                api_hash=api_hash,
                phone=phone
            )
            
            # Try to authenticate
            result = await manager.initialize_listener_service(client_id, credentials)
            
            # Send authentication result
            if result["success"]:
                await websocket.send_json({
                    "event": "authenticated",
                    "success": True
                })
            elif result.get("needs_verification", False):
                await websocket.send_json({
                    "event": "verification_needed",
                    "success": False,
                    "message": "Please provide the verification code sent to your phone"
                })
            else:
                await websocket.send_json({
                    "event": "authentication_failed",
                    "success": False,
                    "message": result.get("error", "Unknown error")
                })
        
        # Listen for messages
        while True:
            # Wait for client messages
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # Handle authentication and credentials (for backward compatibility)
                if "action" in message and message["action"] == "authenticate":
                    if "credentials" in message:
                        try:
                            credentials = TelegramCredentials(**message["credentials"])
                            result = await manager.initialize_listener_service(client_id, credentials)
                            
                            if result["success"]:
                                await websocket.send_json({
                                    "event": "authenticated",
                                    "success": True
                                })
                            elif result.get("needs_verification", False):
                                await websocket.send_json({
                                    "event": "verification_needed",
                                    "success": False,
                                    "message": "Please provide the verification code sent to your phone"
                                })
                            else:
                                await websocket.send_json({
                                    "event": "authentication_failed",
                                    "success": False,
                                    "message": result.get("error", "Unknown error")
                                })
                        except Exception as e:
                            await websocket.send_json({
                                "event": "authentication_failed",
                                "success": False,
                                "message": f"Invalid credentials: {str(e)}"
                            })
                    else:
                        await websocket.send_json({
                            "event": "authentication_failed",
                            "success": False,
                            "message": "No credentials provided"
                        })
                
                # Handle verification code submission
                elif "action" in message and message["action"] == "verify":
                    if client_id in manager.client_credentials and "code" in message:
                        credentials = manager.client_credentials[client_id]
                        code = message["code"]
                        password = message.get("password")
                        
                        try:
                            if password:
                                await manager.listener_service.telegram_service.sign_in_with_password(code, password)
                            else:
                                await manager.listener_service.telegram_service.sign_in_with_code(code)
                            
                            await websocket.send_json({
                                "event": "authenticated",
                                "success": True
                            })
                        except Exception as e:
                            error_message = str(e)
                            if "2fa" in error_message.lower() or "two-step verification" in error_message.lower():
                                await websocket.send_json({
                                    "event": "verification_needed",
                                    "success": False,
                                    "needs_password": True,
                                    "message": "Two-step verification is enabled. Please provide your password."
                                })
                            else:
                                await websocket.send_json({
                                    "event": "authentication_failed",
                                    "success": False,
                                    "message": f"Verification failed: {error_message}"
                                })
                    else:
                        await websocket.send_json({
                            "event": "authentication_failed",
                            "success": False,
                            "message": "No pending verification or missing code"
                        })
                
                # Handle subscribe/unsubscribe actions
                elif "action" in message and "dialog_id" in message:
                    dialog_id = int(message["dialog_id"])
                    
                    if message["action"] == "subscribe":
                        # Try to subscribe to the real dialog if we have a service
                        if manager.listener_service and manager.listener_service.telegram_service:
                            success = await manager.subscribe_to_dialog(client_id, dialog_id)
                            await websocket.send_json({
                                "event": "subscription_update",
                                "dialog_id": dialog_id,
                                "subscribed": success
                            })
                            
                            if not success:
                                # Send an error message if subscription failed
                                await websocket.send_json({
                                    "event": "error",
                                    "message": f"Failed to subscribe to dialog {dialog_id}. Please ensure you're authenticated to Telegram."
                                })
                        else:
                            # No telegram service available
                            await websocket.send_json({
                                "event": "subscription_update",
                                "dialog_id": dialog_id,
                                "subscribed": False
                            })
                            
                            await websocket.send_json({
                                "event": "error",
                                "message": "No active Telegram session found. Please authenticate with Telegram first."
                            })
                    
                    elif message["action"] == "unsubscribe":
                        success = await manager.unsubscribe_from_dialog(client_id, dialog_id)
                        await websocket.send_json({
                            "event": "subscription_update",
                            "dialog_id": dialog_id,
                            "subscribed": False
                        })
                
                # Handle subscribe by dialog name
                elif "action" in message and message["action"] == "subscribe_by_name" and "dialog_name" in message:
                    dialog_name = message["dialog_name"]
                    
                    # Try to subscribe to the dialog by name
                    if manager.listener_service and manager.listener_service.telegram_service:
                        result = await manager.subscribe_to_dialog_by_name(client_id, dialog_name)
                        
                        if result["success"]:
                            dialog = result["dialog"]
                            await websocket.send_json({
                                "event": "subscription_update",
                                "dialog_id": dialog["id"],
                                "dialog_name": dialog["name"],
                                "subscribed": True
                            })
                        else:
                            # Send an error message if subscription failed
                            await websocket.send_json({
                                "event": "error",
                                "message": result.get("error", f"Failed to subscribe to dialog {dialog_name}")
                            })
                    else:
                        # No telegram service available
                        await websocket.send_json({
                            "event": "error",
                            "message": "No active Telegram session found. Please authenticate with Telegram first."
                        })
                
                # Handle invalid actions
                else:
                    await websocket.send_json({
                        "event": "error",
                        "message": "Invalid message format or action"
                    })
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "event": "error",
                    "message": "Invalid JSON"
                })
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send_json({
                    "event": "error",
                    "message": f"Error processing request: {str(e)}"
                })
                
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)