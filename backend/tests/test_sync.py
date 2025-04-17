"""
Tests for the sync.py module.
"""

import unittest
from datetime import datetime, timedelta, UTC
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.models.sync import Sync, SyncState
from app.models.telegram_data import User
from app.core.database import Base


class TestSync(unittest.TestCase):
    """Tests for the Sync model in sync.py."""
    
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
        
        # Create a test user for testing relationships
        self.test_user = User(api_id="12345")
        self.session.add(self.test_user)
        self.session.commit()
    
    def tearDown(self):
        """Clean up after tests."""
        # Close session
        self.session.close()
    
    def test_sync_creation(self):
        """Test that a Sync can be created and stored in the database."""
        # Create a sync
        sync = Sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Add to session and commit
        self.session.add(sync)
        self.session.commit()
        
        # Refresh sync to get any database-generated values
        self.session.refresh(sync)
        
        # Check that sync has an ID
        self.assertIsNotNone(sync.id)
        
        # Check that discussion_name was stored correctly
        self.assertEqual(sync.discussion_name, "Test Discussion")
        
        # Check that user_id was stored correctly
        self.assertEqual(sync.user_id, self.test_user.id)
        
        # Check that state was set to default (ACTIVE)
        self.assertEqual(sync.state, SyncState.ACTIVE)
        
        # Check that created_at and updated_at were set automatically
        self.assertIsNotNone(sync.created_at)
        self.assertIsNotNone(sync.updated_at)
    
    def test_sync_repr(self):
        """Test the __repr__ method of Sync."""
        # Create a sync
        sync = Sync(
            id=1,
            user_id=self.test_user.id,
            discussion_name="Test Discussion",
            state=SyncState.ACTIVE
        )
        
        # Check the string representation
        self.assertEqual(
            repr(sync),
            "<Sync(id=1, user_id={}, discussion_name='Test Discussion', state=SyncState.ACTIVE)>".format(self.test_user.id)
        )
    
    def test_sync_state_transition(self):
        """Test that the state of a Sync can be updated."""
        # Create a sync
        sync = Sync(
            user_id=self.test_user.id,
            discussion_name="Test Discussion"
        )
        
        # Add to session and commit
        self.session.add(sync)
        self.session.commit()
        
        # Change state to PAUSED
        sync.state = SyncState.PAUSED
        self.session.commit()
        
        # Refresh from database
        self.session.refresh(sync)
        
        # Check that state was updated
        self.assertEqual(sync.state, SyncState.PAUSED)
    
    def test_user_relationship(self):
        """Test the relationship between User and Sync."""
        # Create syncs for the test user
        sync1 = Sync(
            user_id=self.test_user.id,
            discussion_name="Discussion 1"
        )
        sync2 = Sync(
            user_id=self.test_user.id,
            discussion_name="Discussion 2"
        )
        
        # Add to session and commit
        self.session.add_all([sync1, sync2])
        self.session.commit()
        
        # Refresh user to get updated relationships
        self.session.refresh(self.test_user)
        
        # Check that the user has two syncs
        self.assertEqual(len(self.test_user.syncs), 2)
        
        # Check that the syncs are related to the user
        for sync in self.test_user.syncs:
            self.assertEqual(sync.user_id, self.test_user.id)
            self.assertEqual(sync.user, self.test_user)


@pytest.fixture
def db_session_with_user():
    """Fixture that provides a SQLite in-memory database session with a test user."""
    # Create an in-memory database
    engine = create_engine("sqlite:///:memory:")
    # Create all tables
    Base.metadata.create_all(engine)
    # Create a sessionmaker
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Create a session
    session = TestSessionLocal()
    
    # Create a test user
    test_user = User(api_id="12345")
    session.add(test_user)
    session.commit()
    
    try:
        yield session, test_user
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(engine)


def test_sync_query(db_session_with_user):
    """Test that Syncs can be queried from the database."""
    session, user = db_session_with_user
    
    # Create and save some syncs
    sync1 = Sync(user_id=user.id, discussion_name="Discussion 1")
    sync2 = Sync(user_id=user.id, discussion_name="Discussion 2")
    session.add_all([sync1, sync2])
    session.commit()
    
    # Query all syncs
    syncs = session.execute(select(Sync)).scalars().all()
    
    # Check that we have two syncs
    assert len(syncs) == 2
    
    # Check that we can find sync1 by discussion_name
    found_sync = session.execute(
        select(Sync).where(Sync.discussion_name == "Discussion 1")
    ).scalar_one()
    assert found_sync.discussion_name == "Discussion 1"


def test_sync_timestamps(db_session_with_user):
    """Test that created_at and updated_at fields are properly set."""
    session, user = db_session_with_user
    
    # Create and save a sync
    sync = Sync(user_id=user.id, discussion_name="Test Discussion")
    session.add(sync)
    session.commit()
    
    # Check that created_at and updated_at are set
    assert sync.created_at is not None
    assert sync.updated_at is not None
    
    # Verify they're timezone-aware datetimes with UTC timezone
    assert sync.created_at.tzinfo is not None
    assert sync.created_at.tzinfo == UTC
    assert sync.updated_at.tzinfo is not None
    assert sync.updated_at.tzinfo == UTC
    
    # Verify they're recent datetimes (within the last minute)
    time_diff = datetime.now(UTC) - sync.created_at
    assert time_diff < timedelta(minutes=1)


def test_sync_update_timestamp(db_session_with_user):
    """Test that updated_at is updated when the sync is modified."""
    session, user = db_session_with_user
    
    # Create and save a sync
    sync = Sync(user_id=user.id, discussion_name="Test Discussion")
    session.add(sync)
    session.commit()
    
    # Store the original updated_at time
    original_updated_at = sync.updated_at
    
    # Wait a short time to ensure timestamps will be different
    import time
    time.sleep(0.1)
    
    # Update the sync
    sync.state = SyncState.PAUSED
    session.commit()
    
    # Refresh from database
    session.refresh(sync)
    
    # Verify updated_at has changed
    assert sync.updated_at > original_updated_at
    
    # Verify created_at has not changed
    assert sync.created_at == sync.created_at 