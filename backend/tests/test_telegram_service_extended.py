"""
Extended tests for the services/telegram_service.py module.

This file contains additional tests that cover methods
not covered in the original test_telegram_service.py.
"""

import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime
import asyncio

import pytest
from telethon.errors import SessionPasswordNeededError
from telethon.tl.types import Channel, Chat, User, Message, Dialog, InputPeerEmpty

from app.services.telegram_service import TelegramService


class TestTelegramServiceExtended(unittest.TestCase):
    """Additional tests for the TelegramService class."""
    
    def setUp(self):
        """Set up test environment before each test."""
        with patch('app.services.telegram_service.TelegramClient'):
            self.service = TelegramService(
                api_id=12345,
                api_hash="test_hash",
                phone="+1234567890",
                session_name="test_session"
            )
            
            # Mock the client
            self.service.client = AsyncMock()
    
    @pytest.mark.asyncio
    async def test_connect_already_authorized(self):
        """Test connection when already authorized."""
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.is_user_authorized.return_value = True
        
        # Call connect
        await self.service.connect()
        
        # Verify client methods were called
        self.service.client.connect.assert_called_once()
        self.service.client.is_user_authorized.assert_called_once()
        self.service.client.send_code_request.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_connect_needs_auth_no_phone(self):
        """Test connection with no phone when auth is needed."""
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.is_user_authorized.return_value = False
        
        # Remove phone number
        self.service.phone = None
        
        # Call connect and expect error
        with self.assertRaises(ValueError) as context:
            await self.service.connect()
            
        self.assertIn("Phone number is required", str(context.exception))
        self.service.client.connect.assert_called_once()
        self.service.client.is_user_authorized.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_connect_needs_auth_with_phone(self):
        """Test connection with phone when auth is needed."""
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.is_user_authorized.return_value = False
        
        # Mock code request response
        mock_result = MagicMock()
        mock_result.phone_code_hash = "test_hash"
        self.service.client.send_code_request.return_value = mock_result
        
        # Call connect and expect error for verification code
        with self.assertRaises(ValueError) as context:
            await self.service.connect()
            
        self.assertIn("Verification code required", str(context.exception))
        self.service.client.connect.assert_called_once()
        self.service.client.is_user_authorized.assert_called_once()
        self.service.client.send_code_request.assert_called_once_with(self.service.phone)
        self.assertEqual(self.service.phone_code_hash, "test_hash")
    
    @pytest.mark.asyncio
    async def test_connect_with_credentials_new_client(self):
        """Test connecting with new credentials that require a new client."""
        # Setup
        new_api_id = 67890
        new_api_hash = "new_hash"
        new_phone = "+9876543210"
        
        with patch('app.services.telegram_service.TelegramClient') as mock_client_class:
            # Mock client behavior
            mock_client = AsyncMock()
            mock_client.is_connected.return_value = False
            mock_client.is_user_authorized.return_value = True
            mock_client_class.return_value = mock_client
            
            # Call method
            result = await self.service.connect_with_credentials(new_api_id, new_api_hash, new_phone)
            
            # Verify
            self.assertTrue(result)
            self.assertEqual(self.service.api_id, new_api_id)
            self.assertEqual(self.service.api_hash, new_api_hash)
            self.assertEqual(self.service.phone, new_phone)
            mock_client_class.assert_called_once()
            mock_client.connect.assert_called_once()
            mock_client.is_user_authorized.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_connect_with_credentials_needs_verification(self):
        """Test connecting with credentials that need verification."""
        # Setup
        api_id = 12345
        api_hash = "test_hash"
        phone = "+1234567890"
        
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.is_user_authorized.return_value = False
        
        # Mock code request response
        mock_result = MagicMock()
        mock_result.phone_code_hash = "test_hash"
        self.service.client.send_code_request.return_value = mock_result
        
        # Call method
        result = await self.service.connect_with_credentials(api_id, api_hash, phone)
        
        # Verify
        self.assertFalse(result)  # False because verification needed
        self.service.client.connect.assert_called_once()
        self.service.client.is_user_authorized.assert_called_once()
        self.service.client.send_code_request.assert_called_once_with(phone)
        self.assertEqual(self.service.phone_code_hash, "test_hash")
    
    @pytest.mark.asyncio
    async def test_sign_in_with_code(self):
        """Test sign in with verification code."""
        # Setup
        code = "12345"
        self.service.phone_code_hash = "test_hash"
        
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        
        # Call method
        await self.service.sign_in_with_code(code)
        
        # Verify
        self.service.client.connect.assert_called_once()
        self.service.client.sign_in.assert_called_once_with(
            self.service.phone, code, phone_code_hash=self.service.phone_code_hash
        )
    
    @pytest.mark.asyncio
    async def test_sign_in_with_code_2fa_required(self):
        """Test sign in with code when 2FA is required."""
        # Setup
        code = "12345"
        self.service.phone_code_hash = "test_hash"
        
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.sign_in.side_effect = SessionPasswordNeededError(None)
        
        # Call method and expect error
        with self.assertRaises(ValueError) as context:
            await self.service.sign_in_with_code(code)
            
        self.assertIn("Two-step verification", str(context.exception))
        self.service.client.connect.assert_called_once()
        self.service.client.sign_in.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_sign_in_with_password(self):
        """Test sign in with code and 2FA password."""
        # Setup
        code = "12345"
        password = "password123"
        self.service.phone_code_hash = "test_hash"
        
        # Mock client behavior
        self.service.client.is_connected.return_value = False
        self.service.client.sign_in.side_effect = [
            SessionPasswordNeededError(None),  # First call fails with 2FA
            None  # Second call succeeds
        ]
        
        # Call method
        await self.service.sign_in_with_password(code, password)
        
        # Verify
        self.assertEqual(self.service.client.connect.call_count, 1)
        self.assertEqual(self.service.client.sign_in.call_count, 2)
        
        # Check first call with code
        first_call_args = self.service.client.sign_in.call_args_list[0][1]
        self.assertEqual(first_call_args, {
            'phone': self.service.phone,
            'code': code,
            'phone_code_hash': self.service.phone_code_hash
        })
        
        # Check second call with password
        second_call_args = self.service.client.sign_in.call_args_list[1][1]
        self.assertEqual(second_call_args, {'password': password})
    
    @pytest.mark.asyncio
    async def test_get_all_dialogs(self):
        """Test getting all dialogs."""
        # Mock dialogs
        dialogs = []
        for i in range(3):
            entity = MagicMock()
            entity.id = i + 1000
            entity.name = f"Test {i}"
            
            dialog = MagicMock(spec=Dialog)
            dialog.id = i + 100
            dialog.name = f"Dialog {i}"
            dialog.unread_count = i
            dialog.entity = entity
            dialogs.append(dialog)
        
        # Mock client iter_dialogs
        self.service.client.iter_dialogs = AsyncMock(return_value=dialogs)
        
        # Mock _get_entity_type
        self.service._get_entity_type = MagicMock(side_effect=lambda e: "channel" if e.id % 2 == 0 else "user")
        
        # Call method
        result = await self.service.get_all_dialogs()
        
        # Verify
        self.assertEqual(len(result), 3)
        for i, dialog_info in enumerate(result):
            self.assertEqual(dialog_info["id"], i + 100)
            self.assertEqual(dialog_info["name"], f"Dialog {i}")
            self.assertEqual(dialog_info["unread_count"], i)
            self.assertEqual(dialog_info["entity_id"], i + 1000)
            expected_type = "channel" if (i + 1000) % 2 == 0 else "user"
            self.assertEqual(dialog_info["type"], expected_type)
    
    @pytest.mark.asyncio
    async def test_get_dialog_by_name(self):
        """Test finding a dialog by name."""
        # Mock get_all_dialogs
        mock_dialogs = [
            {"id": 100, "name": "Dialog 0", "type": "user"},
            {"id": 101, "name": "Target Dialog", "type": "channel"},
            {"id": 102, "name": "Dialog 2", "type": "group"}
        ]
        self.service.get_all_dialogs = AsyncMock(return_value=mock_dialogs)
        
        # Call method
        result = await self.service.get_dialog_by_name("Target Dialog")
        
        # Verify
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 101)
        self.assertEqual(result["name"], "Target Dialog")
        self.assertEqual(result["type"], "channel")
        
        # Test case insensitive
        result = await self.service.get_dialog_by_name("target dialog")
        self.assertIsNotNone(result)
        self.assertEqual(result["id"], 101)
        
        # Test not found
        result = await self.service.get_dialog_by_name("Non-existent Dialog")
        self.assertIsNone(result)
    
    @pytest.mark.asyncio
    async def test_get_messages_from_dialog(self):
        """Test getting messages from a dialog."""
        # Setup
        dialog_id = 123
        mock_entity = MagicMock()
        
        # Mock messages
        mock_messages = []
        for i in range(3):
            message = MagicMock(spec=Message)
            message.id = i + 1
            message.date = datetime.now()
            message.text = f"Message {i}"
            message.sender_id = i + 1000
            message.reply_to_msg_id = None if i == 0 else i
            message.media = None if i % 2 == 0 else MagicMock()
            message.views = i * 10
            message.forwards = i * 5
            mock_messages.append(message)
        
        # Mock sender entities
        mock_senders = {}
        for i in range(3):
            sender = MagicMock(spec=User)
            sender.id = i + 1000
            sender.first_name = f"User {i}"
            sender.last_name = f"Test {i}"
            sender.username = f"user{i}"
            sender.phone = f"+123456789{i}"
            mock_senders[sender.id] = sender
        
        # Mock client methods
        self.service.client.get_entity = AsyncMock(return_value=mock_entity)
        self.service.client.iter_messages = AsyncMock(return_value=mock_messages)
        
        # Mock get_entity for senders
        async def mock_get_entity(sender_id):
            return mock_senders.get(sender_id)
        
        self.service.client.get_entity.side_effect = mock_get_entity
        
        # Mock _get_entity_type
        self.service._get_entity_type = MagicMock(return_value="user")
        
        # Call method
        result = await self.service.get_messages_from_dialog(dialog_id, limit=3)
        
        # Verify
        self.assertEqual(len(result), 3)
        for i, message_info in enumerate(result):
            self.assertEqual(message_info["id"], i + 1)
            self.assertEqual(message_info["text"], f"Message {i}")
            self.assertEqual(message_info["sender_id"], i + 1000)
            self.assertEqual(message_info["reply_to_msg_id"], None if i == 0 else i)
            self.assertEqual(message_info["has_media"], i % 2 != 0)
            self.assertEqual(message_info["views"], i * 10)
            self.assertEqual(message_info["forwards"], i * 5)
            
            # Verify sender info
            sender_info = message_info["sender"]
            self.assertEqual(sender_info["id"], i + 1000)
            self.assertEqual(sender_info["first_name"], f"User {i}")
            self.assertEqual(sender_info["last_name"], f"Test {i}")
            self.assertEqual(sender_info["username"], f"user{i}")
            self.assertEqual(sender_info["phone"], f"+123456789{i}")
            self.assertEqual(sender_info["type"], "user")
    
    @pytest.mark.asyncio
    async def test_disconnect(self):
        """Test disconnecting from Telegram."""
        # Call method
        await self.service.disconnect()
        
        # Verify
        self.service.client.disconnect.assert_called_once() 