"""
Tests for the WebSocket implementation in api/v1/websocket.py
"""

import unittest
import asyncio
import json
from unittest.mock import MagicMock, patch, AsyncMock
from uuid import uuid4

import pytest
from fastapi import WebSocket, WebSocketDisconnect
from telethon.tl.types import Message, User, PeerChannel

from app.api.v1.websocket import ConnectionManager, router
from app.schemas.telegram import TelegramCredentials


class TestConnectionManager(unittest.TestCase):
    """Tests for the ConnectionManager class in websocket.py"""
    
    def setUp(self):
        """Set up test environment before each test"""
        self.manager = ConnectionManager()
        
    def test_init(self):
        """Test ConnectionManager initialization"""
        # Verify attributes are initialized properly
        self.assertEqual(self.manager.active_connections, {})
        self.assertEqual(self.manager.dialog_subscribers, {})
        self.assertEqual(self.manager.client_subscriptions, {})
        self.assertIsNone(self.manager.listener_service)
        self.assertEqual(self.manager.client_credentials, {})
        
    @pytest.mark.asyncio
    async def test_connect(self):
        """Test connecting a client"""
        # Mock WebSocket
        mock_websocket = AsyncMock()
        client_id = "test_client"
        
        # Call connect
        await self.manager.connect(mock_websocket, client_id)
        
        # Verify
        mock_websocket.accept.assert_called_once()
        self.assertEqual(self.manager.active_connections[client_id], mock_websocket)
        self.assertEqual(self.manager.client_subscriptions[client_id], [])
        
    def test_disconnect(self):
        """Test disconnecting a client"""
        # Setup test data
        client_id = "test_client"
        dialog_id = 123
        
        # Setup connections and subscriptions
        self.manager.active_connections[client_id] = MagicMock()
        self.manager.client_subscriptions[client_id] = [dialog_id]
        self.manager.dialog_subscribers[dialog_id] = [client_id]
        
        # Call disconnect
        self.manager.disconnect(client_id)
        
        # Verify cleanup
        self.assertNotIn(client_id, self.manager.active_connections)
        self.assertNotIn(client_id, self.manager.client_subscriptions)
        self.assertNotIn(dialog_id, self.manager.dialog_subscribers)

    def test_disconnect_with_multiple_subscribers(self):
        """Test disconnecting a client when other subscribers exist for the dialog"""
        # Setup test data
        client_id1 = "test_client1"
        client_id2 = "test_client2"
        dialog_id = 123
        
        # Setup connections and subscriptions
        self.manager.active_connections[client_id1] = MagicMock()
        self.manager.active_connections[client_id2] = MagicMock()
        self.manager.client_subscriptions[client_id1] = [dialog_id]
        self.manager.client_subscriptions[client_id2] = [dialog_id]
        self.manager.dialog_subscribers[dialog_id] = [client_id1, client_id2]
        
        # Call disconnect for one client
        self.manager.disconnect(client_id1)
        
        # Verify cleanup
        self.assertNotIn(client_id1, self.manager.active_connections)
        self.assertNotIn(client_id1, self.manager.client_subscriptions)
        self.assertIn(client_id2, self.manager.dialog_subscribers[dialog_id])
        self.assertIn(dialog_id, self.manager.dialog_subscribers)
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_no_listener(self):
        """Test subscribing to dialog without listener service"""
        client_id = "test_client"
        dialog_id = 123
        
        # Call subscribe with no listener service
        result = await self.manager.subscribe_to_dialog(client_id, dialog_id)
        
        # Verify failure
        self.assertFalse(result)
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_with_listener(self):
        """Test subscribing to dialog with listener service"""
        # Setup
        client_id = "test_client"
        dialog_id = 123
        
        # Create mock listener service
        mock_listener = AsyncMock()
        mock_listener.is_listening.return_value = False
        mock_listener.start_listening.return_value = True
        mock_listener.telegram_service = MagicMock()
        
        self.manager.listener_service = mock_listener
        
        # Call subscribe
        result = await self.manager.subscribe_to_dialog(client_id, dialog_id)
        
        # Verify
        self.assertTrue(result)
        self.assertIn(client_id, self.manager.dialog_subscribers[dialog_id])
        self.assertIn(dialog_id, self.manager.client_subscriptions[client_id])
        mock_listener.is_listening.assert_called_once_with(dialog_id)
        mock_listener.start_listening.assert_called_once()
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_already_subscribed(self):
        """Test subscribing to a dialog when already subscribed"""
        # Setup
        client_id = "test_client"
        dialog_id = 123
        
        # Create mock listener service
        mock_listener = AsyncMock()
        mock_listener.is_listening.return_value = True
        mock_listener.telegram_service = MagicMock()
        
        self.manager.listener_service = mock_listener
        self.manager.dialog_subscribers[dialog_id] = [client_id]
        self.manager.client_subscriptions[client_id] = [dialog_id]
        
        # Call subscribe again
        result = await self.manager.subscribe_to_dialog(client_id, dialog_id)
        
        # Verify
        self.assertTrue(result)
        # Lists should contain the client_id only once
        self.assertEqual(self.manager.dialog_subscribers[dialog_id].count(client_id), 1)
        self.assertEqual(self.manager.client_subscriptions[client_id].count(dialog_id), 1)
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_with_listener_failure(self):
        """Test subscribing to dialog with listener service that fails to start listening"""
        # Setup
        client_id = "test_client"
        dialog_id = 123
        
        # Create mock listener service that fails to start listening
        mock_listener = AsyncMock()
        mock_listener.is_listening.return_value = False
        mock_listener.start_listening.return_value = False
        mock_listener.telegram_service = MagicMock()
        
        self.manager.listener_service = mock_listener
        
        # Call subscribe
        result = await self.manager.subscribe_to_dialog(client_id, dialog_id)
        
        # Verify
        self.assertFalse(result)
        # Verify the dialog_id was not added to subscribers
        self.assertNotIn(dialog_id, self.manager.dialog_subscribers)
        self.assertNotIn(dialog_id, self.manager.client_subscriptions.get(client_id, []))
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_by_name(self):
        """Test subscribing to dialog by name"""
        # Setup
        client_id = "test_client"
        dialog_name = "Test Dialog"
        dialog_id = 123
        dialog_info = {
            "id": dialog_id,
            "name": dialog_name,
            "type": "group"
        }
        
        # Create mock listener service
        mock_listener = AsyncMock()
        mock_listener.telegram_service = MagicMock()
        mock_listener.telegram_service.get_dialog_by_name = AsyncMock(return_value=dialog_info)
        mock_listener.is_listening.return_value = False
        mock_listener.start_listening.return_value = True
        
        self.manager.listener_service = mock_listener
        
        # Call method
        result = await self.manager.subscribe_to_dialog_by_name(client_id, dialog_name)
        
        # Verify
        self.assertTrue(result["success"])
        self.assertEqual(result["dialog"], dialog_info)
        mock_listener.telegram_service.get_dialog_by_name.assert_called_once_with(dialog_name)
        self.assertIn(client_id, self.manager.dialog_subscribers[dialog_id])
        self.assertIn(dialog_id, self.manager.client_subscriptions[client_id])
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_by_name_not_found(self):
        """Test subscribing to dialog by name when dialog not found"""
        # Setup
        client_id = "test_client"
        dialog_name = "Nonexistent Dialog"
        
        # Create mock listener service
        mock_listener = AsyncMock()
        mock_listener.telegram_service = MagicMock()
        mock_listener.telegram_service.get_dialog_by_name = AsyncMock(return_value=None)
        
        self.manager.listener_service = mock_listener
        
        # Call method
        result = await self.manager.subscribe_to_dialog_by_name(client_id, dialog_name)
        
        # Verify
        self.assertFalse(result["success"])
        self.assertIn("Dialog not found", result["error"])
        mock_listener.telegram_service.get_dialog_by_name.assert_called_once_with(dialog_name)
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_by_name_no_listener(self):
        """Test subscribing to dialog by name without a listener service"""
        # Setup
        client_id = "test_client"
        dialog_name = "Test Dialog"
        
        # No listener service
        self.manager.listener_service = None
        
        # Call method
        result = await self.manager.subscribe_to_dialog_by_name(client_id, dialog_name)
        
        # Verify
        self.assertFalse(result["success"])
        self.assertIn("Listener service not initialized", result["error"])
        
    @pytest.mark.asyncio
    async def test_subscribe_to_dialog_by_name_exception(self):
        """Test subscribing to dialog by name with an exception"""
        # Setup
        client_id = "test_client"
        dialog_name = "Test Dialog"
        
        # Create mock listener service that raises an exception
        mock_listener = AsyncMock()
        mock_listener.telegram_service = MagicMock()
        mock_listener.telegram_service.get_dialog_by_name = AsyncMock(side_effect=Exception("Test error"))
        
        self.manager.listener_service = mock_listener
        
        # Call method
        result = await self.manager.subscribe_to_dialog_by_name(client_id, dialog_name)
        
        # Verify
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Test error")
        
    @pytest.mark.asyncio
    async def test_message_handler(self):
        """Test processing and broadcasting messages"""
        # Mock message and sender
        mock_message = AsyncMock(spec=Message)
        mock_message.chat_id = 123
        mock_message.id = 456
        mock_message.text = "Test message"
        mock_message.date = asyncio.datetime.now()
        mock_message.media = None
        
        mock_sender = MagicMock(spec=User)
        mock_sender.id = 789
        mock_sender.first_name = "Test"
        mock_sender.last_name = "User"
        mock_sender.username = "testuser"
        
        mock_message.get_sender = AsyncMock(return_value=mock_sender)
        
        # Setup subscribers
        client_id = "test_client"
        dialog_id = mock_message.chat_id
        mock_websocket = AsyncMock()
        
        self.manager.active_connections[client_id] = mock_websocket
        self.manager.dialog_subscribers[dialog_id] = [client_id]
        
        # Call message handler
        await self.manager.message_handler(mock_message)
        
        # Verify message was sent to the client
        mock_websocket.send_json.assert_called_once()
        call_args = mock_websocket.send_json.call_args[0][0]
        self.assertEqual(call_args["event"], "new_message")
        self.assertEqual(call_args["dialog_id"], dialog_id)
        self.assertEqual(call_args["message"]["id"], mock_message.id)
        self.assertEqual(call_args["message"]["text"], mock_message.text)
        
    @pytest.mark.asyncio
    async def test_message_handler_without_chat_id(self):
        """Test processing a message without a chat_id attribute"""
        # Mock message without chat_id
        mock_message = AsyncMock(spec=Message)
        # Intentionally not setting chat_id
        
        # Call message handler
        await self.manager.message_handler(mock_message)
        
        # Verify no errors and nothing happens
        # This is a negative test - we're just verifying the method doesn't crash
        
    @pytest.mark.asyncio
    async def test_broadcast_to_dialog_subscribers(self):
        """Test broadcasting a message to dialog subscribers"""
        # Setup
        dialog_id = 123
        client1 = "client1"
        client2 = "client2"
        message = {"event": "test_event", "data": "test_data"}
        
        # Setup active connections
        mock_websocket1 = AsyncMock()
        mock_websocket2 = AsyncMock()
        self.manager.active_connections = {
            client1: mock_websocket1,
            client2: mock_websocket2
        }
        
        # Setup subscribers
        self.manager.dialog_subscribers[dialog_id] = [client1, client2]
        
        # Call broadcast
        await self.manager.broadcast_to_dialog_subscribers(dialog_id, message)
        
        # Verify
        mock_websocket1.send_json.assert_called_once_with(message)
        mock_websocket2.send_json.assert_called_once_with(message)
        
    @pytest.mark.asyncio
    async def test_broadcast_to_nonexistent_dialog(self):
        """Test broadcasting to a dialog with no subscribers"""
        # Setup
        dialog_id = 123  # This dialog has no subscribers
        message = {"event": "test_event", "data": "test_data"}
        
        # Call broadcast
        await self.manager.broadcast_to_dialog_subscribers(dialog_id, message)
        
        # Verify nothing happens (negative test)
        # This test passes if no exception is raised
        
    @pytest.mark.asyncio
    async def test_broadcast_with_sending_error(self):
        """Test broadcasting with an error when sending to a client"""
        # Setup
        dialog_id = 123
        client1 = "client1"
        client2 = "client2"
        message = {"event": "test_event", "data": "test_data"}
        
        # Setup active connections, one will fail
        mock_websocket1 = AsyncMock()
        mock_websocket1.send_json = AsyncMock(side_effect=Exception("Connection lost"))
        
        mock_websocket2 = AsyncMock()
        
        self.manager.active_connections = {
            client1: mock_websocket1,
            client2: mock_websocket2
        }
        
        # Setup subscribers
        self.manager.dialog_subscribers[dialog_id] = [client1, client2]
        
        # We'll patch the disconnect method to verify it gets called
        self.manager.disconnect = MagicMock()
        
        # Call broadcast
        await self.manager.broadcast_to_dialog_subscribers(dialog_id, message)
        
        # Verify client1 was disconnected due to error
        self.manager.disconnect.assert_called_once_with(client1)
        # Verify client2 still got the message
        mock_websocket2.send_json.assert_called_once_with(message)
        
    @pytest.mark.asyncio
    async def test_unsubscribe_from_dialog(self):
        """Test unsubscribing from a dialog"""
        # Setup
        client_id = "test_client"
        dialog_id = 123
        
        mock_listener = AsyncMock()
        self.manager.listener_service = mock_listener
        
        self.manager.dialog_subscribers[dialog_id] = [client_id]
        self.manager.client_subscriptions[client_id] = [dialog_id]
        
        # Call unsubscribe
        result = await self.manager.unsubscribe_from_dialog(client_id, dialog_id)
        
        # Verify
        self.assertTrue(result)
        self.assertEqual(self.manager.dialog_subscribers[dialog_id], [])
        self.assertEqual(self.manager.client_subscriptions[client_id], [])
        mock_listener.stop_listening.assert_called_once_with(dialog_id)
        
    @pytest.mark.asyncio
    async def test_unsubscribe_from_nonexistent_dialog(self):
        """Test unsubscribing from a dialog that doesn't exist"""
        # Setup
        client_id = "test_client"
        dialog_id = 999  # This dialog doesn't exist
        
        # Call unsubscribe
        result = await self.manager.unsubscribe_from_dialog(client_id, dialog_id)
        
        # Verify
        self.assertFalse(result)
        
    @pytest.mark.asyncio
    async def test_initialize_listener_service_new(self):
        """Test initializing listener service with new credentials"""
        # Setup
        client_id = "test_client"
        credentials = TelegramCredentials(
            api_id=12345,
            api_hash="test_hash",
            phone="+1234567890"
        )
        
        # Mock TelegramService
        with patch('app.api.v1.websocket.TelegramService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service_class.return_value = mock_service
            
            # Mock TelegramListenerService
            with patch('app.api.v1.websocket.TelegramListenerService') as mock_listener_class:
                # Call initialize
                result = await self.manager.initialize_listener_service(client_id, credentials)
                
                # Verify
                self.assertTrue(result["success"])
                self.assertFalse(result["needs_verification"])
                mock_service_class.assert_called_once_with(
                    api_id=credentials.api_id,
                    api_hash=credentials.api_hash,
                    phone=credentials.phone
                )
                mock_service.connect.assert_called_once()
                mock_listener_class.assert_called_once_with(mock_service)
                self.assertEqual(self.manager.client_credentials[client_id], credentials)
    
    @pytest.mark.asyncio
    async def test_initialize_listener_service_existing(self):
        """Test using existing listener service with new credentials"""
        # Setup
        client_id = "test_client"
        credentials = TelegramCredentials(
            api_id=12345,
            api_hash="test_hash",
            phone="+1234567890"
        )
        
        # Create an existing listener service
        self.manager.listener_service = AsyncMock()
        self.manager.listener_service.connect_with_credentials = AsyncMock(return_value=True)
        
        # Call initialize
        result = await self.manager.initialize_listener_service(client_id, credentials)
        
        # Verify
        self.assertTrue(result["success"])
        self.assertFalse(result["needs_verification"])
        self.manager.listener_service.connect_with_credentials.assert_called_once_with(
            credentials.api_id, credentials.api_hash, credentials.phone
        )
        
    @pytest.mark.asyncio
    async def test_initialize_listener_service_existing_needs_verification(self):
        """Test using existing listener service that needs verification"""
        # Setup
        client_id = "test_client"
        credentials = TelegramCredentials(
            api_id=12345,
            api_hash="test_hash",
            phone="+1234567890"
        )
        
        # Create an existing listener service
        self.manager.listener_service = AsyncMock()
        self.manager.listener_service.connect_with_credentials = AsyncMock(return_value=False)
        
        # Call initialize
        result = await self.manager.initialize_listener_service(client_id, credentials)
        
        # Verify
        self.assertFalse(result["success"])
        self.assertTrue(result["needs_verification"])
        self.manager.listener_service.connect_with_credentials.assert_called_once_with(
            credentials.api_id, credentials.api_hash, credentials.phone
        )
        
    @pytest.mark.asyncio
    async def test_initialize_listener_service_existing_exception(self):
        """Test exception when using existing listener service"""
        # Setup
        client_id = "test_client"
        credentials = TelegramCredentials(
            api_id=12345,
            api_hash="test_hash",
            phone="+1234567890"
        )
        
        # Create an existing listener service
        self.manager.listener_service = AsyncMock()
        self.manager.listener_service.connect_with_credentials = AsyncMock(
            side_effect=Exception("Authentication failed")
        )
        
        # Call initialize
        result = await self.manager.initialize_listener_service(client_id, credentials)
        
        # Verify
        self.assertFalse(result["success"])
        self.assertEqual(result["error"], "Authentication failed")
        self.manager.listener_service.connect_with_credentials.assert_called_once_with(
            credentials.api_id, credentials.api_hash, credentials.phone
        )
        
    @pytest.mark.asyncio
    async def test_initialize_listener_service_new_exception(self):
        """Test exception when creating new listener service"""
        # Setup
        client_id = "test_client"
        credentials = TelegramCredentials(
            api_id=12345,
            api_hash="test_hash",
            phone="+1234567890"
        )
        
        # Mock TelegramService to raise exception
        with patch('app.api.v1.websocket.TelegramService') as mock_service_class:
            mock_service = AsyncMock()
            mock_service.connect = AsyncMock(side_effect=Exception("Connection failed"))
            mock_service_class.return_value = mock_service
            
            # Call initialize
            result = await self.manager.initialize_listener_service(client_id, credentials)
            
            # Verify
            self.assertFalse(result["success"])
            self.assertEqual(result["error"], "Connection failed")
            mock_service_class.assert_called_once_with(
                api_id=credentials.api_id,
                api_hash=credentials.api_hash,
                phone=credentials.phone
            )
            mock_service.connect.assert_called_once()


# WebSocket endpoint tests are more complex and require integration testing
# For unit testing, we focus on the ConnectionManager class
@pytest.mark.skip("Websocket endpoint tests require integration testing")
@pytest.mark.asyncio
async def test_websocket_messages_endpoint():
    """
    Test the websocket messages endpoint.
    This test is skipped as WebSocket endpoints are better tested with integration tests.
    """
    pass 