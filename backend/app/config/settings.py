"""
Application settings and configuration.
"""

import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    """Application settings."""
    
    # API Settings
    API_TITLE: str = "Telegram API Service"
    API_DESCRIPTION: str = "REST API to interact with Telegram using Telethon"
    API_VERSION: str = "1.0.0"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # CORS Settings
    CORS_ORIGINS: list[str] = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]
    
    # Telegram API Settings (Optional - can be provided via API)
    TELEGRAM_API_ID: int | None = os.getenv("TELEGRAM_API_ID", None)
    TELEGRAM_API_HASH: str | None = os.getenv("TELEGRAM_API_HASH", None)
    TELEGRAM_PHONE: str | None = os.getenv("TELEGRAM_PHONE", None)

# Create global settings instance
settings = Settings() 