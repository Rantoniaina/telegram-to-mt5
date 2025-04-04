"""
Tests for the application settings.
"""

import os
import pytest
from unittest.mock import patch

from app.config.settings import Settings, settings


def test_settings_instance():
    """Test that a Settings instance is correctly created with default values."""
    # Verify the settings object is an instance of Settings
    assert isinstance(settings, Settings)
    
    # API Settings
    assert settings.API_TITLE == "Telegram API Service"
    assert settings.API_DESCRIPTION == "REST API to interact with Telegram using Telethon"
    assert settings.API_VERSION == "1.0.0"
    
    # Verify HOST has a value
    assert isinstance(settings.HOST, str)
    assert settings.HOST  # Not empty
    
    # Verify PORT is an int
    assert isinstance(settings.PORT, int)
    assert settings.PORT > 0
    
    # Verify DEBUG is a boolean
    assert isinstance(settings.DEBUG, bool)


def test_cors_settings():
    """Test that CORS settings are properly configured."""
    # Verify CORS origins exist and are correctly formatted
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) >= 4
    
    # Check for expected default origins
    assert "http://localhost:3000" in settings.CORS_ORIGINS
    assert "http://localhost:5173" in settings.CORS_ORIGINS
    assert "http://127.0.0.1:5173" in settings.CORS_ORIGINS
    assert "http://localhost:5174" in settings.CORS_ORIGINS
    
    # Verify CORS credentials setting
    assert settings.CORS_ALLOW_CREDENTIALS is True
    
    # Verify allowed methods
    assert isinstance(settings.CORS_ALLOW_METHODS, list)
    assert len(settings.CORS_ALLOW_METHODS) >= 6
    assert "GET" in settings.CORS_ALLOW_METHODS
    assert "POST" in settings.CORS_ALLOW_METHODS
    assert "PUT" in settings.CORS_ALLOW_METHODS
    assert "DELETE" in settings.CORS_ALLOW_METHODS
    assert "OPTIONS" in settings.CORS_ALLOW_METHODS
    assert "PATCH" in settings.CORS_ALLOW_METHODS
    
    # Verify allowed headers
    assert isinstance(settings.CORS_ALLOW_HEADERS, list)
    assert len(settings.CORS_ALLOW_HEADERS) >= 7
    assert "Content-Type" in settings.CORS_ALLOW_HEADERS
    assert "Authorization" in settings.CORS_ALLOW_HEADERS
    assert "Accept" in settings.CORS_ALLOW_HEADERS
    assert "Origin" in settings.CORS_ALLOW_HEADERS


def test_telegram_api_settings():
    """Test that Telegram API settings are properly configured."""
    # These can be None if not set in environment
    assert hasattr(settings, "TELEGRAM_API_ID")
    assert hasattr(settings, "TELEGRAM_API_HASH")
    assert hasattr(settings, "TELEGRAM_PHONE")
    
    # If TELEGRAM_API_ID is set, it should be an int or None
    assert settings.TELEGRAM_API_ID is None or isinstance(settings.TELEGRAM_API_ID, int)
    
    # If TELEGRAM_API_HASH is set, it should be a string or None
    assert settings.TELEGRAM_API_HASH is None or isinstance(settings.TELEGRAM_API_HASH, str)
    
    # If TELEGRAM_PHONE is set, it should be a string or None
    assert settings.TELEGRAM_PHONE is None or isinstance(settings.TELEGRAM_PHONE, str)


def test_settings_direct_creation():
    """Test creating a Settings instance directly."""
    # Create a new settings instance
    new_settings = Settings()
    
    # Verify it has the same shape as the singleton
    assert isinstance(new_settings.API_TITLE, str)
    assert isinstance(new_settings.HOST, str) 
    assert isinstance(new_settings.PORT, int)
    assert isinstance(new_settings.DEBUG, bool)
    assert isinstance(new_settings.CORS_ORIGINS, list)
    assert isinstance(new_settings.CORS_ALLOW_METHODS, list)
    assert isinstance(new_settings.CORS_ALLOW_HEADERS, list)


def test_settings_value_type_conversion():
    """Test that setting values are properly type-converted."""
    # Create a new settings instance
    new_settings = Settings()
    
    # Port should be an integer
    assert isinstance(new_settings.PORT, int)
    
    # DEBUG should be a boolean
    assert isinstance(new_settings.DEBUG, bool)
    
    # CORS_ORIGINS, CORS_ALLOW_METHODS, CORS_ALLOW_HEADERS should be lists
    assert isinstance(new_settings.CORS_ORIGINS, list)
    assert isinstance(new_settings.CORS_ALLOW_METHODS, list)
    assert isinstance(new_settings.CORS_ALLOW_HEADERS, list) 