"""
Pytest configuration and fixtures for the backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.telegram_data import User
from app.models.sync import Sync, SyncState
from datetime import datetime, UTC

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables in the engine
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

# Test database dependency override
def override_get_db():
    """Override get_db dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Apply dependency override for testing
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def test_client():
    """
    Create a FastAPI TestClient instance that uses the test database.
    """
    with TestClient(app) as client:
        yield client

@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for a test.
    Reset the database after each test.
    """
    # Create session
    db = TestingSessionLocal()
    
    try:
        # Clear all data before each test - order matters due to foreign key constraints
        db.query(Sync).delete()
        db.query(User).delete()
        db.commit()
        
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def setup_db():
    """
    Set up the database with test data for API tests.
    """
    # Clear existing data
    db = TestingSessionLocal()
    
    # Clear existing data
    db.query(Sync).delete()
    db.query(User).delete()
    db.commit()
    
    # Create a test user
    test_user = User(api_id="12345")
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    # Create test syncs
    sync1 = Sync(user_id=test_user.id, discussion_name="Test Discussion 1")
    sync2 = Sync(user_id=test_user.id, discussion_name="Test Discussion 2", state=SyncState.PAUSED)
    db.add_all([sync1, sync2])
    db.commit()
    db.refresh(sync1)
    db.refresh(sync2)
    
    yield {"user": test_user, "sync1": sync1, "sync2": sync2, "db": db}
    
    # Clean up - just close the session, don't drop tables
    db.close()

@pytest.fixture
def telegram_credentials():
    """Fixture for telegram credentials"""
    from app.schemas.telegram import TelegramCredentials
    return TelegramCredentials(api_id=12345, api_hash='abcdef1234567890', phone='+1234567890') 