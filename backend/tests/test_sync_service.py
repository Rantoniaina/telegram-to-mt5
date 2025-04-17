"""
Tests for the sync_service.py module.
"""

import unittest
from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.telegram_data import User
from app.models.sync import Sync, SyncState
from app.services.sync_service import SyncService


class TestSyncService(unittest.TestCase):
    """Tests for the SyncService class."""
    
    def setUp(self):
        """Set up test database."""
        # Create an in-memory SQLite database for testing
        self.engine = create_engine("sqlite:///:memory:")
        # Create all tables
        Base.metadata.create_all(self.engine)
        # Create a sessionmaker
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        # Create a session
        self.session = self.SessionLocal()
        
        # Create the service
        self.service = SyncService(self.session)
        
        # Create a test user for testing relationships
        self.test_user = User(api_id="12345")
        self.session.add(self.test_user)
        self.session.commit()
    
    def tearDown(self):
        """Clean up after tests."""
        # Close session
        self.session.close()
    
    def test_create_sync(self):
        """Test creating a new sync."""
        # Create a sync
        sync = self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Check that sync has an ID
        self.assertIsNotNone(sync.id)
        
        # Check that discussion_name was stored correctly
        self.assertEqual(sync.discussion_name, "Test Discussion")
        
        # Check that user_id was stored correctly
        self.assertEqual(sync.user_id, self.test_user.id)
        
        # Check that state was set to default (ACTIVE)
        self.assertEqual(sync.state, SyncState.ACTIVE)
    
    def test_get_sync(self):
        """Test getting a sync by ID."""
        # Create a sync
        sync = self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Get the sync by ID
        retrieved_sync = self.service.get_sync(sync.id)
        
        # Check that we got the same sync
        self.assertEqual(retrieved_sync.id, sync.id)
        self.assertEqual(retrieved_sync.discussion_name, sync.discussion_name)
    
    def test_update_sync(self):
        """Test updating a sync."""
        # Create a sync
        sync = self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Update the sync
        success, updated_sync = self.service.update_sync(
            sync.id,
            discussion_name="Updated Discussion",
            state=SyncState.PAUSED
        )
        
        # Check that update was successful
        self.assertTrue(success)
        
        # Check that fields were updated
        self.assertEqual(updated_sync.discussion_name, "Updated Discussion")
        self.assertEqual(updated_sync.state, SyncState.PAUSED)
        
        # Check that ID and user_id were not changed
        self.assertEqual(updated_sync.id, sync.id)
        self.assertEqual(updated_sync.user_id, sync.user_id)
    
    def test_update_nonexistent_sync(self):
        """Test updating a sync that doesn't exist."""
        # Try to update a nonexistent sync
        success, updated_sync = self.service.update_sync(
            999,
            discussion_name="Updated Discussion"
        )
        
        # Check that update failed
        self.assertFalse(success)
        self.assertIsNone(updated_sync)
    
    def test_delete_sync(self):
        """Test deleting a sync."""
        # Create a sync
        sync = self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Delete the sync
        success = self.service.delete_sync(sync.id)
        
        # Check that deletion was successful
        self.assertTrue(success)
        
        # Check that the sync is no longer in the database
        self.assertIsNone(self.service.get_sync(sync.id))
    
    def test_delete_nonexistent_sync(self):
        """Test deleting a sync that doesn't exist."""
        # Try to delete a nonexistent sync
        success = self.service.delete_sync(999)
        
        # Check that deletion failed
        self.assertFalse(success)
    
    def test_get_all_syncs(self):
        """Test getting all syncs."""
        # Create some syncs
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Discussion 1"
        )
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Discussion 2"
        )
        
        # Get all syncs
        syncs = self.service.get_all_syncs()
        
        # Check that we got both syncs
        self.assertEqual(len(syncs), 2)
    
    def test_get_user_syncs(self):
        """Test getting all syncs for a specific user."""
        # Create a second user
        user2 = User(api_id="67890")
        self.session.add(user2)
        self.session.commit()
        
        # Create syncs for both users
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="User 1 Discussion 1"
        )
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="User 1 Discussion 2"
        )
        self.service.create_sync(
            user_id=user2.id,
            discussion_name="User 2 Discussion"
        )
        
        # Get syncs for the first user
        user1_syncs = self.service.get_user_syncs(self.test_user.id)
        
        # Check that we got only syncs for the first user
        self.assertEqual(len(user1_syncs), 2)
        for sync in user1_syncs:
            self.assertEqual(sync.user_id, self.test_user.id)
    
    def test_get_syncs_by_state(self):
        """Test getting all syncs with a specific state."""
        # Create syncs with different states
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Active Discussion 1",
            state=SyncState.ACTIVE
        )
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Active Discussion 2",
            state=SyncState.ACTIVE
        )
        self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Paused Discussion",
            state=SyncState.PAUSED
        )
        
        # Get all active syncs
        active_syncs = self.service.get_syncs_by_state(SyncState.ACTIVE)
        
        # Check that we got only active syncs
        self.assertEqual(len(active_syncs), 2)
        for sync in active_syncs:
            self.assertEqual(sync.state, SyncState.ACTIVE)
    
    def test_update_sync_state(self):
        """Test updating just the state of a sync."""
        # Create a sync
        sync = self.service.create_sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Update just the state
        success, updated_sync = self.service.update_sync_state(
            sync.id,
            SyncState.ERROR
        )
        
        # Check that update was successful
        self.assertTrue(success)
        
        # Check that state was updated
        self.assertEqual(updated_sync.state, SyncState.ERROR)
        
        # Check that other fields were not changed
        self.assertEqual(updated_sync.discussion_name, "Test Discussion")


@pytest.fixture
def sync_service_with_user():
    """Fixture that provides a SyncService with a test user."""
    # Create an in-memory database
    engine = create_engine("sqlite:///:memory:")
    # Create all tables
    Base.metadata.create_all(engine)
    # Create a sessionmaker
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Create a session
    session = TestSessionLocal()
    
    # Create the service
    service = SyncService(session)
    
    # Create a test user
    test_user = User(api_id="12345")
    session.add(test_user)
    session.commit()
    
    try:
        yield service, test_user, session
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(engine)


def test_create_and_retrieve_sync(sync_service_with_user):
    """Test creating and retrieving a sync."""
    service, user, _ = sync_service_with_user
    
    # Create a sync
    sync = service.create_sync(
        user_id=user.id,
        discussion_name="Test Discussion"
    )
    
    # Verify it was created
    assert sync.id is not None
    
    # Retrieve the sync
    retrieved_sync = service.get_sync(sync.id)
    
    # Verify it's the same sync
    assert retrieved_sync.id == sync.id
    assert retrieved_sync.discussion_name == "Test Discussion" 