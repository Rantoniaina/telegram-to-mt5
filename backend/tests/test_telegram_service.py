"""
Tests for the services/telegram_service.py module.
"""

import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

from telethon.errors import SessionPasswordNeededError
from telethon.tl.types import Channel, Chat, User

from app.services.telegram_service import TelegramService


class TestTelegramService(unittest.TestCase):
    """Tests for the TelegramService class."""
    
    def test_init(self):
        """Test service initialization."""
        with patch('app.services.telegram_service.TelegramClient') as mock_client_class:
            # Create the service
            service = TelegramService(
                api_id=12345,
                api_hash="test_hash",
                phone="+1234567890",
                session_name="test_session"
            )

            # Verify attributes
            self.assertEqual(service.api_id, 12345)
            self.assertEqual(service.api_hash, "test_hash")
            self.assertEqual(service.phone, "+1234567890")
            self.assertEqual(service.session_name, "test_session")
            self.assertIsNone(service.code_callback)
            self.assertIsNone(service.password_callback)
            self.assertIsNone(service.phone_code_hash)
            
            # Verify TelegramClient initialization
            mock_client_class.assert_called_once_with("test_session", 12345, "test_hash")
    
    def test_get_entity_type(self):
        """Test the entity type detection method."""
        with patch('app.services.telegram_service.TelegramClient'):
            # Create service
            service = TelegramService(
                api_id=12345,
                api_hash="test_hash",
                phone="+1234567890",
                session_name="test_session"
            )
            
            # Create test entities
            user = MagicMock(spec=User)
            chat = MagicMock(spec=Chat)
            channel = MagicMock(spec=Channel)
            channel.broadcast = True
            supergroup = MagicMock(spec=Channel)
            supergroup.broadcast = False
            unknown = MagicMock()
            
            # Test entity type detection
            self.assertEqual(service._get_entity_type(user), "user")
            self.assertEqual(service._get_entity_type(chat), "group")
            self.assertEqual(service._get_entity_type(channel), "channel")
            self.assertEqual(service._get_entity_type(supergroup), "supergroup")
            self.assertEqual(service._get_entity_type(unknown), "unknown") 