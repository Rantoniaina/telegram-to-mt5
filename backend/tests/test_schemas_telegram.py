"""
Tests for the schemas/telegram.py module.
"""

import unittest
from typing import Dict, Any, List, Optional
import pytest
from pydantic import ValidationError

from app.schemas.telegram import (
    TelegramCredentials,
    DialogResponse,
    MessageResponse,
    SearchRequest
)


class TestTelegramCredentials(unittest.TestCase):
    """Tests for the TelegramCredentials schema."""
    
    def test_valid_credentials(self):
        """Test that valid credentials can be created."""
        # Create credentials with required fields
        creds = TelegramCredentials(api_id=12345, api_hash="abcdef123456")
        self.assertEqual(creds.api_id, 12345)
        self.assertEqual(creds.api_hash, "abcdef123456")
        self.assertIsNone(creds.phone)
        
        # Create credentials with optional phone
        creds_with_phone = TelegramCredentials(
            api_id=12345,
            api_hash="abcdef123456",
            phone="+1234567890"
        )
        self.assertEqual(creds_with_phone.api_id, 12345)
        self.assertEqual(creds_with_phone.api_hash, "abcdef123456")
        self.assertEqual(creds_with_phone.phone, "+1234567890")
    
    def test_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        # Missing api_id
        with self.assertRaises(ValidationError):
            TelegramCredentials(api_hash="abcdef123456")
        
        # Missing api_hash
        with self.assertRaises(ValidationError):
            TelegramCredentials(api_id=12345)
    
    def test_invalid_field_types(self):
        """Test that validation fails when field types are incorrect."""
        # Invalid api_id type (string instead of int)
        with self.assertRaises(ValidationError):
            TelegramCredentials(api_id="not_an_int", api_hash="abcdef123456")
        
        # Invalid api_hash type (int instead of string)
        with self.assertRaises(ValidationError):
            TelegramCredentials(api_id=12345, api_hash=12345)


class TestDialogResponse(unittest.TestCase):
    """Tests for the DialogResponse schema."""
    
    def test_valid_dialog(self):
        """Test that a valid dialog can be created."""
        dialog_data = {
            "id": 1,
            "name": "Test Group",
            "type": "group",
            "entity_id": 123456789,
            "unread_count": 5
        }
        dialog = DialogResponse(**dialog_data)
        
        self.assertEqual(dialog.id, 1)
        self.assertEqual(dialog.name, "Test Group")
        self.assertEqual(dialog.type, "group")
        self.assertEqual(dialog.entity_id, 123456789)
        self.assertEqual(dialog.unread_count, 5)
    
    def test_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        required_fields = ["id", "name", "type", "entity_id", "unread_count"]
        dialog_data = {
            "id": 1,
            "name": "Test Group",
            "type": "group",
            "entity_id": 123456789,
            "unread_count": 5
        }
        
        # Test each field
        for field in required_fields:
            invalid_data = dialog_data.copy()
            del invalid_data[field]
            with self.assertRaises(ValidationError):
                DialogResponse(**invalid_data)


class TestMessageResponse(unittest.TestCase):
    """Tests for the MessageResponse schema."""
    
    def test_valid_message(self):
        """Test that a valid message can be created."""
        # Minimal valid message
        minimal_message = MessageResponse(
            id=1,
            text="Hello world",
            date="2023-04-04T15:30:00",
            has_media=False
        )
        self.assertEqual(minimal_message.id, 1)
        self.assertEqual(minimal_message.text, "Hello world")
        self.assertEqual(minimal_message.date, "2023-04-04T15:30:00")
        self.assertFalse(minimal_message.has_media)
        self.assertIsNone(minimal_message.sender_id)
        self.assertIsNone(minimal_message.sender)
        self.assertIsNone(minimal_message.views)
        self.assertIsNone(minimal_message.forwards)
        self.assertIsNone(minimal_message.reply_to_msg_id)
        
        # Complete message with all fields
        complete_message = MessageResponse(
            id=2,
            text="Complete message",
            date="2023-04-04T15:35:00",
            sender_id=12345,
            sender={"id": 12345, "name": "John Doe"},
            has_media=True,
            views=10,
            forwards=5,
            reply_to_msg_id=1
        )
        self.assertEqual(complete_message.id, 2)
        self.assertEqual(complete_message.text, "Complete message")
        self.assertEqual(complete_message.date, "2023-04-04T15:35:00")
        self.assertEqual(complete_message.sender_id, 12345)
        self.assertEqual(complete_message.sender, {"id": 12345, "name": "John Doe"})
        self.assertTrue(complete_message.has_media)
        self.assertEqual(complete_message.views, 10)
        self.assertEqual(complete_message.forwards, 5)
        self.assertEqual(complete_message.reply_to_msg_id, 1)
    
    def test_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        required_fields = ["id", "text", "date", "has_media"]
        message_data = {
            "id": 1,
            "text": "Hello world",
            "date": "2023-04-04T15:30:00",
            "has_media": False
        }
        
        # Test each field
        for field in required_fields:
            invalid_data = message_data.copy()
            del invalid_data[field]
            with self.assertRaises(ValidationError):
                MessageResponse(**invalid_data)


class TestSearchRequest(unittest.TestCase):
    """Tests for the SearchRequest schema."""
    
    def test_valid_search_request(self):
        """Test that a valid search request can be created."""
        # Minimal request with just a query
        minimal_request = SearchRequest(query="test query")
        self.assertEqual(minimal_request.query, "test query")
        self.assertIsNone(minimal_request.dialog_ids)
        self.assertEqual(minimal_request.limit, 100)  # Default value
        
        # Complete request with all fields
        complete_request = SearchRequest(
            query="complete query",
            dialog_ids=[1, 2, 3],
            limit=50
        )
        self.assertEqual(complete_request.query, "complete query")
        self.assertEqual(complete_request.dialog_ids, [1, 2, 3])
        self.assertEqual(complete_request.limit, 50)
    
    def test_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        # Missing query
        with self.assertRaises(ValidationError):
            SearchRequest(dialog_ids=[1, 2, 3], limit=50)
    
    def test_invalid_dialog_ids(self):
        """Test that validation fails with invalid dialog_ids."""
        # Non-integer dialog IDs
        with self.assertRaises(ValidationError):
            SearchRequest(query="test", dialog_ids=["not_an_int", 2, 3])
    
    def test_invalid_limit(self):
        """Test that validation fails with an invalid limit."""
        # String instead of int for limit
        with self.assertRaises(ValidationError):
            SearchRequest(query="test", limit="not_an_int")


def test_json_serialization():
    """Test JSON serialization of schema objects."""
    # Test each schema type
    telegram_creds = TelegramCredentials(api_id=12345, api_hash="abcdef123456")
    dialog = DialogResponse(id=1, name="Test", type="group", entity_id=123, unread_count=5)
    message = MessageResponse(id=1, text="Hello", date="2023-04-04", has_media=False)
    search = SearchRequest(query="test", dialog_ids=[1, 2, 3], limit=50)
    
    # Verify serialization works for each
    assert "api_id" in telegram_creds.model_dump_json()
    assert "name" in dialog.model_dump_json()
    assert "text" in message.model_dump_json()
    assert "query" in search.model_dump_json()


def test_schema_documentation():
    """Test that schema documentation is present."""
    # Verify that the classes have docstrings
    assert TelegramCredentials.__doc__ is not None
    assert DialogResponse.__doc__ is not None
    assert MessageResponse.__doc__ is not None
    assert SearchRequest.__doc__ is not None
    
    # Check model schemas contain descriptions
    telegram_schema = TelegramCredentials.model_json_schema()
    search_schema = SearchRequest.model_json_schema()
    
    # Verify descriptions exist in json schema
    assert "description" in telegram_schema["properties"]["api_id"]
    assert "description" in search_schema["properties"]["query"] 