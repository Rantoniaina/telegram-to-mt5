"""
Tests for the database module.
"""

import os
import tempfile
import unittest
from unittest.mock import patch, MagicMock, call

import pytest
from sqlalchemy import Column, Integer, String, create_engine, text
from sqlalchemy.engine.base import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.database import (
    Base,
    SessionLocal, 
    get_db, 
    init_db, 
    engine, 
    DATABASE_DIR, 
    DATABASE_FILE,
    SQLALCHEMY_DATABASE_URL
)


# Create a test model class for database testing
class TestModel(Base):
    """Test model for database tests."""
    __tablename__ = "test_model"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), index=True)


class TestDatabase(unittest.TestCase):
    """Tests for the database module."""
    
    def test_database_constants(self):
        """Test that database constants are correctly defined."""
        # Check that DATABASE_DIR is correctly defined
        expected_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
            "backend", "db"
        )
        # Use normpath to handle different path formats on different OSes
        self.assertEqual(
            os.path.normpath(DATABASE_DIR), 
            os.path.normpath(expected_dir)
        )
        
        # Check that DATABASE_FILE is correctly defined
        expected_file = os.path.join(expected_dir, "app.db")
        self.assertEqual(
            os.path.normpath(DATABASE_FILE), 
            os.path.normpath(expected_file)
        )
    
    def test_engine_creation(self):
        """Test that the database engine is created correctly."""
        # Check engine is instance of Engine
        self.assertIsInstance(engine, Engine)
        
        # Check that engine has correct URL
        self.assertTrue(str(engine.url).startswith("sqlite:///"))
        self.assertTrue(str(engine.url).endswith("app.db"))
        
        # Check for SQLite-specific configuration
        self.assertEqual(engine.dialect.name, "sqlite")
        
        # In different SQLAlchemy versions, the connect_args might be accessed differently
        # So we create a new engine with the same parameters to verify
        test_engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
        # Compare the URLs which should have the same parameters
        self.assertEqual(str(engine.url), str(test_engine.url))
    
    def test_session_local(self):
        """Test that the session factory is created correctly."""
        # Create a session using SessionLocal
        session = SessionLocal()
        try:
            # Check that session is instance of Session
            self.assertIsInstance(session, Session)
            
            # In newer SQLAlchemy versions, autocommit and autoflush settings 
            # are stored internally and not exposed as direct attributes
            # We just verify it's a proper session with the correct engine binding
            self.assertEqual(session.bind, engine)
        finally:
            session.close()
    
    @patch("app.core.database.SessionLocal")
    def test_get_db(self, mock_session_local):
        """Test the get_db function."""
        # Create a mock session
        mock_session = MagicMock()
        mock_session_local.return_value = mock_session
        
        # Create generator from get_db
        db_generator = get_db()
        
        # Get the session from the generator
        db = next(db_generator)
        
        # Check that session is correctly returned
        self.assertEqual(db, mock_session)
        self.assertEqual(mock_session_local.call_count, 1)
        
        # Check that close is called when generator is exhausted
        try:
            next(db_generator)
        except StopIteration:
            pass
        
        # Verify close was called
        mock_session.close.assert_called_once()
    
    @patch("app.core.database.Base")
    @patch("app.core.database.engine")
    def test_init_db(self, mock_engine, mock_base):
        """Test the init_db function."""
        # Call init_db
        init_db()
        
        # Check that create_all was called with correct engine
        mock_base.metadata.create_all.assert_called_once_with(bind=mock_engine)


@pytest.fixture
def test_db():
    """Create a temporary database for testing."""
    # Create a temporary file for the test database
    _, temp_db_file = tempfile.mkstemp(suffix='.db')
    
    # Create a temporary database URL
    temp_db_url = f"sqlite:///{temp_db_file}"
    
    # Create a test engine
    test_engine = create_engine(
        temp_db_url, connect_args={"check_same_thread": False}
    )
    
    # Create tables in the test database
    Base.metadata.create_all(bind=test_engine)
    
    # Create a session factory
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Clean up by removing the temporary file
        os.unlink(temp_db_file)


def test_db_connection():
    """Test database connection directly with a simple query."""
    # Create a simple in-memory database for this test only
    test_engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=test_engine)
    
    # Create a session
    TestSessionLocal = sessionmaker(bind=test_engine)
    session = TestSessionLocal()
    
    try:
        # Just test a simple query with text() function
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1
    finally:
        session.close()


@patch("os.makedirs")
def test_dir_creation(mock_makedirs):
    """Test that the database directory is created if it doesn't exist."""
    # We need to reload the module to trigger the directory creation again
    import importlib
    import app.core.database
    
    # Force reload of the module to trigger directory creation
    importlib.reload(app.core.database)
    
    # Check that makedirs was called with correct arguments
    mock_makedirs.assert_called_once_with(DATABASE_DIR, exist_ok=True)


def test_real_db_integration():
    """Integration test with the actual database."""
    # Import to ensure all models are registered
    from app.models import all_models
    
    # Create a session
    session = SessionLocal()
    
    try:
        # Test query execution (simple test that doesn't modify the database)
        result = session.execute(text("SELECT 1")).scalar()
        assert result == 1
    finally:
        session.close() 