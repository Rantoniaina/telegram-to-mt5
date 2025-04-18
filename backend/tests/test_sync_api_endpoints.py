"""
Tests for the Sync API endpoints.
"""

from unittest.mock import MagicMock, patch
from datetime import datetime, UTC
import pytest
from fastapi.testclient import TestClient
from typing import List

from app.main import app
from app.models.sync import Sync, SyncState


# Sample data for testing
SAMPLE_SYNC = {
    "id": 1,
    "user_id": 1,
    "discussion_name": "Test Discussion",
    "state": SyncState.ACTIVE,
    "created_at": datetime.now(UTC).isoformat(),
    "updated_at": datetime.now(UTC).isoformat()
}

SAMPLE_SYNC_OBJ = Sync(
    id=1,
    user_id=1,
    discussion_name="Test Discussion",
    state=SyncState.ACTIVE,
    created_at=datetime.now(UTC),
    updated_at=datetime.now(UTC)
)


# Create test client
client = TestClient(app)


# Mock SyncService for testing
@pytest.fixture
def mock_sync_service():
    """Create a mock SyncService for testing."""
    with patch("app.api.v1.sync.SyncService") as mock_service_class:
        mock_service = MagicMock()
        mock_service_class.return_value = mock_service
        
        # Set up default behaviors
        mock_service.get_all_syncs.return_value = [SAMPLE_SYNC_OBJ]
        mock_service.get_sync.return_value = SAMPLE_SYNC_OBJ
        mock_service.create_sync.return_value = SAMPLE_SYNC_OBJ
        mock_service.update_sync.return_value = (True, SAMPLE_SYNC_OBJ)
        mock_service.update_sync_state.return_value = (True, SAMPLE_SYNC_OBJ)
        mock_service.delete_sync.return_value = True
        mock_service.get_user_syncs.return_value = [SAMPLE_SYNC_OBJ]
        mock_service.get_syncs_by_state.return_value = [SAMPLE_SYNC_OBJ]
        
        yield mock_service


def test_get_all_syncs(mock_sync_service):
    """Test getting all syncs."""
    response = client.get("/v1/sync/")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 1
    assert syncs[0]["discussion_name"] == "Test Discussion"
    mock_sync_service.get_all_syncs.assert_called_once()


def test_get_user_syncs(mock_sync_service):
    """Test getting all syncs for a specific user."""
    response = client.get("/v1/sync/user/1")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 1
    assert syncs[0]["user_id"] == 1
    mock_sync_service.get_user_syncs.assert_called_once_with(1)


def test_get_syncs_by_state(mock_sync_service):
    """Test getting all syncs with a specific state."""
    response = client.get(f"/v1/sync/state/{SyncState.ACTIVE.value}")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 1
    assert syncs[0]["state"] == SyncState.ACTIVE.value
    mock_sync_service.get_syncs_by_state.assert_called_once_with(SyncState.ACTIVE)


def test_get_sync(mock_sync_service):
    """Test getting a specific sync by ID."""
    response = client.get("/v1/sync/1")
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == 1
    assert sync["discussion_name"] == "Test Discussion"
    mock_sync_service.get_sync.assert_called_once_with(1)


def test_get_sync_not_found(mock_sync_service):
    """Test getting a non-existent sync."""
    mock_sync_service.get_sync.return_value = None
    response = client.get("/v1/sync/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"}
    mock_sync_service.get_sync.assert_called_once_with(999)


def test_create_sync(mock_sync_service):
    """Test creating a new sync."""
    response = client.post(
        "/v1/sync/",
        json={
            "user_id": 1,
            "discussion_name": "New Discussion",
            "state": SyncState.ACTIVE
        }
    )
    assert response.status_code == 200
    sync = response.json()
    assert sync["discussion_name"] == "Test Discussion"  # Mocked response
    mock_sync_service.create_sync.assert_called_once()


def test_update_sync(mock_sync_service):
    """Test updating a sync."""
    response = client.put(
        "/v1/sync/1",
        json={
            "discussion_name": "Updated Discussion",
            "state": SyncState.PAUSED
        }
    )
    assert response.status_code == 200
    mock_sync_service.update_sync.assert_called_once()


def test_update_sync_not_found(mock_sync_service):
    """Test updating a non-existent sync."""
    mock_sync_service.update_sync.return_value = (False, None)
    response = client.put(
        "/v1/sync/999",
        json={
            "discussion_name": "Invalid Update"
        }
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"}
    mock_sync_service.update_sync.assert_called_once()


def test_update_sync_state(mock_sync_service):
    """Test updating just the state of a sync."""
    response = client.put(f"/v1/sync/1/state/{SyncState.STOPPED.value}")
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == 1
    mock_sync_service.update_sync_state.assert_called_once_with(1, SyncState.STOPPED)


def test_delete_sync(mock_sync_service):
    """Test deleting a sync."""
    response = client.delete("/v1/sync/1")
    assert response.status_code == 200
    assert response.json() == {"detail": "Sync deleted successfully"}
    mock_sync_service.delete_sync.assert_called_once_with(1)


def test_delete_sync_not_found(mock_sync_service):
    """Test deleting a non-existent sync."""
    mock_sync_service.delete_sync.return_value = False
    response = client.delete("/v1/sync/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"}
    mock_sync_service.delete_sync.assert_called_once_with(999) 