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
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # CORS Settings
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "http://localhost:5174",
        os.getenv("FRONTEND_URL", "")
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    CORS_ALLOW_HEADERS: list[str] = [
        "Content-Type", 
        "Authorization", 
        "Accept", 
        "Origin", 
        "X-Requested-With",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ]
    
    # Telegram API Settings (Optional - can be provided via API)
    TELEGRAM_API_ID: int | None = os.getenv("TELEGRAM_API_ID", None)
    TELEGRAM_API_HASH: str | None = os.getenv("TELEGRAM_API_HASH", None)
    TELEGRAM_PHONE: str | None = os.getenv("TELEGRAM_PHONE", None)

# Create global settings instance
settings = Settings() 