"""
Database models.
"""

# Import all models in this package to register them with SQLAlchemy
from app.models.telegram_data import User

# List all models to make them available for database initialization
all_models = [User] 