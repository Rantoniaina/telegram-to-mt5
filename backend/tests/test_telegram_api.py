"""
Tests for the Telegram API endpoints.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.v1.telegram import (
    router, 
    active_sessions, 
    pending_verifications,
    get_telegram_service, 
    cleanup_session,
    ConnectResponse,
    VerificationResponse,
    VerificationRequest
)
from app.schemas.telegram import TelegramCredentials, SearchRequest
from app.services.telegram_service import TelegramService

# Test fixtures
@pytest.fixture
def telegram_credentials():
    """Create test credentials for Telegram API."""
    return TelegramCredentials(
        api_id="12345",
        api_hash="abcdef1234567890",
        phone="+1234567890"
    )

@pytest.fixture
def mock_telegram_service():
    """Create a mocked TelegramService."""
    service_mock = AsyncMock(spec=TelegramService)
    service_mock.connect = AsyncMock()
    service_mock.disconnect = AsyncMock()
    service_mock.sign_in_with_code = AsyncMock()
    service_mock.sign_in_with_password = AsyncMock()
    service_mock.get_all_dialogs = AsyncMock(return_value=[])
    service_mock.get_messages_from_dialog = AsyncMock(return_value=[])
    service_mock.search_messages = AsyncMock(return_value=[])
    return service_mock

@pytest.fixture
def mock_db_service():
    """Create a mocked DatabaseService."""
    db_service_mock = MagicMock()
    db_service_mock.create_user_if_not_exists = MagicMock()
    return db_service_mock

@pytest.fixture(autouse=True)
def clear_sessions():
    """Clear active and pending sessions before and after each test."""
    active_sessions.clear()
    pending_verifications.clear()
    yield
    active_sessions.clear()
    pending_verifications.clear()

# Tests for helper functions
@pytest.mark.asyncio
async def test_get_telegram_service_existing(telegram_credentials, mock_telegram_service):
    """Test retrieving an existing telegram service."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    active_sessions[session_id] = mock_telegram_service
    
    result = await get_telegram_service(telegram_credentials)
    
    assert result == mock_telegram_service
    # The connect method should not be called for existing services
    mock_telegram_service.connect.assert_not_called()

@pytest.mark.asyncio
@patch("app.api.v1.telegram.TelegramService", autospec=True)
async def test_get_telegram_service_new(mock_telegram_service_class, telegram_credentials):
    """Test creating a new telegram service."""
    service_instance = AsyncMock()
    mock_telegram_service_class.return_value = service_instance
    
    result = await get_telegram_service(telegram_credentials)
    
    assert result == service_instance
    mock_telegram_service_class.assert_called_once_with(
        api_id=telegram_credentials.api_id,
        api_hash=telegram_credentials.api_hash,
        phone=telegram_credentials.phone
    )
    service_instance.connect.assert_called_once()

@pytest.mark.asyncio
@patch("app.api.v1.telegram.TelegramService", autospec=True)
async def test_get_telegram_service_verification_required(mock_telegram_service_class, telegram_credentials):
    """Test service creation that requires verification."""
    service_instance = AsyncMock()
    mock_telegram_service_class.return_value = service_instance
    
    # Make connect raise an exception indicating verification needed
    service_instance.connect.side_effect = Exception("Please enter the verification code")
    
    with pytest.raises(HTTPException) as exc_info:
        await get_telegram_service(telegram_credentials)
    
    assert exc_info.value.status_code == 401
    assert "verification code" in exc_info.value.detail.lower()
    
    # The service should be stored in pending_verifications
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    assert session_id in pending_verifications

@pytest.mark.asyncio
@patch("app.api.v1.telegram.TelegramService", autospec=True)
async def test_get_telegram_service_auth_error(mock_telegram_service_class, telegram_credentials):
    """Test service creation with authentication error."""
    service_instance = AsyncMock()
    mock_telegram_service_class.return_value = service_instance
    
    # Make connect raise a different exception
    service_instance.connect.side_effect = Exception("Authentication failed")
    
    with pytest.raises(HTTPException) as exc_info:
        await get_telegram_service(telegram_credentials)
    
    assert exc_info.value.status_code == 401
    assert "authentication failed" in exc_info.value.detail.lower()
    
    # Ensure disconnect was called to clean up
    service_instance.disconnect.assert_called_once()

@pytest.mark.asyncio
async def test_cleanup_session_active(mock_telegram_service):
    """Test cleanup of active session."""
    session_id = "test_session"
    active_sessions[session_id] = mock_telegram_service
    
    await cleanup_session(session_id)
    
    mock_telegram_service.disconnect.assert_called_once()
    assert session_id not in active_sessions

@pytest.mark.asyncio
async def test_cleanup_session_pending(mock_telegram_service):
    """Test cleanup of pending session."""
    session_id = "test_session"
    pending_verifications[session_id] = mock_telegram_service
    
    await cleanup_session(session_id)
    
    mock_telegram_service.disconnect.assert_called_once()
    assert session_id not in pending_verifications

# Tests for API endpoints using TestClient
@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
@patch("app.api.v1.telegram.DatabaseService")
async def test_connect_success(mock_db_service_class, mock_get_service, telegram_credentials, test_client):
    """Test successful connection to Telegram."""
    mock_service = AsyncMock()
    mock_get_service.return_value = mock_service
    
    db_service_mock = MagicMock()
    mock_db_service_class.return_value = db_service_mock
    
    response = test_client.post(
        "/v1/telegram/connect", 
        json=telegram_credentials.model_dump()
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["needs_verification"] == False
    
    # Check that the user was created in the database
    db_service_mock.create_user_if_not_exists.assert_called_once_with(str(telegram_credentials.api_id))

@pytest.mark.asyncio
async def test_connect_pending_verification(telegram_credentials, test_client):
    """Test connection with pending verification."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    pending_verifications[session_id] = AsyncMock()
    
    response = test_client.post(
        "/v1/telegram/connect", 
        json=telegram_credentials.model_dump()
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["needs_verification"] == True

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_connect_verification_needed(mock_get_service, telegram_credentials, test_client):
    """Test connection that triggers verification."""
    mock_get_service.side_effect = HTTPException(status_code=401, detail="Verification code required")
    
    response = test_client.post(
        "/v1/telegram/connect", 
        json=telegram_credentials.model_dump()
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == False
    assert data["needs_verification"] == True

@pytest.mark.asyncio
@patch("app.api.v1.telegram.DatabaseService")
async def test_verify_code_success(mock_db_service_class, telegram_credentials, test_client):
    """Test successful code verification."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    
    # Create a mock service in pending verifications
    mock_service = AsyncMock()
    pending_verifications[session_id] = mock_service
    
    db_service_mock = MagicMock()
    mock_db_service_class.return_value = db_service_mock
    
    verification_request = {
        "credentials": telegram_credentials.model_dump(),
        "code": "12345"
    }
    
    response = test_client.post(
        "/v1/telegram/verify_code",
        json=verification_request
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["needs_password"] == False
    
    # Check that service was moved from pending to active
    assert session_id not in pending_verifications
    assert session_id in active_sessions
    
    # Check that sign in was called
    mock_service.sign_in_with_code.assert_called_once_with("12345")
    mock_service.sign_in_with_password.assert_not_called()
    
    # Check that user was created in database
    db_service_mock.create_user_if_not_exists.assert_called_once_with(str(telegram_credentials.api_id))

@pytest.mark.asyncio
async def test_verify_code_with_password(telegram_credentials, test_client):
    """Test code verification with 2FA password."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    
    # Create a mock service in pending verifications
    mock_service = AsyncMock()
    pending_verifications[session_id] = mock_service
    
    verification_request = {
        "credentials": telegram_credentials.model_dump(),
        "code": "12345",
        "password": "secretpassword"
    }
    
    response = test_client.post(
        "/v1/telegram/verify_code",
        json=verification_request
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    
    # Check that the right sign in method was called
    mock_service.sign_in_with_password.assert_called_once_with("12345", "secretpassword")
    mock_service.sign_in_with_code.assert_not_called()

@pytest.mark.asyncio
async def test_verify_code_needs_password(telegram_credentials, test_client):
    """Test verification that requires 2FA password."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    
    # Create a mock service in pending verifications
    mock_service = AsyncMock()
    mock_service.sign_in_with_code.side_effect = Exception("2FA is needed")
    pending_verifications[session_id] = mock_service
    
    verification_request = {
        "credentials": telegram_credentials.model_dump(),
        "code": "12345"
    }
    
    response = test_client.post(
        "/v1/telegram/verify_code",
        json=verification_request
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == False
    assert data["needs_password"] == True
    
    # Service should still be in pending verifications
    assert session_id in pending_verifications

@pytest.mark.asyncio
async def test_verify_code_no_pending_session(telegram_credentials, test_client):
    """Test verification with no pending session."""
    verification_request = {
        "credentials": telegram_credentials.model_dump(),
        "code": "12345"
    }
    
    response = test_client.post(
        "/v1/telegram/verify_code",
        json=verification_request
    )
    
    assert response.status_code == 400
    assert "no pending verification" in response.json()["detail"].lower()

@pytest.mark.asyncio
@patch("app.api.v1.telegram.cleanup_session")
async def test_disconnect(mock_cleanup, telegram_credentials, test_client):
    """Test disconnecting from Telegram."""
    response = test_client.post(
        "/v1/telegram/disconnect",
        json=telegram_credentials.model_dump()
    )
    
    assert response.status_code == 200
    assert response.json()["success"] == True

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_get_dialogs(mock_get_service, telegram_credentials, test_client):
    """Test getting dialogs."""
    mock_service = AsyncMock()
    # Match the DialogResponse schema
    mock_service.get_all_dialogs.return_value = [
        {
            "id": 1, 
            "name": "Test Dialog", 
            "type": "private",
            "entity_id": 12345,
            "unread_count": 5
        }
    ]
    mock_get_service.return_value = mock_service
    
    response = test_client.post(
        "/v1/telegram/dialogs",
        json=telegram_credentials.model_dump()  # Use model_dump() instead of dict()
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["name"] == "Test Dialog"
    assert data[0]["type"] == "private"
    assert data[0]["entity_id"] == 12345
    assert data[0]["unread_count"] == 5

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_get_messages(mock_get_service, telegram_credentials, test_client):
    """Test getting messages from a dialog."""
    mock_service = AsyncMock()
    # Match the MessageResponse schema
    mock_service.get_messages_from_dialog.return_value = [
        {
            "id": 1, 
            "text": "Test Message",
            "date": "2023-04-04T12:00:00",
            "sender_id": 12345,
            "sender": {"id": 12345, "first_name": "Test User"},
            "has_media": False,
            "views": None,
            "forwards": None,
            "reply_to_msg_id": None
        }
    ]
    mock_get_service.return_value = mock_service
    
    response = test_client.post(
        "/v1/telegram/messages/12345?limit=50&offset_id=0",
        json=telegram_credentials.model_dump()  # Use model_dump() instead of dict()
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 1
    assert data[0]["text"] == "Test Message"
    assert data[0]["date"] == "2023-04-04T12:00:00"
    assert data[0]["has_media"] == False
    
    # Verify correct parameters were passed
    mock_service.get_messages_from_dialog.assert_called_once_with(12345, 50, 0)

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_search_messages(mock_get_service, telegram_credentials, test_client):
    """Test searching messages."""
    mock_service = AsyncMock()
    mock_service.search_messages.return_value = [
        {"dialog_id": 1, "message_id": 123, "text": "Test Search Result"}
    ]
    mock_get_service.return_value = mock_service
    
    search_request = {
        "query": "test",
        "dialog_ids": [1, 2, 3],
        "limit": 20
    }
    
    response = test_client.post(
        "/v1/telegram/search",
        json={
            "search_request": search_request, 
            "credentials": telegram_credentials.model_dump()
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["dialog_id"] == 1
    assert data[0]["message_id"] == 123
    
    # Verify correct parameters were passed
    mock_service.search_messages.assert_called_once_with("test", [1, 2, 3], 20)

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_get_dialogs_error(mock_get_service, telegram_credentials, test_client):
    """Test error handling in get_dialogs endpoint."""
    # Set up mock to raise an exception
    mock_service = AsyncMock()
    mock_service.get_all_dialogs.side_effect = Exception("Failed to get dialogs")
    mock_get_service.return_value = mock_service
    
    response = test_client.post(
        "/v1/telegram/dialogs",
        json=telegram_credentials.model_dump()
    )
    
    # Verify we get an error response with the correct status code
    assert response.status_code == 500
    assert "failed to get dialogs" in response.json()["detail"].lower()

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_get_messages_error(mock_get_service, telegram_credentials, test_client):
    """Test error handling in get_messages endpoint."""
    # Set up mock to raise an exception
    mock_service = AsyncMock()
    mock_service.get_messages_from_dialog.side_effect = Exception("Failed to get messages")
    mock_get_service.return_value = mock_service
    
    response = test_client.post(
        "/v1/telegram/messages/12345?limit=50&offset_id=0",
        json=telegram_credentials.model_dump()
    )
    
    # Verify we get an error response with the correct status code
    assert response.status_code == 500
    assert "failed to get messages" in response.json()["detail"].lower()

@pytest.mark.asyncio
@patch("app.api.v1.telegram.get_telegram_service")
async def test_search_messages_error(mock_get_service, telegram_credentials, test_client):
    """Test error handling in search_messages endpoint."""
    # Set up mock to raise an exception
    mock_service = AsyncMock()
    mock_service.search_messages.side_effect = Exception("Failed to search messages")
    mock_get_service.return_value = mock_service
    
    search_request = {
        "query": "test",
        "dialog_ids": [1, 2, 3],
        "limit": 20
    }
    
    response = test_client.post(
        "/v1/telegram/search",
        json={
            "search_request": search_request, 
            "credentials": telegram_credentials.model_dump()
        }
    )
    
    # Verify we get an error response with the correct status code
    assert response.status_code == 500
    assert "failed to search messages" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_verify_code_general_error(telegram_credentials, test_client):
    """Test general error handling in verify_code endpoint."""
    session_id = f"{telegram_credentials.api_id}_{telegram_credentials.api_hash}"
    
    # Create a mock service in pending verifications with a general error
    mock_service = AsyncMock()
    mock_service.sign_in_with_code.side_effect = Exception("General error")
    mock_service.sign_in_with_password.side_effect = Exception("General error")
    pending_verifications[session_id] = mock_service
    
    verification_request = {
        "credentials": telegram_credentials.model_dump(),
        "code": "12345"
    }
    
    response = test_client.post(
        "/v1/telegram/verify_code",
        json=verification_request
    )
    
    # Verify we get an error response with the correct status code
    assert response.status_code == 400
    assert "verification failed" in response.json()["detail"].lower() 