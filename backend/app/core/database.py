"""
Database connection and session management.
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Define the SQLite database file path
DATABASE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db")
DATABASE_FILE = os.path.join(DATABASE_DIR, "app.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DATABASE_FILE}"

# Create database directory if it doesn't exist
os.makedirs(DATABASE_DIR, exist_ok=True)

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all database models
Base = declarative_base()

def get_db() -> Session:
    """
    Get a database session.
    Intended to be used as a FastAPI dependency.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize the database by creating all tables.
    This is called during application startup.
    """
    # Import all models here to ensure they're registered with Base
    from app.models import all_models  # This import is just for registration
    
    # Create all tables
    Base.metadata.create_all(bind=engine) 