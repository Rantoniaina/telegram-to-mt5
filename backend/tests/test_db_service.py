"""
Tests for the services/db_service.py module.
"""

import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime, UTC

import pytest
from sqlalchemy.orm import Session

from app.services.db_service import DatabaseService
from app.models.telegram_data import User


class TestDatabaseService(unittest.TestCase):
    """Tests for the DatabaseService class."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_session = MagicMock(spec=Session)
        self.db_service = DatabaseService(self.mock_session)
        
    def test_init(self):
        """Test initialization of DatabaseService."""
        self.assertEqual(self.db_service.db, self.mock_session)
        
    def test_get_user(self):
        """Test getting a user by API ID."""
        # Arrange
        mock_user = User(id=1, api_id="12345", created_at=datetime.now(UTC))
        mock_query = self.mock_session.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = mock_user
        
        # Act
        result = self.db_service.get_user("12345")
        
        # Assert
        self.mock_session.query.assert_called_once_with(User)
        mock_query.filter.assert_called_once()
        self.assertEqual(result, mock_user)
        
    def test_get_user_not_found(self):
        """Test getting a non-existent user."""
        # Arrange
        mock_query = self.mock_session.query.return_value
        mock_filter = mock_query.filter.return_value
        mock_filter.first.return_value = None
        
        # Act
        result = self.db_service.get_user("nonexistent")
        
        # Assert
        self.assertIsNone(result)
        
    def test_create_user_if_not_exists_existing(self):
        """Test creating a user that already exists."""
        # Arrange
        mock_user = User(id=1, api_id="12345", created_at=datetime.now(UTC))
        
        # Mock the get_user method
        with patch.object(DatabaseService, 'get_user', return_value=mock_user) as mock_get_user:
            # Act
            result = self.db_service.create_user_if_not_exists("12345")
            
            # Assert
            mock_get_user.assert_called_once_with("12345")
            self.mock_session.add.assert_not_called()
            self.mock_session.commit.assert_not_called()
            self.assertEqual(result, mock_user)
            
    def test_create_user_if_not_exists_new(self):
        """Test creating a new user."""
        # Arrange
        # Mock the get_user method to return None (user doesn't exist)
        with patch.object(DatabaseService, 'get_user', return_value=None) as mock_get_user:
            # Act
            result = self.db_service.create_user_if_not_exists("new_user")
            
            # Assert
            mock_get_user.assert_called_once_with("new_user")
            self.mock_session.add.assert_called_once()
            self.mock_session.commit.assert_called_once()
            self.mock_session.refresh.assert_called_once()
            self.assertEqual(result.api_id, "new_user")
    
    def test_get_all_users(self):
        """Test getting all users."""
        # Arrange
        mock_users = [
            User(id=1, api_id="user1", created_at=datetime.now(UTC)),
            User(id=2, api_id="user2", created_at=datetime.now(UTC))
        ]
        mock_query = self.mock_session.query.return_value
        mock_query.all.return_value = mock_users
        
        # Act
        result = self.db_service.get_all_users()
        
        # Assert
        self.mock_session.query.assert_called_once_with(User)
        mock_query.all.assert_called_once()
        self.assertEqual(result, mock_users)
    
    def test_delete_user_exists(self):
        """Test deleting an existing user."""
        # Arrange
        mock_user = User(id=1, api_id="12345", created_at=datetime.now(UTC))
        
        # Mock the get_user method
        with patch.object(DatabaseService, 'get_user', return_value=mock_user) as mock_get_user:
            # Act
            result = self.db_service.delete_user("12345")
            
            # Assert
            mock_get_user.assert_called_once_with("12345")
            self.mock_session.delete.assert_called_once_with(mock_user)
            self.mock_session.commit.assert_called_once()
            self.assertTrue(result)
    
    def test_delete_user_not_exists(self):
        """Test deleting a non-existent user."""
        # Arrange
        # Mock the get_user method to return None (user doesn't exist)
        with patch.object(DatabaseService, 'get_user', return_value=None) as mock_get_user:
            # Act
            result = self.db_service.delete_user("nonexistent")
            
            # Assert
            mock_get_user.assert_called_once_with("nonexistent")
            self.mock_session.delete.assert_not_called()
            self.mock_session.commit.assert_not_called()
            self.assertFalse(result)


def test_with_real_db(tmpdir):
    """Integration test with a real SQLite database."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.models.telegram_data import Base
    
    # Create an in-memory SQLite database
    engine = create_engine(f"sqlite:///{tmpdir}/test.db")
    Base.metadata.create_all(engine)
    
    # Create a session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    
    try:
        # Create service
        service = DatabaseService(db)
        
        # Test create_user_if_not_exists
        user = service.create_user_if_not_exists("test_api_id")
        assert user.api_id == "test_api_id"
        
        # Test get_user
        retrieved_user = service.get_user("test_api_id")
        assert retrieved_user is not None
        assert retrieved_user.api_id == "test_api_id"
        
        # Test get_all_users
        all_users = service.get_all_users()
        assert len(all_users) == 1
        assert all_users[0].api_id == "test_api_id"
        
        # Test delete_user
        delete_result = service.delete_user("test_api_id")
        assert delete_result is True
        
        # Verify user was deleted
        assert service.get_user("test_api_id") is None
        assert len(service.get_all_users()) == 0
        
        # Test deleting non-existent user
        delete_result = service.delete_user("nonexistent")
        assert delete_result is False
        
    finally:
        db.close() 