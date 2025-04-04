"""
Tests for the schemas/db.py module.
"""

import unittest
from datetime import datetime, UTC
import pytest
from pydantic import ValidationError

from app.schemas.db import UserResponse
from app.models.telegram_data import User


class TestUserResponse(unittest.TestCase):
    """Tests for the UserResponse schema."""
    
    def test_valid_user_response(self):
        """Test that a valid UserResponse can be created."""
        # Create a UserResponse with valid data
        user_data = {
            "id": 1,
            "api_id": "12345",
            "created_at": datetime.now(UTC)
        }
        user_response = UserResponse(**user_data)
        
        # Check that attributes are set correctly
        self.assertEqual(user_response.id, 1)
        self.assertEqual(user_response.api_id, "12345")
        self.assertIsNotNone(user_response.created_at)
    
    def test_missing_required_fields(self):
        """Test that validation fails when required fields are missing."""
        # Missing id
        with self.assertRaises(ValidationError):
            UserResponse(api_id="12345", created_at=datetime.now(UTC))
        
        # Missing api_id
        with self.assertRaises(ValidationError):
            UserResponse(id=1, created_at=datetime.now(UTC))
        
        # Missing created_at
        with self.assertRaises(ValidationError):
            UserResponse(id=1, api_id="12345")
    
    def test_invalid_field_types(self):
        """Test that validation fails when field types are incorrect."""
        # Invalid id type (string instead of int)
        with self.assertRaises(ValidationError):
            UserResponse(id="not_an_int", api_id="12345", created_at=datetime.now(UTC))
        
        # Invalid api_id type (int instead of string)
        with self.assertRaises(ValidationError):
            UserResponse(id=1, api_id=12345, created_at=datetime.now(UTC))
        
        # Invalid created_at type (string instead of datetime)
        with self.assertRaises(ValidationError):
            UserResponse(id=1, api_id="12345", created_at="not_a_datetime")


def test_from_orm_conversion():
    """Test conversion from ORM model to Pydantic schema."""
    # Create a User ORM model instance
    user = User(id=1, api_id="12345", created_at=datetime.now(UTC))
    
    # Convert to UserResponse
    user_response = UserResponse.model_validate(user)
    
    # Check that conversion preserved the values
    assert user_response.id == 1
    assert user_response.api_id == "12345"
    assert user_response.created_at is not None


def test_model_dump():
    """Test dumping UserResponse to dict."""
    # Create a UserResponse
    created_at = datetime.now(UTC)
    user_response = UserResponse(id=1, api_id="12345", created_at=created_at)
    
    # Dump to dict
    dumped = user_response.model_dump()
    
    # Check that dict has correct structure
    assert dumped["id"] == 1
    assert dumped["api_id"] == "12345"
    assert isinstance(dumped["created_at"], datetime)
    assert dumped["created_at"] == created_at


def test_json_serialization():
    """Test JSON serialization of UserResponse."""
    # Create a UserResponse
    created_at = datetime.now(UTC)
    user_response = UserResponse(id=1, api_id="12345", created_at=created_at)
    
    # Convert to JSON
    json_str = user_response.model_dump_json()
    
    # Basic checks for JSON structure
    assert '"id":1' in json_str
    assert '"api_id":"12345"' in json_str
    assert "created_at" in json_str 