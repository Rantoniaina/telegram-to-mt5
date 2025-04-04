"""
Tests for the DatabaseService class.
"""

import pytest
from datetime import datetime

from app.models.telegram_data import User
from app.services.db_service import DatabaseService

@pytest.fixture
def db_service(db_session):
    """
    Create a database service instance for testing.
    """
    return DatabaseService(db_session)

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

def test_get_user_existing(db_service, test_user):
    """Test get_user with existing user."""
    user = db_service.get_user("test_user_id")
    assert user is not None
    assert user.api_id == "test_user_id"

def test_get_user_non_existing(db_service):
    """Test get_user with non-existing user."""
    user = db_service.get_user("non_existing_id")
    assert user is None

def test_create_user_if_not_exists_new(db_service):
    """Test create_user_if_not_exists with new user."""
    user = db_service.create_user_if_not_exists("new_user_id")
    assert user is not None
    assert user.api_id == "new_user_id"
    
    # Verify user was created in DB
    retrieved_user = db_service.get_user("new_user_id")
    assert retrieved_user is not None
    assert retrieved_user.api_id == "new_user_id"

def test_create_user_if_not_exists_existing(db_service, test_user):
    """Test create_user_if_not_exists with existing user."""
    user = db_service.create_user_if_not_exists("test_user_id")
    assert user is not None
    assert user.api_id == "test_user_id"
    assert user.id == test_user.id  # Should be the same user

def test_get_all_users(db_service, test_user):
    """Test get_all_users."""
    users = db_service.get_all_users()
    assert len(users) >= 1
    assert any(user.api_id == "test_user_id" for user in users)

def test_delete_user_existing(db_service, test_user):
    """Test delete_user with existing user."""
    success = db_service.delete_user("test_user_id")
    assert success is True
    
    # Verify user was deleted
    user = db_service.get_user("test_user_id")
    assert user is None

def test_delete_user_non_existing(db_service):
    """Test delete_user with non-existing user."""
    success = db_service.delete_user("non_existing_id")
    assert success is False 