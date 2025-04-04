"""
Pytest configuration and fixtures for the backend tests.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models.telegram_data import User

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables in the engine
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
        # Clear all data before each test
        db.query(User).delete()
        db.commit()
        
        yield db
    finally:
        db.close() 