"""
Tests for the telegram_data.py module.
"""

import unittest
from datetime import datetime, timedelta, UTC
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.models.telegram_data import User, TZDateTime
from app.core.database import Base


class TestTZDateTime(unittest.TestCase):
    """Tests for the TZDateTime custom type."""
    
    def test_process_bind_param(self):
        """Test that process_bind_param converts timezone-aware datetimes properly."""
        tz_type = TZDateTime()
        
        # Test with timezone-aware datetime
        dt = datetime.now(UTC)
        result = tz_type.process_bind_param(dt, None)
        
        # Result should be timezone-naive
        self.assertIsNone(result.tzinfo)
        
        # Test with timezone-naive datetime
        naive_dt = datetime.now()
        naive_result = tz_type.process_bind_param(naive_dt, None)
        
        # Result should be unchanged
        self.assertIsNone(naive_result.tzinfo)
        self.assertEqual(naive_dt, naive_result)
    
    def test_process_result_value(self):
        """Test that process_result_value adds UTC timezone to naive datetimes."""
        tz_type = TZDateTime()
        
        # Test with timezone-naive datetime
        dt = datetime.now()
        result = tz_type.process_result_value(dt, None)
        
        # Result should be timezone-aware with UTC timezone
        self.assertIsNotNone(result.tzinfo)
        self.assertEqual(result.tzinfo, UTC)
        

class TestUser(unittest.TestCase):
    """Tests for the User model in telegram_data.py."""
    
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
    
    def tearDown(self):
        """Clean up after tests."""
        # Close session
        self.session.close()
    
    def test_user_creation(self):
        """Test that a User can be created and stored in the database."""
        # Create a user
        user = User(api_id="12345")
        
        # Add to session and commit
        self.session.add(user)
        self.session.commit()
        
        # Refresh user to get any database-generated values
        self.session.refresh(user)
        
        # Check that user has an ID
        self.assertIsNotNone(user.id)
        
        # Check that api_id was stored correctly
        self.assertEqual(user.api_id, "12345")
        
        # Check that created_at was set automatically
        self.assertIsNotNone(user.created_at)
    
    def test_user_repr(self):
        """Test the __repr__ method of User."""
        # Create a user
        user = User(id=1, api_id="12345")
        
        # Check the string representation
        self.assertEqual(repr(user), "<User(id=1, api_id='12345')>")
    
    def test_user_unique_constraint(self):
        """Test that users with duplicate api_ids cannot be created."""
        # Create and save a user
        user1 = User(api_id="12345")
        self.session.add(user1)
        self.session.commit()
        
        # Create another user with the same api_id
        user2 = User(api_id="12345")
        self.session.add(user2)
        
        # Attempting to commit should raise an exception due to the unique constraint
        with self.assertRaises(Exception):
            self.session.commit()


@pytest.fixture
def db_session():
    """Fixture that provides a SQLite in-memory database session."""
    # Create an in-memory database
    engine = create_engine("sqlite:///:memory:")
    # Create all tables
    Base.metadata.create_all(engine)
    # Create a sessionmaker
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    # Create a session
    session = TestSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables
        Base.metadata.drop_all(engine)


def test_user_query(db_session):
    """Test that Users can be queried from the database."""
    # Create and save some users
    user1 = User(api_id="12345")
    user2 = User(api_id="67890")
    db_session.add_all([user1, user2])
    db_session.commit()
    
    # Query all users
    users = db_session.execute(select(User)).scalars().all()
    
    # Check that we have two users
    assert len(users) == 2
    
    # Check that we can find user1 by id
    found_user = db_session.execute(select(User).where(User.api_id == "12345")).scalar_one()
    assert found_user.api_id == "12345"


def test_user_created_at(db_session):
    """Test that created_at field is set to a datetime when not provided."""
    # Create and save a user
    user = User(api_id="12345")
    db_session.add(user)
    db_session.commit()
    
    # Check that created_at is set
    assert user.created_at is not None
    
    # Verify it's a timezone-aware datetime with UTC timezone
    assert user.created_at.tzinfo is not None
    assert user.created_at.tzinfo == UTC
    
    # Verify it's a recent datetime (within the last minute)
    time_diff = datetime.now(UTC) - user.created_at
    assert time_diff < timedelta(minutes=1) 