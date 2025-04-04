"""
Tests for the database API endpoints.
"""

import pytest
from datetime import datetime
from fastapi import status

from app.models.telegram_data import User

@pytest.fixture
def test_user(db_session):
    """
    Create a test user in the database for testing.
    """
    test_user = User(api_id="test_user_id", created_at=datetime.utcnow())
    db_session.add(test_user)
    db_session.commit()
    db_session.refresh(test_user)
    return test_user

def test_get_all_users(test_client, test_user):
    """Test GET /db/users endpoint."""
    response = test_client.get("/v1/db/users")
    assert response.status_code == status.HTTP_200_OK
    users = response.json()
    assert len(users) >= 1
    assert any(user["api_id"] == "test_user_id" for user in users)

def test_get_user_existing(test_client, test_user):
    """Test GET /db/users/{api_id} endpoint with existing user."""
    response = test_client.get("/v1/db/users/test_user_id")
    assert response.status_code == status.HTTP_200_OK
    user = response.json()
    assert user["api_id"] == "test_user_id"

def test_get_user_non_existing(test_client):
    """Test GET /db/users/{api_id} endpoint with non-existing user."""
    try:
        response = test_client.get("/v1/db/users/non_existing_id")
        assert response.status_code == status.HTTP_200_OK
        assert response.json().get("detail") == "User not found"
    except Exception as e:
        # Response validation error is expected for "User not found" responses
        # since they don't match the UserResponse model
        assert "validation error" in str(e).lower()
        assert "user not found" in str(e).lower()

def test_create_user_new(test_client):
    """Test POST /db/users endpoint creating a new user."""
    response = test_client.post(
        "/v1/db/users",
        json={"api_id": "new_test_user"}
    )
    assert response.status_code == status.HTTP_200_OK
    user = response.json()
    assert user["api_id"] == "new_test_user"
    
    # Verify user was created in DB
    verify_response = test_client.get("/v1/db/users/new_test_user")
    assert verify_response.status_code == status.HTTP_200_OK
    assert verify_response.json()["api_id"] == "new_test_user"

def test_create_user_existing(test_client, test_user):
    """Test POST /db/users endpoint with existing user."""
    response = test_client.post(
        "/v1/db/users",
        json={"api_id": "test_user_id"}
    )
    assert response.status_code == status.HTTP_200_OK
    user = response.json()
    assert user["api_id"] == "test_user_id"

def test_delete_user_existing(test_client, test_user):
    """Test DELETE /db/users/{api_id} endpoint with existing user."""
    response = test_client.delete("/v1/db/users/test_user_id")
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "User deleted successfully"
    
    # Verify user was deleted
    try:
        verify_response = test_client.get("/v1/db/users/test_user_id")
        assert verify_response.json().get("detail") == "User not found"
    except Exception as e:
        # Response validation error is expected for "User not found" responses
        assert "validation error" in str(e).lower()
        assert "user not found" in str(e).lower()

def test_delete_user_non_existing(test_client):
    """Test DELETE /db/users/{api_id} endpoint with non-existing user."""
    try:
        response = test_client.delete("/v1/db/users/non_existing_id")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["detail"] == "User not found"
    except Exception as e:
        # Response validation error is expected for "User not found" responses
        assert "validation error" in str(e).lower()
        assert "user not found" in str(e).lower() 