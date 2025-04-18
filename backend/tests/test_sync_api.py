"""
Tests for the sync API endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.sync import SyncState

# Test client
client = TestClient(app)


def test_get_all_syncs(setup_db):
    """Test getting all syncs."""
    response = client.get("/v1/sync/")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 2
    assert syncs[0]["discussion_name"] == "Test Discussion 1"
    assert syncs[1]["discussion_name"] == "Test Discussion 2"


def test_get_user_syncs(setup_db):
    """Test getting all syncs for a specific user."""
    user = setup_db["user"]
    response = client.get(f"/v1/sync/user/{user.id}")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 2
    assert all(sync["user_id"] == user.id for sync in syncs)


def test_get_syncs_by_state(setup_db):
    """Test getting all syncs with a specific state."""
    response = client.get(f"/v1/sync/state/{SyncState.PAUSED.value}")
    assert response.status_code == 200
    syncs = response.json()
    assert len(syncs) == 1
    assert syncs[0]["state"] == SyncState.PAUSED
    assert syncs[0]["discussion_name"] == "Test Discussion 2"


def test_get_sync(setup_db):
    """Test getting a specific sync by ID."""
    sync1 = setup_db["sync1"]
    response = client.get(f"/v1/sync/{sync1.id}")
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == sync1.id
    assert sync["discussion_name"] == "Test Discussion 1"


def test_get_sync_not_found():
    """Test getting a non-existent sync."""
    response = client.get("/v1/sync/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"}


def test_create_sync(setup_db):
    """Test creating a new sync."""
    user = setup_db["user"]
    response = client.post(
        "/v1/sync/",
        json={
            "user_id": user.id,
            "discussion_name": "New Discussion",
            "state": SyncState.ACTIVE
        }
    )
    assert response.status_code == 200
    sync = response.json()
    assert sync["discussion_name"] == "New Discussion"
    assert sync["user_id"] == user.id
    assert sync["state"] == SyncState.ACTIVE


def test_update_sync(setup_db):
    """Test updating a sync."""
    sync1 = setup_db["sync1"]
    response = client.put(
        f"/v1/sync/{sync1.id}",
        json={
            "discussion_name": "Updated Discussion",
            "state": SyncState.PAUSED
        }
    )
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == sync1.id
    assert sync["discussion_name"] == "Updated Discussion"
    assert sync["state"] == SyncState.PAUSED


def test_update_sync_partial(setup_db):
    """Test partially updating a sync."""
    sync1 = setup_db["sync1"]
    response = client.put(
        f"/v1/sync/{sync1.id}",
        json={
            "discussion_name": "Partially Updated"
        }
    )
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == sync1.id
    assert sync["discussion_name"] == "Partially Updated"
    assert sync["state"] == SyncState.ACTIVE  # State should remain unchanged


def test_update_sync_not_found():
    """Test updating a non-existent sync."""
    response = client.put(
        "/v1/sync/999",
        json={
            "discussion_name": "Invalid Update"
        }
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"}


def test_update_sync_state(setup_db):
    """Test updating just the state of a sync."""
    sync1 = setup_db["sync1"]
    response = client.put(f"/v1/sync/{sync1.id}/state/{SyncState.STOPPED.value}")
    assert response.status_code == 200
    sync = response.json()
    assert sync["id"] == sync1.id
    assert sync["discussion_name"] == "Test Discussion 1"  # Name should be unchanged
    assert sync["state"] == SyncState.STOPPED


def test_delete_sync(setup_db):
    """Test deleting a sync."""
    sync1 = setup_db["sync1"]
    response = client.delete(f"/v1/sync/{sync1.id}")
    assert response.status_code == 200
    assert response.json() == {"detail": "Sync deleted successfully"}
    
    # Verify the sync is deleted
    response = client.get(f"/v1/sync/{sync1.id}")
    assert response.status_code == 404


def test_delete_sync_not_found():
    """Test deleting a non-existent sync."""
    response = client.delete("/v1/sync/999")
    assert response.status_code == 404
    assert response.json() == {"detail": "Sync not found"} 